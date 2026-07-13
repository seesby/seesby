import React from 'react';

interface LegacyHeatCell {
  x: string;
  y: string;
  value: number;
}

interface StatusHeatCell {
  row: string;
  col: string;
  status: 'growing' | 'flat' | 'declining';
}

type Props =
  | { data: LegacyHeatCell[]; rows?: never; cols?: never }
  | { data: StatusHeatCell[]; rows: string[]; cols: string[] };

const STATUS_CLASS: Record<'growing' | 'flat' | 'declining', string> = {
  growing: 'bg-green-500/20 border-green-500/30 text-green-400',
  flat: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  declining: 'bg-red-500/20 border-red-500/30 text-red-400',
};

const STATUS_LABEL: Record<'growing' | 'flat' | 'declining', string> = {
  growing: '↑',
  flat: '→',
  declining: '↓',
};

export default function HeatmapGrid({ data, rows, cols }: Props) {
  if (!data.length) return null;

  const isStatusData = 'status' in data[0];

  if (isStatusData) {
    const cells = data as StatusHeatCell[];
    const rowsResolved = rows || Array.from(new Set(cells.map((c) => c.row)));
    const colsResolved = cols || Array.from(new Set(cells.map((c) => c.col)));
    const cellMap = new Map(cells.map((c) => [`${c.row}:${c.col}`, c.status]));

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left text-[var(--brand-text-faint)] font-normal py-1 pr-2" />
              {colsResolved.map((col) => (
                <th key={col} className="text-center text-[var(--brand-text-faint)] font-normal py-1 px-2">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsResolved.map((row) => (
              <tr key={row}>
                <td className="text-[var(--brand-text-mid)] py-1 pr-2 whitespace-nowrap">{row}</td>
                {colsResolved.map((col) => {
                  const status = cellMap.get(`${row}:${col}`) || 'flat';
                  return (
                    <td key={col} className="py-1 px-2 text-center">
                      <span
                        className={`inline-block w-6 h-6 rounded border text-[10px] leading-6 ${STATUS_CLASS[status]}`}
                        title={`${row} × ${col}: ${status}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const legacy = data as LegacyHeatCell[];
  const xs = Array.from(new Set(legacy.map((d) => d.x)));
  const ys = Array.from(new Set(legacy.map((d) => d.y)));
  const max = Math.max(...legacy.map((d) => d.value), 1);

  const getVal = (x: string, y: string) => legacy.find((d) => d.x === x && d.y === y)?.value || 0;

  return (
    <div className="space-y-1">
      {ys.map((y) => (
        <div key={y} className="flex items-center gap-1">
          <span className="w-16 text-[9px] text-[var(--brand-text-faint)] truncate">{y}</span>
          <div className="flex gap-1">
            {xs.map((x) => {
              const value = getVal(x, y);
              const alpha = value / max;
              return (
                <div
                  key={`${x}-${y}`}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgba(59,130,246,${Math.max(0.08, alpha)})` }}
                  title={`${x} / ${y}: ${value}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
