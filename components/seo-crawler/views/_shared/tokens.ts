// components/seo-crawler/views/_shared/tokens.ts
import type { Mode } from '@seesby/types';
export { MODE_ACCENT } from '@seesby/types';

export const STATUS = {
  good:     '#34D27B',
  warn:     '#f59e0b',
  bad:      '#F4655E',
  info:     '#B45309',
  neutral:  'var(--brand-text-faint)',
  muted:    '#574E40',
};

/** Categorical chart palette — amber-led, neutral, no blue/purple accents. */
export const CHART_PALETTE = [
  '#f59e0b', '#d97706', '#fbbf24', '#22c55e', '#14b8a6',
  '#ef4444', 'text-[var(--brand-text-faint)]', '#f43f5e', '#10b981', '#06b6d4',
];

/** Single source of truth for Seesby brand colors (mirrors index.css :root). */
export const SEESBY = {
  amber:        '#F59E0B',
  amberHover:   '#FBBF24',
  amberDeep:    '#D97706',
  amberSoft:    'rgba(245, 158, 11, 0.10)',
  amberSoft2:   'rgba(245, 158, 11, 0.16)',
  amberBorder:  'rgba(245, 158, 11, 0.30)',
  amberBorderSoft: 'rgba(245, 158, 11, 0.20)',

  bg:           '#0B0B0A',
  card:         '#141412',
  sidebar:      '#0E0E0C',

  surface0:     'var(--brand-surface-0)',
  surface1:     'var(--brand-surface-1)',
  surface2:     'var(--brand-surface-2)',
  surface3:     'var(--brand-surface-3)',
  surface4:     'var(--brand-surface-4)',

  border1:      'var(--brand-border-1)',
  border2:      'var(--brand-border-2)',
  border3:      'var(--brand-border-3)',

  textStrong:   'var(--brand-text-strong)',
  textMid:      'var(--brand-text-mid)',
  textFaint:    'var(--brand-text-faint)',
  textMuted:    'var(--brand-text-muted)',
  textDim:      'var(--brand-text-dim)',

  success:      '#22C55E',
  danger:       '#EF4444',
  warn:         '#F59E0B',
  statusNeutral:'#71717A',
} as const;

/** Density row heights in px. */
export const DENSITY = {
  compact: 24,
  comfy:   32,
  cozy:    40,
} as const;
export type Density = keyof typeof DENSITY;

/** Spacing tokens (8px grid). */
export const S = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

// ── Surfaces (extended) ──────────────────────────────────────────────
// NOTE: All SURFACE/TEXT values are consumed inside INLINE style objects
// (e.g. style={{ background: SURFACE.bg0, borderTop: `1px solid ${SURFACE.br1}` }}),
// so they MUST be raw CSS values, never Tailwind class strings.
export const SURFACE_EXT = {
  bgSep:    'var(--brand-surface-3)',
  bgGlass:  'rgba(11, 11, 10, 0.80)',
} as const;

// ── Text (extended) ──────────────────────────────────────────────────
export const TEXT_EXT = {
  strong:  'var(--brand-text-strong)',
  mid:     'var(--brand-text-mid)',
  faint:   'var(--brand-text-faint)',
} as const;

// ── Surfaces ──────────────────────────────────────────────────────────
// bg0..bg4 = elevation tiers (deepest -> top).
// br0..br3 = border tiers (hairline -> strong).
export const SURFACE = {
  bg0:  'var(--brand-surface-0)',
  bg1:  'var(--brand-surface-1)',
  bg2:  'var(--brand-surface-2)',
  bg3:  'var(--brand-surface-3)',
  bg4:  'var(--brand-surface-4)',
  br0:  'var(--brand-border-1)',
  br1:  'var(--brand-border-1)',
  br2:  'var(--brand-border-2)',
  br3:  'var(--brand-border-3)',
  // Raised chrome (sidebars/status) — floats above the sunken workbench canvas.
  sidebar: 'var(--brand-sidebar)',
} as const;

// ── Text ──────────────────────────────────────────────────────────────
export const TEXT = {
  primary:   'var(--brand-text-strong)',
  secondary: 'var(--brand-text-mid)',
  tertiary:  'var(--brand-text-faint)',
  muted:     'var(--brand-text-muted)',
} as const;

// ── Radii ─────────────────────────────────────────────────────────────
export const R = {
  sm: 4,  md: 6,  lg: 8,  xl: 12,  pill: 999,
} as const;
