import type { CreativePlan } from '@apex/types';
import { describe, expect, it } from 'vitest';

import { geometryFailures, templateGeometry } from './templates';

const base = {
  schemaVersion: '2.0',
  singleIdea: 'x',
  objective: 'x',
  audienceId: 'x',
  contentPillarId: 'x',
  factIdsUsed: [],
  copy: { eyebrow: '', headline: 'ÇĞİÖŞÜ çğıöşü Höchstgeschwindigkeit', body: '', cta: '' },
  scene: {
    high_level_description: 'x',
    compositional_deconstruction: { background: 'x', elements: [] },
    style_description: { aesthetics: 'x', lighting: 'x', medium: 'x', color_palette: [] },
  },
  sceneNegativePrompt: 'x',
  sceneFocus: { subjectSide: 'right', copySafeSide: 'left', copySafeAreaPercent: 55 },
  assetUse: { logo: 'EXACT_ASSET', productUi: 'NONE', styleReferences: 'NONE' },
  accent: 'cyan',
  rationale: 'x',
  qaTargets: [],
} as unknown as CreativePlan;

describe('template geometry', () => {
  for (const format of ['instagram-square', 'instagram-portrait', 'story-reel-cover', 'landscape-social'] as const) {
    for (const layoutRecipe of ['editorial-hero-left', 'feature-device-right', 'metric-poster', 'minimal-announcement'] as const) {
      it(`${format} / ${layoutRecipe} stays inside the safe area`, () => {
        const geometry = templateGeometry({ ...base, format, layoutRecipe });
        expect(geometryFailures(geometry)).toEqual([]);
      });
    }
  }
});
