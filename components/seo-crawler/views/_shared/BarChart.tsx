import React from 'react';
import { ResponsiveContainer, BarChart as RBC, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CHART_PALETTE } from './tokens';

export function BarChart({
  data, x, y, color = CHART_PALETTE[0], height = 220, stacked,
}: {
  data: ReadonlyArray<Record<string, any>>;
  x: string;
  y: string | string[];
  color?: string | string[];
  height?: number;
  stacked?: boolean;
}) {
  const ys = Array.isArray(y) ? y : [y];
  const colors = Array.isArray(color) ? color : ys.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBC data={data as any} margin={ { top: 8, right: 8, left: -10, bottom: 0 } }>
        <CartesianGrid stroke="bg-[var(--brand-surface-3)]" vertical={false} />
        <XAxis dataKey={x} stroke="text-[var(--brand-text-faint)]" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="text-[var(--brand-text-faint)]" fontSize={10} tickLine={false} axisLine={false} width={0} />
        <Tooltip contentStyle={ { background: 'bg-[var(--brand-surface-1)]', border: '1px solid bg-[var(--brand-surface-3)]', fontSize: 11 } } />
        {ys.map((k, i) => (
          <Bar key={k} dataKey={k} stackId={stacked ? 's' : undefined} fill={colors[i]} radius={[2, 2, 0, 0]} />
        ))}
      </RBC>
    </ResponsiveContainer>
  );
}
