// Creative Engine V2 — deliberate Deno copy of `packages/ai/src/creative/*`.
//
// Same reason `_shared/ai.ts` is a standalone copy: the non-Docker Supabase
// Edge Function bundler cannot resolve multi-hop cross-package imports, so
// this file inlines its own types and pure logic instead of importing
// `@apex/types` / `@apex/ai`. Keep this in step with `packages/ai/src/creative/`
// by hand — there is no cross-package import to drift silently, but a
// behavior change made in one place and not the other will.
//
// Everything the Node compositor route needs (sharp, real fonts, pixel
// layout) stays out of this file on purpose — that runs in `apps/web`, never
// in this Deno runtime. This file only orchestrates: Gemini creative plan,
// Ideogram scene generation, policy/threshold gates, HMAC signing of the
// render request, and the Gemini Vision critic call.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const PLATFORM_FORMATS = [
  'instagram-square',
  'instagram-portrait',
  'story-reel-cover',
  'landscape-social',
] as const;
export type PlatformFormat = (typeof PLATFORM_FORMATS)[number];

export const LAYOUT_RECIPES = [
  'editorial-hero-left',
  'feature-device-right',
  'metric-poster',
  'minimal-announcement',
] as const;
export type LayoutRecipe = (typeof LAYOUT_RECIPES)[number];

export interface LockedCopy {
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  metric?: string;
  metricLabel?: string;
}

export interface CreativeRequest {
  postId: string;
  postVersionId: string;
  brandId: string;
  objective: string;
  audienceId: string;
  contentPillarId: string;
  format: PlatformFormat;
  language: 'tr' | 'en' | 'de';
  factIdsAllowed: string[];
  lockedCopy: LockedCopy;
  assetIds: { logo: string; productUi?: string; styleReferences: string[] };
  campaignId?: string;
  candidateCount: number;
}

export interface ScenePromptElement {
  type: 'obj';
  desc: string;
  bbox?: [number, number, number, number];
}

export interface ScenePrompt {
  high_level_description: string;
  compositional_deconstruction: { background: string; elements: ScenePromptElement[] };
  style_description: {
    aesthetics: string;
    lighting: string;
    photo?: string;
    medium: string;
    color_palette: string[];
  };
}

export interface CreativePlan {
  schemaVersion: '2.0';
  singleIdea: string;
  objective: string;
  audienceId: string;
  contentPillarId: string;
  format: PlatformFormat;
  layoutRecipe: LayoutRecipe;
  factIdsUsed: string[];
  copy: LockedCopy;
  scene: ScenePrompt;
  sceneNegativePrompt: string;
  sceneFocus: {
    subjectSide: 'left' | 'right' | 'center';
    copySafeSide: 'left' | 'right' | 'top' | 'bottom' | 'center';
    copySafeAreaPercent: number;
  };
  assetUse: { logo: 'EXACT_ASSET'; productUi: 'NONE' | 'EXACT_ASSET'; styleReferences: 'NONE' | 'V3_REFERENCE' };
  accent: 'cyan' | 'orange' | 'none';
  rationale: string;
  qaTargets: string[];
}

export interface VisualQaScores {
  brandFidelity: number;
  hierarchy: number;
  legibility: number;
  composition: number;
  premiumFeel: number;
  sceneIntegrity: number;
  platformReadiness: number;
}

export interface VisualQaResult {
  schemaVersion: '1.0';
  hardFails: string[];
  scores: VisualQaScores;
  overall: number;
  fixes: string[];
  verdict: 'PASS' | 'REPAIR' | 'REJECT';
}

export interface ResolvedAsset {
  id: string;
  type: 'LOGO' | 'PRODUCT_UI' | 'STYLE_REFERENCE';
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  bytes: Uint8Array;
  sha256: string;
}

// ---------------------------------------------------------------------------
// Policy / threshold gates
// ---------------------------------------------------------------------------

export const SCENE_BANNED_TEXT = [
  'logo', 'wordmark', 'typography', 'headline', 'caption', 'cta',
  'lettering', 'poster text', 'app screen', 'dashboard ui', 'watermark',
];

export const REQUIRED_SCENE_NEGATIVES = ['text', 'letters', 'logo', 'watermark', 'user interface'];

export interface GateResult { ok: boolean; failures: string[] }

export function reapplyLockedCopy(plan: CreativePlan, request: CreativeRequest): CreativePlan {
  return { ...plan, copy: { ...request.lockedCopy } };
}

export function validatePlanPolicy(plan: CreativePlan, request: CreativeRequest): GateResult {
  const failures: string[] = [];
  const allowed = new Set(request.factIdsAllowed);
  for (const factId of plan.factIdsUsed) {
    if (!allowed.has(factId)) failures.push(`Unknown or disallowed fact id: ${factId}`);
  }
  if (plan.format !== request.format) failures.push('Plan changed the requested format.');
  if (plan.audienceId !== request.audienceId) failures.push('Plan changed the requested audience.');
  if (plan.contentPillarId !== request.contentPillarId) failures.push('Plan changed the requested content pillar.');

  const scene = JSON.stringify(plan.scene).toLowerCase();
  for (const word of SCENE_BANNED_TEXT) {
    if (scene.includes(word)) failures.push(`Scene asks the image provider to render banned content: ${word}`);
  }
  const negative = plan.sceneNegativePrompt.toLowerCase();
  for (const required of REQUIRED_SCENE_NEGATIVES) {
    if (!negative.includes(required)) failures.push(`Negative prompt is missing: ${required}`);
  }
  if (plan.layoutRecipe === 'feature-device-right' && !request.assetIds.productUi) {
    failures.push('feature-device-right requires a real PRODUCT_UI asset.');
  }
  if (plan.assetUse.productUi === 'EXACT_ASSET' && !request.assetIds.productUi) {
    failures.push('Plan requests product UI but no trusted PRODUCT_UI asset was supplied.');
  }
  if (plan.assetUse.styleReferences === 'V3_REFERENCE' && request.assetIds.styleReferences.length === 0) {
    failures.push('Plan requests a style reference but none was supplied.');
  }
  return { ok: failures.length === 0, failures };
}

export const DEFAULT_QA_THRESHOLDS = {
  overall: 86, brandFidelity: 88, hierarchy: 84, legibility: 90,
  composition: 84, premiumFeel: 84, sceneIntegrity: 82, platformReadiness: 88,
} as const;

export function passesVisualGate(
  qa: VisualQaResult,
  thresholds: typeof DEFAULT_QA_THRESHOLDS = DEFAULT_QA_THRESHOLDS,
): GateResult {
  const failures = [...qa.hardFails];
  if (qa.overall < thresholds.overall) failures.push(`Overall ${qa.overall} < ${thresholds.overall}`);
  for (const key of Object.keys(qa.scores) as Array<keyof typeof qa.scores>) {
    const threshold = thresholds[key];
    if (qa.scores[key] < threshold) failures.push(`${key} ${qa.scores[key]} < ${threshold}`);
  }
  if (qa.verdict !== 'PASS') failures.push(`Critic verdict is ${qa.verdict}`);
  return { ok: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Runtime validation for Gemini's structured output
// ---------------------------------------------------------------------------

interface ValidationFailure { field: string; problem: string }
type ValidationResult<T> = { ok: true; value: T } | { ok: false; failures: ValidationFailure[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function str(record: Record<string, unknown>, field: string, failures: ValidationFailure[]): string {
  const raw = record[field];
  if (typeof raw !== 'string' || raw.length === 0) {
    failures.push({ field, problem: `expected a non-empty string, received ${typeof raw}` });
    return '';
  }
  return raw;
}
function optionalStr(record: Record<string, unknown>, field: string): string | undefined {
  const raw = record[field];
  return typeof raw === 'string' ? raw : undefined;
}
function strArray(record: Record<string, unknown>, field: string, failures: ValidationFailure[]): string[] {
  const raw = record[field];
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === 'string')) {
    failures.push({ field, problem: 'expected an array of strings' });
    return [];
  }
  return raw;
}
function enumField<T extends string>(
  record: Record<string, unknown>, field: string, allowed: readonly T[], failures: ValidationFailure[],
): T {
  const raw = record[field];
  if (typeof raw !== 'string' || !(allowed as readonly string[]).includes(raw)) {
    failures.push({ field, problem: `expected one of ${allowed.join(', ')}, received ${String(raw)}` });
    return allowed[0] as T;
  }
  return raw as T;
}
function validateLockedCopy(record: Record<string, unknown>, failures: ValidationFailure[]): LockedCopy {
  return {
    eyebrow: optionalStr(record, 'eyebrow') ?? '',
    headline: str(record, 'headline', failures),
    body: optionalStr(record, 'body') ?? '',
    cta: optionalStr(record, 'cta') ?? '',
    metric: optionalStr(record, 'metric'),
    metricLabel: optionalStr(record, 'metricLabel'),
  };
}
function validateScene(value: unknown, failures: ValidationFailure[]): ScenePrompt {
  if (!isRecord(value)) {
    failures.push({ field: 'scene', problem: 'expected an object' });
    return {
      high_level_description: '',
      compositional_deconstruction: { background: '', elements: [] },
      style_description: { aesthetics: '', lighting: '', medium: '', color_palette: [] },
    };
  }
  const decon = isRecord(value.compositional_deconstruction) ? value.compositional_deconstruction : {};
  const style = isRecord(value.style_description) ? value.style_description : {};
  const rawElements = Array.isArray(decon.elements) ? decon.elements : [];
  const elements = rawElements.filter(isRecord).slice(0, 5).map((element) => ({
    type: 'obj' as const,
    desc: typeof element.desc === 'string' ? element.desc : '',
    bbox: Array.isArray(element.bbox) && element.bbox.length === 4
      ? (element.bbox as [number, number, number, number]) : undefined,
  }));
  return {
    high_level_description: str(value, 'high_level_description', failures),
    compositional_deconstruction: { background: str(decon, 'background', failures), elements },
    style_description: {
      aesthetics: str(style, 'aesthetics', failures),
      lighting: str(style, 'lighting', failures),
      photo: optionalStr(style, 'photo'),
      medium: str(style, 'medium', failures),
      color_palette: strArray(style, 'color_palette', failures),
    },
  };
}

export function validateCreativePlan(value: unknown): ValidationResult<CreativePlan> {
  const failures: ValidationFailure[] = [];
  if (!isRecord(value)) return { ok: false, failures: [{ field: '.', problem: 'response is not an object' }] };
  const copyRecord = isRecord(value.copy) ? value.copy : {};
  const sceneFocusRecord = isRecord(value.sceneFocus) ? value.sceneFocus : {};
  const assetUseRecord = isRecord(value.assetUse) ? value.assetUse : {};

  const plan: CreativePlan = {
    schemaVersion: '2.0',
    singleIdea: str(value, 'singleIdea', failures),
    objective: str(value, 'objective', failures),
    audienceId: str(value, 'audienceId', failures),
    contentPillarId: str(value, 'contentPillarId', failures),
    format: enumField(value, 'format', PLATFORM_FORMATS, failures),
    layoutRecipe: enumField(value, 'layoutRecipe', LAYOUT_RECIPES, failures),
    factIdsUsed: strArray(value, 'factIdsUsed', failures),
    copy: validateLockedCopy(copyRecord, failures),
    scene: validateScene(value.scene, failures),
    sceneNegativePrompt: str(value, 'sceneNegativePrompt', failures),
    sceneFocus: {
      subjectSide: enumField(sceneFocusRecord, 'subjectSide', ['left', 'right', 'center'] as const, failures),
      copySafeSide: enumField(sceneFocusRecord, 'copySafeSide', ['left', 'right', 'top', 'bottom', 'center'] as const, failures),
      copySafeAreaPercent: typeof sceneFocusRecord.copySafeAreaPercent === 'number' ? sceneFocusRecord.copySafeAreaPercent : 50,
    },
    assetUse: {
      logo: 'EXACT_ASSET',
      productUi: enumField(assetUseRecord, 'productUi', ['NONE', 'EXACT_ASSET'] as const, failures),
      styleReferences: enumField(assetUseRecord, 'styleReferences', ['NONE', 'V3_REFERENCE'] as const, failures),
    },
    accent: enumField(value, 'accent', ['cyan', 'orange', 'none'] as const, failures),
    rationale: str(value, 'rationale', failures),
    qaTargets: strArray(value, 'qaTargets', failures),
  };
  if (failures.length > 0) return { ok: false, failures };
  return { ok: true, value: plan };
}

export function validateVisualQaResult(value: unknown): ValidationResult<VisualQaResult> {
  const failures: ValidationFailure[] = [];
  if (!isRecord(value)) return { ok: false, failures: [{ field: '.', problem: 'response is not an object' }] };
  const scoresRecord = isRecord(value.scores) ? value.scores : {};
  const scoreField = (field: string): number => {
    const raw = scoresRecord[field];
    if (typeof raw !== 'number' || raw < 0 || raw > 100) {
      failures.push({ field: `scores.${field}`, problem: `expected 0-100, received ${String(raw)}` });
      return 0;
    }
    return raw;
  };
  const overallRaw = value.overall;
  const overall = typeof overallRaw === 'number' && overallRaw >= 0 && overallRaw <= 100 ? overallRaw : 0;
  if (overall === 0 && overallRaw !== 0) failures.push({ field: 'overall', problem: 'expected 0-100' });

  const result: VisualQaResult = {
    schemaVersion: '1.0',
    hardFails: strArray(value, 'hardFails', failures),
    scores: {
      brandFidelity: scoreField('brandFidelity'), hierarchy: scoreField('hierarchy'),
      legibility: scoreField('legibility'), composition: scoreField('composition'),
      premiumFeel: scoreField('premiumFeel'), sceneIntegrity: scoreField('sceneIntegrity'),
      platformReadiness: scoreField('platformReadiness'),
    },
    overall,
    fixes: strArray(value, 'fixes', failures),
    verdict: enumField(value, 'verdict', ['PASS', 'REPAIR', 'REJECT'] as const, failures),
  };
  if (failures.length > 0) return { ok: false, failures };
  return { ok: true, value: result };
}

// ---------------------------------------------------------------------------
// JSON Schemas for Gemini structured output
// ---------------------------------------------------------------------------

export const CREATIVE_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    schemaVersion: { type: 'string', enum: ['2.0'] },
    singleIdea: { type: 'string' }, objective: { type: 'string' },
    audienceId: { type: 'string' }, contentPillarId: { type: 'string' },
    format: { type: 'string', enum: [...PLATFORM_FORMATS] },
    layoutRecipe: { type: 'string', enum: [...LAYOUT_RECIPES] },
    factIdsUsed: { type: 'array', items: { type: 'string' } },
    copy: {
      type: 'object',
      properties: {
        eyebrow: { type: 'string' }, headline: { type: 'string' }, body: { type: 'string' },
        cta: { type: 'string' }, metric: { type: 'string' }, metricLabel: { type: 'string' },
      },
      required: ['eyebrow', 'headline', 'body', 'cta'],
    },
    scene: {
      type: 'object',
      properties: {
        high_level_description: { type: 'string' },
        compositional_deconstruction: {
          type: 'object',
          properties: {
            background: { type: 'string' },
            elements: {
              type: 'array', maxItems: 5,
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['obj'] }, desc: { type: 'string' },
                  bbox: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'integer', minimum: 0, maximum: 1000 } },
                },
                required: ['type', 'desc'],
              },
            },
          },
          required: ['background', 'elements'],
        },
        style_description: {
          type: 'object',
          properties: {
            aesthetics: { type: 'string' }, lighting: { type: 'string' }, photo: { type: 'string' },
            medium: { type: 'string' },
            color_palette: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
          },
          required: ['aesthetics', 'lighting', 'medium', 'color_palette'],
        },
      },
      required: ['high_level_description', 'compositional_deconstruction', 'style_description'],
    },
    sceneNegativePrompt: { type: 'string' },
    sceneFocus: {
      type: 'object',
      properties: {
        subjectSide: { type: 'string', enum: ['left', 'right', 'center'] },
        copySafeSide: { type: 'string', enum: ['left', 'right', 'top', 'bottom', 'center'] },
        copySafeAreaPercent: { type: 'integer', minimum: 30, maximum: 70 },
      },
      required: ['subjectSide', 'copySafeSide', 'copySafeAreaPercent'],
    },
    assetUse: {
      type: 'object',
      properties: {
        logo: { type: 'string', enum: ['EXACT_ASSET'] },
        productUi: { type: 'string', enum: ['NONE', 'EXACT_ASSET'] },
        styleReferences: { type: 'string', enum: ['NONE', 'V3_REFERENCE'] },
      },
      required: ['logo', 'productUi', 'styleReferences'],
    },
    accent: { type: 'string', enum: ['cyan', 'orange', 'none'] },
    rationale: { type: 'string' },
    qaTargets: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'schemaVersion', 'singleIdea', 'objective', 'audienceId', 'contentPillarId', 'format',
    'layoutRecipe', 'factIdsUsed', 'copy', 'scene', 'sceneNegativePrompt', 'sceneFocus',
    'assetUse', 'accent', 'rationale', 'qaTargets',
  ],
} as const;

export const VISUAL_QA_SCHEMA = {
  type: 'object',
  properties: {
    schemaVersion: { type: 'string', enum: ['1.0'] },
    hardFails: { type: 'array', items: { type: 'string' } },
    scores: {
      type: 'object',
      properties: {
        brandFidelity: { type: 'integer', minimum: 0, maximum: 100 },
        hierarchy: { type: 'integer', minimum: 0, maximum: 100 },
        legibility: { type: 'integer', minimum: 0, maximum: 100 },
        composition: { type: 'integer', minimum: 0, maximum: 100 },
        premiumFeel: { type: 'integer', minimum: 0, maximum: 100 },
        sceneIntegrity: { type: 'integer', minimum: 0, maximum: 100 },
        platformReadiness: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['brandFidelity', 'hierarchy', 'legibility', 'composition', 'premiumFeel', 'sceneIntegrity', 'platformReadiness'],
    },
    overall: { type: 'integer', minimum: 0, maximum: 100 },
    fixes: { type: 'array', items: { type: 'string' } },
    verdict: { type: 'string', enum: ['PASS', 'REPAIR', 'REJECT'] },
  },
  required: ['schemaVersion', 'hardFails', 'scores', 'overall', 'fixes', 'verdict'],
} as const;

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

export const CREATIVE_PLAN_SYSTEM_PROMPT = `# Role

You are a senior brand art director producing one production-ready social creative plan.

# Authority order

1. Product facts explicitly supplied by ID.
2. Locked operator copy and requested format.
3. Brand visual identity and exact assets supplied in context.
4. Your own creative judgment.

Never invent a product capability, metric, UI state, partnership, rating or safety outcome. Use only supplied fact IDs and return every used ID in \`factIdsUsed\`. An unsupported fact fails the plan, not just the output.

# One idea, one hierarchy

Choose one visual idea. A creative has one headline, at most one support message and one CTA. Do not create a dashboard of competing cards. Do not fill negative space merely because it exists.

Select exactly one allowed layout recipe. Product UI is used only when a trusted \`PRODUCT_UI\` asset exists and then it is \`EXACT_ASSET\`; never describe or redraw UI inside the generated scene.

# Split the jobs

\`copy\` is a deterministic compositor contract: repeat the supplied locked copy in these fields exactly. The application reapplies the locked values after your response regardless of what you write, so treat this as confirmation, not composition.

\`scene\` is sent to an image generation provider and must describe only a text-free photographic or illustrative background. It must not contain or request:

- text, letters, numbers, typography, labels or signage;
- any logo or wordmark;
- UI, phone screen, chart, dashboard, badge or CTA;
- poster/card/mockup frames that compete with the compositor;
- third-party marks or watermarks.

Leave a low-detail copy-safe zone on the side declared in \`sceneFocus\`. Use at most five objects. If using Ideogram V4 bbox coordinates, the order is \`[yMin, xMin, yMax, xMax]\` on a 0-1000 grid. Do not place a main subject inside the copy-safe zone.

For \`style_description\`, keep this order of intent: aesthetics, lighting, photo, medium, color_palette. Use uppercase six-digit hex colors drawn from the supplied brand palette.

# Output discipline

Return only the JSON object required by the response schema. No markdown, no commentary. If the request cannot be satisfied without an unsupported fact or a missing required asset, produce the safest minimal plan and name the blocker in \`qaTargets\` — never fabricate to fill the gap.`;

export const VISUAL_CRITIC_SYSTEM_PROMPT = `You are a strict senior creative director reviewing a final composited social image, not merely its AI-generated background.

Evaluate what is visible at normal mobile feed size. Use the supplied intended copy, format and layout as reference. The application separately verifies exact strings and asset IDs in code — do not claim pixel certainty you cannot see, and do not fail on something the deterministic checks already covered unless it is also visibly wrong in the image.

# Hard fails

Return the condition in \`hardFails\` and never use \`PASS\` when any applies:

- logo missing, visibly altered, cropped, distorted or generated;
- visible gibberish, phantom letters, watermark or third-party logo;
- headline/CTA illegible, clipped, overcrowded or outside the safe area;
- fake app UI or a generated UI-like dashboard;
- an obvious product claim or number not represented in the supplied intended copy;
- the result does not fit the requested platform format.

# Score axes

- \`brandFidelity\`: matches the brand's palette and identity, restrained accents.
- \`hierarchy\`: one immediate focal point; headline, support and CTA order is obvious.
- \`legibility\`: mobile-size type, contrast, line length and background quietness.
- \`composition\`: balance, negative space, crop, alignment and visual rhythm.
- \`premiumFeel\`: deliberate editorial finish, not stock/template/generic AI.
- \`sceneIntegrity\`: believable subject, lighting and material — no malformed anatomy or objects.
- \`platformReadiness\`: safe zones, crop behavior and export suitability.

Score honestly. \`overall\` is not a simple average — hard production weaknesses weigh more. Use \`PASS\` only when there are no hard fails and the image is publishable without manual design correction. Use \`REPAIR\` for a fixable layout/scene issue; \`REJECT\` for fabricated or fundamentally off-brand output. Return only schema-valid JSON.`;

// ---------------------------------------------------------------------------
// Ideogram scene client
// ---------------------------------------------------------------------------

const IDEOGRAM_V4 = 'https://api.ideogram.ai/v1/ideogram-v4/generate';
const IDEOGRAM_V3 = 'https://api.ideogram.ai/v1/ideogram-v3/generate';
const DOWNLOAD_HOSTS = new Set(['ideogram.ai', 'ideogramcdn.com']);

export interface IdeogramOptions {
  apiKey: string;
  apiVersion: 'v4' | 'v3';
  renderingSpeed: 'TURBO' | 'DEFAULT' | 'QUALITY' | 'BALANCED';
  aspectRatio: '1x1' | '4x5' | '9x16' | '16x9';
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
function retryable(status: number) { return status === 429 || status >= 500; }
function wait(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

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
    } finally { clearTimeout(timeout); }
    const jitter = Math.floor(Math.random() * 250);
    await wait(Math.min(4_000, 350 * 2 ** (attempt - 1)) + jitter);
  }
  throw last ?? new Error('Ideogram request failed.');
}
function addV3References(form: FormData, refs: ResolvedAsset[]) {
  for (const [index, asset] of refs.slice(0, 3).entries()) {
    form.append('style_reference_images', new Blob([asset.bytes], { type: asset.mimeType }), `style-${index}.png`);
  }
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
    form.append('negative_prompt', plan.sceneNegativePrompt);
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
    options.maxAttempts ?? 3, options.timeoutMs ?? 60_000,
  );
  if (!response.ok) throw new Error(`Ideogram ${options.apiVersion} failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
  const payload = await response.json() as { data?: Array<{ url?: string; is_image_safe?: boolean }> };
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

// ---------------------------------------------------------------------------
// Gemini creative director + visual critic
// ---------------------------------------------------------------------------

export interface GeminiDirectorOptions {
  apiKey: string; model: string; systemPrompt: string; brandContext: unknown; timeoutMs?: number;
}

export async function createCreativePlan(
  request: CreativeRequest,
  options: GeminiDirectorOptions,
): Promise<CreativePlan> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
      {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify({ request, brandContext: options.brandContext }) }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: CREATIVE_PLAN_SCHEMA, temperature: 0.45 },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini creative director failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text;
    if (typeof text !== 'string') throw new Error('Gemini creative director returned no JSON text.');

    const parsed = validateCreativePlan(JSON.parse(text));
    if (!parsed.ok) throw new Error(`Creative plan failed validation: ${parsed.failures.map((f) => `${f.field}: ${f.problem}`).join('; ')}`);

    const locked = reapplyLockedCopy(parsed.value, request);
    const gate = validatePlanPolicy(locked, request);
    if (!gate.ok) throw new Error(`Creative plan policy failed: ${gate.failures.join('; ')}`);
    return locked;
  } finally { clearTimeout(timeout); }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export interface VisualCriticOptions { apiKey: string; model: string; systemPrompt: string; timeoutMs?: number }

export async function critiqueFinalCreative(
  image: Uint8Array, plan: CreativePlan, deterministicChecks: string[], options: VisualCriticOptions,
): Promise<VisualQaResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
      {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.systemPrompt }] },
          contents: [{
            role: 'user',
            parts: [
              { text: JSON.stringify({
                reviewTarget: 'FINAL_COMPOSITED_CREATIVE', format: plan.format, layoutRecipe: plan.layoutRecipe,
                intendedCopy: plan.copy, qaTargets: plan.qaTargets, deterministicChecks,
              }) },
              { inlineData: { mimeType: 'image/png', data: bytesToBase64(image) } },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: VISUAL_QA_SCHEMA, temperature: 0.1 },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini visual critic failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text;
    if (typeof text !== 'string') throw new Error('Gemini visual critic returned no JSON text.');
    const parsed = validateVisualQaResult(JSON.parse(text));
    if (!parsed.ok) throw new Error(`Visual QA result failed validation: ${parsed.failures.map((f) => `${f.field}: ${f.problem}`).join('; ')}`);
    return parsed.value;
  } finally { clearTimeout(timeout); }
}

// ---------------------------------------------------------------------------
// HMAC signing between this Edge Function and the Node compositor route
// ---------------------------------------------------------------------------

const signingEncoder = new TextEncoder();
function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}
async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', signingEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, signingEncoder.encode(message)));
}
export async function signRenderBody(secret: string, timestamp: string, body: string): Promise<string> {
  return hmac(secret, `${timestamp}.${body}`);
}
