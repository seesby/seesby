import React from 'react'
import type { Tone } from './types'

const toneText: Record<Tone, string> = {
  good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warn: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  bad:  'text-rose-400 bg-rose-500/10 border-rose-500/20',
  info: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  neutral: 'text-[var(--brand-text-mid)] bg-[var(--brand-surface-3)] border-[var(--brand-border-3)]',
}

export function StatusChip({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${toneText[tone]}`}>
      {children}
    </span>
  )
}

// SourceChip → SourceChip.tsx, FreshnessChip → FreshnessChip.tsx (consolidated)

export function TonePill({ tone = 'neutral', label }: { tone?: Tone; label: string }) {
  return <StatusChip tone={tone}>{label}</StatusChip>
}
