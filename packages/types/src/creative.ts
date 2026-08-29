/**
 * Creative Engine V2 contracts. Deliberately not zod: the repo already has a
 * manual-validator pattern for structured Gemini output (see
 * `@apex/ai`'s `safety.ts` / `validateContentProposal`), and this stays
 * consistent with it rather than adding a new validation library.
 *
 * V2 keeps the composition idea from `packages/ai/src/prompts.ts` — Gemini
 * plans and writes copy, an image provider paints a scene — but splits what
 * used to be one `generation_prompt` string into a scene (sent to the image
 * provider, must stay text-free) and exact copy (composited deterministically
 * with real fonts and the real logo asset, never drawn by the image model).
 */

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
  assetIds: {
    logo: string;
    productUi?: string;
    styleReferences: string[];
  };
  campaignId?: string;
  candidateCount: number;
}

export interface ScenePromptElement {
  type: 'obj';
  desc: string;
  /** Ideogram 4 uses [yMin, xMin, yMax, xMax] on a 0-1000 grid. */
  bbox?: [number, number, number, number];
}

export interface ScenePrompt {
  high_level_description: string;
  compositional_deconstruction: {
    background: string;
    elements: ScenePromptElement[];
  };
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
  assetUse: {
    logo: 'EXACT_ASSET';
    productUi: 'NONE' | 'EXACT_ASSET';
    styleReferences: 'NONE' | 'V3_REFERENCE';
  };
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

export interface CandidateManifest {
  schemaVersion: '2.0';
  runId: string;
  candidateId: string;
  postId: string;
  postVersionId: string;
  brandBrainVersion: string;
  format: PlatformFormat;
  width: number;
  height: number;
  layoutRecipe: LayoutRecipe;
  exactCopy: LockedCopy;
  factIdsUsed: string[];
  assetIds: CreativeRequest['assetIds'];
  provider: {
    name: 'ideogram';
    apiVersion: 'v3' | 'v4';
    renderingSpeed: 'FLASH' | 'TURBO' | 'DEFAULT' | 'QUALITY' | 'BALANCED';
    resolution?: string;
    seed?: number;
  };
  promptHash: string;
  sceneStoragePath: string;
  finalStoragePath: string;
  qa: VisualQaResult;
  createdAt: string;
}

export interface ResolvedAsset {
  id: string;
  type: 'LOGO' | 'PRODUCT_UI' | 'STYLE_REFERENCE';
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  bytes: Uint8Array;
  sha256: string;
}

export interface RenderInput {
  plan: CreativePlan;
  background: Uint8Array;
  logo: ResolvedAsset;
  productUi?: ResolvedAsset;
  candidateId: string;
}

export interface RenderOutput {
  bytes: Uint8Array;
  mimeType: 'image/png';
  width: number;
  height: number;
  deterministicChecks: string[];
}

/**
 * `brand_guidelines.creative_profile`. Holds only what the existing columns
 * (mission, positioning, tone_of_voice, target_audience, content_pillars,
 * forbidden_claims) don't already cover: machine-readable visual identity,
 * layout recipes, platform geometry, provider policy and QA thresholds.
 */
export interface CreativeProfile {
  schemaVersion: '2.0';
  visualIdentity: {
    corePalette: Array<{ name: string; hex: string; role: string; weight?: number }>;
    productUiPalette: Array<{ name: string; hex: string; role: string }>;
    typography: {
      display: { family: string; weights: number[]; usage: string };
      body: { family: string; weights: number[]; usage: string };
      technical: { family: string; weights: number[]; usage: string };
      rules: string[];
    };
    markRules: {
      exactAssetOnly: boolean;
      minimumWidthPxAt1080: number;
      clearSpaceMultiplier: number;
      allowedTreatments: string[];
      forbiddenTreatments: string[];
    };
    grid: {
      base: number;
      outerMarginRatio: number;
      safeZoneRatio: number;
      maxTextWidthRatio: number;
      headlineMaxLines: number;
      bodyMaxLines: number;
      maxPrimaryElements: number;
    };
    effectBudget: { maxDecorativeEffects: number; allowed: string[]; forbidden: string[] };
    imageDirection: {
      mood: string[];
      subjects: string[];
      lighting: string[];
      camera: string[];
      safety: string[];
    };
    globalBans: string[];
  };
  layoutRecipes: Array<{
    id: LayoutRecipe;
    bestFor: string[];
    hierarchy: string[];
    sceneRule: string;
    accentRule: string;
  }>;
  platformFormats: Array<{
    id: PlatformFormat;
    width: number;
    height: number;
    safeTop: number;
    safeRight: number;
    safeBottom: number;
    safeLeft: number;
  }>;
  generatorPolicy: {
    defaultMode: 'v4-json' | 'v3-text';
    candidatePolicy: { minimum: number; default: number; maximum: number; maxRepairRounds: number };
  };
  qualityGate: {
    thresholds: VisualQaScores & { overall: number };
    hardFails: string[];
  };
}

export type CreativeRunStatus =
  | 'PLANNED'
  | 'GENERATING'
  | 'RENDERING'
  | 'REVIEWING'
  | 'PASSED'
  | 'REVIEW_REQUIRED'
  | 'FAILED';
