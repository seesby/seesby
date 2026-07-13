// Geogrid.tsx — N×N rank grid on a base map
import React from 'react';
import { mix } from 'color2k';

export function Geogrid({
  cells, size = 7, height = 360,
}: {
  cells: ReadonlyArray<{ row: number; col: number; rank: number }>;  // 1=best
  size?: number;
  height?: number;
}) {
  const map = new Map(cells.map(c => [`${c.row}:${c.col}`, c.rank]));
  return (
    <div className="grid bg-[#0a0a0a] border border-[#1a1a1a] rounded" style={{
      gridTemplateColumns: `repeat(${size}, 1fr)`,
      gridTemplateRows: `repeat(${size}, 1fr)`,
      width: '100%',
      height,
      gap: 1,
      padding: 1,
    }}>
      {Array.from({ length: size * size }).map((_, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const rank = map.get(`${r}:${c}`);
        const color = rank === undefined
          ? '#0c0c0c'
          : rank <= 3 ? '#22c55e'
          : rank <= 10 ? mix('#22c55e', '#f59e0b', (rank - 3) / 7)
          : rank <= 20 ? mix('#f59e0b', '#ef4444', (rank - 10) / 10)
          : '#ef4444';
        return (
          <div key={i} className="grid place-items-center text-[10px] font-mono text-white" style={ { background: color } }>
            {rank ?? ''}
          </div>
        );
      })}
    </div>
  );
}
