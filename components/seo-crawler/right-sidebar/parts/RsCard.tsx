import React from 'react'

export function RsCard({
    title, subtitle, action, children, dense = false,
}: {
    title?: string
    subtitle?: string
    action?: React.ReactNode
    children: React.ReactNode
    dense?: boolean
}) {
    return (
        <section className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-1)]">
            {(title || action) && (
                <header className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <div>
                        {title && <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-text-mid)]">{title}</h4>}
                        {subtitle && <p className="text-[10px] text-[var(--brand-text-faint)] mt-0.5">{subtitle}</p>}
                    </div>
                    {action}
                </header>
            )}
            <div className={dense ? 'px-3 pb-2.5' : 'px-3 pb-3'}>{children}</div>
        </section>
    )
}
