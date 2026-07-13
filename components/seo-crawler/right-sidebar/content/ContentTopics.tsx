import React from 'react'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/empty'
import { compactNum, safePct } from '../_shared/format'

export function ContentTopics() {
  const s = useContentInsights()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const intentDistribution = [
    ...s.intentMix.map((r: any) => ({
      label: r.intent,
      value: r.count,
      tone: r.intent === 'informational' || r.intent === 'transactional' ? 'good' as const : 'warn' as const,
    })),
    { label: 'unclassified', value: s.total - s.intentMix.reduce((a: number, r: any) => a + r.count, 0), tone: 'warn' as const },
  ].filter(r => r.value > 0).slice(0, 5)

  const entityCoveragePct = safePct(s.entityCoverage.withEntity, s.total)
  const topClusters = s.clusters.slice(0, 10)

  const uncoveredQueries = s.orphanTopics.filter((p: any) =>
    Number(p.gscClicks || 0) > 100
  ).length

  const hubPct = safePct(s.hubs, s.clusters.length)
  const weakHubPct = s.hubs > 0 ? safePct(s.weakHubs, s.hubs) : 0

  const strongClusters = s.clusters.filter((c: any) => c.pages >= 3 && c.avgScore >= 65).length
  const growingClusters = s.clusters.filter((c: any) => c.pages >= 3 && c.avgScore < 65).length
  const smallClusters = s.clusters.filter((c: any) => c.pages < 3).length

  const pagesInClusters = s.clusters.reduce((a: number, c: any) => a + c.pages, 0)
  const clusterCoveragePct = safePct(pagesInClusters, s.total)
  const avgPagesPerCluster = s.clusters.length > 0 ? Math.round(pagesInClusters / s.clusters.length) : 0
  const avgClusterScore = s.clusters.length > 0 ? Math.round(s.clusters.reduce((a: number, c: any) => a + c.avgScore, 0) / s.clusters.length) : 0

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Cluster health */}
      <Card title="Cluster health">
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Clusters" value={String(s.clusters.length)} sub={`${clusterCoveragePct} coverage`} />
          <KpiTile label="Avg size" value={`${avgPagesPerCluster}`} sub="pages per cluster" />
          <KpiTile label="Hubs 3+" value={String(s.hubs)} tone={s.hubs > 0 ? 'good' : 'warn'} sub={`${hubPct}`} />
          <KpiTile label="Weak" value={String(s.weakHubs)} tone={s.weakHubs > 0 ? 'warn' : 'good'} sub={`${weakHubPct}`} />
        </div>
      </Card>

      {/* Top clusters — always show */}
      <Card title={`Top clusters ${s.clusters.length}`} padded={false}>
        <div className="px-2 pt-2 pb-1 text-[10px] text-[#666]">
          Topic groups by page count
        </div>
        {topClusters.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {topClusters.map((c: any) => (
              <RowItem
                key={c.id}
                title={c.label}
                meta={`${c.pages} pages · avg score ${c.avgScore}`}
                badge={<span className={`text-[10px] font-mono ${c.avgScore < 50 ? 'text-[#ef4444]' : c.avgScore < 65 ? 'text-[#f59e0b]' : 'text-[#22c55e]'}`}>Q{c.avgScore}</span>}
                onClick={() => drill.toCategory('content', c.label)}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#555] px-2 py-2 border-t border-[#1f1f1f]">No clusters detected</div>
        )}
      </Card>

      {/* Intent mix — always show */}
      <Card title="Intent mix">
        {intentDistribution.length > 0 ? (
          <>
            <HealthStrip
              total={s.total}
              segments={intentDistribution.map(r => ({
                label: r.label,
                value: r.value,
                color: r.label === 'informational' ? '#22c55e' : r.label === 'transactional' ? '#3b82f6' : r.label === 'commercial' ? '#f59e0b' : '#666',
              }))}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {intentDistribution.map(r => (
                <KpiTile key={r.label} label={r.label} value={String(r.value)} sub={`${safePct(r.value, s.total)}%`} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-[11px] text-[#555] py-2">No intent data available</div>
        )}
      </Card>

      {/* Entity coverage — always show */}
      <Card title="Entity coverage">
        <Distribution rows={[
          { label: 'Has entity', value: s.entityCoverage.withEntity, tone: 'good' as const },
          { label: 'Has related', value: s.entityCoverage.withRelated, tone: 'good' as const },
          { label: 'Missing', value: s.entityCoverage.missing, tone: 'warn' as const },
        ].filter(r => r.value > 0)} />
      </Card>

      {/* Orphan topics — always show */}
      <Card title={`Unclustered topics ${s.orphanTopics.length}`} padded={false}>
        <div className="px-2 pt-2 pb-1 text-[10px] text-[#666]">
          Pages with traffic but no topic cluster
        </div>
        {s.orphanTopics.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.orphanTopics.slice(0, 8).map((p: any) => (
              <RowItem
                key={p.url}
                title={(p.title || p.url || '').slice(0, 50)}
                meta={`${compactNum(p.gscClicks)} clicks · ${compactNum(p.keywords?.length || 0)} keywords`}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">?</span>}
                onClick={() => drill.toPage(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#555] px-2 py-2 border-t border-[#1f1f1f]">All pages are in clusters</div>
        )}
      </Card>
    </div>
  )
}
