import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function seriesOf(p: any, k: string): number[] {
  const s = p?.[`${k}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function SearchTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const visibilityScore = Number(getMetric(page, 'searchVisibilityScore') || page?.searchVisibilityScore || 0);
  const mainKeyword = page?.mainKeyword || '—';
  const bestKeyword = page?.bestKeyword || '—';
  const gscClicks = Number(page?.gscClicks || 0);
  const gscImpressions = Number(page?.gscImpressions || 0);
  const gscCtr = Number(page?.gscCtr || 0);
  const gscPosition = Number(page?.gscPosition || 0);
  const searchIntent = page?.searchIntent || '—';
  const intentMatch = page?.intentMatch || '—';
  const mainKwPosition = Number(page?.mainKwPosition || 0);
  const bestKwPosition = Number(page?.bestKwPosition || 0);
  const mainKwVolume = Number(page?.mainKwSearchVolume || page?.mainKwVolume || 0);
  const bestKwVolume = Number(page?.bestKwSearchVolume || page?.bestKwVolume || 0);
  const inSitemap = page?.inSitemap;
  const indexable = page?.indexable;
  const hasFeaturedSnippet = page?.hasFeaturedSnippetPatterns || false;
  const answerBoxReady = page?.answerBoxReady || false;

  const clicksDelta = Number(page?.gscClicksDelta || 0);
  const impressionsDelta = Number(page?.gscImpressionsDelta || 0);

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Visibility" value={visibilityScore > 0 ? `${visibilityScore}` : '—'} good={visibilityScore >= 70} />
        <MetricPill label="Clicks" value={formatNumber(gscClicks)} good={gscClicks > 0} sub={clicksDelta !== 0 ? `${clicksDelta > 0 ? '+' : ''}${clicksDelta}` : undefined} />
        <MetricPill label="Impr" value={formatNumber(gscImpressions)} />
        <MetricPill label="CTR" value={gscCtr > 0 ? `${(gscCtr * 100).toFixed(1)}%` : '—'} />
        <MetricPill label="Position" value={gscPosition > 0 ? gscPosition.toFixed(1) : '—'} good={gscPosition > 0 && gscPosition <= 10} />
      </div>

      <div className="flex flex-wrap gap-2">
        {searchIntent !== '—' && <StatusBadge status="info" label={`Intent: ${searchIntent}`} />}
        {intentMatch !== '—' && <StatusBadge status={intentMatch === 'match' ? 'pass' : 'warn'} label={`Match: ${intentMatch}`} />}
        {inSitemap === false && <StatusBadge status="warn" label="Not in sitemap" />}
        {indexable === false && <StatusBadge status="fail" label="Not indexable" />}
        {hasFeaturedSnippet && <StatusBadge status="pass" label="Featured snippet ready" />}
        {answerBoxReady && <StatusBadge status="pass" label="Answer box ready" />}
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* How this content performs */}
        <Card title="How this content performs">
          <DataRow label="Clicks" value={
            <span className="inline-flex items-center gap-1.5">
              {formatNumber(gscClicks)}
              {clicksDelta !== 0 && (
                <span className={`text-[10px] font-mono ${clicksDelta > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {clicksDelta > 0 ? '▲' : '▼'}{Math.abs(clicksDelta)}%
                </span>
              )}
            </span>
          } />
          <DataRow label="Impressions" value={
            <span className="inline-flex items-center gap-1.5">
              {formatNumber(gscImpressions)}
              {impressionsDelta !== 0 && (
                <span className={`text-[10px] font-mono ${impressionsDelta > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {impressionsDelta > 0 ? '▲' : '▼'}{Math.abs(impressionsDelta)}%
                </span>
              )}
            </span>
          } />
          <DataRow label="CTR" value={gscCtr > 0 ? `${(gscCtr * 100).toFixed(1)}%` : '—'} />
          <DataRow label="Position" value={gscPosition > 0 ? gscPosition.toFixed(1) : '—'} status={gscPosition > 0 && gscPosition <= 10 ? 'pass' : gscPosition > 10 && gscPosition <= 20 ? 'info' : 'warn'} />
          <DataRow label="Top query" value={mainKeyword} status={mainKeyword !== '—' ? 'pass' : 'warn'} />
          {mainKwPosition > 0 && <DataRow label="Query position" value={mainKwPosition.toFixed(1)} />}
        </Card>

        {/* Query ↔ heading alignment */}
        <Card title="Query ↔ heading alignment">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Tag</th>
                  <th className="text-left text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Content</th>
                  <th className="text-right text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Position</th>
                </tr>
              </thead>
              <tbody>
                {page?.h1_1 && (
                  <tr className="border-b border-[#111]">
                    <td className="py-1.5 text-[#666] font-mono">H1</td>
                    <td className="py-1.5 text-[#ccc] truncate max-w-[180px]">{page.h1_1}</td>
                    <td className="py-1.5 text-[#666] text-right font-mono">{gscPosition > 0 ? gscPosition.toFixed(0) : '—'}</td>
                  </tr>
                )}
                {(page?.headings || []).slice(0, 5).map((h: any, i: number) => {
                  const tag = typeof h === 'object' ? (h?.tag || 'H2') : 'H2';
                  const text = typeof h === 'string' ? h : (h?.text || h?.content || '');
                  return (
                    <tr key={i} className="border-b border-[#111] last:border-b-0">
                      <td className="py-1.5 text-[#666] font-mono">{tag}</td>
                      <td className="py-1.5 text-[#ccc] truncate max-w-[180px]">{text}</td>
                      <td className="py-1.5 text-[#666] text-right font-mono">—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Keyword targeting */}
      <Card title="Keyword targeting">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="Main keyword" value={mainKeyword} status={mainKeyword !== '—' ? 'pass' : 'warn'} />
          <DataRow label="Main kw position" value={mainKwPosition > 0 ? mainKwPosition.toFixed(1) : '—'} status={mainKwPosition > 0 && mainKwPosition <= 10 ? 'pass' : mainKwPosition > 10 ? 'info' : 'warn'} />
          <DataRow label="Main kw volume" value={mainKwVolume > 0 ? formatNumber(mainKwVolume) : '—'} />
          <DataRow label="Best keyword" value={bestKeyword} />
          <DataRow label="Best kw position" value={bestKwPosition > 0 ? bestKwPosition.toFixed(1) : '—'} />
          <DataRow label="Best kw volume" value={bestKwVolume > 0 ? formatNumber(bestKwVolume) : '—'} />
        </div>
      </Card>

      {hasTrend && (
        <Card title="Visibility trend">
          <Sparkline values={seriesOf(page, 'searchVisibilityScore')} tone="info" />
        </Card>
      )}
    </div>
  );
}
