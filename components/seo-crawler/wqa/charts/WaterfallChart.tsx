import React, { useMemo } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface WaterfallSegment {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  baseline: number;
  baselineLabel?: string;
  segments: WaterfallSegment[];
  resultLabel?: string;
  formatValue?: (v: number) => string;
}

export default function WaterfallChart({
  baseline,
  baselineLabel = 'Current',
  segments,
  resultLabel = 'After',
  formatValue = (v) => v.toLocaleString(),
}: Props) {
  const data = useMemo(() => {
    const rows: Array<{ name: string; value: number; fill: string }> = [
      { name: baselineLabel, value: baseline, fill: 'text-[var(--brand-text-faint)]' },
      ...segments.map((s) => ({ name: s.label, value: s.value, fill: s.color || '#22c55e' })),
      {
        name: resultLabel,
        value: baseline + segments.reduce((sum, s) => sum + s.value, 0),
        fill: '#F59E0B',
      },
    ];

    return rows;
  }, [baseline, baselineLabel, resultLabel, segments]);

  return (
    <div style={{ width: '100%', height: Math.max(180, data.length * 32) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 8, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={98}
            tick={{ fill: 'text-[var(--brand-text-mid)]', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: 'bg-[var(--brand-surface-2)]', border: '1px solid bg-[var(--brand-surface-4)]', borderRadius: 6, fontSize: 11 }}
            formatter={(v: number, _k, p: any) => [formatValue(v), p?.payload?.name || '']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
