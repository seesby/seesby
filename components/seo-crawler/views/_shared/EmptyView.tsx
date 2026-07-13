// EmptyView.tsx
import React from 'react';
import clsx from 'clsx';

export function EmptyView({
  title, hint, primaryCta, secondaryCta, icon = '◔', className,
}: {
  title: string;
  hint?: string;
  primaryCta?: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  icon?: string;
  className?: string;
}) {
  return (
    <div className={clsx('flex-1 grid place-items-center px-6 py-12', className)}>
      <div className="text-center max-w-sm">
        <div className="text-[24px] text-[var(--brand-border-2)]] mb-2">{icon}</div>
        <div className="text-[14px] text-[var(--brand-text-strong)] font-semibold">{title}</div>
        {hint ? <div className="text-[12px] text-[var(--brand-text-mid)]] mt-1">{hint}</div> : null}
        <div className="flex justify-center gap-2 mt-4">
          {primaryCta && (
            <button onClick={primaryCta.onClick} className="h-8 px-3 text-[12px] bg-[#F59E0B] text-[var(--brand-text-strong)] rounded hover:bg-[#df3248]">
              {primaryCta.label}
            </button>
          )}
          {secondaryCta && (
            <button onClick={secondaryCta.onClick} className="h-8 px-3 text-[12px] text-[var(--brand-text-mid)]] border border-[var(--brand-border-2)]] rounded hover:text-[var(--brand-text-strong)]">
              {secondaryCta.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
