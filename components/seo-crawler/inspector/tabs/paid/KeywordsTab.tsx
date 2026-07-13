import React, { useState } from 'react';
import { DataRow, Card, MetricPill, StatusBadge, formatNumber, formatPercent } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

type SortKey = 'cost' | 'cpc' | 'qs' | 'ctr' | 'conv' | 'cpa' | 'impr';

export default function KeywordsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const keywords = page?.paidKeywords || page?.keywords || [];
  const qsDist = page?.paidQsDistribution || page?.qualityScoreDistribution || {};
  const intentMatch = page?.searchIntentMatchStatus ?? page?.paidIntentMatch;
  const negKeywords = page?.negativeKeywords || page?.paidNegKeywords || [];
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...keywords].sort((a: any, b: any) => {
    const av = Number(a[sortKey] || 0);
    const bv = Number(b[sortKey] || 0);
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold cursor-pointer hover:text-[var(--brand-text-mid)] select-none"
      onClick={() => toggleSort(k)}
    >
      {children} {sortKey === k ? (sortDir === 'desc' ? '▼' : '▲') : ''}
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricPill label="Total keywords" value={String(keywords.length)} />
        <MetricPill label="Avg QS" value={page?.qualityScore ? String(page.qualityScore) : '—'}
          good={Number(page?.qualityScore) >= 7} />
        <MetricPill label="Intent match" value={intentMatch || '—'}
          good={intentMatch === 'high'} />
        <MetricPill label="Neg keywords" value={String(negKeywords.length)} />
      </div>

      {/* QS Distribution */}
      <Card title="QS distribution">
        <div className="flex items-end gap-1 h-16">
          {[10,9,8,7,6,5,4,3,2,1].map(q => {
            const count = qsDist[q] ?? qsDist[String(q)] ?? 0;
            const max = Math.max(1, ...Object.values(qsDist).map(Number));
            const pct = (count / max) * 100;
            const color = q >= 7 ? 'bg-green-500' : q >= 5 ? 'bg-orange-400' : 'bg-red-400';
            return (
              <div key={q} className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-[var(--brand-text-faint)]">{count}</span>
                <div className={`w-full ${color} rounded-t`} style={{ height: `${pct}%`, minHeight: 2 }} />
                <span className="text-[9px] text-[var(--brand-text-faint)]">{q}</span>
              </div>
            );
          })}
        </div>
        {hasTrend && (
          <div className="mt-3 bg-[var(--brand-surface-0)] border border-[var(--brand-surface-2)] rounded p-3">
            <Sparkline values={page?.qsDistributionTrend || []} tone="info" />
          </div>
        )}
      </Card>

      {/* Keywords table */}
      {keywords.length > 0 ? (
        <Card title={`Keywords (${keywords.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[var(--brand-border-2)]">
                  <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Keyword</th>
                  <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Match</th>
                  <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Campaign</th>
                  <SortTh k="cost">Cost</SortTh>
                  <SortTh k="cpc">CPC</SortTh>
                  <SortTh k="qs">QS</SortTh>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">ExpCTR</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">AdRel</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">LPExp</th>
                  <SortTh k="ctr">CTR</SortTh>
                  <SortTh k="impr">Impr</SortTh>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Pos</th>
                  <SortTh k="conv">Conv</SortTh>
                  <SortTh k="cpa">CPA</SortTh>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Δ7d</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 50).map((kw: any, i: number) => {
                  const qs = Number(kw.qs || kw.qualityScore || 0);
                  const qsColor = qs >= 7 ? 'text-green-400' : qs >= 5 ? 'text-orange-400' : 'text-red-400';
                  const delta = Number(kw.delta7d || kw.change7d || 0);
                  return (
                    <tr key={i} className="border-b border-[var(--brand-surface-3)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-2 py-1.5 text-[var(--brand-text-mid)] truncate max-w-[180px]">{kw.keyword || kw.text || '—'}</td>
                      <td className="px-2 py-1.5">
                        <StatusBadge
                          status={kw.matchType === 'exact' ? 'pass' : kw.matchType === 'phrase' ? 'info' : 'warn'}
                          label={kw.matchType || '—'}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-[var(--brand-text-mid)] truncate max-w-[100px]">{kw.campaign || '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">${formatNumber(kw.cost, { maximumFractionDigits: 0 })}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">${formatNumber(kw.cpc, { maximumFractionDigits: 2 })}</td>
                      <td className={`px-2 py-1.5 text-right font-bold ${qsColor}`}>{qs || '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{kw.expCtr || '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{kw.adRelevance || '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{kw.lpExp || '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{kw.ctr ? formatPercent(kw.ctr, 100) : '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{formatNumber(kw.impressions || kw.impr)}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{kw.position || kw.avgPos || '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{formatNumber(kw.conversions || kw.conv)}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{kw.cpa ? `$${formatNumber(kw.cpa, { maximumFractionDigits: 0 })}` : '—'}</td>
                      <td className="px-2 py-1.5 text-right">
                        {delta !== 0 ? (
                          <span className={delta > 0 ? 'text-green-400' : 'text-red-400'}>
                            {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}%
                          </span>
                        ) : <span className="text-[var(--brand-text-faint)]">flat</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {keywords.length > 50 && (
            <div className="text-[10px] text-[var(--brand-text-faint)] text-center py-2">Showing 50 of {keywords.length} keywords</div>
          )}
        </Card>
      ) : (
        <div className="text-center py-12 text-[12px] text-[var(--brand-text-faint)]">
          No keyword data available. Connect a Google Ads account to see keyword performance.
        </div>
      )}

      {/* Negative keywords */}
      {negKeywords.length > 0 && (
        <Card title={`Negative keywords (${negKeywords.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {negKeywords.slice(0, 30).map((kw: any, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-[var(--brand-surface-3)] text-[var(--brand-text-mid)] border border-[var(--brand-border-2)]">
                {typeof kw === 'string' ? kw : kw.keyword || kw.term}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
