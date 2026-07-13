import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatBytes, formatDuration, getMetric,
} from '../../../inspector/shared';
import CollapseGroup from '../parts/CollapseGroup';

function CwvGauge({ label, value, unit, good, warn }: {
  label: string; value: number | null; unit: string; good: number; warn: number;
}) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
        <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest">{label}</div>
        <div className="text-[20px] font-bold mt-1 text-[var(--brand-surface-4)]">\u2014</div>
      </div>
    );
  }
  const tone = value <= good ? 'good' : value <= warn ? 'mid' : 'bad';
  const colorText = tone === 'good' ? 'text-[#22c55e]' : tone === 'mid' ? 'text-[#f59e0b]' : 'text-[#ef4444]';
  const colorBar = tone === 'good' ? '#22c55e' : tone === 'mid' ? '#f59e0b' : '#ef4444';
  const pct = Math.min(100, Math.round((value / (warn * 1.2)) * 100));
  return (
    <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
      <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest">{label}</div>
      <div className={`text-[20px] font-bold mt-1 ${colorText}`}>{value.toFixed(unit === '' ? 3 : 0)}{unit}</div>
      <div className="mt-2 h-1.5 bg-[var(--brand-surface-3)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colorBar }} />
      </div>
      <div className="flex justify-between text-[8px] text-[var(--brand-surface-4)] mt-1">
        <span>\u2264 {good}{unit}</span>
        <span>&gt; {warn}{unit}</span>
      </div>
    </div>
  );
}

export default function TechTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const lcp = Number(getMetric(page, 'lcp') || page?.lcp || 0) || null;
  const cls = Number(getMetric(page, 'cls') || page?.cls || 0) || null;
  const inp = Number(getMetric(page, 'inp') || page?.inp || 0) || null;
  const statusCode = Number(getMetric(page, 'statusCode') || page?.statusCode || 0);
  const sizeBytes = Number(getMetric(page, 'sizeBytes') || page?.sizeBytes || 0);
  const htmlSize = Number(getMetric(page, 'htmlSize') || page?.htmlSize || 0);
  const cssSize = Number(getMetric(page, 'cssSize') || page?.cssSize || 0);
  const jsSize = Number(getMetric(page, 'jsSize') || page?.jsSize || 0);
  const imgSize = Number(getMetric(page, 'imageSize') || page?.imageSize || 0);
  const fontSize = Number(getMetric(page, 'fontSize') || page?.fontSize || 0);
  const otherSize = Math.max(0, sizeBytes - htmlSize - cssSize - jsSize - imgSize - fontSize);
  const imgCount = Number(getMetric(page, 'imgCount') || page?.imgCount || 0);
  const imgMissingAlt = Number(getMetric(page, 'imgMissingAlt') || page?.imgMissingAlt || 0);
  const lazyImages = Number(page?.lazyImages || getMetric(page, 'lazyLoadedImages') || page?.lazyLoadedImages || 0);
  const srcsetCount = Number(getMetric(page, 'srcsetImages') || page?.srcsetImages || 0);
  const missingDims = Number(getMetric(page, 'imagesMissingDimensions') || page?.imagesMissingDimensions || 0);
  const scriptCount = Number(page?.scriptCount || 0);
  const styleCount = Number(page?.styleCount || 0);
  const ttfb = Number(getMetric(page, 'loadTime') || page?.loadTime || 0);
  const domTime = Number(page?.domTime || 0);
  const renderType = getMetric(page, 'renderType') || page?.renderType || 'static';
  const encoding = page?.encoding || 'utf-8';
  const httpVersion = formatNumber(page?.httpVersion || 2);
  const gzSize = Number(page?.compressedSize || 0);
  const domNodes = Number(getMetric(page, 'domNodeCount') || page?.domNodeCount || 0);
  const renderBlockingCss = Number(getMetric(page, 'renderBlockingCss') || page?.renderBlockingCss || 0);
  const renderBlockingJs = Number(getMetric(page, 'renderBlockingJs') || page?.renderBlockingJs || 0);
  const totalRenderBlocking = renderBlockingCss + renderBlockingJs;

  const headers: Array<[string, unknown]> =
    page?.responseHeaders && typeof page.responseHeaders === 'object'
      ? Object.entries(page.responseHeaders)
      : [];
  const redirects: string[] = Array.isArray(page?.redirectChain) ? page.redirectChain : [];

  // Page weight breakdown
  const sizeBreakdown = [
    { label: 'HTML', size: htmlSize, color: '#60a5fa' },
    { label: 'CSS', size: cssSize, color: '#a78bfa' },
    { label: 'JS', size: jsSize, color: '#f59e0b' },
    { label: 'Images', size: imgSize, color: '#22c55e' },
    { label: 'Fonts', size: fontSize, color: '#f472b6' },
    { label: 'Other', size: otherSize, color: '#6b7280' },
  ].filter(s => s.size > 0);

  return (
    <div className="space-y-3">
      {/* Quick metrics strip */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Status" value={statusCode ? String(statusCode) : '\u2014'} good={statusCode >= 200 && statusCode < 400} />
        <MetricPill label="TTFB" value={ttfb ? `${ttfb}ms` : '\u2014'} good={ttfb > 0 && ttfb < 800} />
        <MetricPill label="Size" value={sizeBytes ? formatBytes(sizeBytes) : '\u2014'} />
        <MetricPill label="Render" value={renderType} />
        <MetricPill label="Blocking" value={formatNumber(totalRenderBlocking)} good={totalRenderBlocking === 0} />
      </div>

      {/* CWV Gauges */}
      <div className="grid grid-cols-3 gap-2">
        <CwvGauge label="LCP" value={lcp} unit="ms" good={2500} warn={4000} />
        <CwvGauge label="CLS" value={cls} unit="" good={0.1} warn={0.25} />
        <CwvGauge label="INP" value={inp} unit="ms" good={200} warn={500} />
      </div>

      {/* Row 1: Crawl & Render + Indexability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Crawl & Render">
          <DataRow label="First byte" value={ttfb ? `${ttfb}ms   DOM ${domTime}ms` : '\u2014'} />
          <DataRow label="Size (raw / gz)" value={sizeBytes ? `${formatBytes(sizeBytes)} / ${gzSize ? formatBytes(gzSize) : '\u2014'}` : '\u2014'} />
          <DataRow label="HTTP" value={httpVersion} />
          <DataRow label="Encoding" value={encoding} />
        </Card>
        <Card title="Indexability">
          <DataRow label="robots.txt" value={page?.robotsDirective || 'allow'} />
          <DataRow label="meta robots" value={page?.metaRobots || 'index, follow'} />
          <DataRow label="Canonical" value={page?.canonical ? (page.canonical === page.url ? 'self' : page.canonical) : '\u2014'} />
          <DataRow label="x-robots" value={page?.xRobotsTag || '\u2014'} />
          <DataRow label="hreflang" value={page?.hreflang || '\u2014'} />
          <DataRow label="Sitemaps" value={page?.sitemapRef || '\u2014'} status={page?.sitemapRef ? 'pass' : 'warn'} />
        </Card>
      </div>

      {/* Row 2: Timing + Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Timing & Rendering">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <MetricPill label="DOM nodes" value={formatNumber(domNodes)} good={domNodes < 800} />
            <MetricPill label="3P scripts" value={formatNumber(getMetric(page, 'thirdPartyScriptCount') || page?.thirdPartyScriptCount)} />
          </div>
          <DataRow label="DNS time" value={formatDuration(getMetric(page, 'dnsResolutionTime') || page?.dnsResolutionTime)} />
        </Card>
        <Card title="Security / Privacy">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
            <DataRow label="HTTPS" value={page?.https !== false ? '\u2713' : '\u2717'} status={page?.https !== false ? 'pass' : 'fail'} />
            <DataRow label="HSTS" value={page?.hsts ? '\u2713' : '\u2717'} status={page?.hsts ? 'pass' : 'warn'} />
            <DataRow label="CSP" value={page?.csp ? '\u2713' : '\u2717'} status={page?.csp ? 'pass' : 'warn'} />
            <DataRow label="X-Frame" value={page?.xFrameOptions ? '\u2713' : '\u2717'} status={page?.xFrameOptions ? 'pass' : 'info'} />
          </div>
          <DataRow label="Mixed content" value={formatNumber(page?.mixedContent || 0)} status={Number(page?.mixedContent || 0) === 0 ? 'pass' : 'fail'} />
          <DataRow label="Cookies" value={`${formatNumber(page?.cookieCount || 0)}  (${formatNumber(page?.thirdPartyCookies || 0)} third-party)`} />
        </Card>
      </div>

      {/* Row 3: Image optimization + A11y */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Image optimization">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <MetricPill label="Total" value={formatNumber(imgCount)} />
            <MetricPill label="Lazy" value={`${formatNumber(lazyImages)}/${formatNumber(imgCount)}`} good={imgCount > 0 && lazyImages / imgCount > 0.5} />
            <MetricPill label="Srcset" value={`${formatNumber(srcsetCount)}/${formatNumber(imgCount)}`} good={srcsetCount > 0} />
            <MetricPill label="Missing dims" value={formatNumber(missingDims)} good={missingDims === 0} />
          </div>
          <DataRow label="Alt text missing" value={formatNumber(imgMissingAlt)}
            status={imgMissingAlt > 0 ? 'warn' : 'pass'} />
          <DataRow label="Scripts" value={formatNumber(scriptCount)} />
          <DataRow label="Styles" value={formatNumber(styleCount)} />
        </Card>
        <Card title="A11y">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <DataRow label="Contrast errors" value={formatNumber(page?.contrastErrors || 0)} status={Number(page?.contrastErrors || 0) === 0 ? 'pass' : 'warn'} />
            <DataRow label="Landmarks" value={page?.hasLandmarks !== false ? '\u2713' : '\u2717'} status={page?.hasLandmarks !== false ? 'pass' : 'warn'} />
            <DataRow label="Lang attr" value={page?.hasLangAttr !== false ? '\u2713' : '\u2717'} status={page?.hasLangAttr !== false ? 'pass' : 'warn'} />
            <DataRow label="Skip-link" value={page?.hasSkipLink ? '\u2713' : '\u2717'} status={page?.hasSkipLink ? 'pass' : 'warn'} />
            <DataRow label="Keyboard nav" value={page?.keyboardNav || 'pass'} status="pass" />
          </div>
        </Card>
      </div>

      {/* Page weight */}
      {sizeBytes > 0 && (
        <Card title="Page weight">
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-[var(--brand-text-faint)]">Total</span>
              <span className="text-[var(--brand-text-strong)] font-bold">{formatBytes(sizeBytes)}</span>
            </div>
            <div className="h-2 bg-[var(--brand-surface-3)] rounded-full overflow-hidden flex">
              {sizeBreakdown.map(s => (
                <div
                  key={s.label}
                  style={{ width: `${(s.size / sizeBytes) * 100}%`, background: s.color }}
                  className="h-full"
                  title={`${s.label}: ${formatBytes(s.size)}`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-0">
            {sizeBreakdown.map(s => (
              <div key={s.label} className="flex items-center justify-between text-[11px] py-1 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[var(--brand-text-mid)]">{s.label}</span>
                </span>
                <span className="text-[var(--brand-text-mid)] font-mono">{formatBytes(s.size)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Redirect chain */}
      {redirects.length > 0 && (
        <CollapseGroup title={`Redirect Chain (${redirects.length})`} defaultOpen={false}>
          <div className="space-y-1.5">
            {redirects.map((url: string, i: number) => (
              <div key={i} className="text-[11px] font-mono text-[var(--brand-text-mid)] py-1 px-2 rounded bg-[var(--brand-surface-0)] border border-[var(--brand-surface-2)] truncate">
                {i > 0 && <span className="text-[var(--brand-border-2)] mr-2">\u2192</span>}
                {url}
              </div>
            ))}
          </div>
        </CollapseGroup>
      )}

      {/* Response headers */}
      {headers.length > 0 && (
        <CollapseGroup title="Response Headers" defaultOpen={false}>
          <div className="space-y-0 max-h-[240px] overflow-y-auto">
            {headers.map(([key, val]) => (
              <div key={key} className="flex items-start gap-3 py-1.5 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <span className="text-[10px] text-[var(--brand-text-faint)] font-mono shrink-0 min-w-[120px]">{key}</span>
                <span className="text-[10px] text-[var(--brand-text-mid)] font-mono break-all">{String(val)}</span>
              </div>
            ))}
          </div>
        </CollapseGroup>
      )}
    </div>
  );
}
