import React from 'react'

export function RsEmpty({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="grid place-items-center py-6 px-3 text-center">
            <div className="w-9 h-9 mx-auto rounded-full border border-dashed border-[var(--brand-border-3)]] mb-2" />
            <p className="text-[12px] font-medium text-[var(--brand-text-mid)]]">{title}</p>
            {hint && <p className="mt-1 text-[10px] text-[var(--brand-text-faint)]] max-w-[220px]">{hint}</p>}
        </div>
    )
}
