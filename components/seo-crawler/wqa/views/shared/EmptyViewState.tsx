import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyViewState({
    title, subtitle, icon, cta,
}: { title: string; subtitle?: string; icon?: React.ReactNode; cta?: React.ReactNode }) {
    return (
        <div className="flex-1 flex items-center justify-center bg-[var(--brand-surface-0)] min-h-[240px]">
            <div className="max-w-md text-center px-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] mb-3">
                    {icon || <Inbox size={16} className="text-[var(--brand-text-faint)]" />}
                </div>
                <div className="text-[14px] text-[var(--brand-text-strong)] font-semibold mb-1">{title}</div>
                {subtitle && <div className="text-[12px] text-[var(--brand-text-faint)] leading-relaxed">{subtitle}</div>}
                {cta && <div className="mt-4">{cta}</div>}
            </div>
        </div>
    );
}
