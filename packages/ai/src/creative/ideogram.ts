import type { CreativePlan, PlatformFormat, ResolvedAsset } from '@apex/types';

import { REQUIRED_SCENE_NEGATIVES } from './gates';

/**
 * Ideogram is the scene department, not the whole graphic designer: it paints
 * a text-free background/photograph, and the deterministic compositor layers
 * the real logo, exact copy and CTA on top. See
 * `packages/ai/src/creative/gates.ts` for the code-enforced version of the
 * same rule (banned scene words, required negatives).
 *
 * V3 is the default and only path actually exercised against this repo's
 * existing Ideogram integration (`supabase/functions/_shared/ai.ts` already
 * calls V3). V4's `json_prompt` structured mode is wired here per the
 * reference research package, but its resolution enum should be confirmed
 * against Ideogram's current docs before `apiVersion: 'v4'` is used for real
 * traffic.
 */

const IDEOGRAM_V4 = 'https://api.ideogram.ai/v1/ideogram-v4/generate';
const IDEOGRAM_V3 = 'https://api.ideogram.ai/v1/ideogram-v3/generate';
const DOWNLOAD_HOSTS = new Set(['ideogram.ai', 'ideogramcdn.com']);

export interface IdeogramOptions {
  apiKey: string;
  apiVersion: 'v4' | 'v3';
  renderingSpeed: 'TURBO' | 'DEFAULT' | 'QUALITY' | 'BALANCED';
  aspectRatio: '1x1' | '4x5' | '9x16' | '16x9';
  /** A value accepted by Ideogram V4's current resolution enum; discover from official docs/API. */
  v4Resolution?: string;
  seed?: number;
  styleReferences?: ResolvedAsset[];
  timeoutMs?: number;
  maxAttempts?: number;
}

function allowedDownloadUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Ideogram download must use HTTPS.');
  const hostAllowed = [...DOWNLOAD_HOSTS].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  if (!hostAllowed) throw new Error(`Untrusted Ideogram download host: ${url.hostname}`);
  return url;
}

function retryable(status: number) {
  return status === 429 || status >= 500;
}
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, attempts: number, timeoutMs: number) {
  let last: Error | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!retryable(response.status) || attempt === attempts) return response;
      last = new Error(`Retryable provider response: ${response.status}`);
    } catch (error) {
      last = error instanceof Error ? error : new Error('Provider network failure');
      if (attempt === attempts) throw last;
    } finally {
      clearTimeout(timeout);
    }
    const jitter = Math.floor(Math.random() * 250);
    await wait(Math.min(4_000, 350 * 2 ** (attempt - 1)) + jitter);
  }
  throw last ?? new Error('Ideogram request failed.');
}

function addV3References(form: FormData, refs: ResolvedAsset[]) {
  for (const [index, asset] of refs.slice(0, 3).entries()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BlobPart isn't in this package's lib target; Deno/Node both accept a Uint8Array at runtime.
    form.append('style_reference_images', new Blob([asset.bytes as any], { type: asset.mimeType }), `style-${index}.png`);
  }
}

/**
 * Guarantees the negative prompt actually sent to the provider covers every
 * required term, regardless of how Gemini happened to phrase its own
 * negative prompt — the policy gate stopped rejecting plans over wording
 * ("no UI" vs "user interface") and this is what makes that safe: the
 * substance is enforced here, not trusted from the model's output.
 */
export function withRequiredNegatives(negativePrompt: string): string {
  const lower = negativePrompt.toLowerCase();
  const missing = REQUIRED_SCENE_NEGATIVES.filter((term) => !lower.includes(term));
  if (missing.length === 0) return negativePrompt;
  return [negativePrompt, ...missing].filter(Boolean).join(', ');
}

export function scenePolicySuffix(): string {
  return [
    'No visible text, letters, numbers, signage, label, logo, wordmark, watermark or user interface.',
    'Preserve a calm low-detail negative-space area for deterministic copy overlay.',
    'No cyberpunk HUD, neon overload, fake dashboard, or third-party branding.',
  ].join(' ');
}

export async function generateScene(plan: CreativePlan, options: IdeogramOptions): Promise<Uint8Array> {
  const form = new FormData();
  const speed = options.renderingSpeed === 'BALANCED' && options.apiVersion === 'v4' ? 'DEFAULT' : options.renderingSpeed;

  if (options.apiVersion === 'v4') {
    const jsonPrompt = structuredClone(plan.scene);
    jsonPrompt.high_level_description = `${jsonPrompt.high_level_description} ${scenePolicySuffix()}`;
    form.append('json_prompt', JSON.stringify(jsonPrompt));
    if (!options.v4Resolution) throw new Error('Ideogram V4 requires an explicit accepted resolution.');
    form.append('resolution', options.v4Resolution);
    form.append('rendering_speed', speed);
    form.append('enable_copyright_detection', 'true');
  } else {
    const prompt = [
      plan.scene.high_level_description,
      `Background: ${plan.scene.compositional_deconstruction.background}`,
      `Elements: ${plan.scene.compositional_deconstruction.elements.map((item) => item.desc).join('; ')}`,
      `Aesthetics: ${plan.scene.style_description.aesthetics}`,
      `Lighting: ${plan.scene.style_description.lighting}`,
      `Medium: ${plan.scene.style_description.medium}`,
      scenePolicySuffix(),
    ].join('\n');
    form.append('prompt', prompt);
    form.append('negative_prompt', withRequiredNegatives(plan.sceneNegativePrompt));
    form.append('aspect_ratio', options.aspectRatio);
    form.append('rendering_speed', speed);
    form.append('magic_prompt', 'OFF');
    form.append('style_type', 'REALISTIC');
    form.append('num_images', '1');
    form.append('enable_copyright_detection', 'true');
    if (typeof options.seed === 'number') form.append('seed', String(options.seed));
    addV3References(form, options.styleReferences ?? []);
  }

  const response = await fetchWithRetry(
    options.apiVersion === 'v4' ? IDEOGRAM_V4 : IDEOGRAM_V3,
    { method: 'POST', headers: { 'Api-Key': options.apiKey }, body: form },
    options.maxAttempts ?? 3,
    options.timeoutMs ?? 60_000,
  );
  if (!response.ok) throw new Error(`Ideogram ${options.apiVersion} failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { data?: Array<{ url?: string; is_image_safe?: boolean }> };
  if (payload?.data?.[0]?.is_image_safe === false) {
    throw new Error('Ideogram copyright/safety detection rejected the candidate.');
  }
  const rawUrl = payload?.data?.[0]?.url;
  if (typeof rawUrl !== 'string') throw new Error('Ideogram response contained no image URL.');

  const imageUrl = allowedDownloadUrl(rawUrl);
  const image = await fetchWithRetry(imageUrl.toString(), { method: 'GET' }, 2, options.timeoutMs ?? 60_000);
  if (!image.ok) throw new Error(`Ideogram image download failed: ${image.status}`);
  const contentType = image.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) throw new Error(`Unexpected Ideogram content type: ${contentType}`);
  return new Uint8Array(await image.arrayBuffer());
}

export function aspectRatioFor(format: PlatformFormat): IdeogramOptions['aspectRatio'] {
  if (format === 'instagram-square') return '1x1';
  if (format === 'instagram-portrait') return '4x5';
  if (format === 'story-reel-cover') return '9x16';
  return '16x9';
}
