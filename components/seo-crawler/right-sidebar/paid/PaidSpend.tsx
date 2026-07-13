import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { Sparkline } from '../_shared/Sparkline'
import { RowItem } from '../_shared/RowItem'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { fmtCurrency, fmtPct, compactNum } from '../_shared/format'

export function PaidSpend() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  const channelRows = s.byChannel.map(ch => ({
    label: ch.label,
    value: Math.round(ch.value),
  }))

  const typeRows = s.byType.map(t => ({
    label: t.label,
    value: Math.round(t.spend),
  }))

  const tierRows = [
    { label: '> $10k/mo', value: s.spendTiers.huge },
    { label: '$1k – 10k', value: s.spendTiers.big },
    { label: '$100 – 1k', value: s.spendTiers.mid },
    { label: '< $100', value: s.spendTiers.tiny },
  ].filter(t => t.value > 0)

  const pacingPct = Math.round(s.pacing * 100)
  const pacingTone = pacingPct >= 90 && pacingPct <= 110 ? '#22c55e' : pacingPct < 80 ? '#f59e0b' : '#888'
  const cpcTone = s.cpc <= s.bench.cpc ? '#22c55e' : '#f59e0b'

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Quick KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Total spend" value={fmtCurrency(s.spend30d)} />
        <KpiTile label="Clicks" value={compactNum(s.clicks)} />
        <KpiTile label="CPC" value={fmtCurrency(s.cpc)} tone={s.cpc > s.bench.cpc ? 'warn' : 'good'} />
        <KpiTile label="CTR" value={`${s.ctr.toFixed(1)}%`} />
      </div>

      {/* Conversions & revenue */}
      <Card padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Conversions (30d)</span>
            <span className="text-[11px] font-mono font-medium text-white">{compactNum(s.conv30d)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Revenue (30d)</span>
            <span className="text-[11px] font-mono font-medium text-white">{fmtCurrency(s.revenue30d)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-[#888]">ROAS</span>
            <span className="text-[11px] font-mono font-medium" style={{ color: s.roas >= 3 ? '#22c55e' : s.roas >= 1 ? '#888' : '#ef4444' }}>
              {s.roas.toFixed(1)}x
            </span>
          </div>
        </div>
      </Card>

      {/* Campaign type breakdown */}
      {typeRows.length > 0 && (
        <Card title="By campaign type">
          <Distribution rows={typeRows} />
        </Card>
      )}

      {/* Channel split */}
      {channelRows.length > 0 && (
        <Card title="Channel split">
          <Distribution rows={channelRows} />
        </Card>
      )}

      {/* Spend tiers */}
      {tierRows.length > 0 && (
        <Card title="Spend tiers">
          <Distribution rows={tierRows} />
        </Card>
      )}

      {/* Wasted spend */}
      {s.wasted.length > 0 && (
        <Card title={`Wasted spend — ${fmtCurrency(s.wastedTotal)}`} padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.wasted.slice(0, 5).map((w) => (
              <RowItem
                key={w.id}
                title={w.name}
                meta={w.reason}
                badge={<span className="text-[10px] font-mono text-[#ef4444]">{fmtCurrency(w.wastedAmount)}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Budget & CPC benchmarks */}
      <Card padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Budget pacing</span>
            <span className="text-[11px] font-mono font-medium" style={{ color: pacingTone }}>
              {pacingPct}%
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-[#888]">CPC vs vertical</span>
            <span className="text-[11px] font-mono font-medium" style={{ color: cpcTone }}>
              {fmtCurrency(s.cpc)} / {fmtCurrency(s.bench.cpc)}
            </span>
          </div>
        </div>
      </Card>

      {/* Spend trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="Spend trend">
          <Sparkline values={s.spendSeries} tone="info" />
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
