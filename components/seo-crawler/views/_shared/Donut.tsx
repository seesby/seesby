import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CHART_PALETTE } from './tokens';

export function Donut({
  data, height = 180, total, label,
}: {
  data: ReadonlyArray<{ name: string; value: number; color?: string }>;
  height?: number;
  total?: number;
  label?: string;
}) {
  const t = total ?? data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data as any} dataKey="value" innerRadius={Math.floor(height * 0.32)} outerRadius={Math.floor(height * 0.46)} stroke="bg-[var(--brand-surface-0)]">
            {data.map((d, i) => <Cell key={i} fill={d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={ { background: 'bg-[var(--brand-surface-1)]', border: '1px solid bg-[var(--brand-surface-3)]', fontSize: 11 } } />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-[18px] font-mono text-[var(--brand-text-strong)]">{t.toLocaleString()}</div>
          {label && <div className="text-[10px] uppercase text-[var(--brand-text-faint)]]">{label}</div>}
        </div>
      </div>
    </div>
  );
}
