import React from 'react'

export function ScoreGauge({
    score, label = 'Score', delta,
}: {
    score: number | null | undefined
    label?: string
    delta?: number | null
}) {
    const v = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : null
    const color = v === null ? 'border-[var(--brand-border-2)]' : v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444'
    const radius = 34, stroke = 6
    const circ = 2 * Math.PI * radius
    const offset = v === null ? circ : circ - (circ * v) / 100

    return (
        <div className="flex items-center gap-3">
            <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r={radius} stroke="bg-[var(--brand-surface-3)]" strokeWidth={stroke} fill="none" />
                <circle
                    cx="42" cy="42" r={radius}
                    stroke={color} strokeWidth={stroke} fill="none"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 42 42)"
                />
                <text x="42" y="46" textAnchor="middle" className="font-bold" fontSize="18" fill="text-[var(--brand-text-strong)]">
                    {v ?? '—'}
                </text>
            </svg>
            <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--brand-text-faint)]]">{label}</div>
                <div className="text-[12px] text-[var(--brand-text-mid)]] mt-0.5">
                    {delta === null || delta === undefined ? '' :
                        delta > 0 ? <span className="text-emerald-400">▲ {delta} vs prev</span> :
                        delta < 0 ? <span className="text-red-400">▼ {Math.abs(delta)} vs prev</span> :
                        <span className="text-[var(--brand-text-faint)]]">no change</span>}
                </div>
            </div>
        </div>
    )
}
