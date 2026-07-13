// Card styles
export const CARD = 'rounded-xl border border-[var(--brand-surface-3)] bg-[var(--brand-surface-1)] p-4';
export const CARD_NESTED = 'rounded-lg border border-[#191919] bg-[var(--brand-surface-0)] p-3';
export const CARD_HIGHLIGHT = 'rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-4';

// Section headers
export const SECTION_HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-text-faint)]';
export const SECTION_HEADER_WITH_MARGIN = `${SECTION_HEADER} mb-3`;
export const KEY_NUMBER = 'text-[20px] font-black font-mono text-[var(--brand-text-strong)]';
export const KEY_NUMBER_SM = 'text-[16px] font-bold font-mono text-[var(--brand-text-strong)]';
export const LABEL = 'text-[11px] text-[var(--brand-text-mid)]';
export const SUB_LABEL = 'text-[10px] text-[var(--brand-text-faint)]';
export const DIVIDER = 'h-px bg-[var(--brand-surface-3)]';

// Data values
export const VALUE_BIG = 'font-mono text-[18px] font-black text-[var(--brand-text-strong)]';
export const VALUE_MEDIUM = 'font-mono text-[13px] font-bold text-[var(--brand-text-strong)]';
export const VALUE_SMALL = 'font-mono text-[11px] text-[var(--brand-text-mid)]';
export const VALUE_LABEL = 'text-[10px] uppercase text-[var(--brand-text-faint)]';
export const VALUE_LABEL_INLINE = 'text-[11px] text-[var(--brand-text-faint)]';

// Deltas
export const DELTA_POSITIVE = 'text-green-400';
export const DELTA_NEGATIVE = 'text-red-400';
export const DELTA_NEUTRAL = 'text-[var(--brand-text-faint)]';
export const WIN_COLOR = DELTA_POSITIVE;
export const LOSE_COLOR = DELTA_NEGATIVE;
export const NEUTRAL_COLOR = 'text-[var(--brand-text-mid)]';

// Sub-tab buttons
export const SUBTAB_ACTIVE = 'bg-[#F59E0B]/10 text-[#F59E0B]';
export const SUBTAB_INACTIVE = 'text-[var(--brand-text-faint)] hover:bg-[var(--brand-surface-2)] hover:text-[var(--brand-text-mid)]';
export const SUBTAB_BASE = 'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all';

// "YOU" badge
export const YOU_BADGE = 'rounded px-1 py-0.5 text-[8px] font-black uppercase bg-[#F59E0B]/15 text-[#F59E0B]';

// Threat colors
export const THREAT_CRITICAL = 'bg-red-500/10 text-red-400';
export const THREAT_HIGH = 'bg-orange-500/10 text-orange-400';
export const THREAT_MODERATE = 'bg-yellow-500/10 text-yellow-400';
export const THREAT_LOW = 'bg-green-500/10 text-green-400';

export function threatStyle(level: string | null): string {
  switch (level) {
    case 'Critical':
      return THREAT_CRITICAL;
    case 'High':
      return THREAT_HIGH;
    case 'Moderate':
      return THREAT_MODERATE;
    default:
      return THREAT_LOW;
  }
}

export function heatmapCell(score: number): string {
  if (score >= 70) return 'bg-red-500/20 text-red-400';
  if (score >= 50) return 'bg-orange-500/15 text-orange-400';
  if (score >= 30) return 'bg-yellow-500/10 text-yellow-400';
  return 'bg-green-500/10 text-green-400';
}

// Brand color
export const BRAND_RED = '#F59E0B';
export const COMP_COLORS = ['#F59E0B', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];
export function getCompColor(index: number): string {
  return COMP_COLORS[index % COMP_COLORS.length];
}

// Chart legend colors (you first, then competitors)
export function getAllColors(competitorCount: number): string[] {
  return [BRAND_RED, ...COMP_COLORS.slice(0, competitorCount)];
}

// Empty state dashed box
export const EMPTY_STATE_BOX = 'rounded-xl border border-dashed border-[var(--brand-border-2)] bg-[var(--brand-surface-0)] py-10 text-center';
export const EMPTY_STATE_TEXT = 'text-[12px] text-[var(--brand-text-faint)]';
export const EMPTY_STATE_SUBTEXT = 'mt-1 text-[10px] text-[var(--brand-border-2)]';

// Scrollable container
export const SIDEBAR_SCROLL = 'custom-scrollbar h-full space-y-4 overflow-y-auto';
export const VIEW_SCROLL = 'custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4';
