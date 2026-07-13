import React from 'react'
import { RsPill } from './RsPill'

export function RsActionRow({
    title, count, priority, forecast, onClick,
}: {
    title: string
    count: number
    priority: 'high' | 'med' | 'low'
    forecast?: string
    onClick?: () => void
}) {
    const tone = priority === 'high' ? 'bad' : priority === 'med' ? 'warn' : 'info'
    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] hover:bg-[var(--brand-surface-2)]] hover:border-[var(--brand-border-3)]] p-2.5 transition-colors"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[var(--brand-text-mid)]] truncate flex-1">{title}</span>
                <RsPill tone={tone}>{priority}</RsPill>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[var(--brand-text-faint)]]">
                <span>{count.toLocaleString()} {count === 1 ? 'page' : 'pages'} affected</span>
                {forecast && <span className="text-[var(--brand-text-mid)]] font-mono tabular-nums">{forecast}</span>}
            </div>
        </button>
    )
}
