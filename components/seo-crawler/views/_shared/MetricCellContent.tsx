'use client'

import React from 'react'
import type { SourceTier } from '@seesby/types'

/**
 * Tiny source tier indicator for grid cells.
 * Shows a 4px colored dot next to the value. Hover reveals full source info.
 */
const TIER_DOT: Record<string, { color: string; label: string }> = {
  T0: { color: '#10b981', label: 'Authoritative' },
  T1: { color: '#10b981', label: 'Free API' },
  T2: { color: '#3b82f6', label: 'Browser' },
  T3: { color: '#f97316', label: 'Scrape' },
  T4: { color: '#6b7280', label: 'Public' },
  T5: { color: '#f97316', label: 'Derived' },
  T6: { color: '#a855f7', label: 'AI' },
  T7: { color: '#9ca3af', label: 'Estimate' },
  T8: { color: '#d1d5db', label: 'Default' },
}

interface MetricCellContentProps {
  children: React.ReactNode
  tier?: SourceTier | string | null
  provider?: string
  observedAt?: string
}

export function MetricCellContent({ children, tier, provider, observedAt }: MetricCellContentProps) {
  if (!tier) return <>{children}</>
  const info = TIER_DOT[tier]
  if (!info) return <>{children}</>

  const tooltip = `${info.label}${provider ? ' (' + provider + ')' : ''}${observedAt ? ' — ' + relativeTime(observedAt) : ''}`

  return (
    <span className="flex items-center gap-1 min-w-0">
      <span
        className="inline-block rounded-full shrink-0"
        style={{ width: 4, height: 4, backgroundColor: info.color }}
        title={tooltip}
      />
      <span className="truncate">{children}</span>
    </span>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
