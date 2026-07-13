import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatPercent,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function RankingsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const geoGrid = page?.rankGeogrid ?? page?.e_local_rankGeogrid ?? [];
  const topKeywords = page?.packTopKeywords || page?.localPackKeywords || [];
  const competitors = page?.packCompetitors || page?.localPackCompetitors || [];
  const avgPosition = page?.packAveragePosition ?? page?.localPackAvgPosition;
  const packPresence = page?.localPackShare ?? page?.packVisibilityShare;
  const geoAvg = page?.geoGridAvgPosition;
  const geoTop3Pct = page?.geoGridTop3Percentage;
  const keywordsInPack = topKeywords.filter((kw: any) => {
    const pos = typeof kw === 'object' ? (kw.packPosition ?? kw.position) : null;
    return pos != null && pos <= 10;
  }).length;

  // Position color for geogrid dots
  const posColor = (pos: number) => {
    if (pos <= 3) return 'bg-green-500';
    if (pos <= 5) return 'bg-yellow-400';
    if (pos <= 10) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Avg Position" value={avgPosition ? Number(avgPosition).toFixed(1) : '\u2014'} good={Number(avgPosition) <= 5} />
        <MetricPill label="Pack Share" value={formatPercent(packPresence)} good={Number(packPresence) >= 0.3} />
        <MetricPill label="Keywords" value={formatNumber(topKeywords.length)} />
        <MetricPill label="In Pack" value={formatNumber(keywordsInPack)} good={keywordsInPack > 0} />
        <MetricPill label="Geo-grid" value={geoAvg ? `#${geoAvg}` : '\u2014'} good={geoAvg != null && geoAvg <= 5} />
      </div>

      {/* Top row: Geogrid, Ranking queries */}
      <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr] gap-2.5">
        {/* Local pack geogrid */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Local pack (geogrid 7\u00D77)</div>
          {geoGrid.length > 0 ? (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {geoGrid.slice(0, 49).map((cell: any, i: number) => {
                  const pos = typeof cell === 'number' ? cell : cell.position || cell.rank || 0;
                  return (
                    <div
                      key={i}
                      className={`w-full aspect-square rounded-full ${posColor(pos)} flex items-center justify-center`}
                      title={`Position: ${pos}`}
                    >
                      <span className="text-[8px] text-[var(--brand-text-strong)] font-bold">{pos || '\u2022'}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--brand-text-mid)]">avg pos <span className="text-[var(--brand-text-strong)] font-medium">{geoAvg || (avgPosition ? Number(avgPosition).toFixed(1) : '\u2014')}</span></span>
                <span className="text-[var(--brand-text-mid)]">{geoTop3Pct || packPresence ? formatPercent(geoTop3Pct || packPresence) : '\u2014'} top-3</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">No geogrid data</div>
          )}
        </div>

        {/* Ranking queries */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Ranking queries</div>
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Query</th>
                  <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Pack</th>
                  <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Organic</th>
                  <th className="px-3 py-1.5 text-right text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Vol</th>
                </tr>
              </thead>
              <tbody>
                {topKeywords.length > 0 ? topKeywords.slice(0, 12).map((kw: any, i: number) => {
                  const query = typeof kw === 'string' ? kw : kw.keyword || kw.query;
                  const pack = typeof kw === 'object' ? (kw.packPosition ?? kw.position) : null;
                  const organic = typeof kw === 'object' ? kw.organicPosition : null;
                  const volume = typeof kw === 'object' ? kw.volume : null;
                  const delta = typeof kw === 'object' ? kw.delta : null;
                  return (
                    <tr key={i} className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-3 py-1.5 text-[var(--brand-text-mid)] font-medium">{query}</td>
                      <td className="px-3 py-1.5 text-center">
                        <StatusBadge
                          status={pack != null && pack <= 3 ? 'pass' : pack != null && pack <= 10 ? 'warn' : 'fail'}
                          label={pack != null ? `#${pack}` : '\u2014'}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <StatusBadge
                          status={organic != null && organic <= 10 ? 'pass' : organic != null && organic <= 20 ? 'warn' : 'fail'}
                          label={organic != null ? `#${organic}` : '\u2014'}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right text-[var(--brand-text-mid)]">
                        {volume != null ? formatNumber(volume) : '\u2014'}
                        {delta != null && <span className={`text-[9px] ml-0.5 ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>{delta >= 0 ? '\u25B2' : '\u25BC'}</span>}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-[11px] text-[var(--brand-text-faint)]">No ranking data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Competitors in pack */}
      {competitors.length > 0 && (
        <Card title="Competitors in pack">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Competitor</th>
                  <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Position</th>
                  <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp: any, i: number) => {
                  const name = typeof comp === 'string' ? comp : comp.name || comp.domain;
                  const pos = typeof comp === 'object' ? comp.position : null;
                  const rev = typeof comp === 'object' ? comp.reviews : null;
                  return (
                    <tr key={i} className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-3 py-1.5 text-[var(--brand-text-mid)] font-medium">{name}</td>
                      <td className="px-3 py-1.5 text-center">
                        <StatusBadge
                          status={pos != null && pos <= 3 ? 'pass' : pos != null && pos <= 10 ? 'warn' : 'fail'}
                          label={pos != null ? `#${pos}` : '\u2014'}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center text-[var(--brand-text-mid)]">{rev != null ? formatNumber(rev) : '\u2014'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Trend */}
      {hasTrend && (
        <Card title="Pack Position Trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3">
            <Sparkline values={page?.packPositionTrend || []} tone="info" />
          </div>
        </Card>
      )}
    </div>
  );
}
