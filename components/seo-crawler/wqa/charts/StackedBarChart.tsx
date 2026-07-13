import React, { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface StackedRow {
  label: string;
  segments: Array<{ value: number; color: string; label: string }>;
}

interface Props {
  data: StackedRow[];
  legend?: Array<{ label: string; color: string }>;
}

export default function StackedBarChart({ data, legend }: Props) {
  const { chartData, keys, keyMeta } = useMemo(() => {
    const keyMetaLocal: Array<{ key: string; color: string; label: string }> = [];

    const rows = data.map((row) => {
      const next: Record<string, string | number> = { name: row.label };
      row.segments.forEach((seg, i) => {
        const key = `seg${i}`;
        next[key] = seg.value;
        if (!keyMetaLocal.find((m) => m.key === key)) {
          keyMetaLocal.push({ key, color: seg.color, label: seg.label });
        }
      });
      return next;
    });

    return {
      chartData: rows,
      keys: keyMetaLocal.map((m) => m.key),
      keyMeta: keyMetaLocal,
    };
  }, [data]);

  const height = Math.max(120, data.length * 28 + 20);

  return (
    <div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={78}
              tick={{ fill: 'text-[var(--brand-text-mid)]', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: 'bg-[var(--brand-surface-2)]', border: '1px solid bg-[var(--brand-surface-4)]', borderRadius: 6, fontSize: 11 }}
            />
            {keys.map((key, idx) => {
              const meta = keyMeta[idx];
              return <Bar key={key} dataKey={key} stackId="a" fill={meta.color} radius={idx === keys.length - 1 ? [0, 4, 4, 0] : 0} />;
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {(legend || keyMeta.length > 0) && (
        <div className="flex items-center gap-3 mt-1">
          {(legend || keyMeta.map((m) => ({ label: m.label, color: m.color }))).map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-[9px] text-[var(--brand-text-faint)]">{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
