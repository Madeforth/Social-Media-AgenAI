// `generate-image`: Milestone 7. Same six-step gate as generate-post (see
// docs/SECURITY.md and ../generate-post/index.ts), applied to turning an
// already-generated post version's creative direction into an image.
//
// Imports from ../_shared/ai.ts — see that file's header comment for why
// this isn't a real cross-package import.

// Supabase Edge Functions expose this global for work that should keep
// running after the response is sent — exactly what Creative Engine V2
// needs: the calling browser request is capped at 60s (Vercel Hobby's hard
// ceiling, not configurable), but a single candidate's plan + scene +
// compositor + vision critique routinely takes 60-100s+ on its own. Fast
// setup returns a 202 immediately; everything else keeps running here.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

/**
 * Races any promise against a plain timer, independent of whatever
 * cancellation mechanism (if any) the promise itself supports.
 *
 * A real run got stuck at status=RENDERING past even a 130s outer deadline
 * guard, and a live diagnostic proved `Promise.race` + `setTimeout` fires
 * correctly inside `EdgeRuntime.waitUntil` even against a promise that never
 * settles — so the outer guard should have worked. The one thing it can't
 * help with: `AbortSignal`-based fetch timeouts rely on the runtime actually
 * being able to interrupt the underlying connection, and a sufficiently
 * stuck TCP-level hang is not guaranteed to honor that. Wrapping each
 * external call individually means forward progress no longer depends on
 * cancellation succeeding at all — only on this timer, which is proven to
 * fire. The losing call may keep running as an abandoned promise; that's an
 * acceptable one-off cost against a request that never lets the candidate
 * loop, and the outer 130s guard, move on.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  IMAGE_PROMPT_GUARDRAIL,
  INPUT_LIMITS,
  GEMINI_TEXT_MODEL,
  generateImageBytes,
  resolveImageProvider,
  resolveTextProvider,
  sanitizeUserText,
  type ProviderConnection,
} from '../_shared/ai.ts';
import {
  CREATIVE_PLAN_SYSTEM_PROMPT,
  VISUAL_CRITIC_SYSTEM_PROMPT,
  aspectRatioFor,
  createCreativePlan,
  critiqueFinalCreative,
  generateScene,
  passesVisualGate,
  signRenderBody,
  type CreativePlan,
  type CreativeRequest,
} from '../_shared/creative-v2.ts';

const WRITE_ROLES = new Set(['OWNER', 'ADMIN', 'EDITOR']);
const CREATIVE_ENGINE_V2_FORMAT = 'instagram-portrait' as const;
const CREATIVE_RUN_STORAGE_BUCKET = 'generated-images';

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

  // 3b. Creative Engine V2 — deterministic compositor path, behind a flag.
  // Kept entirely separate from the V1 flow below: nothing past this branch
  // runs when the flag is off, and V1 is untouched either way.
  if (Deno.env.get('CREATIVE_ENGINE_V2_ENABLED') === 'true') {
    return await runCreativeEngineV2(serviceClient, post, brand, postId);
  }

  // 4. Validate and sanitize input before it is rendered into a prompt. The
  // creative direction and generation prompt are themselves prior model
  // output — still untrusted, per docs/SECURITY.md's model boundary.
  const { data: version } = await serviceClient
    .from('post_versions')
    .select('id, generation_prompt, creative_direction')
    .eq('id', post.current_version_id)
    .maybeSingle();
  if (!version) return json(404, { error: 'post version not found' });

  // The brief the text model wrote, cleaned but not wrapped.
  //
  // Everything else here used to go through `renderUntrusted`, the same
  // containment used for the text model: a random boundary, <<LABEL>> markers
  // and a preamble saying the enclosed text is data and its instructions must
  // not be followed. That is right for a model that reads instructions. An image
  // model does not read instructions — it draws the words it is given, and it
  // drew these: a poster came back with "Creative direction...", a garbled
  // "BRAND DIRECTION" and a fragment of the hex boundary rendered into it.
  //
  // Containment also buys nothing here. The worst a hostile brief can do to an
  // image model is produce an unwanted picture, which a human reviews before it
  // is ever published. Sanitising the text and capping its length still matters,
  // so that stays.
  //
  // Brand name and visual rules are deliberately not appended either. The
  // system prompt already requires the brief to name its own palette and
  // typography, and every extra sentence here is another string the model may
  // decide to set in type.
  const imagePrompt = [
    sanitizeUserText(version.generation_prompt ?? '', INPUT_LIMITS.brandField).text,
    IMAGE_PROMPT_GUARDRAIL,
  ]
    .filter((part) => part.length > 0)
    .join('\n\n');

  if (imagePrompt.length < IMAGE_PROMPT_GUARDRAIL.length + 20) {
    return json(400, { error: 'this version has no image brief to draw from' });
  }

  // Resolved before the audit row, so the row records the model actually used
  // rather than the compiled-in default.
  const imageProvider = await resolveImageProvider(serviceClient, brand.organization_id);
  if (!imageProvider) {
    return json(503, { error: 'No AI provider is connected — add one in Settings' });
  }

  // 5. Write the ai_generations row before calling the provider.
  const startedAt = Date.now();
  const { data: generationRow, error: generationInsertError } = await serviceClient
    .from('ai_generations')
    .insert({
      brand_id: brand.id,
      post_id: post.id,
      generation_type: 'IMAGE',
      provider: imageProvider.provider.toLowerCase(),
      model: imageProvider.imageModel,
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

  // 6. Draw, persist, then update the audit row with the outcome. The provider
  // difference lives in the shared module: Gemini answers with inline base64,
  // Ideogram answers with an expiring URL that has to be fetched immediately.
  // Both are pinned to 4:5 — left unset Gemini returns landscape and Ideogram
  // returns a square, and neither fits an Instagram feed post.
  let imageBytes: Uint8Array;
  try {
    imageBytes = await generateImageBytes(imageProvider, imagePrompt);
  } catch (error) {
    await recordFailure({
      provider: imageProvider.provider,
      error: error instanceof Error ? error.message : 'unknown provider error',
    });
    return json(502, { error: 'the image generation call failed' });
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

// ---------------------------------------------------------------------------
// Creative Engine V2
// ---------------------------------------------------------------------------
//
// Gemini plans (CreativePlan), Ideogram paints a text-free scene, the Node
// compositor (`apps/web`'s `/api/internal/creative-render` route) draws the
// real logo and exact copy with real fonts, Gemini Vision critiques the
// finished composite, and only a candidate that clears every threshold is
// ever written to `post_versions.image_storage_path`. See
// `supabase/functions/_shared/creative-v2.ts` for the shared logic and
// `docs/...` in the reference research package this was built from for the
// full design rationale.

async function runCreativeEngineV2(
  serviceClient: ReturnType<typeof createClient>,
  post: { id: string; brand_id: string; current_version_id: string },
  brand: { id: string; organization_id: string; name: string },
  postId: string,
): Promise<Response> {
  const { data: postRow } = await serviceClient
    .from('posts')
    .select('content_pillar, objective')
    .eq('id', postId)
    .maybeSingle();

  const { data: version } = await serviceClient
    .from('post_versions')
    .select('id, headline, supporting_copy, cta')
    .eq('id', post.current_version_id)
    .maybeSingle();
  if (!version) return json(404, { error: 'post version not found' });
  if (!version.headline) return json(400, { error: 'this version has no headline to lock in as exact copy yet' });

  const { data: guidelines } = await serviceClient
    .from('brand_guidelines')
    .select('creative_profile')
    .eq('brand_id', brand.id)
    .maybeSingle();
  const creativeProfile = guidelines?.creative_profile;
  if (!creativeProfile || Object.keys(creativeProfile).length === 0) {
    return json(503, { error: 'Creative Engine V2 needs a creative_profile on this brand before it can plan a layout.' });
  }

  const { data: logoAsset } = await serviceClient
    .from('brand_assets')
    .select('id, storage_path')
    .eq('brand_id', brand.id)
    .eq('asset_type', 'LOGO')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!logoAsset) {
    return json(503, { error: 'Creative Engine V2 needs a real LOGO brand asset before it can compose anything — add one in Brand Assets.' });
  }

  const textProvider = await resolveTextProvider(serviceClient, brand.organization_id);
  if (!textProvider) return json(503, { error: 'No Gemini provider is connected — add one in Settings' });

  const imageProvider = await resolveImageProvider(serviceClient, brand.organization_id);
  if (!imageProvider || imageProvider.provider !== 'IDEOGRAM') {
    return json(503, { error: 'Creative Engine V2 needs the image provider routed to Ideogram — check Settings.' });
  }

  const request: CreativeRequest = {
    postId: post.id,
    postVersionId: version.id,
    brandId: brand.id,
    objective: postRow?.objective ?? '',
    audienceId: 'default',
    contentPillarId: postRow?.content_pillar ?? 'default',
    format: CREATIVE_ENGINE_V2_FORMAT,
    language: 'tr',
    factIdsAllowed: [],
    lockedCopy: {
      eyebrow: '',
      headline: version.headline,
      // The compositor's body box has real but finite room and throws
      // rather than silently clip an overflow — the caption carries the
      // full supporting copy regardless, so a defensive word-boundary
      // truncation here only affects what fits in the image.
      body: truncateForImage(version.supporting_copy ?? '', 90),
      // The stored `cta` is a full caption call-to-action sentence ("Save
      // this post for your next garage day."), not a short button label —
      // the compositor's CTA pill is sized for a handful of words. The
      // caption already carries the full sentence, so the image simply
      // omits the pill when there is nothing short enough to put in it.
      cta: (version.cta ?? '').length <= 24 ? (version.cta ?? '') : '',
    },
    assetIds: { logo: logoAsset.id, styleReferences: [] },
    candidateCount: Math.min(4, Math.max(1, Number(Deno.env.get('CREATIVE_ENGINE_CANDIDATE_COUNT') ?? 1))),
  };

  const { data: runRow, error: runInsertError } = await serviceClient
    .from('creative_runs')
    .insert({ brand_id: brand.id, post_id: post.id, post_version_id: version.id, status: 'GENERATING', request_json: request })
    .select('id')
    .single();
  if (runInsertError || !runRow) return json(500, { error: 'failed to open a creative run' });

  const { data: generationRow } = await serviceClient
    .from('ai_generations')
    .insert({
      brand_id: brand.id, post_id: post.id, generation_type: 'IMAGE',
      provider: 'ideogram', model: imageProvider.imageModel,
      input_json: { post_version_id: version.id, creative_run_id: runRow.id, engine: 'v2' },
    })
    .select('id')
    .single();

  // Everything past this point is real, unavoidable wall-clock time
  // (a Gemini planning call alone can take 45s+), so it runs after the
  // response is sent rather than inside the browser's request budget.
  EdgeRuntime.waitUntil(
    processCreativeEngineV2({
      serviceClient, post, brand, version, request, creativeProfile,
      logoAsset, textProvider, imageProvider, runId: runRow.id,
      generationRowId: generationRow?.id ?? null,
    }),
  );

  return json(202, { post_id: post.id, run_id: runRow.id, status: 'GENERATING' });
}

interface ProcessCreativeEngineV2Args {
  serviceClient: ReturnType<typeof createClient>;
  post: { id: string; brand_id: string; current_version_id: string };
  brand: { id: string; organization_id: string; name: string };
  version: { id: string; headline: string; supporting_copy: string | null; cta: string | null };
  request: CreativeRequest;
  creativeProfile: unknown;
  logoAsset: { id: string; storage_path: string };
  textProvider: ProviderConnection;
  imageProvider: ProviderConnection;
  runId: string;
  generationRowId: string | null;
}

/**
 * Safety net around the whole background pipeline. A real run got stuck at
 * status=RENDERING forever, past even Supabase's own background-task budget
 * (150s free / 400s paid), with no failure ever recorded — something inside
 * the candidate loop hung rather than erroring, and once the platform kills
 * the function there is nothing left to write the failure. This races the
 * real work against a deadline comfortably under the free-tier budget, so a
 * hang anywhere becomes a caught, recorded FAILED status instead of an
 * eternal spinner.
 */
async function processCreativeEngineV2(args: ProcessCreativeEngineV2Args): Promise<void> {
  // Individual per-call timeouts below sum to ~135s worst case for one
  // candidate; 145s leaves a little margin under Supabase's confirmed
  // 150s free-tier background-task budget (a live diagnostic completed a
  // 120s+ background sequence successfully) while still landing before the
  // platform's own harder kill.
  const deadlineMs = 145_000;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error('Generation exceeded the background time budget (130s).')),
      deadlineMs,
    );
  });
  try {
    await Promise.race([processCreativeEngineV2Body(args), deadline]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'creative engine v2 failed';
    await args.serviceClient
      .from('creative_runs')
      .update({ status: 'FAILED', failure_json: { message }, completed_at: new Date().toISOString() })
      .eq('id', args.runId);
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

async function processCreativeEngineV2Body({
  serviceClient, post, brand, version, request, creativeProfile, logoAsset, textProvider, imageProvider, runId, generationRowId,
}: ProcessCreativeEngineV2Args): Promise<void> {
  const runRow = { id: runId };
  const generationRow = generationRowId ? { id: generationRowId } : null;
  const startedAt = Date.now();

  let plan: CreativePlan;
  try {
    plan = await withTimeout(
      createCreativePlan(request, {
        apiKey: textProvider.apiKey, model: textProvider.textModel,
        systemPrompt: CREATIVE_PLAN_SYSTEM_PROMPT, brandContext: creativeProfile,
      }),
      40_000, 'Gemini creative plan',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'creative plan failed';
    await serviceClient.from('creative_runs').update({ status: 'FAILED', failure_json: { message }, completed_at: new Date().toISOString() }).eq('id', runRow.id);
    return;
  }
  await serviceClient.from('creative_runs').update({ status: 'RENDERING', plan_json: plan }).eq('id', runRow.id);

  const renderUrl = Deno.env.get('CREATIVE_RENDER_URL');
  const renderSecret = Deno.env.get('CREATIVE_RENDER_SIGNING_SECRET');
  if (!renderUrl || !renderSecret) {
    await serviceClient.from('creative_runs').update({ status: 'FAILED', failure_json: { message: 'renderer not configured' } }).eq('id', runRow.id);
    return;
  }

  const { data: logoSigned } = await serviceClient.storage.from('brand-assets').createSignedUrl(logoAsset.storage_path, 300);
  if (!logoSigned) {
    await serviceClient.from('creative_runs').update({ status: 'FAILED', failure_json: { message: 'could not sign the logo asset' } }).eq('id', runRow.id);
    return;
  }

  const visionModel = Deno.env.get('GEMINI_VISION_MODEL') || textProvider.textModel || GEMINI_TEXT_MODEL;
  const candidates: Array<{ id: string; passed: boolean; overall: number }> = [];
  let selected: { candidateId: string; finalStoragePath: string; manifest: Record<string, unknown> } | null = null;

  for (let ordinal = 1; ordinal <= request.candidateCount; ordinal++) {
    try {
      const seed = Math.floor(Math.random() * 2_147_483_647);
      const scene = await withTimeout(
        generateScene(plan, {
          apiKey: imageProvider.apiKey, apiVersion: 'v3',
          renderingSpeed: (imageProvider.imageModel as 'TURBO' | 'DEFAULT' | 'QUALITY' | 'BALANCED') || 'BALANCED',
          aspectRatio: aspectRatioFor(plan.format), seed,
        }),
        35_000, 'Ideogram scene generation',
      );
      const scenePath = `creative-v2/${brand.id}/${runRow.id}/scene-${ordinal}.png`;
      await serviceClient.storage.from(CREATIVE_RUN_STORAGE_BUCKET).upload(scenePath, scene, { contentType: 'image/png', upsert: true });
      const { data: sceneSigned } = await serviceClient.storage.from(CREATIVE_RUN_STORAGE_BUCKET).createSignedUrl(scenePath, 300);
      if (!sceneSigned) throw new Error('could not sign the generated scene');

      const timestamp = String(Date.now());
      const candidateId = crypto.randomUUID();
      const renderBody = JSON.stringify({
        candidateId, plan,
        assets: { backgroundUrl: sceneSigned.signedUrl, logoUrl: logoSigned.signedUrl, logoId: logoAsset.id },
      });
      const signature = await signRenderBody(renderSecret, timestamp, renderBody);
      // A real run got stuck at status=RENDERING forever with no error
      // recorded — this fetch had no timeout of its own, so if the
      // compositor round trip ever hangs instead of erroring, the whole
      // background task hangs with it until Supabase's own budget kills the
      // function, at which point nothing is left to write the failure.
      // Bounded here so a hang becomes a caught, recorded error instead.
      const renderResponse = await withTimeout(
        fetch(renderUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-creative-timestamp': timestamp, 'x-creative-signature': signature },
          body: renderBody,
          signal: AbortSignal.timeout(30_000),
        }),
        35_000, 'compositor round trip',
      );
      if (!renderResponse.ok) throw new Error(`compositor failed: ${renderResponse.status} ${(await renderResponse.text()).slice(0, 300)}`);
      const finalBytes = new Uint8Array(await renderResponse.arrayBuffer());
      const deterministicChecks = (renderResponse.headers.get('x-creative-checks') ?? '').split(',').filter(Boolean);

      const finalPath = `creative-v2/${brand.id}/${runRow.id}/final-${ordinal}.png`;
      await serviceClient.storage.from(CREATIVE_RUN_STORAGE_BUCKET).upload(finalPath, finalBytes, { contentType: 'image/png', upsert: true });

      const qa = await withTimeout(
        critiqueFinalCreative(finalBytes, plan, deterministicChecks, {
          apiKey: textProvider.apiKey, model: visionModel, systemPrompt: VISUAL_CRITIC_SYSTEM_PROMPT,
        }),
        25_000, 'Gemini visual critic',
      );
      const gate = passesVisualGate(qa);

      const manifest = {
        schemaVersion: '2.0', runId: runRow.id, candidateId,
        postId: post.id, postVersionId: version.id,
        format: plan.format, layoutRecipe: plan.layoutRecipe,
        exactCopy: plan.copy, factIdsUsed: plan.factIdsUsed, assetIds: request.assetIds,
        provider: { name: 'ideogram', apiVersion: 'v3', renderingSpeed: imageProvider.imageModel, seed },
        sceneStoragePath: scenePath, finalStoragePath: finalPath, qa,
        createdAt: new Date().toISOString(),
      };

      await serviceClient.from('creative_candidates').insert({
        run_id: runRow.id, brand_id: brand.id, ordinal,
        scene_storage_path: scenePath, final_storage_path: finalPath,
        provider: 'ideogram', api_version: 'v3', rendering_speed: imageProvider.imageModel,
        seed, prompt_hash: await sha256Hex(JSON.stringify(plan.scene)),
        manifest_json: manifest, visual_qa: qa, deterministic_failures: gate.failures,
        selected: false,
      });

      candidates.push({ id: candidateId, passed: gate.ok, overall: qa.overall });
      if (gate.ok && (!selected || qa.overall > (selected.manifest.qa as { overall: number }).overall)) {
        selected = { candidateId, finalStoragePath: finalPath, manifest };
      }
    } catch (error) {
      candidates.push({ id: `failed-${ordinal}`, passed: false, overall: 0 });
      await serviceClient.from('creative_candidates').insert({
        run_id: runRow.id, brand_id: brand.id, ordinal,
        scene_storage_path: `creative-v2/${brand.id}/${runRow.id}/scene-${ordinal}-failed.png`,
        provider: 'ideogram', api_version: 'v3', rendering_speed: imageProvider.imageModel,
        prompt_hash: await sha256Hex(`${runRow.id}-${ordinal}-${Date.now()}`),
        deterministic_failures: [error instanceof Error ? error.message : 'candidate generation failed'],
        selected: false,
      });
    }
  }

  // Candidates were seen completing successfully (real PASS verdicts, real
  // stored images) while the run itself stayed stuck at RENDERING forever —
  // the finalization step below never visibly ran or errored. Broken into
  // individually-caught, breadcrumbed steps so the next run either finishes
  // or leaves a precise record of which specific write never returned,
  // instead of a second silent hang indistinguishable from the first.
  if (generationRow?.id) {
    try {
      await withTimeout(
        serviceClient
          .from('ai_generations')
          .update({ output_json: { run_id: runRow.id, candidates, selected: selected?.candidateId ?? null }, duration_ms: Date.now() - startedAt })
          .eq('id', generationRow.id),
        15_000, 'ai_generations finalize update',
      );
    } catch {
      // Non-critical audit write; do not let it block marking the run's real outcome.
    }
  }

  if (!selected) {
    await withTimeout(
      serviceClient.from('creative_runs').update({ status: 'REVIEW_REQUIRED', completed_at: new Date().toISOString() }).eq('id', runRow.id),
      15_000, 'creative_runs REVIEW_REQUIRED update',
    );
    return;
  }

  await withTimeout(
    serviceClient.from('creative_runs').update({ status: 'REVIEWING' }).eq('id', runRow.id),
    15_000, 'creative_runs REVIEWING breadcrumb',
  );

  await withTimeout(
    serviceClient.from('creative_candidates').update({ selected: true }).eq('run_id', runRow.id).eq('id', selected.candidateId),
    15_000, 'creative_candidates selected update',
  );

  await withTimeout(
    serviceClient.from('post_versions').update({
      image_storage_path: selected.finalStoragePath, creative_plan: plan,
      generation_manifest: selected.manifest, visual_qa: selected.manifest.qa,
    }).eq('id', version.id),
    15_000, 'post_versions finalize update',
  );

  await withTimeout(
    serviceClient.from('creative_runs').update({
      status: 'PASSED', selected_candidate_id: selected.candidateId, completed_at: new Date().toISOString(),
    }).eq('id', runRow.id),
    15_000, 'creative_runs PASSED update',
  );
}

function truncateForImage(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const cut = value.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
