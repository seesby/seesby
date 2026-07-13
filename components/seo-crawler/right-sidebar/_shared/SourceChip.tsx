'use client'

/**
 * Unified SourceChip — uses canonical T0-T8 SourceTier from @seesby/types.
 * Replaces the previous named-tier implementation ('official', 'browser', etc.)
 * with the spec-aligned tier codes. Consumers using the old SourceTier type should
 * migrate to import SourceTier from '@seesby/types' directly.
 */
import { SourceTier as CanonicalSourceTier } from '@seesby/types'

// Re-export canonical type for backwards compatibility
export type SourceTier = CanonicalSourceTier

const TIER_STYLES: Record<CanonicalSourceTier, { sym: string; color: string; label: string }> = {
  T0: { sym: '●', color: '#10b981', label: 'Source (API)' },
  T1: { sym: '●', color: '#10b981', label: 'Free API' },
  T2: { sym: '◐', color: '#3b82f6', label: 'Browser' },
  T3: { sym: '◑', color: '#f97316', label: 'Scrape' },
  T4: { sym: '◌', color: '#6b7280', label: 'Public' },
  T5: { sym: '◑', color: '#f97316', label: 'Derived' },
  T6: { sym: '◌', color: '#a855f7', label: 'AI' },
  T7: { sym: '◌', color: '#9ca3af', label: 'Estimate' },
  T8: { sym: '◌', color: '#d1d5db', label: 'Default' },
}

export function SourceChip({ tier }: { tier?: CanonicalSourceTier | null }) {
  if (!tier) return null
  const t = TIER_STYLES[tier]
  if (!t) return null
  return (
    <span
      className="inline-flex items-center rounded px-1 py-0.5 text-[9px] leading-none font-medium border border-current/20"
      style={{ color: t.color }}
      title={t.label}
    >
      {t.sym}
    </span>
  )
}
