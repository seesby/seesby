import React from 'react'
import { Check, Minus, X } from 'lucide-react'
import { Card, Section } from '..'

export type ChecklistItem = {
	id: string
	label: string
	state: 'pass' | 'warn' | 'fail' | 'skip'
	hint?: string
}

const stateColor: Record<ChecklistItem['state'], string> = {
	pass: 'text-emerald-400',
	warn: 'text-amber-400',
	fail: 'text-rose-400',
	skip: 'text-neutral-500',
}

function Icon({ state }: { state: ChecklistItem['state'] }) {
	if (state === 'pass') return <Check size={11} />
	if (state === 'fail') return <X size={11} />
	if (state === 'skip') return <Minus size={11} />
	return <Minus size={11} />
}

export function ChecklistBlock({
	title,
	items,
	cols = 1,
}: {
	title: string
	items: ReadonlyArray<ChecklistItem>
	cols?: 1 | 2
}) {
	return (
		<Card>
			<Section title={title} dense>
				<div className={`grid gap-1 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
					{items.map((it) => (
						<div key={it.id} title={it.hint} className="flex items-center gap-2 text-[11px] text-[var(--brand-text-mid)]]">
							<span className={`flex h-4 w-4 items-center justify-center rounded ${stateColor[it.state]} bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]]`}>
								<Icon state={it.state} />
							</span>
							<span className="flex-1 truncate">{it.label}</span>
						</div>
					))}
				</div>
			</Section>
		</Card>
	)
}
