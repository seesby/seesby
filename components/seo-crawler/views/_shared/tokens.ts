// components/seo-crawler/views/_shared/tokens.ts
import type { Mode } from '@seesby/types';
export { MODE_ACCENT } from '@seesby/types';

export const STATUS = {
  good:     '#22c55e',
  warn:     '#f59e0b',
  bad:      '#ef4444',
  info:     '#3b82f6',
  neutral:  '#71717a',
  muted:    '#3f3f46',
};

/** Categorical chart palette — amber-led, neutral, no blue/purple accents. */
export const CHART_PALETTE = [
  '#f59e0b', '#d97706', '#fbbf24', '#22c55e', '#14b8a6',
  '#ef4444', '#71717a', '#f43f5e', '#10b981', '#06b6d4',
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

  surface0:     '#0A0A0A',
  surface1:     '#0C0C0C',
  surface2:     '#111111',
  surface3:     '#161616',
  surface4:     '#1A1A1A',

  border1:      '#161616',
  border2:      '#222222',
  border3:      '#2A2A2A',

  textStrong:   '#FFFFFF',
  textMid:      '#AAAAAA',
  textFaint:    '#666666',
  textMuted:    '#444444',
  textDim:      '#333333',

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
  bgSep:    '#161616',
  bgGlass:  'rgba(11, 11, 10, 0.80)',
} as const;

// ── Text (extended) ──────────────────────────────────────────────────
export const TEXT_EXT = {
  strong:  '#cccccc',
  mid:     '#888888',
  faint:   '#555555',
} as const;

// ── Surfaces ──────────────────────────────────────────────────────────
export const SURFACE = {
  bg0:  '#0a0a0a',
  bg1:  '#0c0c0c',
  bg2:  '#111111',
  bg3:  '#161616',
  bg4:  '#1a1a1a',
  br0:  '#161616',
  br1:  '#1a1a1a',
  br2:  '#222222',
  br3:  '#2a2a2a',
} as const;

// ── Text ──────────────────────────────────────────────────────────────
export const TEXT = {
  primary:   '#ffffff',
  secondary: '#aaaaaa',
  tertiary:  '#666666',
  muted:     '#444444',
} as const;

// ── Radii ─────────────────────────────────────────────────────────────
export const R = {
  sm: 4,  md: 6,  lg: 8,  xl: 12,  pill: 999,
} as const;
