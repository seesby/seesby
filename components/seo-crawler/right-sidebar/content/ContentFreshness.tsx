import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { SegmentTable } from '../_shared/SegmentTable'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/empty'
import { safePct } from '../_shared/format'

export function ContentFreshness() {
  const { pages } = useSeoCrawler() as any
  const s = useContentInsights()
  const hasTrend = useHasTrend()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const html = pages?.filter((p: any) => p.isHtmlPage !== false) ?? []
  const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

  // ── Date visibility ──
  const dateVisibleOnPage = html.filter((p: any) => p.updatedDateVisible).length
  const dateInSchema = html.filter((p: any) => p.schemaTypes?.length > 0).length
  const dateVisiblePct = safePct(dateVisibleOnPage, s.total)
  const dateSchemaPct = safePct(dateInSchema, s.total)

  const freshnessPct = safePct(s.freshness.live + s.freshness.recent, s.total)
  const stalePct = safePct(s.freshness.stale, s.total)

  // ── Freshness by page type ──
  const freshnessByType = useMemo(() => {
    const typeMap: Record<string, { fresh: number; stale: number; total: number }> = {}
    html.forEach((p: any) => {
      const type = p.category || 'other'
      if (!typeMap[type]) typeMap[type] = { fresh: 0, stale: 0, total: 0 }
      typeMap[type].total++
      if (num(p.freshnessDays) < 90) typeMap[type].fresh++
      else if (num(p.freshnessDays) >= 180) typeMap[type].stale++
    })
    return Object.entries(typeMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6)
      .map(([type, v]) => ({
        id: type,
        label: type,
        values: [
          `${v.total}`,
          `${safePct(v.fresh, v.total)}%`,
          `${safePct(v.stale, v.total)}%`,
        ],
      }))
  }, [html])

  // ── Update cadence by cluster ──
  const cadenceByCluster = useMemo(() => {
    const clusterMap: Record<string, { days: number[]; fresh: number; stale: number }> = {}
    html.forEach((p: any) => {
      const cluster = p.topicCluster
      if (!cluster) return
      if (!clusterMap[cluster]) clusterMap[cluster] = { days: [], fresh: 0, stale: 0 }
      const d = num(p.freshnessDays || 0)
      clusterMap[cluster].days.push(d)
      if (d < 90) clusterMap[cluster].fresh++
      else if (d >= 180) clusterMap[cluster].stale++
    })
    return Object.entries(clusterMap)
      .map(([label, v]) => ({
        id: label,
        label,
        values: [
          `${Math.round(v.days.reduce((a, b) => a + b, 0) / v.days.length)}d`,
          `${v.days.length}`,
          `${v.stale} stale`,
        ],
      }))
      .sort((a, b) => {
        const avgA = parseInt(a.values[0])
        const avgB = parseInt(b.values[0])
        return avgB - avgA
      })
      .slice(0, 8)
  }, [html])

  // ── Evergreen drifts: top ranking pages that are stale ──
  const evergreenDrifts = useMemo(() => [...html]
    .filter((p: any) => {
      const rank = num(p.gscAvgPos || 99)
      const days = num(p.freshnessDays || 0)
      return rank <= 10 && days >= 90
    })
    .sort((a: any, b: any) => num(a.gscAvgPos || 99) - num(b.gscAvgPos || 99))
    .slice(0, 8), [html])

  // ── Content decay (only with trend) ──
  const decaying = useMemo(() => {
    if (!hasTrend) return []
    return html
      .filter((p: any) => p.contentDecay)
      .sort((a: any, b: any) => num(b.contentDecayVelocity || 0) - num(a.contentDecayVelocity || 0))
      .slice(0, 8)
  }, [html, hasTrend])

  // ── Pages never updated ──
  const neverUpdated = useMemo(() => html.filter((p: any) =>
    !p.updatedDateVisible && num(p.freshnessDays) > 180
  ).length, [html])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Recency HealthStrip */}
      <Card title="Updated recency">
        <HealthStrip
          total={s.total}
          segments={[
            { label: '<7d', value: s.freshness.live, color: '#22c55e' },
            { label: '<30d', value: s.freshness.recent, color: '#10b981' },
            { label: '<90d', value: s.freshness.fresh, color: '#f59e0b' },
            { label: '<180d', value: s.freshness.ok, color: '#f97316' },
            { label: '>180d', value: s.freshness.stale, color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <KpiTile label="Fresh" value={`${freshnessPct}%`} tone={freshnessPct >= 70 ? 'good' : 'warn'} sub={`${s.freshness.live + s.freshness.recent} pages`} />
          <KpiTile label="Stale" value={`${stalePct}%`} tone={s.freshness.stale > 0 ? 'bad' : 'good'} sub={`${s.freshness.stale} pages`} />
          <KpiTile label="Never updated" value={String(neverUpdated)} tone={neverUpdated > 0 ? 'warn' : 'good'} sub={`${safePct(neverUpdated, s.total)}`} />
        </div>
      </Card>

      {/* Date signals */}
      <Card title="Date signals">
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="On page" value={`${dateVisiblePct}%`} tone={dateVisiblePct >= 80 ? 'good' : dateVisiblePct >= 50 ? 'warn' : 'bad'} sub={`${dateVisibleOnPage} pages`} />
          <KpiTile label="In schema" value={`${dateSchemaPct}%`} tone={dateSchemaPct >= 80 ? 'good' : dateSchemaPct >= 50 ? 'warn' : 'bad'} sub={`${dateInSchema} pages`} />
        </div>
      </Card>

      {/* Freshness by page type — always show */}
      <Card title="Freshness by type">
        {freshnessByType.length > 0 ? (
          <SegmentTable
            headers={['Type', 'Count', 'Fresh %', 'Stale %']}
            rows={freshnessByType}
          />
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]] py-2">No page type data available</div>
        )}
      </Card>

      {/* Update cadence by cluster — always show */}
      <Card title="Update cadence by cluster">
        {cadenceByCluster.length > 0 ? (
          <SegmentTable
            headers={['Cluster', 'Avg age', 'Count', 'Stale']}
            rows={cadenceByCluster}
          />
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]] py-2">No cluster data available</div>
        )}
      </Card>

      {/* Evergreen drifts — always show */}
      <Card title={`Evergreen drifts ${evergreenDrifts.length}`} padded={false}>
        <div className="px-2 pt-2 pb-1 text-[10px] text-[var(--brand-text-faint)]]">
          Top-ranking pages that need freshening
        </div>
        {evergreenDrifts.length > 0 ? (
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {evergreenDrifts.map((p: any, i: number) => (
              <RowItem
                key={i}
                title={(p.title || p.url || '').slice(0, 50)}
                meta={`rank ${num(p.gscAvgPos || '?')} · ${num(p.freshnessDays || 0)}d old`}
                badge={<span className="text-[10px] font-mono text-[#ef4444]">{num(p.freshnessDays)}d</span>}
                onClick={() => drill.toPage(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]] px-2 py-2 border-t border-[var(--brand-surface-3)]]">No stale top-ranking pages</div>
        )}
      </Card>

      {/* Content decay (trend only) */}
      {hasTrend && (
        <Card title={`Content decay ${decaying.length}`} padded={false}>
          <div className="px-2 pt-2 pb-1 text-[10px] text-[var(--brand-text-faint)]]">
            Pages losing traffic over time
          </div>
          {decaying.length > 0 ? (
            <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
              {decaying.map((p: any, i: number) => (
                <RowItem
                  key={i}
                  title={(p.title || p.url || '').slice(0, 50)}
                  meta={`-${Math.abs(num(p.contentDecayVelocity || 0))}% · ${num(p.gscClicks || 0)} clicks`}
                  badge={<span className="text-[10px] font-mono text-[#ef4444]">down</span>}
                  onClick={() => drill.toPage(p)}
                />
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]] px-2 py-2 border-t border-[var(--brand-surface-3)]]">No decaying pages detected</div>
          )}
        </Card>
      )}
    </div>
  )
}
