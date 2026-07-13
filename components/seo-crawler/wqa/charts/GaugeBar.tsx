import React from 'react';

interface Props {
  label: string;
  value: number;
  suffix?: string;
  max?: number;
}

export default function GaugeBar({ label, value, suffix = '%', max = 100 }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';

  if (suffix === '✓' || suffix === '✗') {
    return (
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[var(--brand-text-mid)]]">{label}</span>
        <span className={suffix === '✓' ? 'text-green-400' : 'text-red-400'}>{suffix}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--brand-text-mid)]] w-[96px] shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[6px] bg-[var(--brand-surface-3)]] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-[var(--brand-text-mid)]] w-[40px] text-right font-mono">{Math.round(value)}{suffix}</span>
    </div>
  );
}
