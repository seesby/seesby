import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BucketData {
  label: string;
  count: number;
}

interface Props {
  data: BucketData[];
}

const BUCKET_COLORS: Record<string, string> = {
  '1-3': '#22c55e',
  '4-10': '#3b82f6',
  '11-20': '#f59e0b',
  '21-50': '#f97316',
  '50+': '#ef4444',
  None: 'text-[var(--brand-text-faint)]',
};

export default function PositionHistogram({ data }: Props) {
  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -12, right: 8, top: 2, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: 'text-[var(--brand-text-mid)]', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'text-[var(--brand-text-faint)]', fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'bg-[var(--brand-surface-2)]', 
              border: '1px solid border-[var(--brand-border-2)]', 
              borderRadius: '8px', 
              fontSize: '11px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
              padding: '8px 10px'
            }}
            itemStyle={{ color: 'white', fontWeight: 'bold' }}
            cursor={{ fill: 'bg-[var(--brand-surface-4)]08' }}
            formatter={(v: number) => [v.toLocaleString(), 'Pages']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }}>
            {data.map((entry) => (
              <Cell 
                key={entry.label} 
                fill={BUCKET_COLORS[entry.label] || 'text-[var(--brand-text-faint)]'}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
