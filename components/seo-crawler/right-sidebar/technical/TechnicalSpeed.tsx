import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { TopList } from '../_shared/lists'
import { BenchmarkBar } from '../_shared/BenchmarkBar'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Sparkline } from '../_shared/Sparkline'
import { EmptyState } from '../_shared/empty'
import { fmtMs, fmtPct, fmtNum } from '../_shared/format'
import { TECH } from '../_shared/constants'

export function TechnicalSpeed() {
  const { pages = [] } = useSeoCrawler() as any
  const s = useTechnicalInsights()
  const hasTrend = useHasTrend()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worstLcp = useMemo(() =>
    [...pages].filter((p: any) => p.lcp).sort((a: any, b: any) => Number(b.lcp) - Number(a.lcp)).slice(0, 5),
  [pages])

  const worstCls = useMemo(() =>
    [...pages].filter((p: any) => p.cls != null).sort((a: any, b: any) => Number(b.cls) - Number(a.cls)).slice(0, 5),
  [pages])

  const cwvTotal = s.cwv.lcpGood + s.cwv.lcpWarn + s.cwv.lcpBad || 1

  const renderTotal = s.render.static + s.render.ssr + s.render.csr + s.render.hybrid || 1

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card title="CWV pass mix">
        <HealthStrip
          total={cwvTotal}
          segments={[
            { label: 'Good', value: s.cwv.lcpGood, color: '#22c55e' },
            { label: 'Warn', value: s.cwv.lcpWarn, color: '#f59e0b' },
            { label: 'Poor', value: s.cwv.lcpBad, color: '#ef4444' },
          ]}
        />
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="LCP p75" value={fmtMs(s.cwvAvg.lcp)} tone={s.cwvAvg.lcp <= TECH.cwv.lcpGood ? 'good' : s.cwvAvg.lcp <= TECH.cwv.lcpWarn ? 'warn' : 'bad'} />
        <KpiTile label="CLS p75" value={Number(s.cwvAvg.cls).toFixed(3)} tone={s.cwvAvg.cls <= TECH.cwv.clsGood ? 'good' : 'bad'} />
        <KpiTile label="INP p75" value={fmtMs(s.cwvAvg.inp)} tone={s.cwvAvg.inp <= TECH.cwv.inpGood ? 'good' : 'bad'} />
      </div>

      <Card title="Render type">
        <HealthStrip
          total={renderTotal}
          segments={[
            { label: 'Static', value: s.render.static, color: '#22c55e' },
            { label: 'SSR', value: s.render.ssr, color: '#3b82f6' },
            { label: 'CSR', value: s.render.csr, color: '#f59e0b' },
            { label: 'Hybrid', value: s.render.hybrid, color: '#a78bfa' },
          ]}
        />
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Blocking CSS" value={fmtNum(s.blocking.blockingCss)} tone={s.blocking.blockingCss > TECH.blocking.cssWarn ? 'warn' : 'good'} />
        <KpiTile label="Blocking JS" value={fmtNum(s.blocking.blockingJs)} tone={s.blocking.blockingJs > TECH.blocking.jsWarn ? 'warn' : 'good'} />
      </div>

      <Card title="DOM size">
        <Distribution rows={[
          { label: 'Big DOM (>1.5k)', value: s.blocking.bigDom, tone: 'warn' },
          { label: 'Huge DOM (>3k)', value: s.blocking.hugeDom, tone: 'bad' },
          { label: 'Many 3rd party (>10)', value: s.blocking.manyThirdParty, tone: 'warn' },
        ]} />
      </Card>

      {hasTrend && s.history.scoreSeries.length > 1 ? (
        <Card title="Score trend">
          <Sparkline values={s.history.scoreSeries} tone="info" width={200} />
        </Card>
      ) : null}

      <Card title="Worst LCP">
        <TopList items={worstLcp.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: fmtMs(Number(p.lcp)), onClick: () => drill.toPage(p),
        }))} />
      </Card>

      <Card title="Worst CLS">
        <TopList items={worstCls.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: Number(p.cls).toFixed(3), onClick: () => drill.toPage(p),
        }))} />
      </Card>

      <Card title="LCP vs CrUX p75">
        <BenchmarkBar site={s.cwvAvg.lcp} benchmark={s.bench.lcpP75} unit="ms" higherIsBetter={false} />
      </Card>

      {hasTrend && s.tech.cwvPassPrev !== undefined && !Number.isNaN(s.tech.cwvPassPrev) ? (
        <Card title="vs last crawl">
          <ComparisonRow
            label="CWV pass"
            a={{ v: s.tech.cwvPass, tag: 'now' }}
            b={{ v: s.tech.cwvPassPrev, tag: 'prev' }}
            format={(v: number) => fmtPct(v)}
          />
        </Card>
      ) : null}
    </div>
  )
}
