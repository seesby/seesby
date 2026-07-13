import React from 'react'

export function NotConnected({ source, reason, onConnect }: {
  source: string
  reason: string
  onConnect?: () => void
}) {
  return (
    <div className="rounded-md border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-4 text-center">
      <div className="text-[12px] text-[var(--brand-text-strong)] font-semibold">{source} not connected</div>
      <div className="text-[11px] text-[var(--brand-text-mid)]] mt-1">{reason}</div>
      <button
        onClick={onConnect}
        className="mt-3 px-3 py-1.5 text-[11px] font-bold bg-[#F59E0B] text-[var(--brand-text-strong)] rounded hover:bg-[#df3248] transition-colors"
      >
        Connect {source}
      </button>
    </div>
  )
}
