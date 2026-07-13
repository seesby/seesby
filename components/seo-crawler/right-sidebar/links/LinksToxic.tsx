import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { SegmentTable } from '../_shared/SegmentTable'
import { RowItem } from '../_shared/RowItem'
import { DrillFooter } from '../_shared/blocks/CardBlocks'
import { EmptyState } from '../_shared/empty'
import { compactNum } from '../_shared/format'

export function LinksToxic() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const totalRisk = s.toxicBands.high + s.toxicBands.medium + s.toxicBands.low || 1

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Toxic links" value={String(s.toxicCount)}
          tone={s.toxicCount === 0 ? 'good' : s.toxicCount > 10 ? 'bad' : 'warn'} />
        <KpiTile label="Pages affected" value={String(s.toxicPages.byPage.length)}
          tone={s.toxicPages.byPage.length === 0 ? 'good' : 'bad'} />
        <KpiTile label="Avg spam score" value={String(s.toxicScore)}
          tone={s.toxicScore <= 30 ? 'good' : s.toxicScore <= 60 ? 'warn' : 'bad'} />
        <KpiTile label="Disavowed" value={String(s.disavowed)} tone={s.disavowed > 0 ? 'info' : 'neutral'} />
      </div>

      {/* Risk bands */}
      <Card title="Risk bands">
        <HealthStrip
          total={totalRisk}
          segments={[
            { label: 'High risk', value: s.toxicBands.high, color: '#ef4444' },
            { label: 'Medium', value: s.toxicBands.medium, color: '#f59e0b' },
            { label: 'Low', value: s.toxicBands.low, color: '#60a5fa' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Reason breakdown */}
      <Card title="Reason breakdown">
        <Distribution rows={[
          { label: 'Spammy TLD', value: s.toxicReasons.tld, tone: 'warn' as const },
          { label: 'PBN signals', value: s.toxicReasons.pbn, tone: 'bad' as const },
          { label: 'Language mismatch', value: s.toxicReasons.lang, tone: 'warn' as const },
          { label: 'Sitewide footer', value: s.toxicReasons.sitewide, tone: 'warn' as const },
        ].filter(r => r.value > 0)} />
      </Card>

      {/* Cleanup priority */}
      {s.toxicCount > 0 && (
        <Card title="Cleanup priority">
          <div className="flex flex-col gap-1.5">
            {s.toxicBands.high > 0 && (
              <div className="flex items-center justify-between rounded bg-[#ef4444]/5 px-2 py-1.5">
                <span className="text-[11px] text-[#ef4444]">Disavow or remove</span>
                <span className="text-[11px] font-mono text-[#ef4444]">{s.toxicBands.high} domains</span>
              </div>
            )}
            {s.toxicBands.medium > 0 && (
              <div className="flex items-center justify-between rounded bg-[#f59e0b]/5 px-2 py-1.5">
                <span className="text-[11px] text-[#f59e0b]">Monitor closely</span>
                <span className="text-[11px] font-mono text-[#f59e0b]">{s.toxicBands.medium} domains</span>
              </div>
            )}
            {s.toxicBands.low > 0 && (
              <div className="flex items-center justify-between rounded bg-[#60a5fa]/5 px-2 py-1.5">
                <span className="text-[11px] text-[#60a5fa]">Low priority</span>
                <span className="text-[11px] font-mono text-[#60a5fa]">{s.toxicBands.low} domains</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Top toxic domains */}
      <Card title="Top toxic domains" padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.toxicLinks.length > 0 ? (
            s.toxicLinks.slice(0, 6).map((r: any) => (
              <RowItem
                key={r.domain}
                title={r.domain}
                badge={<span className={`text-[10px] font-mono ${r.risk === 'high' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>spam {r.spamScore}</span>}
              />
            ))
          ) : (
            <div className="px-2 py-3 text-[11px] text-[#666] italic">No toxic links found</div>
          )}
        </div>
      </Card>

      {/* By target page */}
      {s.toxicPages.byPage.length > 0 && (
        <Card title="By target page">
          <SegmentTable
            headers={['Page', 'Toxic refdoms', 'Risk']}
            rows={s.toxicPages.byPage.map((p: any) => ({
              id: p.url, label: p.title || p.url,
              values: [p.toxicCount, p.risk],
            }))}
            onRowClick={(row) => {
              const p = s.toxicPages.byPage.find((x: any) => x.url === row.id)
              if (p) drill.toPage(p)
            }}
          />
        </Card>
      )}

      {/* Drill chips */}
      <DrillFooter chips={[
        { label: 'High risk', count: s.toxicBands.high },
        { label: 'Disavowed', count: s.disavowed },
      ]} />
    </div>
  )
}
