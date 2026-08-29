import path from 'node:path';

import type { CreativePlan, LayoutRecipe, PlatformFormat, RenderInput } from '@apex/types';
import { LAYOUT_RECIPES, PLATFORM_FORMATS } from '@apex/types';

import { composeCreative } from '@/lib/creative-compositor';
import { verifyRenderBody } from '@/lib/creative-render-signing';

/**
 * Internal-only Creative Engine V2 compositor. Called exclusively by the
 * `generate-image` Edge Function with an HMAC-signed body — never reachable
 * from a browser with meaningful input, since every field it trusts (plan,
 * background, logo) was already resolved and validated server-side before
 * this request was signed. See `docs/SECURITY.md`-style reasoning in
 * `supabase/functions/_shared/creative-v2.ts`'s signing section.
 *
 * `sharp` is native, so this route needs the Node runtime — it cannot run on
 * the Edge runtime or inside a Deno Supabase Function.
 */
export const runtime = 'nodejs';
export const maxDuration = 60;

interface RenderRequestBody {
  candidateId: string;
  plan: CreativePlan;
  assets: {
    backgroundUrl: string;
    logoUrl: string;
    logoId: string;
    productUiUrl?: string;
    productUiId?: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRequestBody(raw: unknown): RenderRequestBody {
  if (!isRecord(raw)) throw new Error('request body must be an object');
  const candidateId = raw.candidateId;
  const plan = raw.plan;
  const assets = raw.assets;
  if (typeof candidateId !== 'string') throw new Error('candidateId is required');
  if (!isRecord(plan)) throw new Error('plan is required');
  if (!isRecord(assets)) throw new Error('assets is required');
  if (typeof assets.backgroundUrl !== 'string' || typeof assets.logoUrl !== 'string' || typeof assets.logoId !== 'string') {
    throw new Error('assets.backgroundUrl, assets.logoUrl and assets.logoId are required');
  }
  if (!PLATFORM_FORMATS.includes(plan.format as PlatformFormat)) throw new Error('plan.format is invalid');
  if (!LAYOUT_RECIPES.includes(plan.layoutRecipe as LayoutRecipe)) throw new Error('plan.layoutRecipe is invalid');
  if (!isRecord(plan.copy)) throw new Error('plan.copy is required');
  if (!isRecord(plan.scene)) throw new Error('plan.scene is required');
  if (!isRecord(plan.sceneFocus)) throw new Error('plan.sceneFocus is required');

  return {
    candidateId,
    plan: plan as unknown as CreativePlan,
    assets: {
      backgroundUrl: assets.backgroundUrl,
      logoUrl: assets.logoUrl,
      logoId: assets.logoId,
      productUiUrl: typeof assets.productUiUrl === 'string' ? assets.productUiUrl : undefined,
      productUiId: typeof assets.productUiId === 'string' ? assets.productUiId : undefined,
    },
  };
}

function allowedAssetUrl(raw: string): URL {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  const allowedOrigin = new URL(supabaseUrl).origin;
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.origin !== allowedOrigin) throw new Error('Untrusted asset URL.');
  if (!url.pathname.includes('/storage/v1/object/sign/')) throw new Error('Asset URL must be a signed Storage URL.');
  return url;
}

async function download(raw: string): Promise<Uint8Array> {
  const url = allowedAssetUrl(raw);
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Asset download failed: ${response.status}`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`Unexpected asset type: ${type}`);
  const max = Number(process.env.CREATIVE_RENDER_MAX_BYTES ?? 12_582_912);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > max) throw new Error('Asset exceeds renderer byte limit.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > max) throw new Error('Asset exceeds renderer byte limit.');
  return bytes;
}

function fontPaths() {
  const base = path.join(process.cwd(), 'assets', 'fonts');
  return {
    display: process.env.CREATIVE_MONTSERRAT_FONT_PATH ?? path.join(base, 'montserrat', 'Montserrat-Variable.ttf'),
    body: process.env.CREATIVE_POPPINS_FONT_PATH ?? path.join(base, 'poppins', 'Poppins-Regular.ttf'),
    technical: process.env.CREATIVE_POPPINS_SEMIBOLD_FONT_PATH ?? path.join(base, 'poppins', 'Poppins-SemiBold.ttf'),
  };
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CREATIVE_RENDER_SIGNING_SECRET;
  if (!secret) return Response.json({ error: 'renderer is not configured' }, { status: 503 });

  const body = await request.text();
  const timestamp = request.headers.get('x-creative-timestamp') ?? '';
  const signature = request.headers.get('x-creative-signature') ?? '';
  const valid = await verifyRenderBody(
    secret, timestamp, body, signature,
    Number(process.env.CREATIVE_RENDER_CLOCK_SKEW_SECONDS ?? 60),
  );
  if (!valid) return Response.json({ error: 'invalid render signature' }, { status: 401 });

  try {
    const payload = parseRequestBody(JSON.parse(body));
    const [background, logo, productUi] = await Promise.all([
      download(payload.assets.backgroundUrl),
      download(payload.assets.logoUrl),
      payload.assets.productUiUrl ? download(payload.assets.productUiUrl) : Promise.resolve(undefined),
    ]);

    const input: RenderInput = {
      candidateId: payload.candidateId,
      plan: payload.plan,
      background,
      logo: { id: payload.assets.logoId, type: 'LOGO', mimeType: 'image/png', bytes: logo, sha256: 'verified-upstream' },
      productUi: productUi && payload.assets.productUiId
        ? { id: payload.assets.productUiId, type: 'PRODUCT_UI', mimeType: 'image/png', bytes: productUi, sha256: 'verified-upstream' }
        : undefined,
    };

    const output = await composeCreative(input, fontPaths());
    return new Response(Buffer.from(output.bytes), {
      status: 200,
      headers: {
        'Content-Type': output.mimeType,
        'X-Creative-Width': String(output.width),
        'X-Creative-Height': String(output.height),
        'X-Creative-Checks': output.deterministicChecks.join(','),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'render failed' }, { status: 400 });
  }
}

