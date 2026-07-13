import React from 'react'

export function Section({
    title, action, children, dense = false,
}: {
    title: string
    action?: React.ReactNode
    children: React.ReactNode
    dense?: boolean
}) {
    // Robustly handle object actions that are NOT react elements
    const renderedAction = action && typeof action === 'object' && !React.isValidElement(action)
        ? (action as any).label || JSON.stringify(action)
        : action

    return (
        <section className={dense ? 'mb-3' : 'mb-4'}>
            <header className="flex items-center justify-between mb-2 px-0.5">
                <h4 className="text-[11px] font-medium text-[var(--brand-text-mid)] tracking-wide">{title}</h4>
                {renderedAction && <div className="text-[10px] text-[var(--brand-text-mid)]">{renderedAction}</div>}
            </header>
            {children}
        </section>
    )
}
