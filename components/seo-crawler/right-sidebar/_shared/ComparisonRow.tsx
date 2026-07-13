import React from 'react'
import { SourceChip, type SourceTier } from './SourceChip'
import { FreshnessChip, type Freshness } from './FreshnessChip'

export function ComparisonRow({
  label, a, b, c, format = (v) => String(v), source, freshness,
}: {
  label: string
  a: { v: number; tag: string }
  b: { v: number; tag: string }
  c?: { v: number; tag: string }
  format?: (v: number) => string
  source?: SourceTier
  freshness?: Freshness
}) {
  const cells = [a, b, c].filter(Boolean) as Array<{ v: number; tag: string }>
  return (
    <div className="flex items-center justify-between py-1 border-b border-[var(--brand-surface-3)]] last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--brand-text-mid)]]">{label}</span>
        <SourceChip tier={source} />
        <FreshnessChip value={freshness} />
      </div>
      <div className="flex gap-3">
        {cells.map((cell, i) => (
          <div key={i} className="text-right">
            <div className="text-[11px] font-mono text-[var(--brand-text-strong)] tabular-nums">{format(cell.v)}</div>
            <div className="text-[9px] uppercase text-[var(--brand-text-faint)]]">{cell.tag}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
