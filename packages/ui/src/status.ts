import { color } from './tokens';

/** Presentation metadata for a post status. Shared by web and mobile. */
export interface StatusPresentation {
  label: string;
  /** Foreground colour for the chip text and dot. */
  tint: string;
  /** Translucent background for the chip. */
  surface: string;
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function present(label: string, tint: string): StatusPresentation {
  return { label, tint, surface: withAlpha(tint, 0.14) };
}

export const POST_STATUS_PRESENTATION = {
  DRAFT: present('Draft', color.textMuted),
  GENERATING: present('Generating', color.info),
  READY: present('Ready', color.accent),
  REVISION: present('Revision', color.secondary),
  APPROVED: present('Approved', color.success),
  SCHEDULED: present('Scheduled', color.warning),
  PUBLISHING: present('Publishing', color.info),
  PUBLISHED: present('Published', color.success),
  FAILED: present('Failed', color.danger),
  CANCELLED: present('Cancelled', color.textMuted),
} as const;

export const VISUAL_FORMAT_LABELS = {
  PRODUCT_UI: 'Product UI',
  CINEMATIC_LIFESTYLE: 'Cinematic lifestyle',
  RIDER_COMMUNITY: 'Rider community',
  EDITORIAL_TYPOGRAPHY: 'Editorial typography',
  DATA_VISUALIZATION: 'Data visualization',
  EDUCATIONAL_CAROUSEL: 'Educational carousel',
  ACHIEVEMENT_BADGE: 'Achievement badge',
  TEASER_LAUNCH: 'Teaser / launch',
  MANIFESTO: 'Manifesto',
  SEASONAL: 'Seasonal',
} as const;

export const BRAND_ASSET_TYPE_LABELS = {
  LOGO: 'Logo',
  PRODUCT_UI: 'Product UI',
  PRODUCT_IMAGE: 'Product image',
  BADGE: 'Badge',
  LIFESTYLE: 'Lifestyle',
  STYLE_REFERENCE: 'Style reference',
} as const;
