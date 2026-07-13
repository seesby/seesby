import React from 'react';

interface FunnelStep {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  steps: FunnelStep[];
}

export default function FunnelChart({ steps }: Props) {
  if (steps.length === 0) return null;

  const max = steps[0]?.value || 1;

  return (
    <div className="flex items-end gap-1 h-[90px]">
      {steps.map((step, i) => {
        const pct = Math.max(15, (step.value / max) * 100);
        return (
          <div key={step.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-[var(--brand-text-mid)] font-medium">{step.value.toLocaleString()}</span>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${pct}%`,
                background: step.color || `rgba(245, 54, 78, ${0.18 + (i / steps.length) * 0.55})`,
                border: '1px solid rgba(245, 54, 78, 0.28)',
              }}
            />
            <span className="text-[9px] text-[var(--brand-text-faint)] text-center leading-tight">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
