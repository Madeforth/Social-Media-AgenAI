// `ai-providers`: everything an owner does to configure which AI runs their work.
//
// Replaces `connect-gemini` and `gemini-models`, which both assumed one
// credential per organization. That assumption breaks as soon as the best text
// model and the best image model come from different companies — Gemini writes
// the copy, Ideogram may draw — so a connection is now a named row, an
// organization may hold up to five, and a routing row says which one does which
// job.
//
// Same gate as every other privileged function: verify the JWT, re-check
// membership through the caller's own session, and never let a key leave the
// server. Reading is open to any member; every change requires OWNER or ADMIN,
// because each one moves real spending.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { GEMINI_IMAGE_MODEL, GEMINI_TEXT_MODEL, type AiProvider } from '../_shared/ai.ts';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);
const PROVIDERS: AiProvider[] = ['GEMINI', 'IDEOGRAM'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const IDEOGRAM_GENERATE = 'https://api.ideogram.ai/v1/ideogram-v3/generate';

/**
 * What Ideogram bills on, cheapest first. Our `image_model` column holds one of
 * these. Taken from the API's own validation error rather than the docs, which
 * disagree with it.
 */
const IDEOGRAM_RENDERING_SPEEDS = ['FLASH', 'TURBO', 'BALANCED', 'QUALITY'];

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

/**
 * Confirms a key belongs to who it claims to.
 *
 * Gemini has a free ListModels call, so that costs nothing.
 *
 * Ideogram has no such endpoint, and it validates the request body *before* the
 * key — an empty body returns 400 whether the key is real or not, which is how
 * the first version of this check silently passed a bogus key. The request must
 * therefore be well formed, and a well-formed request generates an image. So
 * verification costs one FLASH image, the cheapest tier, and only when the key
 * turns out to be valid: a bad key is refused at 401 before anything is drawn.
 *
 * That is worth the few cents. It proves the key works against the exact call
 * shape this product uses, rather than merely that a string was accepted.
 */
async function verifyKey(provider: AiProvider, apiKey: string): Promise<string | null> {
  try {
    if (provider === 'GEMINI') {
      const response = await fetch(`${GEMINI_BASE}/models?key=${encodeURIComponent(apiKey)}`);
      if (response.ok) return null;
      return messageOf(await response.json(), `Gemini returned ${response.status}`);
    }

    const form = new FormData();
    form.append('prompt', 'A plain grey square.');
    form.append('aspect_ratio', '1x1');
    form.append('rendering_speed', 'FLASH');
    form.append('magic_prompt', 'OFF');
    form.append('num_images', '1');

    const response = await fetch(IDEOGRAM_GENERATE, {
      method: 'POST',
      headers: { 'Api-Key': apiKey },
      body: form,
    });
    if (response.status === 401 || response.status === 403) {
      return 'Ideogram rejected this key';
    }
    if (!response.ok) {
      const text = await response.text();
      return `Ideogram returned ${response.status}: ${text.slice(0, 160)}`;
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown error';
  }
}

/** The models a Gemini key can reach, split by what the product needs. */
async function listGeminiModels(apiKey: string) {
  const response = await fetch(
    `${GEMINI_BASE}/models?pageSize=200&key=${encodeURIComponent(apiKey)}`,
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(messageOf(payload, `Gemini returned ${response.status}`));

  const names: string[] = (payload.models ?? [])
    .filter((model: { supportedGenerationMethods?: string[] }) =>
      (model.supportedGenerationMethods ?? []).includes('generateContent'),
    )
    .map((model: { name: string }) => model.name.replace(/^models\//, ''));

  return {
    text: names.filter((n) => !n.includes('image') && !n.includes('embedding')).sort(),
    image: names.filter((n) => n.includes('image')).sort(),
  };
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }

  const action = String(body.action ?? 'list');
  const brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
  if (!brandId) return json(400, { error: 'brand_id is required' });

  // The brand id in the body is the client's assertion. Re-read it through the
  // caller's own session so RLS decides what they may touch.
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

  const isAdmin = ADMIN_ROLES.has(membership.role);
  if (action !== 'list' && action !== 'models' && !isAdmin) {
    return json(403, { error: 'only an organization owner or admin can change AI providers' });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const org = brand.organization_id;

  const loadConnections = async () => {
    const { data } = await serviceClient
      .from('ai_provider_keys')
      .select('id, provider, label, text_model, image_model, created_at')
      .eq('organization_id', org)
      .order('created_at', { ascending: true });
    return data ?? [];
  };

  const loadRouting = async () => {
    const { data } = await serviceClient
      .from('ai_routing')
      .select('text_provider_key_id, image_provider_key_id')
      .eq('organization_id', org)
      .maybeSingle();
    return data ?? { text_provider_key_id: null, image_provider_key_id: null };
  };

  // -------------------------------------------------------------- list
  if (action === 'list') {
    return json(200, {
      connections: await loadConnections(),
      routing: await loadRouting(),
      limit: 5,
      providers: PROVIDERS,
      ideogram_rendering_speeds: IDEOGRAM_RENDERING_SPEEDS,
      defaults: { text_model: GEMINI_TEXT_MODEL, image_model: GEMINI_IMAGE_MODEL },
    });
  }

  // --------------------------------------------------------------- add
  if (action === 'add') {
    const provider = String(body.provider ?? '') as AiProvider;
    const label = String(body.label ?? '').trim();
    const apiKey = String(body.api_key ?? '').trim();

    if (!PROVIDERS.includes(provider)) return json(400, { error: 'unknown provider' });
    if (!label) return json(400, { error: 'a label is required' });
    if (!apiKey) return json(400, { error: 'an API key is required' });

    const existing = await loadConnections();
    if (existing.length >= 5) {
      return json(400, { error: 'an organization may hold at most 5 AI provider connections' });
    }
    if (existing.some((row) => row.label.toLowerCase() === label.toLowerCase())) {
      return json(400, { error: 'that label is already in use' });
    }

    const failure = await verifyKey(provider, apiKey);
    if (failure) return json(400, { error: `Could not verify this key: ${failure}` });

    const { data: secretId, error: secretError } = await serviceClient.rpc(
      'store_provider_secret',
      { p_secret: apiKey, p_name: `${provider.toLowerCase()}:${org}:${label}` },
    );
    if (secretError || !secretId) return json(500, { error: 'failed to store the key' });

    const { data: inserted, error: insertError } = await serviceClient
      .from('ai_provider_keys')
      .insert({
        organization_id: org,
        provider,
        label,
        secret_ref: secretId,
        image_model: provider === 'IDEOGRAM' ? 'BALANCED' : null,
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      return json(500, { error: 'failed to save the connection' });
    }

    return json(200, { added: true, id: inserted.id });
  }

  // ------------------------------------------------------------ delete
  if (action === 'delete') {
    const id = String(body.connection_id ?? '');
    if (!id) return json(400, { error: 'connection_id is required' });

    // Scoped to this organization so an id from elsewhere cannot be deleted, and
    // the routing row's own foreign keys null themselves out.
    const { error } = await serviceClient
      .from('ai_provider_keys')
      .delete()
      .eq('id', id)
      .eq('organization_id', org);
    if (error) return json(500, { error: 'failed to delete the connection' });

    return json(200, { deleted: true });
  }

  // ------------------------------------------------------------- route
  if (action === 'route') {
    const textId =
      body.text_provider_key_id === null ? null : String(body.text_provider_key_id ?? '');
    const imageId =
      body.image_provider_key_id === null ? null : String(body.image_provider_key_id ?? '');

    const connections = await loadConnections();
    const byId = new Map(connections.map((row) => [row.id, row]));

    // Ideogram has no text API, so pointing text at it would fail on the next
    // generation rather than here. Refuse it now, where it can be explained.
    if (textId && byId.get(textId)?.provider !== 'GEMINI') {
      return json(400, { error: 'only a Gemini connection can generate text' });
    }
    if (imageId && !byId.has(imageId)) {
      return json(400, { error: 'unknown image provider connection' });
    }

    const { error } = await serviceClient.from('ai_routing').upsert(
      {
        organization_id: org,
        text_provider_key_id: textId || null,
        image_provider_key_id: imageId || null,
      },
      { onConflict: 'organization_id' },
    );
    if (error) return json(500, { error: 'failed to save the routing' });

    return json(200, { routed: true });
  }

  // ------------------------------------------------------------ models
  if (action === 'models' || action === 'set_models') {
    const id = String(body.connection_id ?? '');
    if (!id) return json(400, { error: 'connection_id is required' });

    const { data: row } = await serviceClient
      .from('ai_provider_keys')
      .select('id, provider, secret_ref, text_model, image_model')
      .eq('id', id)
      .eq('organization_id', org)
      .maybeSingle();
    if (!row) return json(404, { error: 'connection not found' });

    if (action === 'models') {
      // Ideogram exposes rendering speeds rather than a model list, and they are
      // fixed, so there is nothing to fetch.
      if (row.provider === 'IDEOGRAM') {
        return json(200, { text: [], image: IDEOGRAM_RENDERING_SPEEDS });
      }
      const { data: secret } = await serviceClient.rpc('read_provider_secret', {
        p_secret_id: row.secret_ref,
      });
      if (typeof secret !== 'string') return json(500, { error: 'could not read the key' });
      try {
        return json(200, await listGeminiModels(secret));
      } catch (error) {
        return json(502, {
          error: `Could not list models: ${error instanceof Error ? error.message : 'unknown error'}`,
        });
      }
    }

    if (!isAdmin) {
      return json(403, { error: 'only an organization owner or admin can change the model' });
    }

    // A field the form did not submit is left alone; a field submitted empty
    // means "go back to the default", which has to clear the column rather than
    // be treated as a missing value. Choosing Default for both is a legitimate
    // save, not an error.
    const update: Record<string, string | null> = {};

    if ('text_model' in body) {
      const textModel = String(body.text_model ?? '').trim();
      if (textModel && row.provider !== 'GEMINI') {
        return json(400, { error: 'this provider has no text model' });
      }
      update.text_model = textModel || null;
    }

    if ('image_model' in body) {
      const imageModel = String(body.image_model ?? '').trim();
      if (
        imageModel &&
        row.provider === 'IDEOGRAM' &&
        !IDEOGRAM_RENDERING_SPEEDS.includes(imageModel)
      ) {
        return json(400, { error: 'unknown Ideogram rendering speed' });
      }
      update.image_model = imageModel || null;
    }

    if (Object.keys(update).length === 0) {
      return json(400, { error: 'text_model or image_model is required' });
    }

    const { error } = await serviceClient
      .from('ai_provider_keys')
      .update(update)
      .eq('id', id)
      .eq('organization_id', org);
    if (error) return json(500, { error: 'failed to save the model selection' });

    return json(200, { saved: true, ...update });
  }

  return json(400, { error: 'unknown action' });
});
