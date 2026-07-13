// components/seo-crawler/right-sidebar/full-audit/_selectors.ts
import type { Page } from '@seesby/types'
import { getAllActions } from '@seesby/actions'
import { getPageIssues } from '../../IssueTaxonomy'
import { num } from '../_shared/format'

export type StatusMix = { ok: number; redirect: number; clientError: number; serverError: number; total: number }
export type DepthBucket = { depth: number; count: number }
export type CategoryDonut = { name: string; value: number; color: string }
export type SeveritySplit = { critical: number; high: number; medium: number; low: number }
export type CategorySplit = Record<'content' | 'technical' | 'schema' | 'links' | 'a11y' | 'security' | 'performance' | 'ux', number>
export type IssueRow = { code: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low'; count: number; category: string }
export type Pillars = { content: number; technical: number; schema: number; links: number; a11y: number; security: number }
export type CrawlHealth = {
  startedAt: string | null
  finishedAt: string | null
  durationMs: number
  pagesCrawled: number
  avgMs: number
  p90Ms: number
  p99Ms: number
  errors: { timeouts: number; server: number; parse: number; dns: number }
  blocked: { robots: number; metaNoindex: number; auth: number }
  sitemap: { inSitemap: number; missingFromSitemap: number; orphanInSitemap: number }
  render: { staticHtml: number; ssr: number; csr: number }
}

export type SearchSnapshot = {
  clicks: number
  impressions: number
  ctr: number
  avgPosition: number
  clicksDelta?: number
  impressionsDelta?: number
  ctrDeltaPt?: number
  positionDelta?: number
}

export type TrafficSummary = {
  sessions: number
  users: number
  bounceRate: number
  engagedRate: number
  channels: { organic: number; direct: number; referral: number; social: number; paid: number; email: number; other: number }
}

export type ConnectorInfo = {
  id: string
  label: string
  state: 'connected' | 'disconnected' | 'error'
  lastSyncAt?: string | null
  coveragePct?: number
  coverageLabel?: string
}

const SEV_FROM_CODE: Record<string, IssueRow['severity']> = { S1: 'critical', S2: 'high', S3: 'medium', S4: 'low' }

export function selectStatusMix(pages: Page[]): StatusMix {
  let ok = 0, r = 0, c = 0, s = 0
  for (const p of pages) {
    const code = Number(p.statusCode ?? 0)
    if (code >= 200 && code < 300) ok++
    else if (code >= 300 && code < 400) r++
    else if (code >= 400 && code < 500) c++
    else if (code >= 500) s++
  }
  return { ok, redirect: r, clientError: c, serverError: s, total: pages.length }
}

export function selectDepthDistribution(pages: Page[], maxDepth = 6): DepthBucket[] {
  const map = new Map<number, number>()
  for (const p of pages) {
    const d = Math.min(Number(p.crawlDepth ?? 0), maxDepth)
    map.set(d, (map.get(d) ?? 0) + 1)
  }
  return Array.from({ length: maxDepth + 1 }, (_, i) => ({ depth: i, count: map.get(i) ?? 0 }))
}

export function selectCategoryDonut(pages: Page[]): CategoryDonut[] {
  let article = 0, doc = 0, product = 0, other = 0
  for (const p of pages) {
    const t = (p.pageType ?? '').toLowerCase()
    if (t === 'article' || t === 'blog' || t === 'news') article++
    else if (t === 'doc' || t === 'help' || t === 'kb') doc++
    else if (t === 'product' || t === 'collection' || t === 'pdp') product++
    else other++
  }
  return [
    { name: 'Article', value: article, color: '#3b82f6' },
    { name: 'Doc', value: doc, color: '#a78bfa' },
    { name: 'Product', value: product, color: '#10b981' },
    { name: 'Other', value: other, color: '#475569' },
  ]
}

export function selectIndexable(pages: Page[]): { indexable: number; notIndexable: number } {
  let i = 0, n = 0
  for (const p of pages) (p.indexable ? i++ : n++)
  return { indexable: i, notIndexable: n }
}

export function selectIssues(pages: Page[]): { rows: IssueRow[]; severity: SeveritySplit; category: CategorySplit; openTotal: number } {
  const counts = new Map<string, number>()
  for (const p of pages) {
    const list = getPageIssues(p) ?? []
    for (const issue of list) counts.set(issue.id, (counts.get(issue.id) ?? 0) + 1)
  }
  const cat: CategorySplit = { content: 0, technical: 0, schema: 0, links: 0, a11y: 0, security: 0, performance: 0, ux: 0 }
  const sev: SeveritySplit = { critical: 0, high: 0, medium: 0, low: 0 }
  const rows: IssueRow[] = []
  for (const a of getAllActions()) {
    const count = counts.get(a.code) ?? 0
    if (count === 0) continue
    const severity = SEV_FROM_CODE[a.severity] ?? 'low'
    const category = mapCategory(a.code)
    sev[severity] += count
    if (cat[category as keyof CategorySplit] !== undefined) cat[category as keyof CategorySplit] += count
    rows.push({ code: a.code, title: a.title, severity, count, category })
  }
  rows.sort((a, b) => b.count - a.count || severityRank(b.severity) - severityRank(a.severity))
  const openTotal = sev.critical + sev.high + sev.medium + sev.low
  return { rows, severity: sev, category: cat, openTotal }
}

import { getQualityScore, getHealthScore, getAuthorityScore } from '@/components/seo-crawler/views/_shared/get-metric-value'

export function selectPillars(pages: Page[]): Pillars {
  // pillar scores are precomputed by services/PostCrawlEnrichment.ts and stored on site summary
  const avg = (getter: (p: Record<string, unknown>) => number): number => {
    if (!pages.length) return 0
    const sum = pages.reduce((s, p) => s + getter(p as Record<string, unknown>), 0)
    return Math.round(sum / pages.length)
  }
  return {
    content: avg(getQualityScore),
    technical: avg(getHealthScore),
    schema: avg(p => Number((p as any)['p.content.schemaScore'] ?? 0)),
    links: avg(getAuthorityScore),
    a11y: avg(p => Number((p as any)['p.tech.a11yScore'] ?? 0)),
    security: avg(p => Number((p as any)['p.tech.securityScore'] ?? 0)),
  }
}

export function selectOverallScore(p: Pillars): number {
  const w = { content: 0.2, technical: 0.25, schema: 0.1, links: 0.15, a11y: 0.15, security: 0.15 }
  return Math.round(p.content * w.content + p.technical * w.technical + p.schema * w.schema + p.links * w.links + p.a11y * w.a11y + p.security * w.security)
}

export function selectScoreDistribution(pages: Page[]): { bucket: string; count: number }[] {
  const buckets = [0, 0, 0, 0, 0]
  for (const p of pages) {
    const s = Number((p as any)['p.score.contentQuality'] ?? (p as any).qualityScore ?? (p as any).pageScore ?? 0)
    if (s < 50) buckets[0]++
    else if (s < 70) buckets[1]++
    else if (s < 80) buckets[2]++
    else if (s < 90) buckets[3]++
    else buckets[4]++
  }
  return [
    { bucket: '<50', count: buckets[0] },
    { bucket: '50-69', count: buckets[1] },
    { bucket: '70-79', count: buckets[2] },
    { bucket: '80-89', count: buckets[3] },
    { bucket: '90+', count: buckets[4] },
  ]
}

export function selectCrawlHealth(site: any): CrawlHealth {
  const s = site?.lastSession ?? {}
  return {
    startedAt: s.startedAt ?? null,
    finishedAt: s.finishedAt ?? null,
    durationMs: Number(s.durationMs ?? 0),
    pagesCrawled: Number(s.pagesCrawled ?? 0),
    avgMs: Number(s.responseAvgMs ?? 0),
    p90Ms: Number(s.responseP90Ms ?? 0),
    p99Ms: Number(s.responseP99Ms ?? 0),
    errors: {
      timeouts: Number(s.errors?.timeouts ?? 0),
      server: Number(s.errors?.server ?? 0),
      parse: Number(s.errors?.parse ?? 0),
      dns: Number(s.errors?.dns ?? 0),
    },
    blocked: {
      robots: Number(s.blocked?.robots ?? 0),
      metaNoindex: Number(s.blocked?.metaNoindex ?? 0),
      auth: Number(s.blocked?.auth ?? 0),
    },
    sitemap: {
      inSitemap: Number(s.sitemap?.inSitemap ?? 0),
      missingFromSitemap: Number(s.sitemap?.missingFromSitemap ?? 0),
      orphanInSitemap: Number(s.sitemap?.orphanInSitemap ?? 0),
    },
    render: {
      staticHtml: Number(s.render?.staticHtml ?? 0),
      ssr: Number(s.render?.ssr ?? 0),
      csr: Number(s.render?.csr ?? 0),
    },
  }
}

export function selectSearchSnapshot(gscQueries: any[], sessions?: any[]): SearchSnapshot {
  const gsc = gscQueries || []
  const clicks = gsc.reduce((a: number, q: any) => a + num(q.clicks), 0)
  const impressions = gsc.reduce((a: number, q: any) => a + num(q.impressions), 0)
  const ctr = gsc.length ? gsc.reduce((a: number, q: any) => a + num(q.ctr), 0) / gsc.length : 0
  const avgPosition = gsc.length ? gsc.reduce((a: number, q: any) => a + num(q.position), 0) / gsc.length : 0

  // If we have prior session data, compute deltas
  const prevSession = sessions?.[sessions.length - 2]
  const prevGsc = prevSession?.gscQueries || []
  const prevClicks = prevGsc.reduce((a: number, q: any) => a + num(q.clicks), 0)
  const prevImpr = prevGsc.reduce((a: number, q: any) => a + num(q.impressions), 0)
  const prevCtr = prevGsc.length ? prevGsc.reduce((a: number, q: any) => a + num(q.ctr), 0) / prevGsc.length : 0
  const prevPos = prevGsc.length ? prevGsc.reduce((a: number, q: any) => a + num(q.position), 0) / prevGsc.length : 0

  return {
    clicks,
    impressions,
    ctr,
    avgPosition,
    clicksDelta: prevClicks ? clicks - prevClicks : undefined,
    impressionsDelta: prevImpr ? impressions - prevImpr : undefined,
    ctrDeltaPt: prevCtr ? Math.round((ctr - prevCtr) * 1000) / 10 : undefined,
    positionDelta: prevPos ? Math.round((avgPosition - prevPos) * 10) / 10 : undefined,
  }
}

export function selectTrafficSummary(ga4Traffic: any[]): TrafficSummary {
  const ga4 = ga4Traffic || []
  return {
    sessions: ga4.reduce((a: number, r: any) => a + num(r.sessions), 0),
    users: ga4.reduce((a: number, r: any) => a + num(r.users), 0),
    bounceRate: 0,
    engagedRate: 0,
    channels: {
      organic: ga4.filter((r: any) => r.channel === 'Organic Search').reduce((a: number, r: any) => a + num(r.sessions), 0),
      direct: ga4.filter((r: any) => r.channel === 'Direct').reduce((a: number, r: any) => a + num(r.sessions), 0),
      referral: ga4.filter((r: any) => r.channel === 'Referral').reduce((a: number, r: any) => a + num(r.sessions), 0),
      social: ga4.filter((r: any) => r.channel === 'Organic Social').reduce((a: number, r: any) => a + num(r.sessions), 0),
      paid: ga4.filter((r: any) => r.channel === 'Paid Search').reduce((a: number, r: any) => a + num(r.sessions), 0),
      email: ga4.filter((r: any) => r.channel === 'Email').reduce((a: number, r: any) => a + num(r.sessions), 0),
      other: ga4.filter((r: any) => !['Organic Search', 'Direct', 'Referral', 'Organic Social', 'Paid Search', 'Email'].includes(r.channel)).reduce((a: number, r: any) => a + num(r.sessions), 0),
    },
  }
}

export function selectConnectors(site: any): ConnectorInfo[] {
  const conns: Record<string, any> = site?.connectors ?? {}
  const ORDER = [
    { id: 'gsc', label: 'Google Search Console' },
    { id: 'ga4', label: 'Google Analytics 4' },
    { id: 'bing', label: 'Bing Webmaster' },
    { id: 'gbp', label: 'Google Business Profile' },
    { id: 'backlinks', label: 'Backlinks (Ahrefs)' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'ai', label: 'AI router' },
    { id: 'mcp', label: 'MCP' },
  ]
  return ORDER.map((o) => ({
    id: o.id,
    label: o.label,
    state: (conns[o.id]?.state ?? conns[o.id]?.connected ? 'connected' : 'disconnected') as ConnectorInfo['state'],
    lastSyncAt: conns[o.id]?.lastSyncAt ?? conns[o.id]?.lastSync ?? null,
    coveragePct: conns[o.id]?.coveragePct,
    coverageLabel: conns[o.id]?.coverageLabel,
  }))
}

function mapCategory(code: string): keyof CategorySplit {
  if (code.startsWith('C')) return 'content'
  if (code.startsWith('T')) return 'technical'
  if (code.startsWith('S')) return 'schema'
  if (code.startsWith('L')) return 'links'
  if (code.startsWith('A11')) return 'a11y'
  if (code.startsWith('SE')) return 'security'
  if (code.startsWith('P')) return 'performance'
  if (code.startsWith('U')) return 'ux'
  return 'technical'
}

function severityRank(s: IssueRow['severity']) {
  return s === 'critical' ? 4 : s === 'high' ? 3 : s === 'medium' ? 2 : 1
}
