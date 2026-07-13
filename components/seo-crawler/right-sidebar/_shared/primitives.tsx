import React from 'react'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] ${className}`}>
      {children}
    </div>
  )
}

export function Section({
  title, action, dense = false, children,
}: { title?: React.ReactNode; action?: React.ReactNode; dense?: boolean; children: React.ReactNode }) {
  const containerClass = dense ? 'p-2.5' : 'p-3'
  const titleClass = "text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-text-faint)]"
  
  return (
    <div className={containerClass}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between">
          {title && (
            <span className={titleClass}>
              {title}
            </span>
          )}
          {action}
        </div>
      )}
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

export function RowDivider() {
  return <div className="my-1 h-px bg-[var(--brand-surface-3)]" />
}
