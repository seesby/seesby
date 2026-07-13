import React from 'react'
import { Card } from '../Card'
import { Section } from '../Section'

export type RecommendedAction = {
	id: string
	title: string
	subtitle?: string
	priority: 'critical' | 'high' | 'med' | 'low'
	pagesAffected: number
	effortMin: number
	expectedDelta: { value: number; unit: string }
	confidence: number
	category?: string
	onClick?: () => void
}

const PRIORITY: Record<RecommendedAction['priority'], { label: string; color: string }> = {
	critical: { label: 'Critical', color: '#ef4444' },
	high: { label: 'High', color: '#f59e0b' },
	med: { label: 'Medium', color: '#3b82f6' },
	low: { label: 'Low', color: '#6b7280' },
}

function fmtEffort(min: number) {
	if (min < 60) return `${min}m`
	const h = Math.round(min / 60)
	return h < 8 ? `${h}h` : `${Math.round(h / 8)}d`
}

export function RecommendedActionsBlock({
	title = 'Recommended actions',
	items,
	onSeeAll,
	emptyText = 'No actions yet — run a crawl first.',
}: {
	title?: string
	items: ReadonlyArray<RecommendedAction>
	onSeeAll?: () => void
	emptyText?: string
}) {
	if (!items.length) {
		return (
			<Card>
				<Section title={title} dense action={onSeeAll ? <button onClick={onSeeAll} className="hover:text-[var(--brand-text-strong)] transition-colors">See all</button> : undefined}>
					<div className="text-[11px] text-[var(--brand-text-faint)]] py-2">{emptyText}</div>
				</Section>
			</Card>
		)
	}
	return (
		<Card>
			<Section title={title} dense action={onSeeAll ? <button onClick={onSeeAll} className="hover:text-[var(--brand-text-strong)] transition-colors">See all</button> : undefined}>
				<div className="flex flex-col gap-1.5">
					{items.map(a => (
						<button
							key={a.id}
							onClick={a.onClick}
							className="w-full text-left rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] hover:bg-[var(--brand-surface-1)]] hover:border-[var(--brand-border-2)]] p-2 transition-colors"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<div className="text-[11px] font-medium text-[var(--brand-text-strong)] truncate">{a.title}</div>
									{a.subtitle ? <div className="text-[10px] text-[var(--brand-text-mid)]] truncate">{a.subtitle}</div> : null}
								</div>
								<span
									className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border"
									style={{ borderColor: PRIORITY[a.priority].color, color: PRIORITY[a.priority].color }}
								>
									{PRIORITY[a.priority].label}
								</span>
							</div>
							<div className="mt-1.5 grid grid-cols-3 gap-2 text-[10px] text-[var(--brand-text-mid)]]">
								<span className="truncate">{a.pagesAffected.toLocaleString()} {a.pagesAffected === 1 ? 'page' : 'pages'}</span>
								<span className="text-center">⏱ {fmtEffort(a.effortMin)}</span>
								<span className="text-right text-emerald-400 font-mono tabular-nums">+{a.expectedDelta.value}{a.expectedDelta.unit}</span>
							</div>
							<div className="mt-1 h-0.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
								<div
									className="h-full rounded-full"
									style={{ width: `${Math.round(a.confidence * 100)}%`, background: PRIORITY[a.priority].color }}
									title={`Confidence ${Math.round(a.confidence * 100)}%`}
								/>
							</div>
						</button>
					))}
				</div>
			</Section>
		</Card>
	)
}
