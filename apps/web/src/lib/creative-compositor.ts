import sharp, { type OverlayOptions } from 'sharp';

import { geometryFailures, templateGeometry, type Rect } from '@apex/ai';
import type { CreativePlan, RenderInput, RenderOutput } from '@apex/types';

/**
 * Deterministic pixel compositor for Creative Engine V2. Runs only in this
 * Node route (`runtime = 'nodejs'`) — never in the Supabase Edge Function,
 * which is Deno and has no reliable native `sharp` story. The image provider
 * (Ideogram) only ever supplies the background; every visible letter, the
 * logo and the CTA pill are drawn here from the real asset and real font
 * files, so nothing on the finished image was ever "typed" by a model.
 */

export interface FontFiles {
  /** Display face for headlines and metrics. */
  display: string;
  /** Body face for support copy and CTA. */
  body: string;
  /** Short technical/kicker labels — a heavier cut of the body face works fine without a real mono face. */
  technical: string;
}

function escapeMarkup(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

async function textLayer(
  value: string,
  box: Rect,
  options: { fontfile: string; fontFamily: string; maxPx: number; minPx: number; weight?: number; color: string; align?: 'left' | 'center' },
): Promise<{ input: Buffer; left: number; top: number }> {
  if (!value) return { input: Buffer.alloc(0), left: box.left, top: box.top };
  for (let px = options.maxPx; px >= options.minPx; px -= 2) {
    const markup = `<span foreground="${options.color}" font_weight="${options.weight ?? 500}" font_size="${px * 1024}">${escapeMarkup(value)}</span>`;
    const { data, info } = await sharp({
      text: {
        text: markup,
        font: options.fontFamily,
        fontfile: options.fontfile,
        // Leave height unset so Pango reports the natural wrapped height —
        // supplying it here can silently clip overflow instead of failing.
        width: box.width,
        align: options.align ?? 'left',
        rgba: true,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
    if (info.width <= box.width && info.height <= box.height) return { input: data, left: box.left, top: box.top };
  }
  throw new Error(`Text overflow: ${value.slice(0, 40)}`);
}

/**
 * The image provider is told to leave the copy side low-detail, but nothing
 * guarantees it actually does — a real run had the subject (a rider's glove
 * and handlebar) bleed into the text column, and the old fixed gradient only
 * reached 0.52 opacity by the edge of a typical safe area, not enough to
 * save legibility when that happens. This is sized off the plan's own
 * `copySafeAreaPercent` and stays near-opaque through most of that zone
 * rather than tapering from the first pixel, so contrast under the text is
 * guaranteed by the compositor rather than trusted from the scene.
 */
function shadeSvg(
  width: number,
  height: number,
  copySide: CreativePlan['sceneFocus']['copySafeSide'],
  copySafeAreaPercent: number,
) {
  const leftToRight = copySide === 'left';
  const rightToLeft = copySide === 'right';
  const x1 = rightToLeft ? '100%' : '0%';
  const x2 = leftToRight ? '100%' : rightToLeft ? '0%' : '0%';
  const safe = Math.min(0.7, Math.max(0.3, copySafeAreaPercent / 100));
  const holdStop = (safe * 0.82).toFixed(3);
  const edgeStop = safe.toFixed(3);
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="${x1}" y1="0" x2="${x2}" y2="0">
      <stop offset="0" stop-color="#08131F" stop-opacity="0.97"/>
      <stop offset="${holdStop}" stop-color="#08131F" stop-opacity="0.94"/>
      <stop offset="${edgeStop}" stop-color="#08131F" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#08131F" stop-opacity="0.08"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect x="0" y="0" width="100%" height="100%" fill="#08131F" opacity="0.08"/>
  </svg>`);
}

function accentSvg(plan: CreativePlan, width: number, height: number) {
  const color = plan.accent === 'orange' ? '#F47A24' : plan.accent === 'cyan' ? '#11B8DD' : '#E8EDF2';
  const opacity = plan.accent === 'none' ? 0.25 : 0.92;
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="72" y="${Math.round(height * 0.78)}" width="112" height="4" rx="2" fill="${color}" opacity="${opacity}"/>
  </svg>`);
}

async function fittedAsset(bytes: Uint8Array, box: Rect, contain = true) {
  return sharp(Buffer.from(bytes))
    .ensureAlpha()
    .resize(box.width, box.height, {
      fit: contain ? 'contain' : 'cover',
      // Without an explicit background, sharp letterboxes a 'contain' resize
      // with opaque black when the source has no alpha of its own — the
      // exact "black bounding box around the logo" the visual critic flagged
      // on a real run. Transparent padding lets the logo sit on the
      // composited ground instead of inside a visible box.
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
}

export async function composeCreative(input: RenderInput, fonts: FontFiles): Promise<RenderOutput> {
  const g = templateGeometry(input.plan);
  const checks = geometryFailures(g);
  if (checks.length) throw new Error(`Template geometry failed: ${checks.join('; ')}`);

  const layers: OverlayOptions[] = [
    {
      input: shadeSvg(
        g.canvas.width, g.canvas.height,
        input.plan.sceneFocus.copySafeSide, input.plan.sceneFocus.copySafeAreaPercent,
      ),
      left: 0, top: 0,
    },
    { input: accentSvg(input.plan, g.canvas.width, g.canvas.height), left: 0, top: 0 },
  ];

  const logo = await fittedAsset(input.logo.bytes, g.logo);
  layers.push({ input: logo, left: g.logo.left, top: g.logo.top });

  const addText = async (
    value: string | undefined,
    box: Rect | undefined,
    maxPx: number,
    minPx: number,
    weight: number,
    color: string,
    face: 'display' | 'body' | 'technical' = 'body',
  ) => {
    if (!value || !box) return;
    const fontfile = face === 'display' ? fonts.display : face === 'technical' ? fonts.technical : fonts.body;
    const fontFamily = face === 'display' ? 'Montserrat' : 'Poppins';
    const layer = await textLayer(value, box, { fontfile, fontFamily, maxPx, minPx, weight, color });
    if (layer.input.length) layers.push(layer);
  };

  await addText(input.plan.copy.eyebrow.toUpperCase(), g.eyebrow, 22, 18, 600, '#48D4E8', 'technical');
  await addText(input.plan.copy.headline, g.headline, g.headlineMaxPx, g.headlineMinPx, 700, '#E8EDF2', 'display');
  await addText(input.plan.copy.body, g.body, g.bodyPx, Math.max(22, g.bodyPx - 6), 450, '#E8EDF2', 'body');
  await addText(input.plan.copy.metric, g.metric, 160, 96, 700, '#E8EDF2', 'display');
  await addText(input.plan.copy.metricLabel, g.metricLabel, 30, 22, 600, '#48D4E8', 'technical');

  if (input.productUi && g.productUi) {
    const screen = await fittedAsset(input.productUi.bytes, g.productUi);
    const frame = Buffer.from(`<svg width="${g.productUi.width}" height="${g.productUi.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${g.productUi.width - 2}" height="${g.productUi.height - 2}" rx="28" fill="none" stroke="#4B5563" stroke-width="2"/>
    </svg>`);
    layers.push({ input: screen, left: g.productUi.left, top: g.productUi.top });
    layers.push({ input: frame, left: g.productUi.left, top: g.productUi.top });
  }

  if (input.plan.copy.cta) {
    const ctaBg = Buffer.from(`<svg width="${g.cta.width}" height="${g.cta.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="${Math.round(g.cta.height / 2)}" fill="#11B8DD"/>
    </svg>`);
    layers.push({ input: ctaBg, left: g.cta.left, top: g.cta.top });
    const cta = await textLayer(
      input.plan.copy.cta,
      { ...g.cta, left: g.cta.left + 20, top: g.cta.top + 10, width: g.cta.width - 40, height: g.cta.height - 20 },
      { fontfile: fonts.body, fontFamily: 'Poppins', maxPx: 24, minPx: 18, weight: 650, color: '#08131F', align: 'center' },
    );
    layers.push(cta);
  }

  const bytes = await sharp(Buffer.from(input.background))
    .resize(g.canvas.width, g.canvas.height, { fit: 'cover', position: input.plan.sceneFocus.subjectSide })
    .composite(layers)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  return {
    bytes: new Uint8Array(bytes),
    mimeType: 'image/png',
    width: g.canvas.width,
    height: g.canvas.height,
    deterministicChecks: ['canvas-size', 'safe-zone', 'exact-logo-asset', 'exact-copy', 'font-loaded', 'overflow-check'],
  };
}
