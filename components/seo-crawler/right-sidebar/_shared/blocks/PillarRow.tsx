import React from 'react'
import { Sparkline } from '../Sparkline'
import { TrendDelta } from '../TrendDelta'
import { scoreToTone } from '../scoring'

export function PillarRow({
	label, score, prev, series, onClick,
}: {
	label: string
	score: number
	prev?: number
	series?: number[]
	onClick?: () => void
}) {
	const tone = scoreToTone(score)
	const color = tone === 'good' ? '#10b981' : tone === 'warn' ? '#f59e0b' : tone === 'bad' ? '#ef4444' : '#3b82f6'
	return (
		<button
			onClick={onClick}
			className="group w-full grid grid-cols-[80px_1fr_56px_44px] items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--brand-surface-1)]] transition-colors"
		>
			<span className="text-[11px] text-[var(--brand-text-mid)]] truncate text-left">{label}</span>
			<div className="h-1.5 w-full rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
				<div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: color }} />
			</div>
			<span className="text-[11px] font-mono tabular-nums text-right text-[var(--brand-text-strong)]">{Math.round(score)}</span>
			<div className="flex items-center justify-end">
				{series && series.length > 1
					? <Sparkline values={series} width={36} height={16} tone={tone} />
					: typeof prev === 'number' ? <TrendDelta current={score} previous={prev} /> : null}
			</div>
		</button>
	)
}
