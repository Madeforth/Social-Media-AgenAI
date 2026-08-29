import path from 'node:path';

import type { CreativePlan, RenderInput } from '@apex/types';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { composeCreative } from './creative-compositor';

const fonts = {
  display: path.join(process.cwd(), 'assets', 'fonts', 'montserrat', 'Montserrat-Variable.ttf'),
  body: path.join(process.cwd(), 'assets', 'fonts', 'poppins', 'Poppins-Regular.ttf'),
  technical: path.join(process.cwd(), 'assets', 'fonts', 'poppins', 'Poppins-SemiBold.ttf'),
};

async function solidPng(width: number, height: number, color: { r: number; g: number; b: number }) {
  return sharp({ create: { width, height, channels: 3, background: color } }).png().toBuffer();
}

const basePlan = {
  schemaVersion: '2.0',
  singleIdea: 'x', objective: 'x', audienceId: 'x', contentPillarId: 'x',
  format: 'instagram-square', layoutRecipe: 'minimal-announcement', factIdsUsed: [],
  copy: { eyebrow: 'STUDIO LAUNCH', headline: 'ÇĞİÖŞÜ çğıöşü — a real headline', body: 'Supporting line of body copy.', cta: 'Learn more' },
  scene: {
    high_level_description: 'x',
    compositional_deconstruction: { background: 'x', elements: [] },
    style_description: { aesthetics: 'x', lighting: 'x', medium: 'x', color_palette: [] },
  },
  sceneNegativePrompt: 'x',
  sceneFocus: { subjectSide: 'center', copySafeSide: 'left', copySafeAreaPercent: 55 },
  assetUse: { logo: 'EXACT_ASSET', productUi: 'NONE', styleReferences: 'NONE' },
  accent: 'cyan', rationale: 'x', qaTargets: [],
} as unknown as CreativePlan;

describe('composeCreative', () => {
  it('renders a real PNG with Turkish glyphs and stays inside the canvas size', async () => {
    const background = await solidPng(1080, 1080, { r: 8, g: 19, b: 31 });
    const logo = await solidPng(300, 100, { r: 255, g: 255, b: 255 });

    const input: RenderInput = {
      plan: basePlan,
      background: new Uint8Array(background),
      logo: { id: '11111111-1111-4111-8111-111111111111', type: 'LOGO', mimeType: 'image/png', bytes: new Uint8Array(logo), sha256: 'test' },
      candidateId: '22222222-2222-4222-8222-222222222222',
    };

    const output = await composeCreative(input, fonts);
    expect(output.mimeType).toBe('image/png');
    expect(output.width).toBe(1080);
    expect(output.height).toBe(1080);

    const meta = await sharp(Buffer.from(output.bytes)).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1080);
  }, 30_000);

  it('throws instead of silently clipping an overflowing headline', async () => {
    const background = await solidPng(1080, 1080, { r: 8, g: 19, b: 31 });
    const logo = await solidPng(300, 100, { r: 255, g: 255, b: 255 });
    const input: RenderInput = {
      plan: {
        ...basePlan,
        copy: {
          ...basePlan.copy,
          headline: Array.from({ length: 40 }, () => 'A very long headline word').join(' '),
        },
      },
      background: new Uint8Array(background),
      logo: { id: '11111111-1111-4111-8111-111111111111', type: 'LOGO', mimeType: 'image/png', bytes: new Uint8Array(logo), sha256: 'test' },
      candidateId: '33333333-3333-4333-8333-333333333333',
    };
    await expect(composeCreative(input, fonts)).rejects.toThrow(/Text overflow/);
  }, 30_000);
});
