import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { ProgressRing } from '../_shared/ProgressRing'
import { Sparkline } from '../_shared/Sparkline'
import { DeltaChip } from '../_shared/DeltaChip'
import { RowItem } from '../_shared/RowItem'
import { DrillFooter } from '../_shared/blocks/CardBlocks'
import { EmptyState } from '../_shared/empty'
import { compactNum } from '../_shared/format'

export function LinksOverview() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const scoreGrade = s.score >= 80 ? 'A' : s.score >= 65 ? 'B' : s.score >= 50 ? 'C' : s.score >= 30 ? 'D' : 'F'
  const refDomainsDelta = s.hasTrend && s.refDomainsPrev > 0 ? s.refDomains - s.refDomainsPrev : undefined
  const backlinksDelta = s.hasTrend && s.totalBacklinksPrev > 0 ? s.totalBacklinks - s.totalBacklinksPrev : undefined
  const drDelta = s.hasTrend && s.avgDrPrev > 0 ? s.avgDr - s.avgDrPrev : undefined

  const totalSafe = s.dofollow + s.nofollow + s.ugc + s.sponsored || 1
  const cleanCount = s.toxicBands.low
  const suspiciousCount = s.toxicBands.medium + s.toxicBands.high
  const toxicCount = s.toxicCount

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Authority score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white">{s.score}</span>
              <span className="text-sm font-medium text-[#666]">{scoreGrade}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {typeof refDomainsDelta === 'number' && <DeltaChip value={refDomainsDelta} />}
              {s.hasTrend && s.scoreSeries.length > 1 && (
                <Sparkline values={s.scoreSeries} width={80} height={20} />
              )}
            </div>
            <div className="mt-1.5 text-[10px] text-[#666]">Internal health + backlink quality + toxic risk</div>
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Ref domains" value={compactNum(s.refDomains)}
          delta={typeof refDomainsDelta === 'number' ? `${refDomainsDelta > 0 ? '+' : ''}${compactNum(refDomainsDelta)}` : undefined}
          deltaTone={typeof refDomainsDelta === 'number' ? (refDomainsDelta > 0 ? 'up' : refDomainsDelta < 0 ? 'down' : 'flat') : 'flat'} />
        <KpiTile label="Backlinks" value={compactNum(s.totalBacklinks)}
          delta={typeof backlinksDelta === 'number' ? `${backlinksDelta > 0 ? '+' : ''}${compactNum(backlinksDelta)}` : undefined}
          deltaTone={typeof backlinksDelta === 'number' ? (backlinksDelta > 0 ? 'up' : backlinksDelta < 0 ? 'down' : 'flat') : 'flat'} />
        <KpiTile label="Avg DR" value={s.avgDr.toFixed(0)} tone={s.avgDr >= 50 ? 'good' : s.avgDr >= 20 ? 'warn' : 'bad'}
          delta={typeof drDelta === 'number' ? `${drDelta > 0 ? '+' : ''}${drDelta.toFixed(1)}` : undefined}
          deltaTone={typeof drDelta === 'number' ? (drDelta > 0 ? 'up' : drDelta < 0 ? 'down' : 'flat') : 'flat'} />
        <KpiTile label="Orphans" value={String(s.internal.orphans)} tone={s.internal.orphans === 0 ? 'good' : 'bad'}
          sub={`${s.internal.broken} broken`} />
      </div>

      {/* Score breakdown */}
      <Card title="Score breakdown">
        <div className="flex flex-col gap-2">
          {[
            { label: 'Internal health', value: s.internalHealth, weight: '35%', color: '#22c55e' },
            { label: 'External quality', value: s.externalHealth, weight: '45%', color: '#60a5fa' },
            { label: 'Toxic safety', value: s.toxicHealth, weight: '20%', color: '#a78bfa' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-[100px] text-[10px] text-[#bbb] truncate">{item.label}</span>
              <div className="flex-1 h-1.5 bg-[#141414] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
              </div>
              <span className="text-[10px] font-mono text-[#888] w-8 text-right">{item.value}</span>
              <span className="text-[9px] text-[#555] w-6 text-right">{item.weight}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Link attributes strip */}
      <Card title="Link attributes">
        <HealthStrip
          total={totalSafe}
          segments={[
            { label: 'Dofollow', value: s.dofollow, color: '#22c55e' },
            { label: 'Nofollow', value: s.nofollow, color: '#60a5fa' },
            { label: 'UGC', value: s.ugc, color: '#a78bfa' },
            { label: 'Sponsored', value: s.sponsored, color: '#f59e0b' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Link risk strip */}
      {toxicCount > 0 && (
        <Card title="Link risk">
          <HealthStrip
            total={s.total}
            segments={[
              { label: 'Clean', value: cleanCount, color: '#22c55e' },
              { label: 'Suspicious', value: suspiciousCount, color: '#f59e0b' },
              { label: 'Toxic', value: toxicCount, color: '#ef4444' },
            ].filter(seg => seg.value > 0)}
          />
        </Card>
      )}

      {/* Top linked pages */}
      {s.topLinked.length > 0 && (
        <Card title="Top linked pages" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.topLinked.slice(0, 5).map((p: any) => (
              <RowItem
                key={p.url}
                title={p.title || p.url}
                meta={p.url}
                badge={<span className="text-[10px] font-mono text-[#60a5fa]">{compactNum(Number(p.refDomains) || 0)}</span>}
                onClick={() => drill.toPage(p)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Trend sparkline */}
      {s.hasTrend && s.refDomainsSeries.length > 1 && (
        <Card title="Ref domains trend">
          <Sparkline values={s.refDomainsSeries} tone="info" />
        </Card>
      )}

      {/* Drill chips */}
      <DrillFooter chips={[
        { label: 'Internal', count: s.internal.total },
        { label: 'External', count: s.external.refDomains },
        { label: 'Anchors', count: s.uniqueAnchors },
        { label: 'Toxic', count: s.toxicCount },
      ]} />
    </div>
  )
}
