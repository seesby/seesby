import React from 'react'

export function Card({
	children, className = '', padded = true, tone = 'default', title,
}: {
	children: React.ReactNode
	className?: string
	padded?: boolean
	tone?: 'default' | 'sunken' | 'accent'
	title?: string
}) {
	const bg =
		tone === 'sunken' ? 'bg-[var(--brand-surface-0)]' :
		tone === 'accent' ? 'bg-[#F59E0B]/[0.06]' :
		'bg-[var(--brand-surface-2)]'
	const border =
		tone === 'accent' ? 'border-[#F59E0B]/25' : 'border-[var(--brand-surface-3)]'

	return (
		<div className={`rounded-md border ${border} ${bg} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${padded ? 'p-3' : ''} ${className}`}>
			{title && (
				<div className={`flex items-center justify-between ${padded ? 'mb-2.5' : 'px-3 pt-3 pb-2'}`}>
					<h5 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-text-faint)]">{title}</h5>
				</div>
			)}
			{children}
		</div>
	)
}
