import React from 'react';
import {
  DataRow, Card, MetricPill, TruncatedUrl,
  formatNumber, formatDuration, formatBytes, getMetric, getActions,
} from '../../../inspector/shared';
import { DeltaChip } from '@/components/seo-crawler/right-sidebar/_shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const topAction = actions[0];
  const healthScore = Number(getMetric(page, 'healthScore') || 0);
  const healthTone = healthScore >= 80 ? 'good' : healthScore >= 50 ? 'mid' : 'bad';
  const metaDescLen = Number(getMetric(page, 'metaDescLength') || page?.metaDesc?.length || 0);
  const h1 = getMetric(page, 'h1') || page?.h1_1 || page?.h1 || '';
  const title = getMetric(page, 'title') || page?.title || '';
  const canonical = getMetric(page, 'canonical') || page?.canonical || 'self';
  const language = page?.language || 'en';

  // Crawl
  const statusCode = Number(getMetric(page, 'statusCode') || page?.statusCode || 0);
  const renderType = getMetric(page, 'renderType') || page?.renderType || 'static';
  const sizeBytes = getMetric(page, 'sizeBytes') || page?.sizeBytes;
  const crawlDepth = Number(getMetric(page, 'crawlDepth') || page?.crawlDepth || 0);
  const firstSeen = getMetric(page, 'firstSeenDate') || page?.firstSeenDate;
  const lastCrawl = getMetric(page, 'lastCrawlDate') || page?.lastCrawlDate;

  // Schema
  const hasArticle = !!getMetric(page, 'hasArticleSchema');
  const hasBreadcrumb = !!getMetric(page, 'hasBreadcrumbSchema');
  const hasAuthor = !!getMetric(page, 'hasAuthorSchema');
  const hasFaq = !!getMetric(page, 'hasFaqSchema');
  const hasWebPage = !!getMetric(page, 'hasWebPageSchema');
  const hasHowTo = !!getMetric(page, 'hasHowToSchema');
  const hasReview = !!getMetric(page, 'hasReviewSchema');

  // Signals
  const clicks = Number(getMetric(page, 'gscClicks') || page?.gscClicks || 0);
  const impressions = Number(getMetric(page, 'gscImpressions') || page?.gscImpressions || 0);
  const ctr = Number(getMetric(page, 'gscCtr') || page?.gscCtr || 0);
  const position = Number(getMetric(page, 'gscPosition') || page?.gscPosition || 0);
  const kwRanked = Number(getMetric(page, 'kwRanked') || page?.kwRanked || 0);
  const backlinks = Number(getMetric(page, 'backlinksCount') || page?.backlinksCount || 0);
  const words = Number(getMetric(page, 'wordCount') || page?.wordCount || 0);
  const inlinks = Number(getMetric(page, 'inlinks') || page?.inlinks || 0);
  const clicksDelta = Number(page?.clicksDelta || 0);
  const imprDelta = Number(page?.imprDelta || 0);
  const ctrDelta = Number(page?.ctrDelta || 0);
  const posDelta = Number(page?.posDelta || 0);

  // Decision
  const recommendation = topAction?.label || (healthScore >= 80 ? 'Monitor' : 'Improve');
  const recType = recommendation.toLowerCase().includes('rewrite') ? 'REWRITE + EXPAND'
    : recommendation.toLowerCase().includes('expand') ? 'EXPAND'
    : recommendation.toLowerCase().includes('fix') ? 'FIX'
    : recommendation;

  const gaugeColor = healthTone === 'good' ? '#22c55e' : healthTone === 'mid' ? '#f59e0b' : '#ef4444';
  // Circumference of circle with r=15: 2 * PI * 15 = 94.25
  const gaugeDash = (healthScore / 100) * 94.25;

  // Quick metrics
  const imageCount = Number(getMetric(page, 'imgCount') || page?.imageCount || 0);
  const imgMissingAlt = Number(getMetric(page, 'imgMissingAlt') || page?.imgMissingAlt || 0);
  const internalLinksCount = Number(getMetric(page, 'internalLinks') || page?.internalLinks || 0);
  const externalLinksCount = Number(getMetric(page, 'externalOutlinks') || page?.externalOutlinks || 0);
  const brokenLinks = Number(getMetric(page, 'brokenLinks') || page?.brokenLinks || 0);
  const schemaCount = [hasArticle, hasBreadcrumb, hasAuthor, hasFaq, hasWebPage, hasHowTo, hasReview].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)]] to-[var(--brand-surface-0)]] border border-[var(--brand-surface-3)]]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{title || 'Untitled'}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)]] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        {healthScore > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={gaugeColor} strokeWidth="3"
                  strokeDasharray={`${gaugeDash} 94.25`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-[var(--brand-text-strong)]">{healthScore}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Words" value={formatNumber(words)} good={words >= 300} />
        <MetricPill label="Images" value={formatNumber(imageCount)} good={imgMissingAlt === 0} sub={imgMissingAlt > 0 ? `${imgMissingAlt} alt missing` : undefined} />
        <MetricPill label="Links" value={`${formatNumber(internalLinksCount)}\u2009/\u2009${formatNumber(externalLinksCount)}`} />
        <MetricPill label="Broken" value={formatNumber(brokenLinks)} good={brokenLinks === 0} />
        <MetricPill label="Schema" value={`${schemaCount}/7`} good={schemaCount >= 3} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Identity */}
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)]] mb-2.5">Identity</div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-0.5">Title</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{title || '\u2014'}</div>
          </div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-0.5">H1</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{h1 || '\u2014'}</div>
          </div>
          <div className="space-y-0">
            <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
            <DataRow label="Canonical" value={<TruncatedUrl url={String(canonical || '')} />}
              status={canonical && canonical !== page?.url ? 'info' : 'pass'} />
            <DataRow label="Language" value={language} />
            <DataRow label="Meta desc" value={metaDescLen > 0 ? `${metaDescLen} chars` : '\u2014'}
              status={metaDescLen >= 120 && metaDescLen <= 155 ? 'pass' : metaDescLen > 0 ? 'warn' : 'fail'} />
          </div>
        </div>

        {/* Crawl */}
        <Card title="Crawl">
          <DataRow label="Status" value={statusCode || '\u2014'}
            status={statusCode >= 400 ? 'fail' : statusCode >= 300 ? 'info' : 'pass'} />
          <DataRow label="Render" value={renderType} />
          <DataRow label="Size" value={sizeBytes ? formatBytes(sizeBytes) : '\u2014'} />
          <DataRow label="Depth" value={crawlDepth || '\u2014'} mono />
          <DataRow label="First seen" value={firstSeen || '\u2014'} />
          <DataRow label="Last crawl" value={lastCrawl || '\u2014'} />
        </Card>

        {/* Signals */}
        <Card title="Signals">
          <div className="space-y-0">
            {[
              { label: 'Q score', value: String(healthScore), delta: hasTrend ? Number(page?.healthDelta || 0) : null },
              { label: 'Clicks', value: formatNumber(clicks), delta: hasTrend && clicksDelta !== 0 ? clicksDelta : null },
              { label: 'Impr.', value: formatNumber(impressions), delta: hasTrend && imprDelta !== 0 ? imprDelta : null },
              { label: 'CTR', value: ctr > 0 ? `${(ctr * 100).toFixed(1)}%` : '\u2014', delta: hasTrend && ctrDelta !== 0 ? ctrDelta : null },
              { label: 'Pos.', value: position > 0 ? position.toFixed(1) : '\u2014', delta: hasTrend && posDelta !== 0 ? posDelta : null },
              { label: 'Kw ranked', value: formatNumber(kwRanked) },
              { label: 'Backlinks', value: formatNumber(backlinks) },
              { label: 'Words', value: formatNumber(words) },
              { label: 'In-links', value: formatNumber(inlinks) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1 border-b border-[var(--brand-surface-2)]] last:border-b-0">
                <span className="text-[10px] text-[var(--brand-text-faint)]]">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--brand-text-strong)] font-mono">{row.value}</span>
                  {row.delta !== null && row.delta !== undefined && <DeltaChip value={row.delta} />}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Schema + Decision */}
        <div className="space-y-3">
          <Card title="Schema">
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'Article', present: hasArticle },
                { key: 'Breadcrumb', present: hasBreadcrumb },
                { key: 'Author', present: hasAuthor },
                { key: 'FAQ', present: hasFaq },
                { key: 'WebPage', present: hasWebPage },
                { key: 'HowTo', present: hasHowTo },
                { key: 'Review', present: hasReview },
              ].map(s => (
                <div key={s.key} className={`flex items-center justify-between px-3 py-2 rounded-md text-[11px] ${
                  s.present ? 'bg-[#22c55e]/5 border border-[#22c55e]/20' : 'bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-3)]]'
                }`}>
                  <span className="text-[var(--brand-text-mid)]]">{s.key}</span>
                  <span className={`text-[10px] font-medium ${s.present ? 'text-[#22c55e]' : 'text-[var(--brand-text-faint)]]'}`}>
                    {s.present ? '\u2713' : '\u2717'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Decision">
            <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
              <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest mb-1">Recommendation</div>
              <div className="text-[13px] font-bold text-[var(--brand-text-strong)]">{recType}</div>
            </div>
            {topAction && (
              <>
                <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
                  <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest mb-1">Why</div>
                  <div className="text-[10px] text-[var(--brand-text-mid)]] leading-relaxed">{topAction.description || topAction.reason || '\u2014'}</div>
                </div>
                {topAction.targetKeyword && (
                  <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
                    <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest mb-1">Target</div>
                    <div className="text-[10px] text-[var(--brand-text-mid)]]">Keyword: &ldquo;{topAction.targetKeyword}&rdquo;</div>
                    {topAction.targetWords && <div className="text-[10px] text-[var(--brand-text-mid)]]">Length: {formatNumber(topAction.targetWords)}w</div>}
                  </div>
                )}
                <div className="mb-2">
                  <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest mb-1">Forecast</div>
                  <div className="text-[10px] text-[var(--brand-text-mid)]]">
                    Q: {healthScore} &rarr; {healthScore + Math.round(Number(topAction.estimatedImpact || 0) / 10)}
                    {topAction.estimatedImpact ? <span className="text-[#22c55e]"> +{topAction.estimatedImpact}</span> : ''}
                  </div>
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--brand-surface-2)]]">
              <button className="px-2 py-1 text-[9px] font-medium uppercase tracking-widest bg-[var(--brand-surface-3)]] border border-[var(--brand-border-3)]] rounded text-[var(--brand-text-strong)] hover:bg-[var(--brand-border-2)]] transition-colors">
                Approve
              </button>
              <button className="px-2 py-1 text-[9px] font-medium uppercase tracking-widest bg-[var(--brand-surface-0)]] border border-[var(--brand-border-3)]] rounded text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] hover:border-[var(--brand-border-2)]] transition-colors">
                Edit
              </button>
              <button className="px-2 py-1 text-[9px] font-medium uppercase tracking-widest bg-[var(--brand-surface-0)]] border border-[var(--brand-border-3)]] rounded text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] hover:border-[var(--brand-border-2)]] transition-colors">
                Dismiss
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
