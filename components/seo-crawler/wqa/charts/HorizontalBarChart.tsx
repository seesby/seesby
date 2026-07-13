import React, { useMemo } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: BarData[];
  formatValue?: (v: number) => string;
  onClick?: (label: string) => void;
}

export default function HorizontalBarChart({ data, formatValue, onClick }: Props) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, color: d.color || '#F59E0B' })),
    [data]
  );

  const height = Math.max(120, chartData.length * 34);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={105}
            tick={{ fill: 'text-[var(--brand-text-mid)]', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ background: 'bg-[var(--brand-surface-2)]', border: '1px solid bg-[var(--brand-surface-4)]', borderRadius: 6, fontSize: 11 }}
            formatter={(v: number) => [formatValue ? formatValue(v) : v.toLocaleString(), 'Impact']}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            onClick={(entry: any) => onClick?.(entry?.label)}
            cursor={onClick ? 'pointer' : 'default'}
          >
            {chartData.map((entry) => (
              <Cell key={entry.label} fill={entry.color || '#F59E0B'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
