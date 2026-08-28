// `generate-image`: Milestone 7. Same six-step gate as generate-post (see
// docs/SECURITY.md and ../generate-post/index.ts), applied to turning an
// already-generated post version's creative direction into an image.
//
// Imports from ../_shared/ai.ts — see that file's header comment for why
// this isn't a real cross-package import.

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  AI_PROVIDER,
  assertUntrustedSize,
  IMAGE_PROMPT_GUARDRAIL,
  INPUT_LIMITS,
  renderUntrusted,
  resolveGeminiApiKey,
  resolveGeminiModels,
  sanitizeUserText,
  type UntrustedBlock,
} from '../_shared/ai.ts';

const WRITE_ROLES = new Set(['OWNER', 'ADMIN', 'EDITOR']);

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Supabase environment is not configured' });
  }

  // 1. Verify the JWT.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'missing Authorization header' });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'not authenticated' });

  let body: { post_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  const postId = typeof body.post_id === 'string' ? body.post_id : null;
  if (!postId) return json(400, { error: 'post_id is required' });

  // 2. Re-check authorization server-side, against the caller's own session.
  const { data: post } = await userClient
    .from('posts')
    .select('id, brand_id, current_version_id')
    .eq('id', postId)
    .maybeSingle();
  if (!post || !post.current_version_id) return json(404, { error: 'post not found' });

  const { data: brand } = await userClient
    .from('brands')
    .select('id, organization_id, name')
    .eq('id', post.brand_id)
    .maybeSingle();
  if (!brand) return json(404, { error: 'brand not found' });

  const { data: membership } = await userClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', brand.organization_id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!membership || !WRITE_ROLES.has(membership.role)) {
    return json(403, { error: 'not permitted to generate images for this brand' });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 3. Check the allowance — image calls draw from the same brand quota as text.
  const { data: allowanceRows, error: allowanceError } = await serviceClient.rpc('ai_allowance', {
    p_brand_id: brand.id,
  });
  if (allowanceError) {
    return json(500, { error: `allowance check failed: ${allowanceError.message}` });
  }
  const allowance = Array.isArray(allowanceRows) ? allowanceRows[0] : allowanceRows;
  if (!allowance?.allowed) {
    return json(429, {
      error: 'generation quota exceeded',
      hourly_used: allowance?.hourly_used,
      hourly_limit: allowance?.hourly_limit,
      daily_used: allowance?.daily_used,
      daily_limit: allowance?.daily_limit,
      monthly_used: allowance?.monthly_used,
      monthly_limit: allowance?.monthly_limit,
    });
  }

  // 4. Validate and sanitize input before it is rendered into a prompt. The
  // creative direction and generation prompt are themselves prior model
  // output — still untrusted, per docs/SECURITY.md's model boundary.
  const [{ data: version }, { data: guidelines }] = await Promise.all([
    serviceClient
      .from('post_versions')
      .select('id, generation_prompt, creative_direction')
      .eq('id', post.current_version_id)
      .maybeSingle(),
    serviceClient
      .from('brand_guidelines')
      .select('visual_rules')
      .eq('brand_id', brand.id)
      .maybeSingle(),
  ]);
  if (!version) return json(404, { error: 'post version not found' });

  const field = (value: unknown) =>
    sanitizeUserText(
      typeof value === 'string' ? value : JSON.stringify(value ?? ''),
      INPUT_LIMITS.brandField,
    ).text;

  const untrustedBlocks: UntrustedBlock[] = [
    { label: 'BRAND_NAME', content: field(brand.name) },
    { label: 'VISUAL_RULES', content: field(guidelines?.visual_rules) },
    { label: 'CREATIVE_DIRECTION', content: field(version.creative_direction) },
    { label: 'GENERATION_PROMPT', content: field(version.generation_prompt) },
  ];

  try {
    assertUntrustedSize(untrustedBlocks);
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : 'input too large' });
  }

  const imagePrompt = `${renderUntrusted(untrustedBlocks)}\n\n${IMAGE_PROMPT_GUARDRAIL}`;

  // Resolved before the audit row, so the row records the model actually used
  // rather than the compiled-in default.
  const { imageModel } = await resolveGeminiModels(serviceClient, brand.organization_id);

  // 5. Write the ai_generations row before calling Gemini.
  const startedAt = Date.now();
  const { data: generationRow, error: generationInsertError } = await serviceClient
    .from('ai_generations')
    .insert({
      brand_id: brand.id,
      post_id: post.id,
      generation_type: 'IMAGE',
      provider: AI_PROVIDER,
      model: imageModel,
      input_json: { post_version_id: version.id },
    })
    .select('id')
    .single();
  if (generationInsertError || !generationRow) {
    return json(500, { error: 'failed to record the generation audit row' });
  }

  const recordFailure = (output: Record<string, unknown>) =>
    serviceClient
      .from('ai_generations')
      .update({ output_json: output, duration_ms: Date.now() - startedAt })
      .eq('id', generationRow.id);

  const geminiApiKey = await resolveGeminiApiKey(serviceClient, brand.organization_id);
  if (!geminiApiKey) {
    await recordFailure({ error: 'no Gemini API key configured for this brand or project' });
    return json(503, { error: 'Gemini is not configured yet — connect a key in Settings' });
  }

  // 6. Call Gemini, persist the image, then update the audit row with the outcome.
  let imageBytes: Uint8Array;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText.slice(0, 500)}`);
    }
    const payload = await response.json();
    const parts = payload?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (part: { inlineData?: { data?: string } }) => part?.inlineData?.data,
    );
    const base64 = imagePart?.inlineData?.data;
    if (typeof base64 !== 'string') throw new Error('Gemini response had no image data');
    imageBytes = base64ToBytes(base64);
  } catch (error) {
    await recordFailure({ error: error instanceof Error ? error.message : 'unknown Gemini error' });
    return json(502, { error: 'the Gemini image call failed' });
  }

  const storagePath = `${brand.id}/${post.id}/${version.id}.png`;
  const { error: uploadError } = await serviceClient.storage
    .from('generated-images')
    .upload(storagePath, imageBytes, { contentType: 'image/png', upsert: true });
  if (uploadError) {
    await recordFailure({ error: `storage upload failed: ${uploadError.message}` });
    return json(500, { error: 'failed to store the generated image' });
  }

  await Promise.all([
    serviceClient
      .from('post_versions')
      .update({ image_storage_path: storagePath })
      .eq('id', version.id),
    serviceClient
      .from('ai_generations')
      .update({
        output_json: { storage_path: storagePath },
        duration_ms: Date.now() - startedAt,
      })
      .eq('id', generationRow.id),
  ]);

  return json(200, { post_id: post.id, storage_path: storagePath });
});
