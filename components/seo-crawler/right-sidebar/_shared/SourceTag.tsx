// components/seo-crawler/right-sidebar/_shared/SourceTag.tsx
import React from 'react'

const COLOR: Record<string, string> = {
  crawl: '#94a3b8',
  gsc: '#3b82f6',
  bing: '#22c55e',
  gbp: '#f59e0b',
  backlinks: '#a78bfa',
  keywords: '#ec4899',
  inventory: '#10b981',
  ai: '#d946ef',
  mcp: '#06b6d4',
}

export function SourceTag({ source }: { source: keyof typeof COLOR | string }) {
  const c = COLOR[source] ?? 'text-[var(--brand-text-faint)]'
  return (
    <span
      className="inline-flex h-4 items-center rounded-sm border px-1 text-[9px] uppercase tracking-wide text-[var(--brand-text-mid)]]"
      style={{ borderColor: c, color: c }}
    >
      {source}
    </span>
  )
}
