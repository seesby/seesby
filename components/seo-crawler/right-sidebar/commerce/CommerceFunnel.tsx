import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct, fmtCurrency } from '../_shared/format'

export function CommerceFunnel() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Sessions" value={compactNum(s.sessions30d || s.funnel[0].value)} />
        <KpiTile label="Purchases" value={compactNum(s.conv30d || s.funnel[4].value)} />
        <KpiTile
          label="ATC rate"
          value={fmtPct(s.atcRate * 100, 1)}
          tone={s.atcRate > 0.1 ? 'good' : s.atcRate > 0.06 ? 'warn' : 'bad'}
        />
        <KpiTile
          label="Abandon rate"
          value={fmtPct(s.abandonRate * 100, 1)}
          tone={s.abandonRate < 0.5 ? 'good' : s.abandonRate < 0.7 ? 'warn' : 'bad'}
        />
      </div>

      {/* Full funnel */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">Checkout funnel</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.drops.map((step, i) => {
            const barWidth = s.funnel[0].value > 0 ? (step.value / s.funnel[0].value) * 100 : 0
            return (
              <div key={step.label} className="px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#ccc]">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#888]">{compactNum(step.value)}</span>
                    {i > 0 && step.dropPct > 0 && (
                      <span className={`text-[9px] font-mono ${step.dropPct > 0.3 ? 'text-[#ef4444]' : step.dropPct > 0.15 ? 'text-[#f59e0b]' : 'text-[#888]'}`}>
                        -{(step.dropPct * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${barWidth}%`,
                    background: barWidth > 80 ? '#22c55e' : barWidth > 50 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Biggest drop-off */}
      {s.biggestDrop && s.biggestDrop.dropPct > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#666]">Biggest drop-off</span>
          </div>
          <div className="text-[13px] text-white font-medium">
            {s.biggestDrop.label} loses {(s.biggestDrop.dropPct * 100).toFixed(0)}% of users
          </div>
          <div className="text-[11px] text-[#888] mt-1">
            {compactNum(s.biggestDrop.drop)} users lost at this step
          </div>
        </Card>
      )}

      {/* Conversion rates */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">Step conversion</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.drops.slice(1).map((step, i) => (
            <div key={step.label} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
              <span className="text-[11px] text-[#ccc]">{s.drops[i].label} → {step.label}</span>
              <span className={`text-[11px] font-mono font-medium ${step.convFromPrev >= 0.7 ? 'text-[#22c55e]' : step.convFromPrev >= 0.4 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                {(step.convFromPrev * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Device breakdown */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">By device</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.byDevice.map(d => (
            <div key={d.id} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-[#ccc]">{d.label}</div>
                <div className="text-[10px] text-[#666]">{compactNum(d.sessions)} sessions</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[9px] text-[#666]">ATC</div>
                  <div className={`text-[10px] font-mono ${d.atc > 0.1 ? 'text-[#22c55e]' : 'text-[#888]'}`}>{fmtPct(d.atc * 100, 1)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[#666]">Order</div>
                  <div className={`text-[10px] font-mono ${d.order > 0.03 ? 'text-[#22c55e]' : 'text-[#888]'}`}>{fmtPct(d.order * 100, 1)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[#666]">Revenue</div>
                  <div className="text-[10px] font-mono text-[#888]">{fmtCurrency(d.revenue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Benchmark */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">vs benchmark</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#ccc]">Your CVR</span>
            <span className={`text-[11px] font-mono font-medium ${s.cvr >= s.bench.cvr ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {fmtPct(s.cvr * 100, 1)}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#ccc]">Vertical median CVR</span>
            <span className="text-[11px] font-mono font-medium text-[#888]">{fmtPct(s.bench.cvr * 100, 1)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#ccc]">Your AOV</span>
            <span className={`text-[11px] font-mono font-medium ${s.aov >= s.bench.aov ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {fmtCurrency(s.aov)}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-[#ccc]">Vertical median AOV</span>
            <span className="text-[11px] font-mono font-medium text-[#888]">{fmtCurrency(s.bench.aov)}</span>
          </div>
        </div>
      </Card>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
