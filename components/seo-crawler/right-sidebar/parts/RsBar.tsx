import React from 'react'
import { clamp, type Tone, toneToColor } from './format'

export function RsBar({
    label, value, total, tone, suffix,
}: {
    label: string
    value: number
    total: number
    tone?: Tone
    suffix?: string
}) {
    const pct = total > 0 ? clamp((value / total) * 100, 0, 100) : 0
    const color = toneToColor(tone)
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--brand-text-mid)]] truncate">{label}</span>
                <span className="text-[11px] font-mono tabular-nums text-[var(--brand-text-mid)]] shrink-0">
                    {value.toLocaleString()}{suffix ? ` ${suffix}` : ''}
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    )
}
