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
import { fmtPct } from '../_shared/format'

export function PaidCompetition() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  const positionRows = [
    { label: 'Top', value: s.auction.posTop },
    { label: 'Other', value: s.auction.posOther },
    { label: 'Absolute top', value: s.auction.posAbsolute },
  ].filter(r => r.value > 0)

  const lostReasons = [
    { label: 'Lost — budget', value: s.auction.lostBudget * 100 },
    { label: 'Lost — rank', value: s.auction.lostRank * 100 },
    { label: 'Eligible', value: (1 - s.auction.lostBudget - s.auction.lostRank) * 100 },
  ]

  // Per-campaign auction data sorted by impression share (lowest first = biggest opportunity)
  const campaignAuction = [...s.auction.byCampaign]
    .sort((a, b) => a.is - b.is)
    .slice(0, 6)

  // Competitors sorted by overlap rate (highest first)
  const competitors = [...s.auction.competitors]
    .sort((a, b) => b.overlapRate - a.overlapRate)
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Auction KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Impression share"
          value={fmtPct(s.auction.impressionShare * 100)}
          tone={s.auction.impressionShare >= 0.6 ? 'good' : s.auction.impressionShare >= 0.3 ? 'warn' : 'bad'}
        />
        <KpiTile
          label="Top IS"
          value={fmtPct(s.auction.topImpressionShare * 100)}
        />
        <KpiTile
          label="Lost budget"
          value={fmtPct(s.auction.lostBudget * 100)}
          tone={s.auction.lostBudget > 0.2 ? 'warn' : 'good'}
        />
        <KpiTile
          label="Lost rank"
          value={fmtPct(s.auction.lostRank * 100)}
          tone={s.auction.lostRank > 0.2 ? 'warn' : 'good'}
        />
      </div>

      {/* Share breakdown */}
      <Card title="Share breakdown">
        <Distribution rows={lostReasons} />
      </Card>

      {/* Position mix */}
      {positionRows.length > 0 && (
        <Card title="Position mix">
          <Distribution rows={positionRows} />
        </Card>
      )}

      {/* Per-campaign auction data */}
      {campaignAuction.length > 0 && (
        <Card title="By campaign" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {campaignAuction.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-[#666]">
                    IS {fmtPct(c.is * 100)}
                    {c.lostBudget > 0.1 && <span className="text-[#f59e0b]"> · Lost budget {fmtPct(c.lostBudget * 100)}</span>}
                    {c.lostRank > 0.1 && <span className="text-[#ef4444]"> · Lost rank {fmtPct(c.lostRank * 100)}</span>}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#888]">{fmtPct(c.is * 100)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Competitors */}
      {competitors.length > 0 && (
        <Card title="Competitors in auction" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {competitors.map((c) => (
              <RowItem
                key={c.domain}
                title={c.domain}
                badge={<span className="text-[10px] font-mono text-[#888]">{fmtPct(c.overlapRate * 100)}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Impression share trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="Impression share trend">
          <Sparkline values={s.auction.isSeries} tone="info" />
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
