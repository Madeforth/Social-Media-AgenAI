// `gemini-models`: lists the Gemini models an organization's own key can reach,
// and stores the pair it wants to run on.
//
// This exists because pinned model ids rot. `gemini-2.5-pro` and
// `gemini-2.5-flash` were both retired mid-flight with "no longer available to
// new users", which broke generation with a 404 until the constants were edited
// and the functions redeployed. Letting the owner pick a model turns that into
// a dropdown change.
//
// Two things worth knowing about the Gemini API, both learned the hard way:
//
//   - ListModels advertises models that then fail on the first real call, so a
//     name appearing in `list` is not proof it works. `select` therefore makes
//     an actual generateContent call before saving.
//   - On a free-tier key every image model returns 429 "You exceeded your
//     current quota". That is a billing state, not a bad choice, so a failing
//     image model is saved with a warning rather than rejected.
//
// Same gate shape as connect-gemini: verify the JWT, re-check membership
// server-side, and never let the key itself leave the server.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { GEMINI_IMAGE_MODEL, GEMINI_TEXT_MODEL, resolveGeminiApiKey } from '../_shared/ai.ts';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Enough of a schema to prove the model honours structured output. */
const PROBE_SCHEMA = {
  type: 'object',
  properties: { ok: { type: 'string' } },
  required: ['ok'],
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function messageOf(payload: unknown, fallback: string): string {
  const error = (payload as { error?: { message?: string } })?.error;
  return typeof error?.message === 'string' ? error.message : fallback;
}

/** Models the key can see, split by what the product actually needs. */
async function listModels(apiKey: string) {
  const response = await fetch(
    `${GEMINI_BASE}/models?pageSize=200&key=${encodeURIComponent(apiKey)}`,
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(messageOf(payload, `Gemini returned ${response.status}`));
  }

  const names: string[] = (payload.models ?? [])
    .filter((model: { supportedGenerationMethods?: string[] }) =>
      (model.supportedGenerationMethods ?? []).includes('generateContent'),
    )
    .map((model: { name: string }) => model.name.replace(/^models\//, ''));

  return {
    text: names.filter((name) => !name.includes('image') && !name.includes('embedding')).sort(),
    image: names.filter((name) => name.includes('image')).sort(),
  };
}

/** One real call. Returns null when the model works, or the reason it does not. */
async function verifyTextModel(apiKey: string, model: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with ok.' }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: PROBE_SCHEMA },
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok) return messageOf(payload, `Gemini returned ${response.status}`);

    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return 'the model returned no text';
    JSON.parse(text);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown error';
  }
}

async function verifyImageModel(apiKey: string, model: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'A plain grey square.' }] }],
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok) return messageOf(payload, `Gemini returned ${response.status}`);

    const parts = payload?.candidates?.[0]?.content?.parts ?? [];
    const hasImage = parts.some(
      (part: Record<string, unknown>) => part.inlineData ?? part.inline_data,
    );
    return hasImage ? null : 'the model returned no image data';
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown error';
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Supabase environment is not configured' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'missing Authorization header' });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'not authenticated' });

  let body: {
    action?: unknown;
    brand_id?: unknown;
    text_model?: unknown;
    image_model?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }

  const action = body.action === 'select' ? 'select' : 'list';
  const brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
  if (!brandId) return json(400, { error: 'brand_id is required' });

  // The brand id in the body is the client's assertion, not a fact: re-read it
  // through the caller's own session so RLS decides what they may see.
  const { data: brand } = await userClient
    .from('brands')
    .select('id, organization_id')
    .eq('id', brandId)
    .maybeSingle();
  if (!brand) return json(404, { error: 'brand not found' });

  const { data: membership } = await userClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', brand.organization_id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!membership) return json(403, { error: 'not a member of this organization' });

  // Reading the list is harmless; changing which model the organization pays to
  // run is not.
  if (action === 'select' && !ADMIN_ROLES.has(membership.role)) {
    return json(403, { error: 'only an organization owner or admin can change the model' });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const apiKey = await resolveGeminiApiKey(serviceClient, brand.organization_id);
  if (!apiKey) {
    return json(503, { error: 'no Gemini API key is configured for this organization' });
  }

  const { data: current } = await serviceClient
    .from('ai_provider_keys')
    .select('text_model, image_model')
    .eq('organization_id', brand.organization_id)
    .eq('provider', 'GEMINI')
    .maybeSingle();

  if (action === 'list') {
    try {
      const models = await listModels(apiKey);
      return json(200, {
        ...models,
        selected: {
          text_model: current?.text_model ?? null,
          image_model: current?.image_model ?? null,
        },
        defaults: { text_model: GEMINI_TEXT_MODEL, image_model: GEMINI_IMAGE_MODEL },
      });
    } catch (error) {
      return json(502, {
        error: `Could not list models: ${error instanceof Error ? error.message : 'unknown error'}`,
      });
    }
  }

  const textModel = typeof body.text_model === 'string' ? body.text_model.trim() : '';
  const imageModel = typeof body.image_model === 'string' ? body.image_model.trim() : '';
  if (!textModel && !imageModel) {
    return json(400, { error: 'text_model or image_model is required' });
  }

  const warnings: string[] = [];
  const update: Record<string, string> = {};

  if (textModel) {
    // Strict: generation is the core path, and a text model that cannot answer
    // is not a configuration worth saving.
    const failure = await verifyTextModel(apiKey, textModel);
    if (failure) {
      return json(400, { error: `${textModel} did not answer: ${failure}` });
    }
    update.text_model = textModel;
  }

  if (imageModel) {
    // Lenient: the usual failure here is 429 from an unbilled key, which the
    // owner fixes in Google Cloud, not in this dropdown.
    const failure = await verifyImageModel(apiKey, imageModel);
    if (failure) {
      warnings.push(`${imageModel} could not be verified: ${failure}`);
    }
    update.image_model = imageModel;
  }

  const { error: updateError } = await serviceClient
    .from('ai_provider_keys')
    .update(update)
    .eq('organization_id', brand.organization_id)
    .eq('provider', 'GEMINI');
  if (updateError) return json(500, { error: 'failed to save the model selection' });

  return json(200, {
    saved: true,
    text_model: update.text_model ?? current?.text_model ?? null,
    image_model: update.image_model ?? current?.image_model ?? null,
    warnings,
  });
});
