import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/empty'
import { fmtPct } from '../_shared/format'

export function PaidLandingPages() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  const lpSegments = [
    { label: 'Healthy', value: s.lps.healthy, color: '#22c55e' },
    { label: 'Slow', value: s.lps.slow, color: '#f59e0b' },
    { label: 'Broken', value: s.lps.broken, color: '#ef4444' },
  ].filter(seg => seg.value > 0)

  const lpReasons = [
    { label: 'Slow LCP', value: s.lps.reasons.lcp },
    { label: 'Bad CLS', value: s.lps.reasons.cls },
    { label: '404 / 5xx', value: s.lps.reasons.error },
    { label: 'Mobile-unfriendly', value: s.lps.reasons.mobile },
  ].filter(r => r.value > 0)

  const healthyPct = s.lps.total > 0 ? Math.round((s.lps.healthy / s.lps.total) * 100) : 0

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* LP health overview */}
      <Card>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <KpiTile
            label="Total LPs"
            value={String(s.lps.total)}
          />
          <KpiTile
            label="Healthy"
            value={`${healthyPct}%`}
            tone={healthyPct >= 80 ? 'good' : healthyPct >= 50 ? 'warn' : 'bad'}
          />
        </div>
        {lpSegments.length > 0 && (
          <HealthStrip total={s.lps.total} segments={lpSegments} />
        )}
      </Card>

      {/* Best LPs by conversion rate */}
      {s.lps.best.length > 0 && (
        <Card title="Top performers" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.lps.best.map((lp, i) => (
              <RowItem
                key={i}
                title={lp.title}
                meta={lp.url}
                badge={<span className="text-[10px] font-mono text-[#22c55e]">{fmtPct(lp.cvr * 100)}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Worst LPs by conversion rate */}
      {s.lps.worst.length > 0 && (
        <Card title="Lowest performers" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.lps.worst.map((lp, i) => (
              <RowItem
                key={i}
                title={lp.title}
                meta={lp.url}
                badge={<span className="text-[10px] font-mono text-[#ef4444]">{fmtPct(lp.cvr * 100)}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* LP issues breakdown */}
      {lpReasons.length > 0 && (
        <Card title="Issues" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {lpReasons.map((r, i) => (
              <RowItem
                key={i}
                title={r.label}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{r.value}</span>}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
