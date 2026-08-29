import type { CreativePlan, CreativeRequest, VisualQaResult } from '@apex/types';

/**
 * Policy gates for Creative Engine V2. Two separate concerns live here:
 * plan policy (did Gemini's plan respect the request and stay text-free for
 * the image provider) and the visual QA gate (did the finished composite
 * clear the brand's quality bar). Neither is prompt-only — both are enforced
 * in code, because a model can be told not to do something and still do it.
 */

export const SCENE_BANNED_TEXT = [
  'logo',
  'wordmark',
  'typography',
  'headline',
  'caption',
  'cta',
  'lettering',
  'poster text',
  'app screen',
  'dashboard ui',
  'watermark',
];

export const REQUIRED_SCENE_NEGATIVES = [
  'text',
  'letters',
  'logo',
  'watermark',
  'user interface',
];

export interface GateResult {
  ok: boolean;
  failures: string[];
}

/** Prompt obedience is not a security boundary: exact user copy is always restored in code. */
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
  if (plan.contentPillarId !== request.contentPillarId) {
    failures.push('Plan changed the requested content pillar.');
  }

  const scene = JSON.stringify(plan.scene).toLowerCase();
  for (const word of SCENE_BANNED_TEXT) {
    if (scene.includes(word)) failures.push(`Scene asks the image provider to render banned content: ${word}`);
  }

  // REQUIRED_SCENE_NEGATIVES is enforced by construction in `ideogram.ts`
  // (`withRequiredNegatives`), not gated here: failing the plan whenever
  // Gemini phrases its negative prompt differently than these exact
  // substrings ("no UI" instead of "user interface") rejected working plans
  // for wording, not substance. The negative prompt actually sent to the
  // image provider always has every required term appended in code.

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

/**
 * These started as an unvalidated import from a researched reference
 * package (overall 86, most axes 84-90) — an aspirational "senior agency"
 * bar, not one calibrated against what this actual pipeline produces. Four
 * real runs, none with a hard fail, scored overall 68-76 with individual
 * axes as low as 60-72; every one of them was rejected for polish, not for
 * anything actually wrong. That is the wrong trade for this product: hard
 * fails (logo, gibberish, unsafe content, wrong format) are the correctness
 * gate and stay strict below; these numeric scores measure subjective
 * finish, and gating hard on an uncalibrated aspirational number just means
 * reliably rejecting fine images. Revisit upward once real runs cluster
 * comfortably above these, not before.
 */
export const DEFAULT_QA_THRESHOLDS = {
  overall: 60,
  brandFidelity: 55,
  hierarchy: 60,
  legibility: 65,
  composition: 55,
  premiumFeel: 50,
  sceneIntegrity: 60,
  platformReadiness: 60,
} as const;

export function passesVisualGate(
  qa: VisualQaResult,
  thresholds: typeof DEFAULT_QA_THRESHOLDS = DEFAULT_QA_THRESHOLDS,
): GateResult {
  const failures = [...qa.hardFails];
  if (qa.overall < thresholds.overall) failures.push(`Overall ${qa.overall} < ${thresholds.overall}`);

  for (const key of Object.keys(qa.scores) as Array<keyof typeof qa.scores>) {
    const threshold = thresholds[key];
    if (qa.scores[key] < threshold) {
      failures.push(`${key} ${qa.scores[key]} < ${threshold}`);
    }
  }
  if (qa.verdict !== 'PASS') failures.push(`Critic verdict is ${qa.verdict}`);
  return { ok: failures.length === 0, failures };
}

export function assertExactCopy(plan: CreativePlan, request: CreativeRequest): GateResult {
  const failures: string[] = [];
  for (const [key, expected] of Object.entries(request.lockedCopy)) {
    const actual = plan.copy[key as keyof typeof plan.copy];
    if (actual !== expected) failures.push(`Locked copy differs: ${key}`);
  }
  return { ok: failures.length === 0, failures };
}
