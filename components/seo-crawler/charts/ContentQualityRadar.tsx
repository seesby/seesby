import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import { RsPanel as ChartCard } from '../right-sidebar/primitives';

export default function ContentQualityRadar({
  data,
}: {
  data: { metric: string; value: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Content Quality">
        <div className="flex items-center justify-center h-[240px] text-[var(--brand-text-faint)]] text-xs">
          No HTML pages to analyze.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Content Quality">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="border-[var(--brand-border-3)]" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#a0a0a0', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'text-[var(--brand-text-faint)]', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke="#F59E0B"
            fill="#F59E0B"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'bg-[var(--brand-surface-3)]',
              border: '1px solid bg-[var(--brand-surface-4)]',
              borderRadius: 8,
              fontSize: 12,
              color: 'text-[var(--brand-text-strong)]',
            }}
            itemStyle={{ color: 'text-[var(--brand-text-strong)]' }}
            formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
