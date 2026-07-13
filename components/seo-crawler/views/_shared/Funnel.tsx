// Funnel.tsx — vertical bar funnel with step % and drop %
import React from 'react';
import clsx from 'clsx';
import { fmtCompact, fmtPct } from './formatters';

export function Funnel({
  steps, accent = '#a78bfa', className,
}: {
  steps: ReadonlyArray<{ label: string; value: number; tone?: 'good' | 'warn' | 'bad' }>;
  accent?: string;
  className?: string;
}) {
  const top = steps[0]?.value ?? 1;
  return (
    <div className={clsx('space-y-1', className)}>
      {steps.map((s, i) => {
        const prev = i === 0 ? s.value : steps[i - 1].value;
        const w = Math.max(0, Math.min(1, s.value / top));
        const stepPct = i === 0 ? 1 : (prev > 0 ? s.value / prev : 0);
        const dropPct = 1 - stepPct;
        const color = s.tone === 'bad' ? '#ef4444' : s.tone === 'warn' ? '#f59e0b' : accent;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-32 truncate text-[12px] text-[#ccc]">{s.label}</div>
            <div className="flex-1 h-5 rounded bg-[#0c0c0c] border border-[#1a1a1a] overflow-hidden">
              <div className="h-full" style={{ width: `${w * 100}%`, background: color, opacity: 0.85 }} />
            </div>
            <div className="w-20 text-right text-[11px] font-mono text-white tabular-nums">{fmtCompact(s.value)}</div>
            <div className="w-16 text-right text-[10px] text-[#666]">{i === 0 ? '—' : fmtPct(stepPct)}</div>
            <div className="w-16 text-right text-[10px] text-[#ef4444]">{i === 0 ? '' : `▼ ${fmtPct(dropPct)}`}</div>
          </div>
        );
      })}
    </div>
  );
}
