import React from 'react';
import {
  DataRow, Card, MetricPill, TruncatedUrl, StatusBadge,
  formatNumber, formatDuration, formatBytes, getMetric, getActions,
} from '../../shared';

function FlagRow({ label, fail }: { label: string; fail: boolean }) {
  return (
    <div className="flex items-center justify-between py-[3px] text-[11px]">
      <span className="text-[var(--brand-text-faint)]]">{label}</span>
      <span className={`text-[10px] font-medium ${fail ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>
        {fail ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const statusCode = Number(getMetric(page, 'statusCode') || page?.statusCode || 0);
  const renderType = page?.renderType || page?.jsRenderDiff
    ? (Number(page?.jsRenderDiff?.textDiffPercent || 0) > 10 ? 'CSR' : 'SSR')
    : 'static';
  const isHttps = String(page?.url || '').startsWith('https://');
  const indexable = page?.indexable !== false;
  const canonical = getMetric(page, 'canonical') || page?.canonical || '';
  const canonicalSelf = canonical === page?.url;

  const cwvLcp = Number(page?.lcp || 0);
  const cwvCls = Number(page?.cls || 0);
  const cwvInp = Number(page?.inp || 0);
  const cwvBucket =
    cwvLcp <= 2500 && cwvCls <= 0.1 && cwvInp <= 200 ? 'Good' :
    cwvLcp <= 4000 && cwvCls <= 0.25 && cwvInp <= 500 ? 'Needs Work' : 'Poor';

  const domNodes = Number(getMetric(page, 'domNodeCount') || page?.domNodeCount || 0);
  const secScore = Number(getMetric(page, 'securityScore') || page?.securityScore || 0);
  const a11yScore = Number(getMetric(page, 'accessibilityScore') || page?.accessibilityScore || 0);

  const metaRobots = page?.metaRobots1 || page?.metaRobots || '';
  const isNoindex = /noindex/i.test(metaRobots);

  const topIssues = actions
    .filter((a: any) => /technical|crawl|render|status|index|speed|https|security|accessibility/i.test(a.label || a.title || ''))
    .slice(0, 5);

  // Compute tech score from individual checks when server score isn't available
  const serverScore = Number(getMetric(page, 'techScore') || page?.techScore || page?.healthScore || 0);
  const computedScore = (() => {
    let score = 100;
    if (!isHttps) score -= 15;
    if (statusCode >= 400) score -= 20;
    else if (statusCode >= 300) score -= 5;
    if (renderType === 'CSR') score -= 10;
    if (cwvLcp > 4000) score -= 15;
    else if (cwvLcp > 2500) score -= 5;
    if (cwvCls > 0.25) score -= 10;
    else if (cwvCls > 0.1) score -= 3;
    if (cwvInp > 500) score -= 10;
    else if (cwvInp > 200) score -= 3;
    if (isNoindex) score -= 10;
    if (!indexable) score -= 10;
    if (domNodes > 3000) score -= 10;
    else if (domNodes > 1500) score -= 5;
    if (!canonical) score -= 5;
    return Math.max(0, Math.min(100, score));
  })();
  const healthScore = serverScore || (secScore && a11yScore ? Math.round((secScore + a11yScore) / 2) : (secScore || a11yScore || computedScore));
  const healthTone = healthScore >= 80 ? 'good' : healthScore >= 50 ? 'mid' : 'bad';
  const gaugeColor = healthTone === 'good' ? '#22c55e' : healthTone === 'mid' ? '#f59e0b' : '#ef4444';
  const gaugeDash = (healthScore / 100) * 94.25;

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)]] to-[var(--brand-surface-0)]] border border-[var(--brand-surface-3)]]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{page?.title || 'Untitled'}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)]] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={gaugeColor} strokeWidth="3" strokeDasharray={`${gaugeDash} 94.25`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-[var(--brand-text-strong)]">{healthScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Score" value={String(healthScore)} good={healthScore >= 80} />
        <MetricPill label="Status" value={String(statusCode || '—')} good={statusCode >= 200 && statusCode < 400} />
        <MetricPill label="Render" value={renderType} good={renderType !== 'CSR'} />
        <MetricPill label="CWV" value={cwvBucket} good={cwvBucket === 'Good'} />
        <MetricPill label="HTTPS" value={isHttps ? 'Yes' : 'No'} good={isHttps} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Identity */}
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)]] mb-2.5">Identity</div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-0.5">Title</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{page?.title || '—'}</div>
          </div>
          <div className="space-y-0">
            <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
            <DataRow label="Canonical" value={<TruncatedUrl url={String(canonical || '')} />}
              status={canonical ? (canonicalSelf ? 'pass' : 'info') : 'warn'} />
            <DataRow label="Language" value={page?.language || page?.lang || '—'} />
            <DataRow label="Meta robots" value={metaRobots || '—'} status={isNoindex ? 'fail' : 'pass'} />
          </div>
        </div>

        {/* Delivery */}
        <Card title="Delivery">
          <DataRow label="Status" value={statusCode || '—'}
            status={statusCode >= 400 ? 'fail' : statusCode >= 300 ? 'info' : 'pass'} />
          <DataRow label="TTFB" value={formatDuration(page?.ttfb || page?.loadTime)} />
          <DataRow label="HTTPS" value={isHttps ? 'Yes' : 'No'} status={isHttps ? 'pass' : 'fail'} />
          <DataRow label="HTTP version" value={page?.httpVersion || '—'} />
          <DataRow label="Size" value={formatBytes(page?.sizeBytes)} />
          <DataRow label="Depth" value={formatNumber(page?.crawlDepth)} mono />
        </Card>

        {/* Index */}
        <Card title="Index">
          <DataRow label="Indexable" value={indexable ? 'Yes' : 'No'} status={indexable ? 'pass' : 'fail'} />
          <DataRow label="In sitemap" value={page?.inSitemap ? 'Yes' : 'No'} status={page?.inSitemap ? 'pass' : 'warn'} />
          <DataRow label="Canonical" value={canonical ? (canonicalSelf ? 'Self' : 'External') : 'Missing'}
            status={canonicalSelf ? 'pass' : canonical ? 'info' : 'warn'} />
          <DataRow label="Render type" value={renderType} />
          <DataRow label="DOM nodes" value={formatNumber(domNodes)} status={domNodes > 1500 ? 'warn' : 'pass'} />
        </Card>

        {/* Risks */}
        <Card title="Risks">
          <FlagRow label="CSR indexable" fail={renderType === 'CSR'} />
          <FlagRow label={`LCP ${(cwvLcp / 1000).toFixed(1)}s`} fail={cwvLcp > 2500} />
          <FlagRow label={`CLS ${cwvCls.toFixed(3)}`} fail={cwvCls > 0.1} />
          <FlagRow label="Noindex" fail={isNoindex} />
          <FlagRow label="Not HTTPS" fail={!isHttps} />
          <FlagRow label="DOM too large" fail={domNodes > 1500} />
          <FlagRow label="Security low" fail={secScore > 0 && secScore < 80} />
          <FlagRow label="A11y low" fail={a11yScore > 0 && a11yScore < 80} />
        </Card>
      </div>

      {/* Issues */}
      {topIssues.length > 0 && (
        <Card title={`Issues (${topIssues.length})`}>
          <div className="space-y-0">
            {topIssues.map((a: any, i: number) => (
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
