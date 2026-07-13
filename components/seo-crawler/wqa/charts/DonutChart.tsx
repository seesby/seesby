import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Segment[];
  size?: number;
}

export default function DonutChart({ data, size = 160 }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-3" style={{ minHeight: size }}>
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={Math.max(24, Math.floor(size * 0.2))}
              outerRadius={Math.max(36, Math.floor(size * 0.31))}
              dataKey="value"
              stroke="none"
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {data.map((entry, i) => (
                <Cell 
                  key={`${entry.label}-${i}`} 
                  fill={entry.color} 
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'bg-[var(--brand-surface-2)]', 
                border: '1px solid border-[var(--brand-border-2)]', 
                borderRadius: '8px', 
                fontSize: '11px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                padding: '8px 10px'
              }}
              labelStyle={{ color: 'white', fontWeight: 'bold' }}
              itemStyle={{ color: 'text-[var(--brand-text-mid)]', fontSize: '10px' }}
              formatter={(value: number, name: string, props: any) => [
                `${value.toLocaleString()} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                props.payload.label,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-0">
        <div className="text-[18px] leading-none font-black text-[var(--brand-text-strong)]">{total.toLocaleString()}</div>
        <div className="text-[10px] text-[var(--brand-text-faint)]] mt-0.5">pages</div>
      </div>
    </div>
  );
}
