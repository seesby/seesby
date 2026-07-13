import React from 'react';
import {
  DataRow, StatusBadge, Card, MetricPill, TruncatedUrl,
  formatNumber, getMetric,
} from '../../shared';

export default function OurPageTab({ page }: { page: any; hasTrend?: boolean }) {
  const competitor = page?.competitor || page?.competitorData || {};
  const compDomain = competitor.domain || page?.competitorDomain || 'Competitor';

  // Our ranking page
  const url = page?.url || '';
  const title = getMetric(page, 'title') || page?.title || '\u2014';
  const ourPosition = Number(page?.ourPosition ?? page?.ourRank ?? 0);
  const qualityScore = Number(getMetric(page, 'qualityScore') || page?.qualityScore || 0);
  const clicks = Number(getMetric(page, 'gscClicks') || page?.gscClicks || 0);
  const backlinks = Number(getMetric(page, 'backlinksCount') || page?.backlinksCount || 0);
  const freshnessDays = Number(getMetric(page, 'freshnessDays') || page?.freshnessDays || 0);

  // Our structure
  const ourWords = Number(getMetric(page, 'wordCount') || page?.wordCount || 0);
  const ourH2 = Number(getMetric(page, 'h2Count') || page?.h2Count || 0);
  const ourH3 = Number(getMetric(page, 'h3Count') || page?.h3Count || 0);
  const ourTables = Number(getMetric(page, 'tableCount') || page?.tableCount || 0);
  const ourFaq = !!getMetric(page, 'hasFaqSchema') || !!page?.hasFaqSchema;
  const ourReview = !!getMetric(page, 'hasReviewSchema') || !!page?.hasReviewSchema;

  // Competitor structure (for comparison)
  const theirWords = Number(page?.theirWordCount || competitor.wordCount || 0);
  const theirH2 = Number(page?.theirH2Count || competitor.h2Count || 0);
  const theirH3 = Number(page?.theirH3Count || competitor.h3Count || 0);
  const theirBacklinks = Number(page?.theirBacklinks || competitor.backlinks || 0);

  // Weaknesses
  const wordGap = theirWords - ourWords;
  const h2Gap = theirH2 - ourH2;
  const h3Gap = theirH3 - ourH3;
  const blGap = theirBacklinks - backlinks;
  const hasTableGap = ourTables === 0;
  const hasFaqGap = !ourFaq;
  const hasReviewGap = !ourReview;
  const isStale = freshnessDays > 90;

  // Upgrades needed
  const upgrades: string[] = [];
  if (wordGap > 0) upgrades.push(`+${formatNumber(wordGap)} words`);
  if (h2Gap > 0 || h3Gap > 0) upgrades.push(`+${h2Gap + h3Gap} sections`);
  if (hasTableGap) upgrades.push('Add comparison table');
  if (hasFaqGap) upgrades.push('Add FAQ');
  if (isStale) upgrades.push('Refresh date');
  if (hasReviewGap) upgrades.push('Add Review + FAQ schema');
  if (blGap > 0) upgrades.push(`Link from hub`);

  // Alternate pages
  const alternatePages = page?.alternatePages || page?.alternativePages || page?.betterCandidatePages || [];

  // Score (for gauge)
  const healthScore = Number(getMetric(page, 'healthScore') || page?.healthScore || qualityScore || 0);
  const scoreColor = healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-3">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a] border border-[#1a1a1a]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white font-semibold truncate">Our Page</div>
          {url && <div className="text-[11px] text-[#555] font-mono truncate mt-0.5">{url}</div>}
        </div>
        <div className="shrink-0">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1a1a" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={scoreColor}
                strokeWidth="3"
                strokeDasharray={`${(healthScore / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{healthScore}</span>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Words" value={formatNumber(ourWords)} good={ourWords >= 1000} />
        <MetricPill label="H2/H3" value={`${ourH2}/${ourH3}`} />
        <MetricPill label="Clicks" value={formatNumber(clicks)} />
        <MetricPill label="Backlinks" value={formatNumber(backlinks)} />
        <MetricPill label="Updated" value={freshnessDays > 0 ? `${freshnessDays}d` : '\u2014'} good={freshnessDays < 30} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Our weaknesses */}
        <Card title="Our weaknesses">
          <DataRow label="Words" value={wordGap > 0 ? `${formatNumber(ourWords)} vs ${formatNumber(theirWords)} (\u2212${formatNumber(wordGap)})` : `${formatNumber(ourWords)} words`}
            status={wordGap > 500 ? 'fail' : wordGap > 0 ? 'warn' : 'pass'} />
          <DataRow label="H2/H3" value={`${ourH2}/${ourH3} vs ${theirH2}/${theirH3}`}
            status={h2Gap > 3 || h3Gap > 5 ? 'fail' : h2Gap > 0 || h3Gap > 0 ? 'warn' : 'pass'} />
          {!ourFaq && <DataRow label="FAQ" value="No FAQ" status="fail" />}
          {hasTableGap && <DataRow label="Tables" value="No table" status="fail" />}
          {!ourReview && <DataRow label="Review schema" value="No Review schema" status="fail" />}
          <DataRow label="Backlinks" value={`${formatNumber(backlinks)} vs ${formatNumber(theirBacklinks)}`}
            status={blGap > 50 ? 'fail' : blGap > 0 ? 'warn' : 'pass'} />
          <DataRow label="Updated" value={isStale ? `Stale ${freshnessDays}d` : `${freshnessDays}d ago`}
            status={isStale ? 'fail' : freshnessDays > 30 ? 'warn' : 'pass'} />
        </Card>

        {/* Upgrades needed */}
        <Card title="Upgrades needed">
          {upgrades.length > 0 ? (
            <div className="space-y-1.5">
              {upgrades.map((upgrade, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-green-400 text-[11px] shrink-0">+</span>
                  <span className="text-[11px] text-[#ccc] leading-snug">{upgrade}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[#666]">Page is well-optimized.</div>
          )}
        </Card>
      </div>

      {/* Alternate pages */}
      {Array.isArray(alternatePages) && alternatePages.length > 0 && (
        <Card title="Alternate pages we could use">
          <div className="space-y-0">
            {alternatePages.map((alt: any, i: number) => {
              const altUrl = typeof alt === 'string' ? alt : alt.url || '';
              const altQ = alt.qualityScore ?? alt.q ?? null;
              const altClicks = alt.clicks ?? null;
              const altReason = alt.reason || alt.note || '';
              return (
                <div key={i} className="py-2 border-b border-[#111] last:border-b-0">
                  <div className="flex items-center gap-2">
                    {altUrl && <TruncatedUrl url={altUrl} />}
                    {altQ !== null && <StatusBadge status={altQ >= 80 ? 'pass' : altQ >= 50 ? 'warn' : 'fail'} label={`Q ${altQ}`} />}
                    {altClicks !== null && <span className="text-[10px] text-[#666]">{formatNumber(altClicks)} clicks</span>}
                  </div>
                  {altReason && <div className="text-[10px] text-green-400 mt-0.5">{altReason}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
