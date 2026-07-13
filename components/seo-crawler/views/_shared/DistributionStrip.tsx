import React from 'react';

type BarSegment = {
  label: string;
  count: number;
  color: string;
};

export function DistributionStrip({ title, segments }: { title: string; segments: BarSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 text-[10px]">
      <span className="text-[var(--brand-text-faint)]] w-12 shrink-0">{title}</span>
      <div className="flex-1 flex h-3 rounded overflow-hidden">
        {segments.map(seg => {
          const pct = (seg.count / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={seg.label}
              title={`${seg.label}: ${seg.count}`}
              style={{ width: `${pct}%`, background: seg.color }}
            />
          );
        })}
      </div>
      <div className="flex gap-2 shrink-0">
        {segments.map(seg => (
          <span key={seg.label} className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-sm" style={{ background: seg.color }} />
            <span className="text-[var(--brand-text-mid)]]">{seg.label}</span>
            <span className="text-[var(--brand-text-mid)]] tabular-nums">{seg.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
