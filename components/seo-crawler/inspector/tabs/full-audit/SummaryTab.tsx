import React from 'react';
import {
  DataRow, StatusBadge, TruncatedUrl, Card, MetricPill,
  formatNumber, formatPercent, formatDuration, formatBytes, getMetric, getActions,
} from '../../shared';
import { DeltaChip } from '@/components/seo-crawler/right-sidebar/_shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const metaDescLen = Number(getMetric(page, 'metaDescLength') || page?.metaDesc?.length || 0);
  const categoryConfidence = getMetric(page, 'categoryConfidence');
  const wordCount = Number(getMetric(page, 'wordCount') || page?.wordCount || 0);
  const imageCount = Number(getMetric(page, 'imgCount') || page?.imageCount || 0);
  const imgMissingAlt = Number(getMetric(page, 'imgMissingAlt') || page?.imgMissingAlt || 0);
  const internalLinks = Number(getMetric(page, 'internalLinks') || page?.internalLinks || 0);
  const externalLinks = Number(getMetric(page, 'externalOutlinks') || page?.externalOutlinks || 0);
  const brokenLinks = Number(getMetric(page, 'brokenLinks') || page?.brokenLinks || 0);
  const statusCode = Number(getMetric(page, 'statusCode') || page?.statusCode || 0);
  const lcp = Number(getMetric(page, 'lcp') || page?.lcp || 0) || null;
  const cls = Number(getMetric(page, 'cls') || page?.cls || 0) || null;

  const hasArticle = !!getMetric(page, 'hasArticleSchema') || !!page?.hasArticleSchema;
  const hasBreadcrumb = !!getMetric(page, 'hasBreadcrumbSchema') || !!page?.hasBreadcrumbSchema;
  const hasAuthor = !!getMetric(page, 'hasAuthorSchema') || !!page?.hasAuthorSchema;
  const hasFaq = !!getMetric(page, 'hasFaqSchema') || !!page?.hasFaqSchema;

  const healthScore = Number(getMetric(page, 'healthScore') || page?.healthScore || 0);
  const healthTone = healthScore >= 80 ? 'good' : healthScore >= 50 ? 'mid' : 'bad';

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)] to-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{getMetric(page, 'title') || page?.title || 'Untitled'}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        {healthScore > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={healthTone === 'good' ? '#22c55e' : healthTone === 'mid' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${(healthScore / 100) * 94.25} 94.25`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--brand-text-strong)]">{healthScore}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Words" value={formatNumber(wordCount)} good={wordCount >= 300} />
        <MetricPill label="Images" value={formatNumber(imageCount)} good={imgMissingAlt === 0} sub={imgMissingAlt > 0 ? `${imgMissingAlt} alt missing` : undefined} />
        <MetricPill label="Links" value={`${formatNumber(internalLinks)}\u2009/\u2009${formatNumber(externalLinks)}`} />
        <MetricPill label="Broken" value={formatNumber(brokenLinks)} good={brokenLinks === 0} />
        <MetricPill label="Schema" value={`${[hasArticle, hasBreadcrumb, hasAuthor, hasFaq].filter(Boolean).length}/4`} good={[hasArticle, hasBreadcrumb, hasAuthor, hasFaq].some(Boolean)} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Row 1: Identity + Crawl */}
        {/* Identity */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Identity</div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">Title</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{getMetric(page, 'title') || page?.title || '\u2014'}</div>
          </div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">H1</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{getMetric(page, 'h1_1') || page?.h1_1 || '\u2014'}</div>
          </div>
          <div className="space-y-0">
            <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
            <DataRow label="Canonical" value={<TruncatedUrl url={String(page?.canonical || '')} />}
              status={page?.canonical && page.canonical !== page.url ? 'info' : 'pass'} />
            <DataRow label="Language" value={getMetric(page, 'language') || page?.language} />
            <DataRow label="Meta desc" value={metaDescLen > 0 ? `${metaDescLen} chars` : '\u2014'}
              status={metaDescLen >= 120 && metaDescLen <= 155 ? 'pass' : metaDescLen > 0 ? 'warn' : 'fail'} />
          </div>
        </div>

        {/* Crawl */}
        <Card title="Crawl">
          <DataRow label="Status" value={statusCode || '\u2014'}
            status={statusCode >= 400 ? 'fail' : statusCode >= 300 ? 'info' : 'pass'} />
          <DataRow label="TTFB" value={formatDuration(getMetric(page, 'loadTime') || page?.loadTime)} />
          <DataRow label="Render" value={getMetric(page, 'renderType') || page?.renderType || 'static'} />
          <DataRow label="Size" value={
            getMetric(page, 'sizeBytes') || page?.sizeBytes
              ? formatBytes(getMetric(page, 'sizeBytes') || page?.sizeBytes)
              : '\u2014'
          } />
          <DataRow label="Depth" value={formatNumber(getMetric(page, 'crawlDepth') || page?.crawlDepth)} mono />
          <DataRow label="First seen" value={getMetric(page, 'firstSeenDate') || page?.firstSeenDate} />
          <DataRow label="Last crawl" value={getMetric(page, 'lastCrawlDate') || page?.lastCrawlDate} />
        </Card>

        {/* Row 2: Signals + Flags */}
        {/* Signals */}
        <Card title="Signals">
          {hasTrend && (
            <>
              <DataRow label="Clicks" value={
                <span className="inline-flex items-center gap-1.5">
                  {formatNumber(getMetric(page, 'gscClicks') || page?.gscClicks)}
                  <DeltaChip value={Number(getMetric(page, 'gscClicksDelta') || page?.gscClicksDelta || 0)} />
                </span>
              } />
              <DataRow label="Impressions" value={
                <span className="inline-flex items-center gap-1.5">
                  {formatNumber(getMetric(page, 'gscImpressions') || page?.gscImpressions)}
                  <DeltaChip value={Number(getMetric(page, 'gscImpressionsDelta') || page?.gscImpressionsDelta || 0)} />
                </span>
              } />
            </>
          )}
          <DataRow label="Position" value={formatNumber(getMetric(page, 'gscPosition') || page?.gscPosition, { maximumFractionDigits: 1 })} />
          <DataRow label="CTR" value={formatPercent(getMetric(page, 'gscCtr') || page?.gscCtr, 100)} />
          <DataRow label="Keywords" value={formatNumber(getMetric(page, 'keywordsRanked') || page?.keywordsRanked)} />
          <DataRow label="Backlinks" value={formatNumber(getMetric(page, 'backlinksCount') || page?.backlinksCount)} />
        </Card>

        {/* Flags */}
        <Card title="Flags">
          <FlagRow label="Missing author" fail={getMetric(page, 'missingAuthorSchema') || page?.missingAuthorSchema} />
          <FlagRow label="Thin vs cluster" fail={getMetric(page, 'thinVsClusterAvg') || page?.thinVsClusterAvg} />
          <FlagRow label="0 ranking kw" fail={Number(getMetric(page, 'keywordsRanked') || page?.keywordsRanked || 0) === 0} />
          <FlagRow label={`Stale ${getMetric(page, 'staleDays') || page?.staleDays || '\u2014'}d`}
            fail={Number(getMetric(page, 'staleDays') || page?.staleDays || 0) > 90} />
          <FlagRow label="Missing alt" fail={imgMissingAlt > 0} />
          <FlagRow label="Broken links" fail={brokenLinks > 0} />
          {lcp !== null && <FlagRow label="LCP poor" fail={lcp > 2500} />}
          {cls !== null && <FlagRow label="CLS poor" fail={cls > 0.1} />}
        </Card>
      </div>

      {/* Issues summary */}
      {actions.length > 0 && (
        <Card title={`Issues (${actions.length})`}>
          <div className="space-y-0">
            {actions.slice(0, 5).map((a: any, i: number) => (
              <div key={`${a.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[var(--brand-surface-2)] last:border-b-0">
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
                  <div className="text-[11px] text-[var(--brand-text-mid)] font-medium">{a.label}</div>
                  {(a.description || a.reason) && (
                    <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5 line-clamp-1">{a.description || a.reason}</div>
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

function FlagRow({ label, fail }: { label: string; fail: any }) {
  const isFail = !!fail;
  return (
    <div className="flex items-center justify-between py-[3px] text-[11px]">
      <span className="text-[var(--brand-text-faint)]">{label}</span>
      <span className={`text-[10px] font-medium ${isFail ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>
        {isFail ? 'Yes' : 'No'}
      </span>
    </div>
  );
}
