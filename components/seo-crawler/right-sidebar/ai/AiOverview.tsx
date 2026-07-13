import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { TopList } from '../_shared/lists'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { RowItem } from '../_shared/RowItem'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { fmtNum } from '../_shared/format'
import { RsSparkline } from '../parts/RsSparkline'

export function AiOverview() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const botAccessPct = s.bots.total > 0
    ? Math.round((s.bots.allowed / s.bots.total) * 100)
    : 0

  const engines = [
    { label: 'ChatGPT', value: s.citations.byEngine.chatgpt },
    { label: 'Gemini', value: s.citations.byEngine.gemini },
    { label: 'Perplexity', value: s.citations.byEngine.perplexity },
    { label: 'Claude', value: s.citations.byEngine.claude },
    { label: 'Bing', value: s.citations.byEngine.bing },
  ].filter(e => e.value > 0)

  const topIssues = s.quickIssues.slice(0, 4)

  const topEntities = s.entities.list.slice(0, 3)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]]">AI ready score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-[var(--brand-text-strong)]">{s.score}</span>
            </div>
            <Trendable hasPrior={s.hasTrend}>
              {s.history.score.length > 1 && (
                <div className="mt-1 w-24"><RsSparkline values={s.history.score} /></div>
              )}
            </Trendable>
            <div className="mt-1 text-[10px] text-[var(--brand-text-faint)]]">Crawlability + Schema + Citations + Entities</div>
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Bot access" value={`${botAccessPct}%`} tone={botAccessPct >= 70 ? 'good' : botAccessPct >= 40 ? 'warn' : 'bad'} />
        <KpiTile label="Citations" value={fmtNum(s.citations.total)} tone={s.citations.total > 0 ? 'good' : 'neutral'} />
        <KpiTile label="Schema" value={`${s.schema.score}`} tone={s.schema.score >= 70 ? 'good' : s.schema.score >= 40 ? 'warn' : 'bad'} />
        <KpiTile label="Entities" value={String(s.entities.totalEntities)} tone={s.entities.totalEntities > 0 ? 'good' : 'warn'} />
      </div>

      {/* Bot access health */}
      <Card title="AI bot access">
        <HealthStrip
          total={s.bots.total || 1}
          segments={[
            { label: 'Allowed', value: s.bots.allowed, color: '#22c55e' },
            { label: 'Partial', value: s.bots.partial, color: '#f59e0b' },
            { label: 'Blocked', value: s.bots.blocked, color: '#ef4444' },
            { label: 'Unknown', value: s.bots.unknown, color: '#64748b' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Score breakdown */}
      <Card title="Score breakdown">
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          <RowItem title="Crawlability" badge={<span className="text-[10px] font-mono text-[var(--brand-text-strong)]">{s.crawlability.score}</span>} />
          <RowItem title="Schema" badge={<span className="text-[10px] font-mono text-[var(--brand-text-strong)]">{s.schema.score}</span>} />
          <RowItem title="Citations" badge={<span className="text-[10px] font-mono text-[var(--brand-text-strong)]">{s.citations.total}</span>} />
          <RowItem title="Entities" badge={<span className="text-[10px] font-mono text-[var(--brand-text-strong)]">{s.entities.totalEntities}</span>} />
        </div>
      </Card>

      {/* Engine presence */}
      {engines.length > 0 && (
        <Card title="Engine presence">
          <Distribution rows={engines.map(e => ({
            label: e.label,
            value: e.value,
          }))} />
        </Card>
      )}

      {/* Top entities preview */}
      {topEntities.length > 0 && (
        <Card title="Top entities">
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {topEntities.map((e: any) => (
              <RowItem
                key={e.label}
                title={e.label}
                meta={e.type}
                badge={<span className="text-[10px] text-[var(--brand-text-mid)]]">{e.citations} mentions</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Top issues */}
      {topIssues.length > 0 && (
        <Card title="Needs attention" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {topIssues.map((issue, i) => (
              <RowItem
                key={i}
                title={issue.label}
                badge={
                  <span className={`text-[10px] font-medium ${
                    issue.tone === 'bad' ? 'text-red-400' : issue.tone === 'warn' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {issue.tone === 'bad' ? 'Fix' : issue.tone === 'warn' ? 'Review' : 'Info'}
                  </span>
                }
              />
            ))}
          </div>
        </Card>
      )}

      {/* Comparison */}
      <Trendable hasPrior={s.hasTrend}>
        {!Number.isNaN(s.scorePrev) && (
          <Card title="vs last crawl">
            <ComparisonRow
              label="AI ready score"
              a={{ v: s.score, tag: 'now' }}
              b={{ v: s.scorePrev, tag: 'prev' }}
              format={(v: number) => String(v)}
            />
          </Card>
        )}
      </Trendable>

      {!s.hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
