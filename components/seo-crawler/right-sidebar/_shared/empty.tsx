import React from 'react'

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-dashed border-[var(--brand-border-2)]] bg-[var(--brand-surface-0)]] px-3 py-6 text-center">
      {icon && <div className="mb-1.5 text-[var(--brand-text-faint)]]">{icon}</div>}
      <div className="text-[12px] font-semibold text-[var(--brand-text-mid)]]">{title}</div>
      {hint && <div className="mt-0.5 max-w-[260px] text-[10px] text-[var(--brand-text-faint)]]">{hint}</div>}
    </div>
  )
}

export function NotConnected({ source, onConnect }: { source: string; onConnect?: () => void }) {
  return (
    <div className="rounded border border-dashed border-[var(--brand-border-2)]] bg-[var(--brand-surface-0)]] p-3 text-center">
      <div className="text-[12px] font-semibold text-[var(--brand-text-mid)]]">{source} not connected</div>
      <div className="mt-1 text-[10px] text-[var(--brand-text-faint)]]">Connect to populate this tab.</div>
      {onConnect && (
        <button onClick={onConnect}
          className="mt-2 rounded bg-[#F59E0B] px-2.5 py-1 text-[10px] font-bold text-[var(--brand-text-strong)] hover:bg-[#df3248]">
          Connect {source}
        </button>
      )}
    </div>
  )
}
