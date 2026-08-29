import type { CreativePlan, CreativeRequest, VisualQaResult } from '@apex/types';
import { describe, expect, it } from 'vitest';

import { assertExactCopy, passesVisualGate, reapplyLockedCopy, validatePlanPolicy } from './gates';

const request = {
  postId: '11111111-1111-4111-8111-111111111111',
  postVersionId: '22222222-2222-4222-8222-222222222222',
  brandId: '33333333-3333-4333-8333-333333333333',
  objective: 'Test',
  audienceId: 'enthusiast_owner',
  contentPillarId: 'machine_relationship',
  format: 'instagram-portrait',
  language: 'tr',
  factIdsAllowed: ['af.machine_relationship_os'],
  lockedCopy: { eyebrow: '', headline: 'Kesin başlık', body: '', cta: '' },
  assetIds: { logo: '44444444-4444-4444-8444-444444444444', styleReferences: [] },
  candidateCount: 2,
} satisfies CreativeRequest;

const plan = {
  schemaVersion: '2.0',
  singleIdea: 'Calm machine portrait',
  objective: 'Test',
  audienceId: request.audienceId,
  contentPillarId: request.contentPillarId,
  format: request.format,
  layoutRecipe: 'editorial-hero-left',
  factIdsUsed: ['af.machine_relationship_os'],
  copy: { eyebrow: '', headline: 'Model changed it', body: '', cta: '' },
  scene: {
    high_level_description: 'Cinematic motorcycle detail on the right with deliberate negative space on the left.',
    compositional_deconstruction: {
      background: 'Navy garage wall with controlled texture.',
      elements: [{ type: 'obj', desc: 'credible motorcycle tank detail on the right', bbox: [180, 610, 860, 980] }],
    },
    style_description: {
      aesthetics: 'premium calm industrial editorial photography',
      lighting: 'soft cyan edge light with natural shadow',
      photo: '50mm editorial',
      medium: 'photograph',
      color_palette: ['#08131F', '#11B8DD', '#E8EDF2'],
    },
  },
  sceneNegativePrompt: 'no text, no letters, no logo, no watermark, no user interface',
  sceneFocus: { subjectSide: 'right', copySafeSide: 'left', copySafeAreaPercent: 55 },
  assetUse: { logo: 'EXACT_ASSET', productUi: 'NONE', styleReferences: 'NONE' },
  accent: 'cyan',
  rationale: 'One clear brand promise with calm machine intimacy.',
  qaTargets: ['clear hierarchy', 'quiet copy zone'],
} satisfies CreativePlan;

describe('creative gates', () => {
  it('restores locked copy after model output', () => {
    const locked = reapplyLockedCopy(plan, request);
    expect(locked.copy.headline).toBe('Kesin başlık');
    expect(assertExactCopy(locked, request).ok).toBe(true);
  });

  it('rejects an unknown fact id', () => {
    const bad = { ...plan, factIdsUsed: ['af.invented'] };
    expect(validatePlanPolicy(bad, request).failures).toContain('Unknown or disallowed fact id: af.invented');
  });

  it('rejects a scene that asks for banned content', () => {
    const bad = {
      ...plan,
      scene: { ...plan.scene, high_level_description: 'A poster with a bold logo and headline typography.' },
    };
    const result = validatePlanPolicy(bad, request);
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes('logo'))).toBe(true);
  });

  it('never passes a critic hard fail even with high scores', () => {
    const qa: VisualQaResult = {
      schemaVersion: '1.0',
      hardFails: ['generated gibberish'],
      scores: {
        brandFidelity: 99, hierarchy: 99, legibility: 99, composition: 99,
        premiumFeel: 99, sceneIntegrity: 99, platformReadiness: 99,
      },
      overall: 99,
      fixes: [],
      verdict: 'PASS',
    };
    expect(passesVisualGate(qa).ok).toBe(false);
  });

  it('passes a clean, above-threshold result', () => {
    const qa: VisualQaResult = {
      schemaVersion: '1.0',
      hardFails: [],
      scores: {
        brandFidelity: 90, hierarchy: 90, legibility: 92, composition: 90,
        premiumFeel: 88, sceneIntegrity: 90, platformReadiness: 92,
      },
      overall: 90,
      fixes: [],
      verdict: 'PASS',
    };
    expect(passesVisualGate(qa).ok).toBe(true);
  });
});
