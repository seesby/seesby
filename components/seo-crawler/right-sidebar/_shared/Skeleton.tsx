import React from 'react'

export function Skeleton({
  rows = 3, h = 14, className = '',
}: { rows?: number; h?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-sm bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] animate-pulse" style={{ height: h }}  />
      ))}
    </div>
  )
}
