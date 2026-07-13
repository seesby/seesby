import React from 'react';
import {
  DataRow, StatusBadge, Card, MetricPill, TruncatedUrl,
  formatNumber, formatPercent, getActions,
} from '../../shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const competitor = page?.competitor || page?.competitorData || {};
  const compDomain = competitor.domain || page?.competitorDomain || 'Competitor';

  // Topic
  const topic = page?.topic || page?.query || page?.keyword || '';
  const volume = page?.volume || page?.searchVolume || competitor.volume || 0;
  const intent = page?.intent || page?.searchIntent || competitor.intent || '';

  // Positions
  const ourPosition = Number(page?.ourPosition ?? page?.ourRank ?? competitor.ourPosition ?? 0);
  const theirPosition = Number(page?.theirPosition ?? page?.competitorRank ?? competitor.position ?? 0);
  const competitors = page?.competitors || page?.competitorRankings || [];
  const serpFeatures = page?.serpFeatures || page?.serpFeaturesPresent || [];
  const otherCompetitors = competitors.slice(0, 3);

  // Content
  const ourWordCount = Number(page?.ourWordCount || page?.wordCount || 0);
  const theirWordCount = Number(page?.theirWordCount || competitor.wordCount || 0);

  // Links
  const ourBacklinks = Number(page?.ourBacklinks || page?.backlinksCount || 0);
  const theirBacklinks = Number(page?.theirBacklinks || competitor.backlinks || 0);

  // Gap size
  const positionGap = ourPosition > 0 && theirPosition > 0 ? ourPosition - theirPosition : 0;
  const estimatedClicksLost = page?.estimatedClicksLost || page?.clicksLost || 0;

  // Opportunity
  const catchability = page?.catchability || page?.gapType || competitor.catchability || '';
  const catchabilityLevel = page?.catchabilityLevel || page?.opportunityLevel || competitor.catchabilityLevel || '';
  const recommendedAction = page?.recommendedAction || page?.suggestedAction || competitor.recommendedAction || '';
  const forecast = page?.forecast || page?.positionForecast || competitor.forecast || null;

  // Score (for gauge)
  const competitiveScore = Number(page?.competitiveScore || competitor.score || 0);
  const scoreColor = competitiveScore >= 70 ? '#22c55e' : competitiveScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-3">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)]] to-[var(--brand-surface-0)]] border border-[var(--brand-surface-3)]]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{topic || compDomain}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)]] mt-0.5">
            {compDomain} vs <span className="text-[var(--brand-text-mid)]]">{page?.domain || 'your site'}</span>
          </div>
        </div>
        <div className="shrink-0">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={scoreColor}
                strokeWidth="3"
                strokeDasharray={`${(competitiveScore / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--brand-text-strong)]">{competitiveScore}</span>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Volume" value={volume ? formatNumber(volume) : '\u2014'} />
        <MetricPill label="Us" value={ourPosition ? `#${ourPosition}` : '\u2014'} good={ourPosition > 0 && ourPosition <= 10} />
        <MetricPill label={compDomain} value={theirPosition ? `#${theirPosition}` : '\u2014'} good={theirPosition > 0 && theirPosition <= 10} />
        <MetricPill label="Words" value={`${formatNumber(ourWordCount)} vs ${formatNumber(theirWordCount)}`} />
        <MetricPill label="Backlinks" value={`${formatNumber(ourBacklinks)} vs ${formatNumber(theirBacklinks)}`} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Positions */}
        <Card title="Positions">
          <DataRow label="Us" value={ourPosition ? `pos ${ourPosition}` : '\u2014'}
            status={ourPosition > 0 ? (ourPosition <= 3 ? 'pass' : ourPosition <= 10 ? 'warn' : 'fail') : 'info'} />
          <DataRow label={compDomain} value={theirPosition ? `pos ${theirPosition}` : '\u2014'}
            status={theirPosition > 0 ? (theirPosition <= 3 ? 'pass' : theirPosition <= 10 ? 'warn' : 'fail') : 'info'} />
          {otherCompetitors.map((comp: any, i: number) => {
            const name = comp.domain || comp.name || `Comp ${i + 1}`;
            const pos = comp.position ?? comp.rank ?? null;
            return pos ? (
              <DataRow key={i} label={name} value={`pos ${pos}`}
                status={pos <= 3 ? 'pass' : pos <= 10 ? 'warn' : 'fail'} />
            ) : null;
          })}
          {serpFeatures.length > 0 && (
            <DataRow label="SERP features" value={serpFeatures.join(', ')} />
          )}
        </Card>

        {/* Gap Size + Opportunity */}
        <Card title="Gap & Opportunity">
          <DataRow label="Position gap" value={positionGap ? `${positionGap > 0 ? '+' : ''}${positionGap} positions` : '\u2014'}
            status={positionGap > 0 ? 'fail' : positionGap < 0 ? 'pass' : 'info'} mono />
          <DataRow label="Est. clicks lost" value={estimatedClicksLost ? `${formatNumber(estimatedClicksLost)}/mo` : '\u2014'}
            status={estimatedClicksLost > 0 ? 'fail' : 'pass'} mono />
          {catchability && (
            <DataRow label="Catchability" value={
              <span className="inline-flex items-center gap-1.5">
                <StatusBadge
                  status={catchability === 'catchable' ? 'pass' : catchability === 'aspirational' ? 'warn' : 'info'}
                  label={catchability}
                />
                {catchabilityLevel && <StatusBadge
                  status={catchabilityLevel === 'high' ? 'pass' : catchabilityLevel === 'medium' ? 'warn' : 'fail'}
                  label={catchabilityLevel}
                />}
              </span>
            } />
          )}
          {recommendedAction && (
            <DataRow label="Action" value={recommendedAction} />
          )}
          {forecast && (
            <DataRow label="Forecast" value={forecast} />
          )}
        </Card>
      </div>

      {/* Issues */}
      {actions.length > 0 && (
        <Card title={`Issues (${actions.length})`}>
          <div className="space-y-0">
            {actions.slice(0, 5).map((a: any, i: number) => (
              <div key={`${a.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[var(--brand-surface-2)]] last:border-b-0">
                <div className="mt-0.5">
                  {a.type === 'error' || a.severity === 'CRITICAL' || a.severity === 'HIGH' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  ) : a.type === 'warning' || a.severity === 'MEDIUM' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--brand-text-mid)]] font-medium">{a.label}</div>
                  {(a.description || a.reason) && (
                    <div className="text-[10px] text-[var(--brand-border-2)]] mt-0.5 line-clamp-1">{a.description || a.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
