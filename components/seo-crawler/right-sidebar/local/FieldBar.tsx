import React from 'react'

export function FieldBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[11px] text-[#888] shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={`w-10 text-right text-[11px] font-mono tabular-nums ${pct >= 90 ? 'text-[#22c55e]' : pct >= 70 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
        {pct}%
      </span>
    </div>
  )
}
