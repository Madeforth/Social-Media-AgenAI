/**
 * Design tokens for the dark premium creative workstation described in
 * `docs/DESIGN_SYSTEM.md`. Single source of truth for web and mobile.
 * Web consumes these through `tokens.css`; mobile imports the objects directly.
 */

export const color = {
  // Surfaces — near-black to deep navy, each step slightly lifted.
  bg: '#07090D',
  surface: '#0D1117',
  surfaceRaised: '#141A22',
  surfaceOverlay: '#1B222C',

  // Thin, low-contrast cool gray borders.
  border: '#232B36',
  borderStrong: '#323C4A',

  // Text.
  textPrimary: '#E8EDF4',
  textSecondary: '#9AA7B8',
  textMuted: '#65717F',

  // Accents.
  accent: '#22D3EE',
  accentStrong: '#06B6D4',
  accentSoft: 'rgba(34, 211, 238, 0.12)',
  secondary: '#F97316',
  secondarySoft: 'rgba(249, 115, 22, 0.12)',

  // Semantic.
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#A78BFA',
} as const;

/** Status chip colors, keyed by the canonical `PostStatus` values. */
export const statusColor = {
  DRAFT: color.textMuted,
  GENERATING: color.info,
  READY: color.accent,
  REVISION: color.secondary,
  APPROVED: color.success,
  SCHEDULED: color.warning,
  PUBLISHING: color.info,
  PUBLISHED: color.success,
  FAILED: color.danger,
  CANCELLED: color.textMuted,
} as const;

/** 8pt base rhythm. */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Motion stays sparse: state changes and hover only. */
export const duration = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export const tokens = {
  color,
  statusColor,
  space,
  radius,
  fontSize,
  fontWeight,
  duration,
  easing,
} as const;

export type Tokens = typeof tokens;
