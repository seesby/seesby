import React from 'react'

export type HeatCell = { x: string; y: string; value: number }

export function Heatmap({
  cells,
  xLabels,
  yLabels,
  max,
  cellSize = 14,
}: {
  cells: ReadonlyArray<HeatCell>
  xLabels: ReadonlyArray<string>
  yLabels: ReadonlyArray<string>
  max?: number
  cellSize?: number
}) {
  const peak = (max ?? cells.reduce((m, c) => Math.max(m, c.value), 0)) || 1
  const lookup = new Map(cells.map(c => [`${c.y}::${c.x}`, c.value]))

  const styleLabelY = { height: cellSize }
  const styleLabelX = { width: cellSize }

  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-[2px] pt-[18px]">
        {yLabels.map(y => (
          <div key={y} className="text-[10px] text-[var(--brand-text-faint)]] truncate max-w-[80px]" style={styleLabelY}>{y}</div>
        ))}
      </div>
      <div className="flex flex-col gap-[2px]">
        <div className="flex gap-[2px]">
          {xLabels.map(x => (
            <div key={x} className="text-[10px] text-[var(--brand-text-faint)]] text-center truncate" style={styleLabelX}>{x}</div>
          ))}
        </div>
        {yLabels.map(y => (
          <div key={y} className="flex gap-[2px]">
            {xLabels.map(x => {
              const v = lookup.get(`${y}::${x}`) ?? 0
              const intensity = Math.min(1, v / peak)
              const styleCell = {
                width: cellSize, height: cellSize,
                background: `rgba(245,158,11,${0.08 + intensity * 0.65})`,
              }
              return (
                <div
                  key={x}
                  title={`${y} · ${x}: ${v}`}
                  className="rounded-[2px] border border-[var(--brand-surface-3)]]"
                  style={styleCell}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
