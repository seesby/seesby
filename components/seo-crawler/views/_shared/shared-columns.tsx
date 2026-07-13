'use client'

/**
 * Shared column definitions for all grid modes.
 *
 * Uses `metricColumn()` from metric-cell-renderers.tsx which auto-formats
 * via the metric catalog. Custom cell renderers are only used for columns
 * that need visual enhancements (color-coded status, score bars, etc.).
 *
 * Canonical dotted keys ensure compatibility with MetricRole 'G' filtering,
 * the ColumnPicker, and the metric catalog's format info.
 */

import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { metricColumn, metricCell } from './metric-cell-renderers'
import { resolveCellValue } from './resolve-cell-value'
import { fmtCompact, fmtMs, fmtPct, fmtUrl } from './formatters'

// ── Status color palette (single source of truth) ────────────────────
// All mode selectors MUST use these classes for consistency.
// STATUS = Tailwind classes for className usage
// STATUS_HEX = hex values for inline style={{ color: }} usage (re-export from tokens.ts)
import { STATUS as STATUS_HEX_BASE } from './tokens'

/** Hex equivalents for inline `style={{ color: ... }}` usage. */
export const STATUS_HEX = {
  good:    STATUS_HEX_BASE.good,
  warn:    STATUS_HEX_BASE.warn,
  bad:     STATUS_HEX_BASE.bad,
  info:    STATUS_HEX_BASE.info,
  muted:   STATUS_HEX_BASE.muted,
  link:    '#bdb6ff',
} as const

export const STATUS = {
  good:    'text-emerald-400',
  warn:    'text-amber-400',
  bad:     'text-red-400',
  info:    'text-blue-400',
  muted:   'text-[var(--brand-text-mid)]',
  link:    'text-[#bdb6ff]',
} as const

/** Map a 0-100 score to a Tailwind status class. */
export function scoreClass(v: number, good = 70, warn = 40): string {
  if (v >= good) return STATUS.good
  if (v >= warn) return STATUS.warn
  return STATUS.bad
}

/** Map a 0-100 score to a hex color for inline styles. */
export function scoreHex(v: number, good = 70, warn = 40): string {
  if (v >= good) return STATUS_HEX.good
  if (v >= warn) return STATUS_HEX.warn
  return STATUS_HEX.bad
}

/** Map CWV ms to a status class. */
export function cwvClass(ms: number, good = 2500, warn = 4000): string {
  if (ms <= good) return STATUS.good
  if (ms <= warn) return STATUS.warn
  return STATUS.bad
}

/** Map CWV ms to a hex color for inline styles. */
export function cwvHex(ms: number, good = 2500, warn = 4000): string {
  if (ms <= good) return STATUS_HEX.good
  if (ms <= warn) return STATUS_HEX.warn
  return STATUS_HEX.bad
}

/** Map CLS to a status class. */
export function clsClass(v: number, good = 0.1, warn = 0.25): string {
  if (v <= good) return STATUS.good
  if (v <= warn) return STATUS.warn
  return STATUS.bad
}

/** Map HTTP status code to a status class. */
export function httpStatusClass(code: number): string {
  if (code < 300) return STATUS.good
  if (code < 400) return STATUS.info
  if (code < 500) return STATUS.warn
  return STATUS.bad
}

/** Map security grade to a status class. */
export function secGradeClass(grade: string): string {
  if (grade === 'A' || grade === 'B') return STATUS.good
  if (grade === 'C') return STATUS.warn
  return STATUS.bad
}

// ── URL column (needs link styling) ──────────────────────────────────

export function urlColumn<T extends Record<string, unknown>>(): ColumnDef<T> {
  return {
    id: 'p.identity.url',
    accessorFn: (row) => row['url'] ?? resolveCellValue(row, 'p.identity.url'),
    header: 'URL',
    size: 320,
    cell: (ctx) => {
      const val = ctx.getValue() as string
      // Strip protocol + www for display, let CSS truncate handle overflow
      let display = val || '—'
      try {
        const u = new URL(val)
        display = u.hostname.replace(/^www\./, '') + u.pathname + u.search
      } catch { /* keep raw */ }
      return <span className="text-[#bdb6ff] truncate block">{display}</span>
    },
  }
}

// ── Status code (needs color coding) ─────────────────────────────────

export function statusColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.indexing.statusCode',
    accessorFn: opts?.accessorFn ?? ((row) => row['statusCode'] ?? resolveCellValue(row, 'p.indexing.statusCode')),
    header: 'Status',
    size: opts?.size ?? 70,
    cell: (ctx) => {
      const code = ctx.getValue() as number
      return <span className={`font-mono ${httpStatusClass(code)}`}>{code}</span>
    },
  }
}

// ── CWV bucket (color-coded) ─────────────────────────────────────────

export function cwvBucketColumn<T extends Record<string, unknown>>(): ColumnDef<T> {
  return {
    id: 'p.tech.cwv.bucket',
    accessorFn: (row) => row['cwvBucket'] ?? resolveCellValue(row, 'p.tech.cwv.bucket'),
    header: 'CWV',
    size: 80,
    cell: (ctx) => {
      const bucket = ctx.getValue() as string
      const cls = bucket === 'good' ? STATUS.good : bucket === 'needs-improvement' ? STATUS.warn : STATUS.bad
      return <span className={`font-mono ${cls}`}>{bucket || '—'}</span>
    },
  }
}

// ── Security grade (letter grade coloring) ───────────────────────────

export function secGradeColumn<T extends Record<string, unknown>>(): ColumnDef<T> {
  return {
    id: 'p.tech.sec.grade',
    accessorFn: (row) => row['securityGrade'] ?? resolveCellValue(row, 'p.tech.sec.grade'),
    header: 'Security',
    size: 80,
    cell: (ctx) => {
      const grade = ctx.getValue() as string
      return <span className={`font-mono font-bold ${secGradeClass(grade)}`}>{grade || '—'}</span>
    },
  }
}

// ── Score bar (progress bar with value) ──────────────────────────────

function scoreBarCell(value: unknown) {
  const score = typeof value === 'number' ? value : 0
  const tone = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const barStyle: React.CSSProperties = { width: `${Math.max(0, Math.min(100, score))}%`, background: tone }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded bg-[var(--brand-surface-3)] overflow-hidden">
        <div className="h-full" style={barStyle} />
      </div>
      <span className="w-6 text-right font-mono tabular-nums text-[11px]">{Math.round(score)}</span>
    </div>
  )
}

export function scoreBarColumn<T extends Record<string, unknown>>(
  metricKey: string,
  opts: { header: string; size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: metricKey,
    accessorFn: opts.accessorFn,
    header: opts.header,
    size: opts.size ?? 100,
    cell: (ctx) => scoreBarCell(ctx.getValue()),
  }
}

// ── Metric catalog columns (auto-formatted, no custom renderer) ──────

// Indexing
export const TITLE_COLUMN = metricColumn('p.content.title', { header: 'Title', size: 260 }) as ColumnDef<any>
export const WORD_COUNT_COLUMN = metricColumn('p.content.wordCount', { header: 'Words', size: 80 }) as ColumnDef<any>
export const DEPTH_COLUMN = metricColumn('p.indexing.depthCrawl', { header: 'Depth', size: 60 }) as ColumnDef<any>

// CWV (individual metrics for modes that need them)
export const LCP_COLUMN = metricColumn('p.tech.cwv.lcp', { header: 'LCP', size: 80 }) as ColumnDef<any>
export const CLS_COLUMN = metricColumn('p.tech.cwv.cls', { header: 'CLS', size: 70 }) as ColumnDef<any>
export const INP_COLUMN = metricColumn('p.tech.cwv.inp', { header: 'INP', size: 80 }) as ColumnDef<any>

// Links
export const INLINKS_COLUMN = metricColumn('p.links.inlinks', { header: 'Inbound', size: 70 }) as ColumnDef<any>
export const OUTLINKS_COLUMN = metricColumn('p.links.outlinks', { header: 'Outbound', size: 75 }) as ColumnDef<any>

// Content
export const READABILITY_COLUMN = metricColumn('p.content.readabilityGradeLevel', { header: 'Readability', size: 100 }) as ColumnDef<any>
export const FRESHNESS_COLUMN = metricColumn('p.content.freshnessClass', { header: 'Freshness', size: 80 }) as ColumnDef<any>
export const SCHEMA_TYPES_COLUMN = metricColumn('p.content.schemaTypes', { header: 'Schema', size: 120 }) as ColumnDef<any>
export const TOPIC_CLUSTER_COLUMN = metricColumn('p.content.topicCluster', { header: 'Cluster', size: 120 }) as ColumnDef<any>

// Search
export const CLICKS_COLUMN = metricColumn('p.search.gsc.clicks', { header: 'Clicks', size: 80 }) as ColumnDef<any>
export const IMPRESSIONS_COLUMN = metricColumn('p.search.gsc.impressions', { header: 'Impressions', size: 90 }) as ColumnDef<any>

// Analytics
export const SESSIONS_COLUMN = metricColumn('p.ga.sessions', { header: 'Sessions', size: 80 }) as ColumnDef<any>
export const CONVERSION_RATE_COLUMN = metricColumn('p.ga.conversionRate', { header: 'Conv. Rate', size: 80 }) as ColumnDef<any>
export const BOUNCE_RATE_COLUMN = metricColumn('p.ga.bounce', { header: 'Bounce', size: 80 }) as ColumnDef<any>

// E-E-A-T
export const EEAT_COLUMN = metricColumn('p.content.eeatScore', { header: 'E-E-A-T', size: 80 }) as ColumnDef<any>

// AI
export const AI_CITATION_COLUMN = metricColumn('p.ai.citationRate', { header: 'Citations', size: 80 }) as ColumnDef<any>
export const LLMSTXT_COLUMN = metricColumn('p.ai.llmsTxt', { header: 'llms.txt', size: 80 }) as ColumnDef<any>
export const BOT_ACCESS_COLUMN = metricColumn('p.ai.botsAllowed', { header: 'Bot Access', size: 80 }) as ColumnDef<any>
export const EXTRACTABILITY_COLUMN = metricColumn('p.ai.extractability', { header: 'Extractable', size: 80 }) as ColumnDef<any>

// Scores
export const Q_SCORE_COLUMN = metricColumn('s.score.qOverall', { header: 'Q-Score', size: 80 }) as ColumnDef<any>

// ── Paid ─────────────────────────────────────────────────────────────
export const PAID_SESSIONS_COLUMN = metricColumn('p.paid.paidSessions', { header: 'Paid sess', size: 85 }) as ColumnDef<any>
export const PAID_BOUNCE_COLUMN = metricColumn('p.paid.paidBounce', { header: 'Bounce', size: 70 }) as ColumnDef<any>
export const PAID_CVR_COLUMN = metricColumn('p.paid.paidCvr', { header: 'Conv. Rate', size: 70 }) as ColumnDef<any>
export const QS_LP_COLUMN = metricColumn('p.paid.qsLpComponent', { header: 'QS-LP', size: 60 }) as ColumnDef<any>
export const SPEND_COLUMN = metricColumn('s.paid.spend30d.google', { header: 'Spend', size: 80 }) as ColumnDef<any>
export const ROAS_COLUMN = metricColumn('s.paid.roas.google', { header: 'ROAS', size: 60 }) as ColumnDef<any>

// ── Commerce ─────────────────────────────────────────────────────────
export const PRICE_COLUMN = metricColumn('p.commerce.price', { header: 'Price', size: 80 }) as ColumnDef<any>
export const STOCK_COLUMN = metricColumn('p.commerce.availability', { header: 'Stock', size: 80 }) as ColumnDef<any>
export const REVIEW_COUNT_COLUMN = metricColumn('p.commerce.reviews.count', { header: 'Reviews', size: 80 }) as ColumnDef<any>
export const REVIEW_AVG_COLUMN = metricColumn('p.commerce.reviews.avg', { header: 'Avg Rating', size: 80 }) as ColumnDef<any>

// ── Social ───────────────────────────────────────────────────────────
export const SOCIAL_SHARES_COLUMN = metricColumn('p.social.shares.total', { header: 'Shares', size: 80 }) as ColumnDef<any>
export const SOCIAL_FOLLOWERS_COLUMN = metricColumn('s.social.followers.twitter', { header: 'Followers', size: 90 }) as ColumnDef<any>
export const MENTIONS_COLUMN = metricColumn('s.social.mentions.volume', { header: 'Mentions', size: 80 }) as ColumnDef<any>
export const SENTIMENT_COLUMN = metricColumn('s.social.mentions.sentiment', { header: 'Sentiment', size: 80 }) as ColumnDef<any>

// ── Local ────────────────────────────────────────────────────────────
export const GBP_REVIEW_COUNT_COLUMN = metricColumn('e.local.reviews.count.google', { header: 'Reviews', size: 80 }) as ColumnDef<any>
export const GBP_AVG_COLUMN = metricColumn('e.local.reviews.avg.google', { header: 'Avg Rating', size: 80 }) as ColumnDef<any>
export const CITATIONS_COLUMN = metricColumn('e.local.citations.count', { header: 'Citations', size: 80 }) as ColumnDef<any>

// ── AI-specific columns ─────────────────────────────────────────────

/** AI Readiness score bar (0-100). Wraps scoreBarColumn with AI-specific accessor. */
export function aiScoreBarColumn<T extends Record<string, unknown>>(
  opts?: { size?: number },
): ColumnDef<T> {
  return scoreBarColumn<T>('p.ai.passageScore', {
    header: 'AI Score',
    size: opts?.size ?? 100,
    accessorFn: (row) => {
      const v = (row as any).aiReady ?? 0
      return v
    },
  })
}

/** Bot access badge column (✓ allowed, ✗ blocked, — unknown). */
export function botBadgeColumn<T extends Record<string, unknown>>(
  botKey: string,
  header: string,
  opts?: { size?: number },
): ColumnDef<T> {
  return {
    id: `p.ai.bot.${botKey}`,
    accessorFn: (row) => (row as any)[botKey] ?? 'unknown',
    header,
    size: opts?.size ?? 80,
    cell: (ctx) => {
      const status = ctx.getValue() as string
      if (status === 'allowed') return <span className={STATUS.good}>&#10003;</span>
      if (status === 'blocked') return <span className={STATUS.bad}>&#10007;</span>
      return <span className={STATUS.muted}>&#8212;</span>
    },
  }
}

/** AI Citations column (numeric, conditional green/muted). */
export function aiCitationsColumn<T extends Record<string, unknown>>(
  opts?: { size?: number },
): ColumnDef<T> {
  return metricColumn<T>('p.ai.citationCount', {
    header: 'Citations',
    size: opts?.size ?? 80,
    accessorFn: (row) => (row as any).citations ?? 0,
  })
}

/** Entity name column (simple text). */
export function entityColumn<T extends Record<string, unknown>>(
  opts?: { size?: number },
): ColumnDef<T> {
  return {
    id: 'p.ai.entity',
    accessorFn: (row) => (row as any).entity ?? '',
    header: 'Entity',
    size: opts?.size ?? 140,
    cell: (ctx) => {
      const v = ctx.getValue() as string
      return v
        ? <span className="text-[11px] truncate block">{v}</span>
        : <span className="text-[10px] text-[var(--brand-border-2)]">&#8212;</span>
    },
  }
}

// ── Content-specific columns ────────────────────────────────────────

/** Search intent column with semantic coloring. */
export function intentColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  const INTENT_COLORS: Record<string, string> = {
    informational: 'text-emerald-400',
    transactional: 'text-blue-400',
    commercial: 'text-violet-400',
    navigational: 'text-amber-400',
  }
  return {
    id: 'p.content.intentSearch',
    accessorFn: opts?.accessorFn,
    header: 'Intent',
    size: opts?.size ?? 100,
    cell: (ctx) => {
      const v = (ctx.getValue() as string) || 'unknown'
      return <span className={`text-[10px] ${INTENT_COLORS[v] || 'text-[var(--brand-text-faint)]'}`}>{v}</span>
    },
  }
}

/** Search position column with rank-based coloring. */
export function positionColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.search.gsc.position',
    accessorFn: opts?.accessorFn,
    header: 'Position',
    size: opts?.size ?? 60,
    cell: (ctx) => {
      const v = ctx.getValue() as number
      if (!v) return <span className="text-[10px] text-[var(--brand-border-2)]">&#8212;</span>
      const tone = v <= 3 ? 'text-emerald-400' : v <= 10 ? 'text-blue-400' : v <= 20 ? 'text-amber-400' : 'text-red-400'
      return <span className={`text-[11px] tabular-nums ${tone}`}>{v.toFixed(1)}</span>
    },
  }
}

/** Top keyword column (simple text). */
export function topKeywordColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.search.mainKw',
    accessorFn: opts?.accessorFn,
    header: 'Top Keyword',
    size: opts?.size ?? 140,
    cell: (ctx) => {
      const v = ctx.getValue() as string
      return v
        ? <span className="text-[10px] text-[var(--brand-text-mid)] truncate block">{v}</span>
        : <span className="text-[10px] text-[var(--brand-border-2)]">&#8212;</span>
    },
  }
}

// ── Technical-specific columns ──────────────────────────────────────

/** TTFB column (CWV metric, lower is better). */
export function ttfbColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.tech.cwv.ttfb',
    accessorFn: opts?.accessorFn,
    header: 'TTFB',
    size: opts?.size ?? 70,
    cell: (ctx) => {
      const v = ctx.getValue() as number
      return <span className={`font-mono text-[11px] ${cwvClass(v, 800, 1800)}`}>{fmtMs(v)}</span>
    },
  }
}

/** Transfer size column (bytes formatting). */
export function sizeColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return metricColumn<T>('p.tech.transfer.size', {
    header: 'Size',
    size: opts?.size ?? 80,
    accessorFn: opts?.accessorFn,
  })
}

/** HTTP requests count column. */
export function requestsColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return metricColumn<T>('p.tech.transfer.requests', {
    header: 'Requests',
    size: opts?.size ?? 70,
    accessorFn: opts?.accessorFn,
  })
}

/** Render mode column (static=green, ssr=blue, csr=amber). */
export function renderModeColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.tech.renderMode',
    accessorFn: opts?.accessorFn,
    header: 'Render',
    size: opts?.size ?? 90,
    cell: (ctx) => {
      const v = ctx.getValue() as string
      const color = v === 'static' ? STATUS.good : v === 'ssr' ? STATUS.info : v === 'csr' ? STATUS.warn : STATUS.muted
      return <span className={`text-[10px] uppercase tracking-wider ${color}`}>{v}</span>
    },
  }
}

/** Indexability status column (indexable=noindex/blocked). */
export function indexableColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.indexing.indexable',
    accessorFn: opts?.accessorFn,
    header: 'Indexable',
    size: opts?.size ?? 85,
    cell: (ctx) => {
      const v = ctx.getValue() as string
      const color = v === 'indexable' ? STATUS.good : v === 'noindex' ? STATUS.warn : STATUS.bad
      return <span className={`text-[10px] ${color}`}>{v}</span>
    },
  }
}

/** Canonical URL column (self vs external). */
export function canonicalColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.indexing.canonical',
    accessorFn: opts?.accessorFn,
    header: 'Canonical',
    size: opts?.size ?? 180,
    cell: (ctx) => {
      const v = ctx.getValue() as string
      const isSelf = v === 'self'
      return (
        <span className={`text-[11px] truncate block ${isSelf ? 'text-[var(--brand-text-mid)]' : STATUS.link}`}>
          {isSelf ? 'self' : v}
        </span>
      )
    },
  }
}

/** Meta robots directives column (noindex=amber, nofollow=blue). */
export function robotsColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.indexing.metaRobots',
    accessorFn: opts?.accessorFn,
    header: 'Robots',
    size: opts?.size ?? 120,
    cell: (ctx) => {
      const v = ctx.getValue() as string
      const hasNoindex = v.includes('noindex')
      const hasNofollow = v.includes('nofollow')
      return (
        <span className={`text-[10px] ${hasNoindex ? STATUS.warn : hasNofollow ? STATUS.info : STATUS.muted}`}>
          {v}
        </span>
      )
    },
  }
}

/** Redirect count column (>=2 = amber warning). */
export function redirectsColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.indexing.redirectUrl',
    accessorFn: opts?.accessorFn,
    header: 'Redirects',
    size: opts?.size ?? 70,
    cell: (ctx) => {
      const v = ctx.getValue() as number
      return <span className={`font-mono text-[11px] ${v >= 2 ? STATUS.warn : 'text-[var(--brand-text-mid)]'}`}>{v}</span>
    },
  }
}

/** Schema markup count column. */
export function schemaColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return metricColumn<T>('p.content.schemaCount', {
    header: 'Schema',
    size: opts?.size ?? 65,
    accessorFn: opts?.accessorFn,
  })
}

/** SSL certificate expiry column (days until expiry, <30 = red). */
export function certColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.tech.certDays',
    accessorFn: opts?.accessorFn,
    header: 'Cert. Expiry',
    size: opts?.size ?? 95,
    cell: (ctx) => {
      const v = ctx.getValue() as number | null
      if (v == null) return <span className="text-[var(--brand-border-2)]">&#8212;</span>
      return <span className={`font-mono text-[11px] ${v < 30 ? STATUS.bad : 'text-[var(--brand-text-mid)]'}`}>{v}d</span>
    },
  }
}

/** Security pass/fail column (checkmark/cross). */
export function securityColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.tech.sec.grade',
    accessorFn: opts?.accessorFn,
    header: 'Secure',
    size: opts?.size ?? 55,
    cell: (ctx) => {
      const v = ctx.getValue() as boolean
      return v
        ? <span className={`${STATUS.good} text-[10px]`}>&#10003;</span>
        : <span className={`${STATUS.bad} text-[10px]`}>&#10007;</span>
    },
  }
}

/** Accessibility violations column (0=pass green, 1-3 amber, >3 red). */
export function a11yColumn<T extends Record<string, unknown>>(
  opts?: { size?: number; accessorFn?: (row: T) => unknown },
): ColumnDef<T> {
  return {
    id: 'p.tech.a11y.score',
    accessorFn: opts?.accessorFn,
    header: 'A11y',
    size: opts?.size ?? 70,
    cell: (ctx) => {
      const v = ctx.getValue() as number
      if (v < 0) return <span className="text-[10px] text-[var(--brand-text-faint)]">&#8212;</span>
      const color = v === 0 ? STATUS.good : v <= 3 ? STATUS.warn : STATUS.bad
      return <span className={`font-mono text-[11px] ${color}`}>{v === 0 ? 'pass' : `${v}`}</span>
    },
  }
}
