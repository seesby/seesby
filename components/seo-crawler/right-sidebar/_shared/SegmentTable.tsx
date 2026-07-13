import React from 'react'

export type SegmentRow = { id: string; label: string; values: ReadonlyArray<number | string>; tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral' }

export function SegmentTable({
  headers, rows, max = 6, onRowClick,
}: {
  headers: ReadonlyArray<string>
  rows: ReadonlyArray<SegmentRow>
  max?: number
  onRowClick?: (row: SegmentRow) => void
}) {
  const top = rows.slice(0, max)
  if (!top.length) return <div className="text-[11px] text-[var(--brand-text-faint)]] italic">No segments</div>
  return (
    <div className="text-[11px]">
      <div className="grid gap-1 pb-1 border-b border-[var(--brand-surface-3)]] text-[10px] uppercase tracking-wide text-[var(--brand-text-faint)]]"
           style={{ gridTemplateColumns: `1fr repeat(${headers.length - 1}, 70px)` }}>
        {headers.map(h => <div key={h} className="truncate">{h}</div>)}
      </div>
      {top.map(r => (
        <button key={r.id}
          onClick={onRowClick ? () => onRowClick(r) : undefined}
          className="w-full grid gap-1 py-1 text-left hover:bg-[var(--brand-surface-1)]] transition-colors"
          style={{ gridTemplateColumns: `1fr repeat(${headers.length - 1}, 70px)` }}>
          <span className="text-[var(--brand-text-mid)]] truncate">{r.label}</span>
          {r.values.map((v, i) => (
            <span key={i} className="font-mono text-[var(--brand-text-strong)] tabular-nums truncate">{v}</span>
          ))}
        </button>
      ))}
    </div>
  )
}
