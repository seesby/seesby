import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { BenchmarkBar } from '../_shared/BenchmarkBar'
import { SegmentTable } from '../_shared/SegmentTable'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { DeltaChip } from '../_shared/DeltaChip'
import { RsSparkline } from '../parts/RsSparkline'
import { selectPillars, selectOverallScore, selectScoreDistribution } from './_selectors'

const PILLARS: { key: keyof ReturnType<typeof selectPillars>; label: string; color: string }[] = [
  { key: 'technical', label: 'Technical', color: '#3b82f6' },
  { key: 'content', label: 'Content', color: '#f59e0b' },
  { key: 'links', label: 'Links', color: '#14b8a6' },
  { key: 'a11y', label: 'Accessibility', color: '#10b981' },
  { key: 'security', label: 'Security', color: '#ef4444' },
  { key: 'schema', label: 'Schema', color: '#a78bfa' },
]

export default function FullAuditScores() {
  const { pages, site } = useSeoCrawler() as any
  const hasTrend = useHasTrend()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const pillars = useMemo(() => selectPillars(pages), [pages])
  const overall = useMemo(() => selectOverallScore(pillars), [pillars])
  const distribution = useMemo(() => selectScoreDistribution(pages), [pages])
  const cohort = site?.cohort ?? null
  const moverCount = Number(site?.lastSession?.movers ?? 0)
  const scoreSpark = (site?.history?.score ?? []) as number[]
  const scoreDelta = scoreSpark.length >= 2 ? overall - scoreSpark[scoreSpark.length - 2] : 0

  // Find weakest and strongest pillars
  const sortedPillars = useMemo(() => {
    return PILLARS.map(p => ({ ...p, score: pillars[p.key] })).sort((a, b) => a.score - b.score)
  }, [pillars])
  const weakest = sortedPillars[0]
  const strongest = sortedPillars[sortedPillars.length - 1]

  // Score by page type
  const byCategory = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>()
    for (const p of pages) {
      const cat = p.category || 'other'
      const cur = m.get(cat) ?? { count: 0, total: 0 }
      cur.count++
      cur.total += Number(p.qualityScore ?? 0)
      m.set(cat, cur)
    }
    return [...m.entries()]
      .map(([id, v]) => ({
        id,
        label: id,
        values: [v.count, Math.round(v.total / v.count)] as const,
      }))
      .sort((a, b) => b.values[1] - a.values[1])
      .slice(0, 5)
  }, [pages])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Overall score */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]">Overall score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--brand-text-strong)]">{overall}</span>
              {hasTrend && scoreDelta !== 0 && <DeltaChip value={scoreDelta} />}
            </div>
            {hasTrend && scoreSpark.length > 1 ? (
              <div className="mt-1.5 w-24"><RsSparkline values={scoreSpark} stroke="#22c55e" fill="rgba(34,197,94,0.12)" /></div>
            ) : null}
          </div>
          <ProgressRing value={overall} size={72} />
        </div>
      </Card>

      {/* Pillar bars */}
      <Card title="Pillars">
        <ul className="flex flex-col gap-2.5">
          {PILLARS.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] text-[var(--brand-text-mid)]">{p.label}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--brand-surface-2)]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ width: `${pillars[p.key]}%`, background: p.color }}
                />
              </div>
              <span className="w-8 text-right text-[11px] tabular-nums text-[var(--brand-text-mid)]">{pillars[p.key]}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Weakest / strongest */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Weakest" value={weakest.label} tone="bad" mono={false} />
        <KpiTile label="Strongest" value={strongest.label} tone="good" mono={false} />
      </div>

      {/* Score breakdown by pillar */}
      <Card title="Score breakdown">
        <SegmentTable
          headers={['Pillar', 'Score', 'Gap']}
          rows={PILLARS.map(p => ({
            id: p.key,
            label: p.label,
            values: [
              pillars[p.key],
              `${100 - pillars[p.key]}`,
            ],
          }))}
        />
      </Card>

      {/* Cohort benchmark */}
      {cohort && (
        <Card title={`Cohort: ${cohort.label}`}>
          <BenchmarkBar site={overall} benchmark={cohort.p50} unit=" pts" />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--brand-text-mid)]">
            <span>Percentile <span className="text-[var(--brand-text-mid)] tabular-nums">{cohort.percentile}</span></span>
            <span>Top {100 - cohort.percentile}%</span>
          </div>
        </Card>
      )}

      {/* Score distribution */}
      <Card title="Score distribution">
        <Distribution
          rows={distribution.map((d) => ({
            label: d.bucket,
            value: d.count,
            color: d.bucket === '<50' ? '#ef4444' : d.bucket === '50-69' ? '#f59e0b' : d.bucket === '90+' ? '#22c55e' : '#3b82f6',
          }))}
        />
      </Card>

      {/* Score by category */}
      {byCategory.length > 0 && (
        <Card title="Score by page type">
          <SegmentTable
            headers={['Type', 'Pages', 'Avg score']}
            rows={byCategory.map(c => ({
              id: c.id,
              label: c.label,
              values: c.values,
            }))}
          />
        </Card>
      )}

      {/* Score movers - only with trend */}
      {hasTrend && (
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Movers" value={moverCount} />
          <KpiTile
            label="Score change"
            value={scoreDelta > 0 ? `+${scoreDelta}` : String(scoreDelta)}
            tone={scoreDelta > 0 ? 'good' : scoreDelta < 0 ? 'bad' : 'neutral'}
          />
        </div>
      )}

      {!hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
