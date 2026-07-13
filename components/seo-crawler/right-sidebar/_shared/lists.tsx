import React from 'react'
import type { Tone, RsAction, RsAlert, RsListItem } from './types'
import { StatusChip } from './chips'

export function MetricRow({ label, value, tone = 'neutral' }: { label: React.ReactNode; value: React.ReactNode; tone?: Tone }) {
  const cls = tone === 'good' ? 'text-emerald-300'
           : tone === 'warn' ? 'text-amber-300'
           : tone === 'bad'  ? 'text-rose-300'
           : tone === 'info' ? 'text-sky-300' : 'text-[var(--brand-text-mid)]'
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <span className="truncate text-[11px] text-[var(--brand-text-mid)]">{label}</span>
      <span className={`text-[11px] font-mono tabular-nums ${cls}`}>{value}</span>
    </div>
  )
}

export function TopList({ items, max = 6, onSeeAll }: { items: ReadonlyArray<RsListItem>; max?: number; onSeeAll?: () => void }) {
  const shown = items.slice(0, max)
  return (
    <div className="space-y-1">
      {shown.map(it => (
        <button key={it.id} onClick={it.onClick}
          className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-[var(--brand-surface-2)]">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] text-[var(--brand-text-mid)]">{it.primary}</div>
            {it.secondary && <div className="truncate text-[10px] text-[var(--brand-text-faint)]">{it.secondary}</div>}
          </div>
          {it.tail && <span className="shrink-0 text-[10px] font-mono tabular-nums text-[var(--brand-text-mid)]">{it.tail}</span>}
        </button>
      ))}
      {items.length > max && onSeeAll && (
        <button onClick={onSeeAll} className="w-full px-1.5 py-1 text-left text-[10px] text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)]">
          See all {items.length} →
        </button>
      )}
    </div>
  )
}

export function AlertRow({ alert, onClick }: { alert: RsAlert; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-[var(--brand-surface-2)]">
      <div className="flex min-w-0 items-center gap-1.5">
        <StatusChip tone={alert.tone}>•</StatusChip>
        <span className="truncate text-[11px] text-[var(--brand-text-mid)]">{alert.title}</span>
      </div>
      {alert.count != null && (
        <span className="shrink-0 text-[11px] font-mono tabular-nums text-[var(--brand-text-mid)]">{alert.count}</span>
      )}
    </button>
  )
}

export function ActionRow({ action, onApprove, onDismiss }: { action: RsAction; onApprove?: () => void; onDismiss?: () => void }) {
  return (
    <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {action.primary && <StatusChip tone="info">primary</StatusChip>}
            <span className="truncate text-[11px] font-medium text-[var(--brand-text-mid)]">{action.title}</span>
          </div>
          {action.reason && <div className="mt-0.5 truncate text-[10px] text-[var(--brand-text-faint)]">{action.reason}</div>}
        </div>
        <div className="shrink-0 text-right">
          {action.forecast && <div className="text-[10px] text-emerald-400">{action.forecast}</div>}
          {action.affected != null && <div className="text-[9px] text-[var(--brand-text-faint)]">{action.affected} pages</div>}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={onApprove}
          className="rounded bg-[#F59E0B] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-text-strong)] hover:bg-[#df3248]">Approve</button>
        <button onClick={onDismiss}
          className="rounded border border-[var(--brand-border-2)] px-2 py-0.5 text-[10px] text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)]">Dismiss</button>
        {action.cta && (
          <button onClick={action.cta.onClick}
            className="rounded border border-[var(--brand-border-2)] px-2 py-0.5 text-[10px] text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)]">{action.cta.label}</button>
        )}
      </div>
    </div>
  )
}

export function DrillChip({ label, count, onClick }: { label: string; count?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 rounded border border-[var(--brand-border-2)] bg-[var(--brand-surface-0)] px-1.5 py-0.5 text-[10px] text-[var(--brand-text-mid)] hover:bg-[var(--brand-surface-2)] hover:text-[var(--brand-text-strong)]">
      {label}
      {count != null && <span className="font-mono text-[var(--brand-text-faint)]">{count}</span>}
    </button>
  )
}
