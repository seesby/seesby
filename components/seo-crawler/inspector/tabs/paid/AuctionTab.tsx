import React from 'react';
import { DataRow, Card, MetricPill, StatusBadge, formatNumber, formatPercent } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function AuctionTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const auction = page?.auctionInsights || page?.paidAuctionInsights || {};
  const competitors = auction.competitors || page?.competitors || [];
  const impressionShare = auction.impressionShare ?? page?.impressionShare ?? 0;
  const topImpressionShare = auction.topImpressionShare ?? page?.topImpressionShare ?? 0;
  const absoluteTopShare = auction.absoluteTopPct ?? page?.absoluteTopPct ?? 0;
  const lostBudget = auction.lostBudget ?? auction.lostBudgetShare ?? page?.lostBudgetShare ?? 0;
  const lostRank = auction.lostRank ?? auction.lostRankShare ?? page?.lostRankShare ?? 0;
  const lostAdRank = auction.lostAdRank ?? page?.lostAdRankShare ?? 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricPill label="Impr share" value={formatPercent(impressionShare)} good={impressionShare >= 0.5} />
        <MetricPill label="Top IS" value={formatPercent(topImpressionShare)} />
        <MetricPill label="Lost (budget)" value={formatPercent(lostBudget)} good={lostBudget < 0.15} />
        <MetricPill label="Lost (rank)" value={formatPercent(lostRank)} good={lostRank < 0.15} />
      </div>

      {/* Competitor matrix */}
      {competitors.length > 0 ? (
        <Card title={`Competitor matrix (${competitors.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-2 py-1.5 text-left text-[#555] uppercase tracking-widest font-bold">Competitor</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">Overlap</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">Above pos</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">Top of page</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">Abs top</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">Outrank us</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">IS</th>
                </tr>
              </thead>
              <tbody>
                {competitors.slice(0, 15).map((cp: any, i: number) => {
                  const domain = typeof cp === 'string' ? cp : cp.domain || cp.name || '—';
                  const overlap = typeof cp === 'object' ? (cp.overlapRate || cp.overlap || 0) : 0;
                  const abovePos = typeof cp === 'object' ? (cp.abovePos || 0) : 0;
                  const topOfPage = typeof cp === 'object' ? (cp.topOfPage || cp.topPct || 0) : 0;
                  const absTop = typeof cp === 'object' ? (cp.absTop || cp.absoluteTopPct || 0) : 0;
                  const outrankUs = typeof cp === 'object' ? (cp.outrankUs || 0) : 0;
                  const is = typeof cp === 'object' ? (cp.impressionShare || cp.is || 0) : 0;
                  return (
                    <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                      <td className="px-2 py-1.5 text-[#ccc] truncate max-w-[150px]">{domain}</td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 bg-[#1a1a1a] rounded h-1.5">
                            <div className="bg-blue-500 rounded h-1.5" style={{ width: `${Math.min(overlap * 100, 100)}%` }} />
                          </div>
                          <span className="text-[#ccc]">{formatPercent(overlap)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className={abovePos > 0 ? 'text-[#ef4444]' : abovePos < 0 ? 'text-green-400' : 'text-[#888]'}>
                          {abovePos > 0 ? '+' : ''}{abovePos}%
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right text-[#ccc]">{formatPercent(topOfPage)}</td>
                      <td className="px-2 py-1.5 text-right text-[#ccc]">{formatPercent(absTop)}</td>
                      <td className="px-2 py-1.5 text-right text-[#ccc]">{formatPercent(outrankUs)}</td>
                      <td className="px-2 py-1.5 text-right text-[#ccc]">{formatPercent(is)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 text-[12px] text-[#555]">
          No competitor data available.
        </div>
      )}

      {/* Impression share lost breakdown */}
      <Card title="Impression share lost">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#666]">Total lost</span>
              <span className="text-[10px] text-[#ccc] font-bold">{formatPercent(1 - impressionShare)}</span>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded h-2">
              <div className="bg-[#ef4444] rounded h-2" style={{ width: `${(1 - impressionShare) * 100}%` }} />
            </div>
          </div>
          <LossBar label="Due to rank" value={lostRank} suggestion="Raise bids on high-value keywords" />
          <LossBar label="Due to budget" value={lostBudget} suggestion="Increase daily budget on top campaigns" />
          <LossBar label="Due to ad rank" value={lostAdRank} suggestion="Refresh creatives and improve QS" />
        </div>
      </Card>

      {/* SoV trend */}
      {hasTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Share of voice trend">
            <div className="bg-[#0a0a0a] border border-[#111] rounded p-3">
              <Sparkline values={page?.sovTrend || page?.shareOfVoiceTrend || []} tone="info" />
            </div>
          </Card>
          <Card title="Above-position trend">
            <div className="bg-[#0a0a0a] border border-[#111] rounded p-3">
              <Sparkline values={page?.abovePosTrend || []} tone="info" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function LossBar({ label, value, suggestion }: { label: string; value: number; suggestion?: string }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 1) * 100;
  const color = pct > 20 ? 'bg-[#ef4444]' : pct > 10 ? 'bg-[#f59e0b]' : 'bg-[#444]';

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-[#666]">{label}</span>
        <span className="text-[10px] text-[#ccc]">{formatPercent(value)}</span>
      </div>
      <div className="w-full bg-[#1a1a1a] rounded h-1.5">
        <div className={`${color} rounded h-1.5 transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {suggestion && pct > 10 && (
        <div className="text-[9px] text-[#555] mt-0.5">{suggestion}</div>
      )}
    </div>
  );
}
