import React from 'react'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/empty'
import { safePct, compactNum } from '../_shared/format'

export function ContentQuality() {
  const s = useContentInsights()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const overStuffed = s.lengthMix.veryLong

  const issues = [
    { label: 'Thin <300 words', value: s.thin },
    { label: 'Over-stuffed 5k+', value: overStuffed },
    { label: 'AI-likely', value: s.aiLikely },
    { label: 'Missing H1', value: s.missing.noH1 },
    { label: 'No meta desc', value: s.missing.noMeta },
    { label: 'No schema', value: s.missing.noSchema },
    { label: 'No byline', value: s.missing.noByline },
  ].filter(r => r.value > 0)

  const schemaPct = safePct(s.schema.withSchema, s.total)
  const totalIssues = issues.reduce((a, r) => a + r.value, 0)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Readability overview */}
      <Card title="Readability">
        <div className="grid grid-cols-3 gap-2">
          <KpiTile
            label="Avg score"
            value={String(Math.round(s.readability.avg))}
            tone={s.readability.avg >= 60 ? 'good' : 'warn'}
          />
          <KpiTile
            label="Hard"
            value={String(s.readability.hard)}
            tone={s.readability.hard > s.total * 0.2 ? 'bad' : 'good'}
            sub={`${safePct(s.readability.hard, s.total)}`}
          />
          <KpiTile
            label="Easy"
            value={String(s.readability.easy)}
            tone={s.readability.easy > s.total * 0.5 ? 'good' : 'warn'}
            sub={`${safePct(s.readability.easy, s.total)}`}
          />
        </div>
      </Card>

      {/* Word count distribution */}
      <Card title="Word count">
        <HealthStrip
          total={s.total}
          segments={[
            { label: '<300', value: s.lengthMix.tiny, color: '#ef4444' },
            { label: '300-800', value: s.lengthMix.short, color: '#f59e0b' },
            { label: '800-1.5k', value: s.lengthMix.medium, color: '#22c55e' },
            { label: '1.5k-3k', value: s.lengthMix.long, color: '#10b981' },
            { label: '3k+', value: s.lengthMix.veryLong, color: '#3b82f6' },
          ].filter(seg => seg.value > 0)}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <KpiTile label="Avg words" value={compactNum(s.avgWords)} />
          <KpiTile label="Thin <300" value={String(s.thin)} tone={s.thin > 0 ? 'bad' : 'good'} sub={`${safePct(s.thin, s.total)}`} />
        </div>
      </Card>

      {/* E-E-A-T signals */}
      <Card title="E-E-A-T signals">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <KpiTile label="Bylines" value={`${safePct(s.eeat.bylines, s.total)}%`} tone={safePct(s.eeat.bylines, s.total) >= 60 ? 'good' : 'warn'} sub={`${s.eeat.bylines} pages`} />
          <KpiTile label="Author bios" value={`${safePct(s.eeat.bios, s.total)}%`} tone={safePct(s.eeat.bios, s.total) >= 40 ? 'good' : 'bad'} sub={`${s.eeat.bios} pages`} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Citations" value={`${safePct(s.eeat.citations, s.total)}%`} tone={safePct(s.eeat.citations, s.total) >= 40 ? 'good' : 'warn'} sub={`${s.eeat.citations} pages`} />
          <KpiTile label="Updated ver." value={`${safePct(s.eeat.updated, s.total)}%`} tone={safePct(s.eeat.updated, s.total) >= 60 ? 'good' : 'warn'} sub={`${s.eeat.updated} pages`} />
        </div>
      </Card>

      {/* Schema coverage */}
      <Card title="Schema">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <KpiTile label="Coverage" value={`${schemaPct}%`} tone={schemaPct >= 70 ? 'good' : 'warn'} sub={`${s.schema.withSchema} pages`} />
          <KpiTile label="Errors" value={String(s.schema.errors)} tone={s.schema.errors > 0 ? 'bad' : 'good'} />
        </div>
        {s.schema.types.length > 0 && (
          <Distribution rows={s.schema.types.slice(0, 5).map(t => ({
            label: t.type,
            value: Number(t.count),
            tone: 'good' as const,
          }))} />
        )}
      </Card>

      {/* AI detection */}
      {s.aiLikely > 0 && (
        <Card title="AI detection">
          <KpiTile label="Likely AI" value={String(s.aiLikely)} tone="warn" sub={`${safePct(s.aiLikely, s.total)}% of pages`} />
        </Card>
      )}

      {/* Content issues */}
      {issues.length > 0 && (
        <Card title={`Issues to fix ${totalIssues}`} padded={false}>
          <div className="px-2 pt-2 pb-1 text-[10px] text-[var(--brand-text-faint)]">
            {issues.length} issue types affecting {totalIssues} pages
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {issues.map((issue, i) => (
              <RowItem
                key={i}
                title={issue.label}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{issue.value}</span>}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
