import type {
  CreativePlan, LayoutRecipe, LockedCopy, PlatformFormat, ScenePrompt, VisualQaResult,
} from '@apex/types';
import { LAYOUT_RECIPES, PLATFORM_FORMATS } from '@apex/types';

/**
 * Runtime validation for Creative Engine V2's Gemini responses, in the same
 * style as `packages/ai/src/safety.ts`'s `validateContentProposal`: Gemini's
 * `responseSchema` constrains generation but is not a trust boundary on its
 * own, so every field is re-checked before anything downstream (the policy
 * gates, the compositor, storage) sees it.
 */

export interface CreativeValidationFailure {
  field: string;
  problem: string;
}

export type CreativeValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; failures: CreativeValidationFailure[] };

type ValidationFailure = CreativeValidationFailure;
type ValidationResult<T> = CreativeValidationResult<T>;

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
  record: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  failures: ValidationFailure[],
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
  const elements = rawElements
    .filter(isRecord)
    .slice(0, 5)
    .map((element) => ({
      type: 'obj' as const,
      desc: typeof element.desc === 'string' ? element.desc : '',
      bbox: Array.isArray(element.bbox) && element.bbox.length === 4 ? (element.bbox as [number, number, number, number]) : undefined,
    }));
  return {
    high_level_description: str(value, 'high_level_description', failures),
    compositional_deconstruction: {
      background: str(decon, 'background', failures),
      elements,
    },
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
    format: enumField(value, 'format', PLATFORM_FORMATS, failures) as PlatformFormat,
    layoutRecipe: enumField(value, 'layoutRecipe', LAYOUT_RECIPES, failures) as LayoutRecipe,
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
      brandFidelity: scoreField('brandFidelity'),
      hierarchy: scoreField('hierarchy'),
      legibility: scoreField('legibility'),
      composition: scoreField('composition'),
      premiumFeel: scoreField('premiumFeel'),
      sceneIntegrity: scoreField('sceneIntegrity'),
      platformReadiness: scoreField('platformReadiness'),
    },
    overall,
    fixes: strArray(value, 'fixes', failures),
    verdict: enumField(value, 'verdict', ['PASS', 'REPAIR', 'REJECT'] as const, failures),
  };

  if (failures.length > 0) return { ok: false, failures };
  return { ok: true, value: result };
}
