import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { SegmentTable } from '../_shared/SegmentTable'
import { Sparkline } from '../_shared/Sparkline'
import { RowItem } from '../_shared/RowItem'
import { DrillFooter } from '../_shared/blocks/CardBlocks'
import { EmptyState } from '../_shared/empty'
import { compactNum } from '../_shared/format'

export function LinksExternal() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const totalDr = s.external.dr80plus + s.external.dr5079 + s.external.dr2049 + s.external.dr019 || 1
  const benchDelta = s.refDomains - s.bench.refDomains
  const benchPct = s.bench.refDomains > 0 ? Math.round((s.refDomains / s.bench.refDomains) * 100) : 0

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Ref domains" value={compactNum(s.external.refDomains)}
          tone={s.external.refDomains >= s.bench.refDomains ? 'good' : 'warn'} />
        <KpiTile label="Avg DR" value={s.avgDr.toFixed(0)}
          tone={s.avgDr >= 50 ? 'good' : s.avgDr >= 20 ? 'warn' : 'bad'} />
        <KpiTile label="New (30d)" value={compactNum(s.external.gained30d)} tone={s.external.gained30d > 0 ? 'good' : 'neutral'} />
        <KpiTile label="Lost (30d)" value={compactNum(s.external.lost30d)} tone={s.external.lost30d > 0 ? 'bad' : 'good'} />
      </div>

      {/* DR distribution */}
      <Card title="Domain rating distribution">
        <HealthStrip
          total={totalDr}
          segments={[
            { label: '80+', value: s.external.dr80plus, color: '#22c55e' },
            { label: '50–79', value: s.external.dr5079, color: '#10b981' },
            { label: '20–49', value: s.external.dr2049, color: '#60a5fa' },
            { label: '0–19', value: s.external.dr019, color: '#64748b' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* TLD mix */}
      {s.external.tldMix.length > 0 && (
        <Card title="TLD mix">
          <Distribution rows={s.external.tldMix.slice(0, 6).map((t: any) => ({
            label: t.tld,
            value: t.count,
            tone: t.tld === '.edu' || t.tld === '.gov' ? 'good' : undefined,
          }))} />
        </Card>
      )}

      {/* Ref domains trend */}
      {s.hasTrend && s.refDomainsSeries.length > 1 && (
        <Card title="Ref domains trend">
          <Sparkline values={s.refDomainsSeries} tone="info" />
        </Card>
      )}

      {/* Top referring domains */}
      <Card title="Top referring domains" padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.external.topRefDomains.slice(0, 6).map((r: any) => (
            <RowItem
              key={r.domain}
              title={r.domain}
              badge={<span className={`text-[10px] font-mono ${r.dr >= 50 ? 'text-[#22c55e]' : r.dr >= 20 ? 'text-[#60a5fa]' : 'text-[#64748b]'}`}>DR {r.dr}</span>}
            />
          ))}
        </div>
      </Card>

      {/* Recently lost */}
      {s.hasTrend && s.external.recentlyLost.length > 0 && (
        <Card title="Recently lost" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.external.recentlyLost.slice(0, 4).map((l: any) => (
              <RowItem
                key={l.domain}
                title={l.domain}
                meta={l.targetUrl}
                badge={<span className="text-[10px] text-[#666]">{l.relTime}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* By target page */}
      {s.external.byPage.length > 0 && (
        <Card title="By target page">
          <SegmentTable
            headers={['Page', 'Refdoms', 'New', 'Lost']}
            rows={s.external.byPage.map((p: any) => ({
              id: p.url, label: p.title || p.url,
              values: [p.refDomains, p.gained30d, p.lost30d],
            }))}
            onRowClick={(row) => {
              const p = s.external.byPage.find((x: any) => x.url === row.id)
              if (p) drill.toPage(p)
            }}
          />
        </Card>
      )}

      {/* Benchmark */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#666]">vs competitor avg</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-white">{compactNum(s.refDomains)}</span>
              <span className="text-[11px] text-[#666]">/ {compactNum(s.bench.refDomains)}</span>
            </div>
          </div>
          <div className={`text-[11px] font-mono px-2 py-1 rounded ${benchPct >= 100 ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
            {benchPct}%
          </div>
        </div>
      </Card>

      {/* Drill chips */}
      <DrillFooter chips={[
        { label: 'New', count: s.external.gained30d },
        { label: 'Lost', count: s.external.lost30d },
        { label: 'Toxic', count: s.toxicCount },
      ]} />
    </div>
  )
}
