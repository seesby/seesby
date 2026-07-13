import React from 'react';
import {
  DataRow, Card, StatusBadge,
  formatNumber, formatPercent,
} from '../../../inspector/shared';
import { Sparkline } from '@/components/seo-crawler/right-sidebar/_shared';
import CollapseGroup from '../parts/CollapseGroup';

function series28d(page: any, key: string): number[] {
  const s = page?.[`${key}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function SearchTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const hasGsc = [page?.gscClicks, page?.gscImpressions, page?.gscCtr, page?.gscPosition]
    .some((v) => v !== null && v !== undefined);
  const topQueries = Array.isArray(page?.gscTopQueries) ? page.gscTopQueries : [];
  const missedQueries = Array.isArray(page?.missedQueries) ? page.missedQueries : [];
  const strikingKw = Array.isArray(page?.strikingDistanceKeywords) ? page.strikingDistanceKeywords : [];
  const siblings = Array.isArray(page?.cannibalizationSiblings) ? page.cannibalizationSiblings : [];
  const serpFeatures = page?.serpFeatures || {};

  if (!hasGsc) {
    return (
      <div className="bg-[#0a0a0a] border border-[#222] rounded p-5 text-center">
        <div className="text-[14px] text-white font-semibold mb-2">Google Search Console not connected</div>
        <div className="text-[12px] text-[#666]">Connect GSC in Integrations to enable search-performance data.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top row: Timeseries + Country + Device */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_0.6fr_0.6fr] gap-3">
        <Card title="28d Timeseries">
          {hasTrend ? (
            <div className="space-y-1.5">
              <SparkRow label="Clk" values={series28d(page, 'gscClicks')} />
              <SparkRow label="Imp" values={series28d(page, 'gscImpressions')} />
              <SparkRow label="Pos" values={series28d(page, 'gscPosition')} invert />
              <SparkRow label="CTR" values={series28d(page, 'gscCtr')} />
            </div>
          ) : (
            <div className="text-[11px] text-[#444] py-2">Single crawl — no trend data</div>
          )}
        </Card>
        <Card title="Country Mix">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {(page?.countryMix || []).slice(0, 6).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-[#ccc]">{c.country || c.code}</span>
                <span className="text-[10px] font-mono text-white">{c.pct || c.percentage || 0}%</span>
              </div>
            ))}
            {(!page?.countryMix || page.countryMix.length === 0) && (
              <div className="text-[10px] text-[#444] col-span-2">No data</div>
            )}
          </div>
        </Card>
        <Card title="Device">
          <div className="space-y-1">
            {[
              { label: 'Mobile', value: page?.mobilePct || 0 },
              { label: 'Desktop', value: page?.desktopPct || 0 },
              { label: 'Tablet', value: page?.tabletPct || 0 },
            ].map((d) => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-[10px] text-[#ccc]">{d.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#60a5fa] rounded-full" style={{ width: `${d.value}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-white">{d.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ranking keywords table */}
      <Card title={`Ranking Keywords (GSC+Bing) — ${topQueries.length}`}>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#0a0a0a]">
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-[9px] text-[#444] uppercase tracking-widest font-bold py-2 px-2">Query</th>
                <th className="text-[9px] text-[#444] uppercase tracking-widest font-bold py-2 px-2 text-right">Pos</th>
                <th className="text-[9px] text-[#444] uppercase tracking-widest font-bold py-2 px-2 text-right">Impr</th>
                <th className="text-[9px] text-[#444] uppercase tracking-widest font-bold py-2 px-2 text-right">Clk</th>
                <th className="text-[9px] text-[#444] uppercase tracking-widest font-bold py-2 px-2 text-right">CTR</th>
                <th className="text-[9px] text-[#444] uppercase tracking-widest font-bold py-2 px-2 text-right">&Delta;pos 30d</th>
                <th className="text-[9px] text-[#444] uppercase tracking-widest font-bold py-2 px-2 text-right">Intent</th>
              </tr>
            </thead>
            <tbody>
              {topQueries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-[11px] text-[#444] py-6 text-center">No ranking keyword data yet</td>
                </tr>
              ) : (
                topQueries.slice(0, 20).map((q: any, i: number) => (
                  <tr key={i} className="border-b border-[#111] last:border-b-0 hover:bg-[#080808]">
                    <td className="text-[11px] text-[#ccc] py-1.5 px-2 max-w-[180px] truncate">{q.query}</td>
                    <td className="text-[11px] font-mono text-white py-1.5 px-2 text-right">{formatNumber(q.position, { maximumFractionDigits: 1 })}</td>
                    <td className="text-[11px] font-mono text-[#888] py-1.5 px-2 text-right">{formatNumber(q.impressions)}</td>
                    <td className="text-[11px] font-mono text-[#888] py-1.5 px-2 text-right">{formatNumber(q.clicks)}</td>
                    <td className="text-[11px] font-mono text-[#888] py-1.5 px-2 text-right">{formatPercent(q.ctr, 100)}</td>
                    <td className="text-[11px] font-mono py-1.5 px-2 text-right">
                      {q.posDelta ? (
                        <span className={q.posDelta < 0 ? 'text-red-400' : 'text-green-400'}>
                          {q.posDelta > 0 ? '+' : ''}{q.posDelta}
                        </span>
                      ) : '\u2014'}
                    </td>
                    <td className="text-[10px] text-[#888] py-1.5 px-2 text-right">{q.intent || '\u2014'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Missed queries + SERP features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Missed Queries (rank 51-100, impr>0)">
          <div className="space-y-1">
            {missedQueries.length === 0 ? (
              <div className="text-[11px] text-[#444] py-2">No missed queries</div>
            ) : (
              missedQueries.slice(0, 10).map((q: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#111] last:border-b-0">
                  <span className="text-[10px] text-[#ccc] truncate max-w-[160px]">{q.query}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white">#{formatNumber(q.position, { maximumFractionDigits: 0 })}</span>
                    <span className="text-[10px] font-mono text-[#666]">{formatNumber(q.impressions)} impr</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card title="SERP Features">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              { label: 'AI Overview', value: serpFeatures.aiOverview },
              { label: 'People Also Ask', value: serpFeatures.peopleAlsoAsk },
              { label: 'Featured Snippet', value: serpFeatures.featuredSnippet },
              { label: 'Video', value: serpFeatures.video },
              { label: 'Site Links', value: serpFeatures.siteLinks },
              { label: 'Images', value: serpFeatures.images },
            ].map((f) => (
              <DataRow
                key={f.label}
                label={f.label}
                value={f.value ? '\u2713' : '\u2717'}
                status={f.value ? 'pass' : 'info'}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Striking distance */}
      {strikingKw.length > 0 && (
        <CollapseGroup title="Striking Distance Keywords">
          <div className="flex flex-wrap gap-1.5">
            {strikingKw.map((kw: any, i: number) => (
              <span key={i} className="px-2 py-1 rounded border border-[#262626] bg-[#0a0a0a] text-[10px] text-[#bbb] font-mono">
                {typeof kw === 'string' ? kw : kw.keyword || kw.query}
                {kw.position && <span className="text-[#666] ml-1">#{formatNumber(kw.position, { maximumFractionDigits: 0 })}</span>}
              </span>
            ))}
          </div>
        </CollapseGroup>
      )}

      {/* Cannibalization */}
      {siblings.length > 0 && (
        <CollapseGroup title="Cannibalization Siblings">
          <div className="space-y-1.5">
            {siblings.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-[#080808] border border-[#141414]">
                <div className="text-[11px] text-[#ccc] truncate max-w-[200px]">{typeof s === 'string' ? s : s.url}</div>
                <div className="flex items-center gap-3">
                  {s.position && <span className="text-[10px] font-mono text-white">#{formatNumber(s.position, { maximumFractionDigits: 1 })}</span>}
                  {s.clicks !== undefined && <span className="text-[10px] font-mono text-[#888]">{formatNumber(s.clicks)} clicks</span>}
                </div>
              </div>
            ))}
          </div>
        </CollapseGroup>
      )}
    </div>
  );
}

function SparkRow({ label, values, invert }: { label: string; values: number[]; invert?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[9px] text-[#444] uppercase tracking-widest w-[40px] shrink-0">{label}</span>
      <div className="flex-1">
        <Sparkline values={values} width={280} height={20} tone={invert ? 'bad' : 'info'} />
      </div>
    </div>
  );
}
