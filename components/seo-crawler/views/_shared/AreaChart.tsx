// AreaChart.tsx
import React from 'react';
import { ResponsiveContainer, AreaChart as RAC, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CHART_PALETTE } from './tokens';

export function AreaChart({
  data, x, series, stacked = true, height = 220,
}: {
  data: ReadonlyArray<Record<string, any>>;
  x: string;
  series: ReadonlyArray<{ key: string; color?: string }>;
  stacked?: boolean;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RAC data={data as any} margin={ { top: 8, right: 8, left: 0, bottom: 0 } }>
        <CartesianGrid stroke="#171717" vertical={false} />
        <XAxis dataKey={x} stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={ { background: '#0c0c0c', border: '1px solid #1a1a1a', fontSize: 11 } } />
        {series.map((s, i) => (
          <Area
            key={s.key}
            dataKey={s.key}
            stackId={stacked ? '1' : undefined}
            stroke={s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            fill={s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            fillOpacity={0.18}
          />
        ))}
      </RAC>
    </ResponsiveContainer>
  );
}
