import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { DeltaChip } from '../_shared/DeltaChip'
import { ProgressRing } from '../_shared/ProgressRing'
import { Sparkline } from '../_shared/Sparkline'
import { RowItem } from '../_shared/RowItem'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { Trendable } from '../_shared/blocks/Trendable'
import { EmptyState } from '../_shared/empty'
import { fmtCurrency, fmtPct } from '../_shared/format'

export function PaidQuality() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  const qsSegments = Object.entries(s.qsDist)
    .map(([k, v]) => ({
      label: k,
      value: v as number,
      color: Number(k) >= 8 ? '#22c55e' : Number(k) >= 6 ? '#3b82f6' : Number(k) >= 5 ? '#f59e0b' : '#ef4444',
    }))
    .filter(seg => seg.value > 0)

  const qsDelta = s.hasPrior && s.avgQsPrev > 0 ? s.avgQs - s.avgQsPrev : undefined

  // Worst campaigns by wasted spend (proxy for low QS impact)
  const worstCampaigns = s.wasted.slice(0, 5)

  // Best campaigns (highest ROAS, excluding wasted)
  const bestCampaigns = [...paidCampaigns]
    .filter((c: any) => !s.wasted.find((w: any) => w.id === (c.id || c.name)))
    .sort((a: any, b: any) => Number(b.roas || 0) - Number(a.roas || 0))
    .slice(0, 5)
    .map((c: any) => ({
      id: c.id || c.name,
      name: c.name || c.campaignName || 'Campaign',
      roas: Number(c.roas || 0),
      qs: Number(c.qsAvg || 0),
    }))

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* QS score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Avg Quality Score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white">{s.avgQs > 0 ? s.avgQs.toFixed(1) : '—'}</span>
              <span className="text-sm font-medium text-[#666]">/10</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {s.hasPrior && typeof qsDelta === 'number' && <DeltaChip value={qsDelta} />}
              <Trendable hasPrior={s.hasPrior}>
                {s.qsSeries.length > 1 && (
                  <Sparkline values={s.qsSeries} width={80} height={20} />
                )}
              </Trendable>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <div>
                <span className="text-[10px] text-[#666]">Below 5 </span>
                <span className="text-sm font-bold text-[#ef4444]">{s.below5}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#666]">Above 8 </span>
                <span className="text-sm font-bold text-[#22c55e]">{s.above8}</span>
              </div>
            </div>
            <ProgressRing value={Math.round(s.avgQs * 10)} size={64} />
          </div>
        </div>
      </Card>

      {/* Component KPIs */}
      <Card title="QS components">
        <div className="grid grid-cols-3 gap-2">
          <KpiTile label="CTR" value={`${(s.clicks / Math.max(1, s.impressions) * 100).toFixed(1)}%`} />
          <KpiTile label="Conv. rate" value={s.clicks > 0 ? `${(s.conv30d / Math.max(1, s.clicks) * 100).toFixed(1)}%` : '—'} />
          <KpiTile label="LP health" value={s.lps.total > 0 ? `${Math.round((s.lps.healthy / s.lps.total) * 100)}%` : '—'} />
        </div>
      </Card>

      {/* QS distribution */}
      {qsSegments.length > 0 && (
        <Card title="QS distribution">
          <HealthStrip
            total={paidCampaigns.length}
            segments={qsSegments}
          />
        </Card>
      )}

      {/* Best campaigns */}
      {bestCampaigns.length > 0 && (
        <Card title="Top campaigns" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {bestCampaigns.map((c) => (
              <RowItem
                key={c.id}
                title={c.name}
                meta={c.qs > 0 ? `QS ${c.qs}` : undefined}
                badge={<span className="text-[10px] font-mono text-[#22c55e]">{c.roas.toFixed(1)}x</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Worst campaigns */}
      {worstCampaigns.length > 0 && (
        <Card title="Worst campaigns" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {worstCampaigns.map((w) => (
              <RowItem
                key={w.id}
                title={w.name}
                meta={w.reason}
                badge={<span className="text-[10px] font-mono text-[#ef4444]">{fmtCurrency(w.wastedAmount)}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* QS trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="QS trend">
          <Sparkline values={s.qsSeries} tone="info" />
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
