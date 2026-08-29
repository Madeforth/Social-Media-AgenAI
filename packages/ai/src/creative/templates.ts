import type { CreativePlan, PlatformFormat } from '@apex/types';

/**
 * Deterministic layout geometry for the compositor. Pure and framework-free
 * so it can be unit tested without sharp or a real font file, and imported
 * from the Node compositor route (`apps/web`) without pulling anything
 * native into the calculation.
 */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TemplateGeometry {
  canvas: { width: number; height: number };
  safe: Rect;
  logo: Rect;
  eyebrow: Rect;
  headline: Rect;
  body: Rect;
  cta: Rect;
  productUi?: Rect;
  metric?: Rect;
  metricLabel?: Rect;
  headlineMaxPx: number;
  headlineMinPx: number;
  bodyPx: number;
}

const FORMAT = {
  'instagram-square': { width: 1080, height: 1080, top: 60, right: 72, bottom: 72, left: 72 },
  'instagram-portrait': { width: 1080, height: 1350, top: 72, right: 72, bottom: 90, left: 72 },
  'story-reel-cover': { width: 1080, height: 1920, top: 250, right: 72, bottom: 320, left: 72 },
  'landscape-social': { width: 1200, height: 627, top: 48, right: 72, bottom: 54, left: 72 },
} satisfies Record<PlatformFormat, { width: number; height: number; top: number; right: number; bottom: number; left: number }>;

function rect(left: number, top: number, width: number, height: number): Rect {
  return { left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) };
}

export function templateGeometry(plan: CreativePlan): TemplateGeometry {
  const f = FORMAT[plan.format];
  const safe = rect(f.left, f.top, f.width - f.left - f.right, f.height - f.top - f.bottom);
  const landscape = f.width / f.height > 1.3;
  const copyWidth = Math.round(safe.width * (landscape ? 0.5 : 0.56));
  const logo = rect(safe.left, safe.top, Math.min(210, safe.width * 0.22), 72);
  const eyebrow = rect(safe.left, safe.top + (landscape ? 86 : 118), copyWidth, 38);

  if (plan.layoutRecipe === 'metric-poster') {
    const metricTop = safe.top + (landscape ? 118 : 210);
    return {
      canvas: { width: f.width, height: f.height },
      safe,
      logo,
      eyebrow,
      metric: rect(safe.left, metricTop, safe.width * 0.68, landscape ? 150 : 240),
      metricLabel: rect(safe.left, metricTop + (landscape ? 145 : 230), safe.width * 0.55, 52),
      headline: rect(safe.left, metricTop + (landscape ? 205 : 320), copyWidth, landscape ? 110 : 180),
      body: rect(safe.left, safe.top + safe.height - 180, copyWidth, 92),
      cta: rect(safe.left, safe.top + safe.height - 64, 230, 56),
      headlineMaxPx: landscape ? 58 : 72,
      headlineMinPx: 42,
      bodyPx: landscape ? 27 : 30,
    };
  }

  if (plan.layoutRecipe === 'feature-device-right') {
    const headlineTop = safe.top + (landscape ? 132 : 205);
    return {
      canvas: { width: f.width, height: f.height },
      safe,
      logo,
      eyebrow,
      headline: rect(safe.left, headlineTop, copyWidth, landscape ? 205 : 310),
      body: rect(safe.left, headlineTop + (landscape ? 215 : 330), copyWidth, 130),
      cta: rect(safe.left, safe.top + safe.height - 68, 230, 58),
      productUi: rect(
        safe.left + safe.width * (landscape ? 0.58 : 0.6),
        safe.top + (landscape ? 34 : 130),
        safe.width * (landscape ? 0.38 : 0.36),
        safe.height * (landscape ? 0.88 : 0.72),
      ),
      headlineMaxPx: landscape ? 64 : 82,
      headlineMinPx: 44,
      bodyPx: landscape ? 26 : 30,
    };
  }

  const minimal = plan.layoutRecipe === 'minimal-announcement';
  const headlineTop = safe.top + (landscape ? 145 : minimal ? safe.height * 0.28 : 235);
  return {
    canvas: { width: f.width, height: f.height },
    safe,
    logo,
    eyebrow,
    headline: rect(safe.left, headlineTop, copyWidth, landscape ? 225 : 330),
    body: rect(safe.left, headlineTop + (landscape ? 225 : 345), copyWidth, 140),
    cta: rect(safe.left, safe.top + safe.height - 70, 230, 58),
    headlineMaxPx: landscape ? 68 : minimal ? 96 : 86,
    headlineMinPx: 44,
    bodyPx: landscape ? 27 : 31,
  };
}

export function inside(inner: Rect, outer: Rect): boolean {
  return (
    inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.left + inner.width <= outer.left + outer.width &&
    inner.top + inner.height <= outer.top + outer.height
  );
}

export function geometryFailures(geometry: TemplateGeometry): string[] {
  const failures: string[] = [];
  for (const [name, value] of Object.entries(geometry)) {
    if (!value || name === 'canvas' || name.endsWith('Px') || name === 'safe') continue;
    if (!inside(value as Rect, geometry.safe)) failures.push(`${name} crosses the safe zone.`);
  }
  if (geometry.logo.width < 116) failures.push('Logo is smaller than 116 px at 1080-class output.');
  return failures;
}
