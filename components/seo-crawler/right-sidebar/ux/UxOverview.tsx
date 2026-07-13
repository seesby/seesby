import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { TopList } from '../_shared/lists'
import { EmptyState } from '../_shared/empty'
import { Trendable, SingleCrawlNotice, DeltaChip, ComparisonRow } from '../_shared'
import { RsSparkline } from '../parts/RsSparkline'
import { compactNum, fmtPct } from '../_shared/format'

export function UxOverview() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const scoreGrade = s.score >= 90 ? 'A' : s.score >= 75 ? 'B' : s.score >= 60 ? 'C' : s.score >= 40 ? 'D' : 'F'
  const scoreHistory = s.scoreHistory
  const scoreDelta = scoreHistory.length >= 2 ? s.score - scoreHistory[scoreHistory.length - 2] : null

  // Top converting pages
  const topConverting = [...(pages || [])]
    .filter((p: any) => {
      const ux = p.ux || {}
      return Number(ux.formCompletes) > 0 || Number(ux.ctaClicks) > 0 || Number(p.addToCart) > 0
    })
    .sort((a: any, b: any) => {
      const aEvents = Number(a.ux?.formCompletes || 0) + Number(a.ux?.ctaClicks || 0)
      const bEvents = Number(b.ux?.formCompletes || 0) + Number(b.ux?.ctaClicks || 0)
      return bEvents - aEvents
    })
    .slice(0, 5)

  // Event distribution
  const eventRows = [
    { label: 'Form submit', value: s.events.form, tone: 'good' as const },
    { label: 'Add to cart', value: s.events.atc, tone: 'good' as const },
    { label: 'Checkout', value: s.events.checkout, tone: 'good' as const },
    { label: 'Signup', value: s.events.signup, tone: 'good' as const },
  ]

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">UX score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white">{s.score}</span>
              <span className="text-sm font-medium text-[#666]">{scoreGrade}</span>
              {s.hasTrend && scoreDelta !== null && <DeltaChip value={scoreDelta} />}
            </div>
            {s.hasTrend && scoreHistory.length > 1 && (
              <div className="mt-1.5 w-24"><RsSparkline values={scoreHistory} stroke="#f43f5e" fill="rgba(244,63,94,0.12)" /></div>
            )}
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      {/* Key KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Conv. rate"
          value={fmtPct(s.cvr * 100)}
          tone={s.cvr >= 0.03 ? 'good' : s.cvr >= 0.015 ? 'warn' : 'bad'}
          sub={`${compactNum(s.convertingPages)} pages`}
        />
        <KpiTile
          label="Bounce"
          value={fmtPct(s.bounceRate * 100)}
          tone={s.bounceRate <= 0.4 ? 'good' : s.bounceRate <= 0.6 ? 'warn' : 'bad'}
        />
        <KpiTile
          label="Engagement"
          value={fmtPct(s.engagementRate * 100)}
          tone={s.engagementRate >= 0.6 ? 'good' : 'warn'}
        />
        <KpiTile
          label="Avg session"
          value={`${Math.round(s.avgSessionSec)}s`}
          tone={s.avgSessionSec >= 120 ? 'good' : 'warn'}
        />
      </div>

      {/* Page quality strip */}
      <Card title="Page quality">
        <HealthStrip
          total={s.total}
          segments={[
            { label: 'Low friction', value: s.frictionBands.low, color: '#22c55e' },
            { label: 'Medium', value: s.frictionBands.medium, color: '#f59e0b' },
            { label: 'High friction', value: s.frictionBands.high, color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Conversion events */}
      <Card title="Conversion events">
        <Distribution rows={eventRows} />
      </Card>

      {/* Top converting pages */}
      <Card title="Top converting">
        {topConverting.length > 0 ? (
          <TopList items={topConverting.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: `${Number(p.ux?.formCompletes || 0) + Number(p.ux?.ctaClicks || 0)} events`,
            onClick: () => drill.toPage(p),
          }))} max={5} />
        ) : (
          <div className="text-[11px] text-[#666]">No conversion events recorded yet.</div>
        )}
      </Card>

      {/* Trend comparison */}
      <Trendable hasPrior={s.hasTrend}>
        <Card title="vs last crawl">
          <ComparisonRow label="UX score" a={{ v: s.score, tag: 'now' }} b={{ v: Number.isNaN(s.prevScore) ? 0 : s.prevScore, tag: 'prev' }} />
          <ComparisonRow label="Conv. rate" a={{ v: Math.round(s.cvr * 100), tag: 'now' }} b={{ v: Number.isNaN(s.prevCvr) ? 0 : Math.round(s.prevCvr * 100), tag: 'prev' }} format={v => `${v}%`} />
          <ComparisonRow label="Bounce rate" a={{ v: Math.round(s.bounceRate * 100), tag: 'now' }} b={{ v: Number.isNaN(s.prevBounceRate) ? 0 : Math.round(s.prevBounceRate * 100), tag: 'prev' }} format={v => `${v}%`} />
          <ComparisonRow label="Engagement" a={{ v: Math.round(s.engagementRate * 100), tag: 'now' }} b={{ v: Number.isNaN(s.prevEngagementRate) ? 0 : Math.round(s.prevEngagementRate * 100), tag: 'prev' }} format={v => `${v}%`} />
        </Card>
      </Trendable>

      {!s.hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
