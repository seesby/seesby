import React from 'react'
import { Card, Section } from '..'

export type RankBucket = {
	label: string
	value: number
	tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral'
	onClick?: () => void
}

const toneToBg: Record<NonNullable<RankBucket['tone']>, string> = {
	good: 'bg-emerald-500/30',
	warn: 'bg-amber-500/30',
	bad: 'bg-rose-500/30',
	info: 'bg-sky-500/25',
	neutral: 'bg-neutral-500/25',
}

export function RankBucketsBlock({
	title = 'Rank distribution',
	buckets,
	hint,
}: {
	title?: string
	buckets: ReadonlyArray<RankBucket>
	hint?: string
}) {
	const max = Math.max(1, ...buckets.map((b) => b.value))
	return (
		<Card>
			<Section title={title} dense>
				<div className="flex flex-col gap-1">
					{buckets.map((b) => {
						const width = Math.round((b.value / max) * 100)
						const Row = b.onClick ? 'button' : 'div'
						return (
							<Row
								key={b.label}
								onClick={b.onClick}
								className={`flex items-center gap-2 w-full text-left group ${b.onClick ? 'hover:bg-[var(--brand-surface-3)] -mx-1 px-1 rounded' : ''}`}
							>
								<span className="w-12 text-[10px] text-[var(--brand-text-mid)]]">{b.label}</span>
								<div className="relative h-2.5 flex-1 rounded bg-[var(--brand-surface-2)]] overflow-hidden">
									<div className={`h-full ${toneToBg[b.tone || 'info']}`} style={{ width: `${width}%` }} />
								</div>
								<span className="w-10 text-right text-[10px] font-mono text-[var(--brand-text-mid)]]">{b.value.toLocaleString()}</span>
							</Row>
						)
					})}
				</div>
				{hint ? <div className="mt-2 text-[10px] text-[var(--brand-text-faint)]]">{hint}</div> : null}
			</Section>
		</Card>
	)
}
