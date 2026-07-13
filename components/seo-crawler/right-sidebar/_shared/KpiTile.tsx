import React from 'react'

export function KpiTile({
    label, value, sub, delta, deltaTone = 'flat', mono = true, tone = 'neutral'
}: {
    label: string
    value: React.ReactNode
    sub?: string
    delta?: string
    deltaTone?: 'up' | 'down' | 'flat'
    mono?: boolean
    tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral'
}) {
    const trendTone =
        deltaTone === 'up' ? 'text-emerald-400' :
        deltaTone === 'down' ? 'text-red-400' :
        'text-[var(--brand-text-mid)]'

    const valueColor = 
        tone === 'good' ? 'text-emerald-400' :
        tone === 'bad' ? 'text-red-400' :
        tone === 'warn' ? 'text-amber-400' :
        tone === 'info' ? 'text-blue-400' :
        'text-[var(--brand-text-strong)]'

    const indicatorColor =
        tone === 'good' ? 'bg-emerald-500' :
        tone === 'bad' ? 'bg-red-500' :
        tone === 'warn' ? 'bg-amber-500' :
        tone === 'info' ? 'bg-blue-500' :
        'bg-[var(--brand-surface-4)]'

    return (
        <div className="flex flex-col justify-between h-full bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-md p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[var(--brand-surface-2)] transition-colors">
            
            <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`} />
                <div className="text-[10px] font-semibold tracking-wider text-[var(--brand-text-mid)] uppercase">{label}</div>
            </div>
            
            <div className="mt-1 flex items-end justify-between">
                <div className={`text-[20px] font-bold leading-none tracking-tight ${mono ? 'font-mono' : ''} ${valueColor}`}>
                    {value}
                </div>
                
                {delta && (
                    <div className="flex items-center gap-1 bg-[var(--brand-surface-2)] px-1.5 py-0.5 rounded border border-[var(--brand-border-2)]">
                        {deltaTone !== 'flat' && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d={deltaTone === 'up' ? "M12 4L12 20M12 4L6 10M12 4L18 10" : "M12 20L12 4M12 20L6 14M12 20L18 14"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={trendTone} />
                            </svg>
                        )}
                        <span className={`text-[10px] font-medium ${trendTone}`}>{delta}</span>
                    </div>
                )}
            </div>

            {sub && <div className="mt-1.5 text-[11px] text-[var(--brand-text-faint)] font-medium leading-snug">{sub}</div>}
        </div>
    )
}
