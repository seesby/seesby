import React from 'react'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { RowItem } from '../_shared/RowItem'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { RsSparkline } from '../parts/RsSparkline'
import { fmtPct } from '../_shared/format'
import { scoreToTone } from '../_shared/scoring'

export function LocalPack() {
  const s = useLocalInsights()
  if (!s.byLocation?.length) return <EmptyState title="No local data yet" />
  const packScore = Math.round(s.localPack.share * 100)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Hero */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]]">Local pack share</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--brand-text-strong)]">{fmtPct(s.localPack.share * 100)}</div>
            <div className="mt-1 text-[10px] text-[var(--brand-text-faint)]]">Visibility in the local map pack</div>
          </div>
          <ProgressRing value={packScore} size={72} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile
          label="Avg position"
          value={s.localPack.avgPos > 0 ? s.localPack.avgPos.toFixed(1) : '\u2014'}
          tone={s.localPack.avgPos > 0 ? scoreToTone(100 - s.localPack.avgPos * 10) : 'neutral'}
        />
        <KpiTile label="Top 3" value={String(s.localPack.top3)} tone={s.localPack.top3 > 0 ? 'good' : 'neutral'} />
        <KpiTile label="Not ranking" value={String(s.localPack.notRanking)} tone={s.localPack.notRanking > 0 ? 'warn' : 'good'} />
      </div>

      {/* Position mix */}
      <Card title="Position mix">
        <Distribution rows={[
          { label: '#1', value: s.localPack.pos1, tone: 'good' as const },
          { label: '#2-3', value: s.localPack.pos2 + s.localPack.pos3, tone: 'good' as const },
          { label: '#4+', value: s.localPack.pos4plus, tone: 'warn' as const },
          { label: 'Not ranking', value: s.localPack.notRanking, tone: 'bad' as const },
        ]} />
      </Card>

      {/* Your share vs benchmark */}
      <Card title="vs Benchmark">
        <div className="flex items-center justify-between py-1 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Your share</span>
          <span className="text-[11px] font-mono tabular-nums text-[var(--brand-text-strong)]">{fmtPct(s.localPack.share * 100)}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Benchmark</span>
          <span className="text-[11px] font-mono tabular-nums text-[var(--brand-text-strong)]">{fmtPct(s.localPack.benchmark * 100)}</span>
        </div>
      </Card>

      {/* Top keywords in pack */}
      {s.localPack.topKeywords.length > 0 && (
        <Card title="Top keywords in pack" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {s.localPack.topKeywords.map((kw: any, i: number) => (
              <RowItem
                key={i}
                title={kw.keyword}
                meta={kw.location}
                badge={<span className={`text-[10px] font-mono ${scoreToTone(100 - kw.position * 10)}`}>#{kw.position}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Lost rankings — only meaningful with trend */}
      <Trendable hasPrior={s.hasPrior}>
        {s.localPack.lost.length > 0 && (
          <Card title="Lost rankings" padded={false}>
            <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
              {s.localPack.lost.map((kw: any, i: number) => (
                <RowItem
                  key={i}
                  title={kw.keyword}
                  meta={kw.location}
                  badge={
                    <span className="text-[10px] font-mono text-red-400">
                      #{kw.prevPosition} \u2192 {kw.position != null ? `#${kw.position}` : 'gone'}
                    </span>
                  }
                />
              ))}
            </div>
          </Card>
        )}
      </Trendable>

      {/* Pack share trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="Pack share trend">
          {s.localPack.shareSeries90d.length > 1 ? (
            <RsSparkline values={s.localPack.shareSeries90d} />
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]] py-2">Not enough data</div>
          )}
        </Card>
      </Trendable>

      {/* Trend comparison */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="vs last crawl" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            <ComparisonRow
              label="Pack share"
              a={{ v: Math.round(s.localPack.share * 100), tag: 'now' }}
              b={{ v: Math.round(s.localPack.sharePrev * 100), tag: 'prev' }}
              format={(v) => `${v}%`}
            />
            <ComparisonRow
              label="Avg position"
              a={{ v: Math.round(s.localPack.avgPos * 10), tag: 'now' }}
              b={{ v: Math.round((s.localPack.avgPos + 0.2) * 10), tag: 'prev' }}
              format={(v) => (v / 10).toFixed(1)}
            />
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
