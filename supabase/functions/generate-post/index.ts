// `generate-post`: the Edge Function gate described in docs/SECURITY.md §"The
// Edge Function gate — Milestone 6". Runs the six checks in the documented
// order, then calls Gemini and persists a post + its first version — or, when
// `post_id` is given (Milestone 8's "Regenerate"), appends a new version to
// that existing post instead of creating a new one.
//
// Imports from ../_shared/ai.ts, a self-contained Deno copy of
// packages/ai/src — see that file's header comment for why it isn't a real
// cross-package import.

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  AI_PROVIDER,
  assertUntrustedSize,
  CONTENT_PROPOSAL_SCHEMA,
  CREATIVE_DIRECTOR_SYSTEM_PROMPT,
  findForbiddenClaims,
  GEMINI_TEXT_MODEL,
  INPUT_LIMITS,
  renderUntrusted,
  sanitizeUserText,
  validateContentProposal,
  type UntrustedBlock,
} from '../_shared/ai.ts';

const WRITE_ROLES = new Set(['OWNER', 'ADMIN', 'EDITOR']);

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Supabase environment is not configured' });
  }

  // 1. Verify the JWT. Reject an unauthenticated request outright.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'missing Authorization header' });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'not authenticated' });

  let body: { brand_id?: unknown; brief?: unknown; post_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  const regeneratingPostId = typeof body.post_id === 'string' ? body.post_id : null;

  // 2. Re-check authorization server-side. The service role bypasses RLS, so a
  // brand_id (or post_id) in the request body is an assertion by the client,
  // not a fact — this check runs against the caller's own session, never the
  // service role.
  let brandId: string | null = null;
  if (regeneratingPostId) {
    const { data: existingPost } = await userClient
      .from('posts')
      .select('brand_id')
      .eq('id', regeneratingPostId)
      .maybeSingle();
    if (!existingPost) return json(404, { error: 'post not found' });
    brandId = existingPost.brand_id;
  } else {
    brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
  }
  if (!brandId) return json(400, { error: 'brand_id is required' });

  const { data: brand } = await userClient
    .from('brands')
    .select('id, organization_id, name')
    .eq('id', brandId)
    .maybeSingle();
  if (!brand) return json(404, { error: 'brand not found' });

  const { data: membership } = await userClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', brand.organization_id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!membership || !WRITE_ROLES.has(membership.role)) {
    return json(403, { error: 'not permitted to generate content for this brand' });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 3. Check the allowance.
  const { data: allowanceRows, error: allowanceError } = await serviceClient.rpc('ai_allowance', {
    p_brand_id: brandId,
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

  // 4. Validate and sanitize input before it is rendered into a prompt.
  const brief = sanitizeUserText(
    typeof body.brief === 'string' ? body.brief : '',
    INPUT_LIMITS.brief,
  );

  const [{ data: guidelines }, { data: recentPosts }] = await Promise.all([
    serviceClient.from('brand_guidelines').select('*').eq('brand_id', brandId).maybeSingle(),
    serviceClient
      .from('posts')
      .select('concept_title, content_pillar, visual_format, created_at')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const field = (value: unknown) =>
    sanitizeUserText(
      typeof value === 'string' ? value : JSON.stringify(value ?? ''),
      INPUT_LIMITS.brandField,
    ).text;

  const untrustedBlocks: UntrustedBlock[] = [
    { label: 'BRAND_NAME', content: field(brand.name) },
    { label: 'MISSION', content: field(guidelines?.mission) },
    { label: 'VISION', content: field(guidelines?.vision) },
    { label: 'POSITIONING', content: field(guidelines?.positioning) },
    { label: 'TARGET_AUDIENCE', content: field(guidelines?.target_audience) },
    { label: 'TONE_OF_VOICE', content: field(guidelines?.tone_of_voice) },
    { label: 'VISUAL_RULES', content: field(guidelines?.visual_rules) },
    { label: 'COPY_RULES', content: field(guidelines?.copy_rules) },
    { label: 'FORBIDDEN_CLAIMS', content: field(guidelines?.forbidden_claims) },
    { label: 'CONTENT_PILLARS', content: field(guidelines?.content_pillars) },
    { label: 'RECENT_POSTS', content: field(recentPosts) },
    { label: 'BRIEF', content: brief.text },
  ];

  try {
    assertUntrustedSize(untrustedBlocks);
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : 'input too large' });
  }

  const userPrompt = renderUntrusted(untrustedBlocks);

  // 5. Write the ai_generations row so the call is counted whether or not it
  // succeeds — an uncounted failure is a free retry for an attacker.
  const startedAt = Date.now();
  const { data: generationRow, error: generationInsertError } = await serviceClient
    .from('ai_generations')
    .insert({
      brand_id: brandId,
      generation_type: 'POST_PROPOSAL',
      provider: AI_PROVIDER,
      model: GEMINI_TEXT_MODEL,
      input_json: { brief: brief.text, regenerating_post_id: regeneratingPostId },
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

  if (!GEMINI_API_KEY) {
    await recordFailure({ error: 'GEMINI_API_KEY not configured' });
    return json(503, { error: 'Gemini is not configured on this project' });
  }

  let geminiJson: unknown;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: CREATIVE_DIRECTOR_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CONTENT_PROPOSAL_SCHEMA,
          },
        }),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText.slice(0, 500)}`);
    }
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') throw new Error('Gemini response had no text output');
    geminiJson = JSON.parse(text);
  } catch (error) {
    await recordFailure({ error: error instanceof Error ? error.message : 'unknown Gemini error' });
    return json(502, { error: 'the Gemini call failed' });
  }

  // 6. Validate the response, screen it, then persist.
  const validation = validateContentProposal(geminiJson);
  if (!validation.ok) {
    await recordFailure({ raw: geminiJson, failures: validation.failures });
    return json(502, { error: 'Gemini response failed validation', failures: validation.failures });
  }

  const proposal = validation.value;
  const forbiddenHits = findForbiddenClaims(
    proposal,
    Array.isArray(guidelines?.forbidden_claims) ? (guidelines.forbidden_claims as string[]) : [],
  );

  await serviceClient
    .from('ai_generations')
    .update({
      output_json: { proposal, forbidden_hits: forbiddenHits },
      duration_ms: Date.now() - startedAt,
    })
    .eq('id', generationRow.id);

  const postStatus = forbiddenHits.length > 0 ? 'REVISION' : 'READY';

  let postId: string;
  let nextVersionNumber = 1;

  if (regeneratingPostId) {
    const { data: latestVersion } = await serviceClient
      .from('post_versions')
      .select('version_number')
      .eq('post_id', regeneratingPostId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

    const { error: postUpdateError } = await serviceClient
      .from('posts')
      .update({
        status: postStatus,
        content_pillar: proposal.content_pillar,
        objective: proposal.objective,
        concept_title: proposal.concept_title,
        visual_format: proposal.visual_format,
        ui_asset_required: proposal.ui_asset_required,
      })
      .eq('id', regeneratingPostId);
    if (postUpdateError) return json(500, { error: 'failed to update the post' });
    postId = regeneratingPostId;
  } else {
    const { data: post, error: postError } = await serviceClient
      .from('posts')
      .insert({
        brand_id: brandId,
        status: postStatus,
        content_pillar: proposal.content_pillar,
        objective: proposal.objective,
        concept_title: proposal.concept_title,
        visual_format: proposal.visual_format,
        ui_asset_required: proposal.ui_asset_required,
      })
      .select('id')
      .single();
    if (postError || !post) return json(500, { error: 'failed to create the post' });
    postId = post.id;
  }

  const { data: version, error: versionError } = await serviceClient
    .from('post_versions')
    .insert({
      post_id: postId,
      version_number: nextVersionNumber,
      headline: proposal.headline,
      supporting_copy: proposal.supporting_copy,
      caption: proposal.caption,
      cta: proposal.cta,
      hashtags: proposal.hashtags,
      creative_direction: proposal.creative_direction,
      generation_prompt: proposal.generation_prompt,
      created_by: 'AI',
      model_name: GEMINI_TEXT_MODEL,
      model_metadata: {
        rationale: proposal.rationale,
        qa_notes: proposal.qa_notes,
        forbidden_hits: forbiddenHits,
      },
    })
    .select('id')
    .single();
  if (versionError || !version) return json(500, { error: 'failed to create the post version' });

  await Promise.all([
    serviceClient.from('posts').update({ current_version_id: version.id }).eq('id', postId),
    serviceClient.from('ai_generations').update({ post_id: postId }).eq('id', generationRow.id),
  ]);

  if (postStatus === 'READY') {
    const { data: members } = await serviceClient
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', brand.organization_id);
    if (members && members.length > 0) {
      await serviceClient.from('notifications').insert(
        members.map((member) => ({
          user_id: member.user_id,
          type: 'APPROVAL_REQUIRED' as const,
          title: `"${proposal.concept_title}" is ready for review`,
          body: proposal.objective,
          payload: { post_id: postId },
        })),
      );
    }
  }

  return json(200, { post_id: postId, status: postStatus, forbidden_hits: forbiddenHits });
});
