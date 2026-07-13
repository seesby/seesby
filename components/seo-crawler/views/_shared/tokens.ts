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

/** Categorical chart palette (color-blind safe, viridis-derived). */
export const CHART_PALETTE = [
  '#a78bfa', '#3b82f6', '#14b8a6', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#f43f5e', '#6366f1', '#10b981',
];

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
  bgSep:    '#171717',
  bgGlass:  'rgba(10,10,10,0.80)',
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
