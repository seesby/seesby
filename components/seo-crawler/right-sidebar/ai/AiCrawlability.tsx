import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { TopList } from '../_shared/lists'
import { SegmentTable } from '../_shared/SegmentTable'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { RowItem } from '../_shared/RowItem'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'

export function AiCrawlability() {
  const { pages } = useSeoCrawler() as any
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const botList = s.bots.list
    .filter((b: any) => b.status !== 'Unknown')
    .slice(0, 10)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Bot access breakdown */}
      <Card title="Bot access">
        <HealthStrip
          total={s.bots.total || 1}
          segments={[
            { label: 'Allowed', value: s.bots.allowed, color: '#22c55e' },
            { label: 'Partial', value: s.bots.partial, color: '#f59e0b' },
            { label: 'Blocked', value: s.bots.blocked, color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* AI bot status */}
      {botList.length > 0 && (
        <Card title="AI bot status">
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {botList.map((b: any) => (
              <RowItem
                key={b.name}
                title={b.name}
                badge={
                  <span className={`text-[10px] font-medium ${
                    b.status === 'Allowed' ? 'text-emerald-400'
                      : b.status === 'Blocked' ? 'text-red-400'
                      : 'text-amber-400'
                  }`}>
                    {b.status}
                  </span>
                }
              />
            ))}
          </div>
        </Card>
      )}

      {/* robots.txt details */}
      <Card title="robots.txt">
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Status" value={s.robotsTxt.hasRules ? 'Found' : 'Missing'} tone={s.robotsTxt.hasRules ? 'good' : 'bad'} />
          <KpiTile label="Rules" value={String(s.robotsTxt.ruleCount)} />
          <KpiTile label="AI rules" value={s.robotsTxt.hasAiRules ? 'Yes' : 'No'} tone={s.robotsTxt.hasAiRules ? 'good' : 'warn'} />
          <KpiTile label="Sitemaps" value={String(s.llmsTxtDetails.sitemaps)} />
        </div>
      </Card>

      {/* llms.txt */}
      <Card title="llms.txt">
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Status" value={s.llmsTxtDetails.status} tone={s.llmsTxt ? 'good' : 'warn'} />
          <KpiTile label="Entries" value={String(s.llmsTxtDetails.entries)} />
        </div>
      </Card>

      {/* Blocked pages */}
      {s.crawlability.blockedPages.length > 0 && (
        <Card title="Blocked pages">
          <TopList items={s.crawlability.blockedPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: 'blocked',
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Partial pages */}
      {s.crawlability.partialPages.length > 0 && (
        <Card title="Partial access pages">
          <TopList items={s.crawlability.partialPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: 'partial',
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* By template */}
      {s.crawlability.byTemplate.length > 0 && (
        <Card title="By template">
          <SegmentTable
            headers={['Template', 'Pages', 'Allowed', 'Blocked']}
            rows={s.crawlability.byTemplate.slice(0, 6).map((t: any) => ({
              id: t.id,
              label: t.label,
              values: [t.pages, t.allowed, t.blocked],
            }))}
          />
        </Card>
      )}

      {/* Comparison */}
      <Trendable hasPrior={s.hasTrend}>
        {!Number.isNaN(s.crawlability.scorePrev) && (
          <Card title="vs last crawl">
            <ComparisonRow
              label="Crawlability score"
              a={{ v: s.crawlability.score, tag: 'now' }}
              b={{ v: s.crawlability.scorePrev, tag: 'prev' }}
              format={(v: number) => String(v)}
            />
          </Card>
        )}
      </Trendable>

      {!s.hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
