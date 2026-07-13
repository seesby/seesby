// components/seo-crawler/views/_shared/tokens.ts
import type { Mode } from '@seesby/types';
export { MODE_ACCENT } from '@seesby/types';

export const STATUS = {
  good:     '#22c55e',
  warn:     '#f59e0b',
  bad:      '#ef4444',
  info:     '#3b82f6',
  neutral:  'text-[var(--brand-text-faint)]',
  muted:    '#3f3f46',
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

  surface0:     'bg-[var(--brand-surface-0)]',
  surface1:     'bg-[var(--brand-surface-1)]',
  surface2:     'bg-[var(--brand-surface-2)]',
  surface3:     'bg-[var(--brand-surface-3)]',
  surface4:     '#1A1A1A',

  border1:      'bg-[var(--brand-surface-3)]',
  border2:      'border-[var(--brand-border-2)]',
  border3:      '#2A2A2A',

  textStrong:   'bg-[var(--brand-surface-4)]',
  textMid:      '#AAAAAA',
  textFaint:    '#666666',
  textMuted:    'border-[var(--brand-border-2)]',
  textDim:      'bg-[var(--brand-surface-4)]3',

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
export const SURFACE_EXT = {
  bgSep:    'bg-[var(--brand-surface-3)]',
  bgGlass:  'rgba(11, 11, 10, 0.80)',
} as const;

// ── Text (extended) ──────────────────────────────────────────────────
export const TEXT_EXT = {
  strong:  'text-[var(--brand-text-mid)]',
  mid:     '#888888',
  faint:   '#555555',
} as const;

// ── Surfaces ──────────────────────────────────────────────────────────
export const SURFACE = {
  bg0:  'bg-[var(--brand-surface-0)]',
  bg1:  'bg-[var(--brand-surface-1)]',
  bg2:  'bg-[var(--brand-surface-2)]',
  bg3:  'bg-[var(--brand-surface-3)]',
  bg4:  'bg-[var(--brand-surface-3)]',
  br0:  'bg-[var(--brand-surface-3)]',
  br1:  'bg-[var(--brand-surface-3)]',
  br2:  'border-[var(--brand-border-2)]',
  br3:  'border-[var(--brand-border-3)]',
} as const;

// ── Text ──────────────────────────────────────────────────────────────
export const TEXT = {
  primary:   'bg-[var(--brand-surface-4)]',
  secondary: 'text-[var(--brand-text-mid)]',
  tertiary:  '#666666',
  muted:     'border-[var(--brand-border-2)]',
} as const;

// ── Radii ─────────────────────────────────────────────────────────────
export const R = {
  sm: 4,  md: 6,  lg: 8,  xl: 12,  pill: 999,
} as const;
