import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export function HelpHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}>
      <HelpCircle size={11} className="text-[var(--brand-text-faint)]] hover:text-[var(--brand-text-mid)]]" />
      {open && (
        <span className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 w-44 rounded-md border border-[var(--brand-border-2)]] bg-[var(--brand-surface-0)]] px-2 py-1 text-[10px] text-[var(--brand-text-mid)]] shadow-lg pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}
