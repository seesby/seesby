// Heatmap.tsx — simple HTML grid heatmap
import React from 'react';
import { mix } from 'color2k';

export function Heatmap({
  rows, cols, getValue, getCell, max,
  baseColor = '#0c0c0c', accentColor = '#a78bfa',
  cellSize = 18, gap = 1, fullWidth = false,
}: {
  rows: ReadonlyArray<string>;
  cols: ReadonlyArray<string>;
  getValue: (rowKey: string, colKey: string) => number;
  getCell?: (rowKey: string, colKey: string) => React.ReactNode;
  max?: number;
  baseColor?: string;
  accentColor?: string;
  cellSize?: number;
  gap?: number;
  fullWidth?: boolean;
}) {
  const top = max ?? rows.flatMap(r => cols.map(c => getValue(r, c))).reduce((a, b) => Math.max(a, b), 1);
  const colTemplate = fullWidth
    ? `auto repeat(${cols.length}, 1fr)`
    : `auto repeat(${cols.length}, ${cellSize}px)`;
  return (
    <div className={fullWidth ? 'w-full' : 'inline-block'}>
      <div className="grid" style={{ gridTemplateColumns: colTemplate, gap }}>
        <div />
        {cols.map(c => (
          <div key={c} className="text-[9px] text-[#666] text-center truncate" style={fullWidth ? {} : { width: cellSize } }>{c}</div>
        ))}
        {rows.map(r => (
          <React.Fragment key={r}>
            <div className="text-[10px] text-[#888] pr-2 truncate" style={{ height: cellSize, lineHeight: `${cellSize}px` }}>{r}</div>
            {cols.map(c => {
              const v = getValue(r, c);
              const t = Math.max(0, Math.min(1, v / top));
              return (
                <div
                  key={c}
                  title={`${r} · ${c} = ${v}`}
                  style={ { width: fullWidth ? '100%' : cellSize, height: cellSize, aspectRatio: fullWidth ? '1' : undefined, background: mix(baseColor, accentColor, t) } }
                  className="rounded-[2px]"
                >
                  {getCell?.(r, c)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
