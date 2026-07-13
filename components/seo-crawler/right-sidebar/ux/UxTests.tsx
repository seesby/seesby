import React from 'react'
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
import { fmtPct } from '../_shared/format'

export function UxTests() {
  const s = useUxInsights()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const totalTests = s.tests.active + s.tests.won + s.tests.lost + s.tests.inconclusive
  const winRate = totalTests > 0 ? s.tests.won / totalTests : 0
  const lossRate = totalTests > 0 ? s.tests.lost / totalTests : 0

  const statusRows = [
    { label: 'Active', value: s.tests.active, tone: 'info' as const },
    { label: 'Won', value: s.tests.won, tone: 'good' as const },
    { label: 'Lost', value: s.tests.lost, tone: 'bad' as const },
    { label: 'Inconclusive', value: s.tests.inconclusive, tone: 'neutral' as const },
  ]

  const typeRows = [
    { label: 'A/B', value: s.tests.byType.ab, tone: 'good' as const },
    { label: 'Multivariate', value: s.tests.byType.mvt, tone: 'warn' as const },
    { label: 'Personalize', value: s.tests.byType.personalize, tone: 'bad' as const },
  ]

  // Tests needing attention (low confidence after many days)
  const staleTests = s.tests.activeList.filter((t: any) => t.daysRunning > 14 && t.confidence < 0.8)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Active"
          value={String(s.tests.active)}
          tone={s.tests.active > 0 ? 'info' : 'neutral'}
          sub={`${s.tests.readyToShip} ready`}
        />
        <KpiTile
          label="Win rate"
          value={fmtPct(winRate * 100)}
          tone={winRate >= 0.3 ? 'good' : 'warn'}
          sub={`${s.tests.won} / ${totalTests}`}
        />
        <KpiTile
          label="Avg lift"
          value={fmtPct(s.tests.avgLift * 100)}
          tone={s.tests.avgLift > 0 ? 'good' : 'warn'}
        />
        <KpiTile
          label="Loss rate"
          value={fmtPct(lossRate * 100)}
          tone={lossRate <= 0.2 ? 'good' : 'bad'}
          sub={`${s.tests.lost} lost`}
        />
      </div>

      {/* Status mix */}
      <Card title="Status">
        <HealthStrip
          total={totalTests || 1}
          segments={statusRows.map(r => ({
            label: r.label,
            value: r.value,
            color: r.tone === 'good' ? '#22c55e' : r.tone === 'bad' ? '#ef4444' : r.tone === 'info' ? '#60a5fa' : '#666',
          }))}
        />
      </Card>

      {/* Ready to ship */}
      {s.tests.readyToShip > 0 && (
        <Card tone="accent">
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-[#ccc]">
              <span className="font-medium text-emerald-400">{s.tests.readyToShip}</span> test{s.tests.readyToShip > 1 ? 's' : ''} ready to ship (95%+ confidence)
            </div>
          </div>
        </Card>
      )}

      {/* Test types */}
      <Card title="Test types">
        <Distribution rows={typeRows} />
      </Card>

      {/* Recent winners */}
      <Card title="Recent winners">
        {s.tests.recentWins.length > 0 ? (
          <TopList items={s.tests.recentWins.map((t: any) => ({
            id: t.id,
            primary: t.name,
            tail: `+${fmtPct(t.lift * 100)}`,
          }))} max={6} />
        ) : (
          <div className="text-[11px] text-[#666]">No winning tests yet.</div>
        )}
      </Card>

      {/* Active tests with confidence */}
      <Card title="Active tests">
        {s.tests.activeList.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.tests.activeList.map((t: any) => (
              <RowItem
                key={t.id}
                title={t.name}
                meta={`${t.daysRunning}d running · ${t.targetUrl}`}
                badge={
                  <span className={`text-[10px] font-mono ${
                    t.confidence >= 0.95 ? 'text-emerald-400' :
                    t.confidence >= 0.8 ? 'text-amber-400' : 'text-[#888]'
                  }`}>
                    {fmtPct(t.confidence * 100)}
                  </span>
                }
                onClick={() => drill.toPage({ url: t.targetUrl })}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#666]">No active tests.</div>
        )}
      </Card>

      {/* Stale tests needing attention */}
      <Card title={`Needs attention ${staleTests.length}`}>
        {staleTests.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {staleTests.map((t: any) => (
              <RowItem
                key={t.id}
                title={t.name}
                meta={`${t.daysRunning}d · ${fmtPct(t.confidence * 100)} confidence`}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">stale</span>}
                onClick={() => drill.toPage({ url: t.targetUrl })}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#666]">No stale tests.</div>
        )}
      </Card>

      {/* By page */}
      <Card title="By page">
        {s.tests.byPage.length > 0 ? (
          <SegmentTable
            headers={['Page', 'Tests', 'Wins', 'Lift']}
            rows={s.tests.byPage.map((p: any) => ({
              id: p.url, label: p.title || p.url,
              values: [p.tests, p.wins, fmtPct(p.avgLift * 100)],
            }))}
          />
        ) : (
          <div className="text-[11px] text-[#666]">No page-level test data.</div>
        )}
      </Card>
    </div>
  )
}
