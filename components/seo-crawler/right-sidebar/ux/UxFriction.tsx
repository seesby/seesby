import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { SegmentTable } from '../_shared/SegmentTable'
import { RowItem } from '../_shared/RowItem'
import { TopList } from '../_shared/lists'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct } from '../_shared/format'

export function UxFriction() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const totalSignals = s.friction.rageClicks + s.friction.deadClicks + s.friction.errorClicks
  const signalRate = s.total > 0 ? (totalSignals / s.total).toFixed(1) : '0'

  // Worst friction pages
  const worstPages = [...(pages || [])]
    .filter((p: any) => p.frictionScore != null)
    .sort((a: any, b: any) => Number(b.frictionScore) - Number(a.frictionScore))
    .slice(0, 8)

  // Pages with multiple friction types
  const multiFriction = [...(pages || [])]
    .filter((p: any) => {
      const ux = p.ux || {}
      const types = [
        Number(ux.rageClicks) > 0,
        Number(ux.deadClicks) > 0,
        Number(ux.errorClicks) > 0,
      ].filter(Boolean).length
      return types >= 2
    })
    .slice(0, 6)

  // Signal type distribution
  const severityRows = [
    { label: 'Rage clicks', value: s.friction.rageClicks, tone: 'bad' as const },
    { label: 'Dead clicks', value: s.friction.deadClicks, tone: 'warn' as const },
    { label: 'Error clicks', value: s.friction.errorClicks, tone: 'bad' as const },
  ]

  // Pages affected by signal type
  const pagesBySignal = [
    { label: 'Rage clicks', value: s.pagesWithRage, tone: 'bad' as const },
    { label: 'Dead clicks', value: s.pagesWithDead, tone: 'warn' as const },
    { label: 'Error clicks', value: s.pagesWithErrors, tone: 'bad' as const },
    { label: 'Form drop-off', value: s.pagesWithFormIssues, tone: 'warn' as const },
  ]

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Total signals"
          value={compactNum(totalSignals)}
          tone={totalSignals > 50 ? 'bad' : totalSignals > 10 ? 'warn' : 'good'}
          sub={`${signalRate} per page`}
        />
        <KpiTile
          label="Affected pages"
          value={compactNum(s.pagesWithRage + s.pagesWithDead + s.pagesWithErrors)}
          tone={s.pagesWithRage > 0 ? 'bad' : 'good'}
        />
        <KpiTile
          label="Low scroll"
          value={compactNum(s.friction.scrollDepth)}
          tone={s.friction.scrollDepth > s.total * 0.3 ? 'warn' : 'good'}
          sub={`${s.total > 0 ? Math.round((s.friction.scrollDepth / s.total) * 100) : 0}%`}
        />
        <KpiTile
          label="Form abandon"
          value={compactNum(s.friction.formAbandon)}
          tone={s.friction.formAbandon > 20 ? 'bad' : 'warn'}
        />
      </div>

      {/* Signal type */}
      <Card title="Signal type">
        <Distribution rows={severityRows} />
      </Card>

      {/* Pages by signal type */}
      <Card title="Pages by signal">
        <HealthStrip
          total={s.total}
          segments={pagesBySignal.map(r => ({
            label: r.label,
            value: r.value,
            color: r.tone === 'bad' ? '#ef4444' : '#f59e0b',
          }))}
        />
      </Card>

      {/* Scroll depth distribution */}
      <Card title="Scroll depth">
        <HealthStrip
          total={s.total}
          segments={[
            { label: 'Deep 75%+', value: s.scrollDist.deep, color: '#22c55e' },
            { label: 'Medium 40-75%', value: s.scrollDist.medium, color: '#f59e0b' },
            { label: 'Shallow <40%', value: s.scrollDist.shallow, color: '#ef4444' },
            { label: 'None', value: s.scrollDist.none, color: '#64748b' },
          ].filter(seg => seg.value > 0)}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <KpiTile label="Avg scroll" value={`${Math.round(s.avgScrollDepth)}%`} tone={s.avgScrollDepth >= 60 ? 'good' : 'warn'} />
          <KpiTile label="Shallow" value={compactNum(s.scrollDist.shallow + s.scrollDist.none)} tone={s.scrollDist.shallow + s.scrollDist.none > s.total * 0.3 ? 'bad' : 'good'} sub={`${s.total > 0 ? Math.round(((s.scrollDist.shallow + s.scrollDist.none) / s.total) * 100) : 0}%`} />
        </div>
      </Card>

      {/* Friction by template */}
      <Card title="By template">
        {s.frictionByTemplate.length > 0 ? (
          <SegmentTable
            headers={['Template', 'Pages', 'Friction', 'CVR', 'Bounce']}
            rows={s.frictionByTemplate.map((t: any) => ({
              id: t.id, label: t.label,
              values: [t.pages, t.avgFriction, fmtPct(t.cvr * 100), fmtPct(t.avgBounce * 100)],
            }))}
          />
        ) : (
          <div className="text-[11px] text-[#666]">No template data available.</div>
        )}
      </Card>

      {/* Form friction details */}
      <Card title="Form friction">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <KpiTile
            label="Field abandon"
            value={compactNum(s.forms.fieldAbandon)}
            tone={s.forms.fieldAbandon > 50 ? 'bad' : 'warn'}
          />
          <KpiTile
            label="Errors"
            value={compactNum(s.forms.totalErrors)}
            tone={s.forms.totalErrors > 20 ? 'bad' : 'good'}
          />
        </div>
        {s.forms.worstFields.length > 0 ? (
          <>
            <div className="text-[10px] uppercase tracking-wide text-[#666] mb-1">Worst fields</div>
            <TopList items={s.forms.worstFields.map((f: any) => ({
              id: f.id,
              primary: f.label,
              secondary: f.formName,
              tail: f.errorRate > 0 ? `${fmtPct(f.errorRate * 100)} err` : `${fmtPct(f.abandonRate * 100)} abandon`,
            }))} max={5} />
          </>
        ) : (
          <div className="text-[11px] text-[#666]">No form field data available.</div>
        )}
      </Card>

      {/* Multi-friction pages */}
      <Card title={`Multiple signals ${multiFriction.length}`}>
        {multiFriction.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {multiFriction.map((p: any, i: number) => {
              const ux = p.ux || {}
              const signals = [
                Number(ux.rageClicks) > 0 && 'rage',
                Number(ux.deadClicks) > 0 && 'dead',
                Number(ux.errorClicks) > 0 && 'error',
              ].filter(Boolean).join(', ')
              return (
                <RowItem
                  key={i}
                  title={(p.title || p.url || '').slice(0, 50)}
                  meta={signals}
                  badge={<span className="text-[10px] font-mono text-[#ef4444]">{Number(p.frictionScore).toFixed(0)}</span>}
                  onClick={() => drill.toPage(p)}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[#666]">No pages with multiple friction types.</div>
        )}
      </Card>

      {/* Worst pages */}
      <Card title="Worst pages">
        {worstPages.length > 0 ? (
          <TopList items={worstPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: Number(p.frictionScore).toFixed(0),
            onClick: () => drill.toPage(p),
          }))} max={8} />
        ) : (
          <div className="text-[11px] text-[#666]">No friction data available.</div>
        )}
      </Card>
    </div>
  )
}
