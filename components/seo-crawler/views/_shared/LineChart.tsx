// LineChart.tsx
import React from 'react';
import { ResponsiveContainer, LineChart as RLC, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { CHART_PALETTE } from './tokens';

export function LineChart({
  data, x, series, height = 220, smooth = true,
}: {
  data: ReadonlyArray<Record<string, any>>;
  x: string;
  series: ReadonlyArray<{ key: string; label?: string; color?: string }>;
  height?: number;
  smooth?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLC data={data as any} margin={ { top: 8, right: 8, left: -10, bottom: 0 } }>
        <CartesianGrid stroke="#171717" vertical={false} />
        <XAxis dataKey={x} stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis hide />
        <Tooltip contentStyle={ { background: '#0c0c0c', border: '1px solid #1a1a1a', fontSize: 11 } } />
        <Legend wrapperStyle={ { fontSize: 11 } } />
        {series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            type={smooth ? 'monotone' : 'linear'}
            strokeWidth={1.5}
            dot={false}
            activeDot={ { r: 3 } }
          />
        ))}
      </RLC>
    </ResponsiveContainer>
  );
}
