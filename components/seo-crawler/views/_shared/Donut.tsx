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
          <Pie data={data as any} dataKey="value" innerRadius={Math.floor(height * 0.32)} outerRadius={Math.floor(height * 0.46)} stroke="#0a0a0a">
            {data.map((d, i) => <Cell key={i} fill={d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={ { background: '#0c0c0c', border: '1px solid #1a1a1a', fontSize: 11 } } />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-[18px] font-mono text-white">{t.toLocaleString()}</div>
          {label && <div className="text-[10px] uppercase text-[#666]">{label}</div>}
        </div>
      </div>
    </div>
  );
}
