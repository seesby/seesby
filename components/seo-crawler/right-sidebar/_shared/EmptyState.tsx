import React from 'react'

export function EmptyState({
    title, hint, action,
}: { title: string; hint?: string; action?: React.ReactNode }) {
    return (
        <div className="rounded-md border border-dashed border-[var(--brand-border-2)] bg-[var(--brand-surface-0)] p-4 text-center">
            <div className="text-[12px] text-[var(--brand-text-mid)] font-medium">{title}</div>
            {hint && <div className="text-[11px] text-[var(--brand-text-faint)] mt-1">{hint}</div>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    )
}
