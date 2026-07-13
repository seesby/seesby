import React from 'react';

export default function ViewHeader({
    title, subtitle, count, left, right,
}: {
    title: string;
    subtitle?: string;
    count?: number;
    left?: React.ReactNode;
    right?: React.ReactNode;
}) {
    return (
        <div className="h-[44px] shrink-0 border-b border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] px-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand-text-strong)] truncate">{title}</span>
                        {typeof count === 'number' && (
                            <span className="text-[11px] font-mono text-[var(--brand-text-faint)]]">· {count.toLocaleString()}</span>
                        )}
                    </div>
                    {subtitle && <div className="text-[10px] text-[var(--brand-text-faint)]] truncate">{subtitle}</div>}
                </div>
                {left}
            </div>
            {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
        </div>
    );
}
