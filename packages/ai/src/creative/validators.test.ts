import { describe, expect, it } from 'vitest';

import { validateCreativePlan, validateVisualQaResult } from './validators';

describe('validateCreativePlan', () => {
  it('rejects a non-object response', () => {
    const result = validateCreativePlan('not json');
    expect(result.ok).toBe(false);
  });

  it('rejects a plan missing required scene fields', () => {
    const result = validateCreativePlan({ format: 'instagram-square' });
    expect(result.ok).toBe(false);
  });

  it('accepts a well-formed plan', () => {
    const result = validateCreativePlan({
      singleIdea: 'x', objective: 'x', audienceId: 'x', contentPillarId: 'x',
      format: 'instagram-square', layoutRecipe: 'minimal-announcement', factIdsUsed: [],
      copy: { eyebrow: '', headline: 'Headline', body: '', cta: '' },
      scene: {
        high_level_description: 'A calm garage scene.',
        compositional_deconstruction: { background: 'x', elements: [] },
        style_description: { aesthetics: 'x', lighting: 'x', medium: 'photograph', color_palette: ['#000000'] },
      },
      sceneNegativePrompt: 'no text, no letters, no logo, no watermark, no user interface',
      sceneFocus: { subjectSide: 'right', copySafeSide: 'left', copySafeAreaPercent: 55 },
      assetUse: { logo: 'EXACT_ASSET', productUi: 'NONE', styleReferences: 'NONE' },
      accent: 'cyan', rationale: 'x', qaTargets: [],
    });
    expect(result.ok).toBe(true);
  });
});

describe('validateVisualQaResult', () => {
  it('rejects an out-of-range score', () => {
    const result = validateVisualQaResult({
      hardFails: [],
      scores: {
        brandFidelity: 150, hierarchy: 90, legibility: 90, composition: 90,
        premiumFeel: 90, sceneIntegrity: 90, platformReadiness: 90,
      },
      overall: 90, fixes: [], verdict: 'PASS',
    });
    expect(result.ok).toBe(false);
  });

  it('accepts a well-formed result', () => {
    const result = validateVisualQaResult({
      hardFails: [],
      scores: {
        brandFidelity: 90, hierarchy: 90, legibility: 90, composition: 90,
        premiumFeel: 90, sceneIntegrity: 90, platformReadiness: 90,
      },
      overall: 90, fixes: [], verdict: 'PASS',
    });
    expect(result.ok).toBe(true);
  });
});
