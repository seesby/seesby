import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, formatDuration, formatBytes, getMetric,
} from '../../shared';

function CwvGauge({ label, value, unit, good, warn }: {
  label: string; value: number | null; unit: string; good: number; warn: number;
}) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-3">
        <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest">{label}</div>
        <div className="text-[20px] font-bold mt-1 text-[var(--brand-surface-4)]]">\u2014</div>
      </div>
    );
  }
  const tone = value <= good ? 'good' : value <= warn ? 'mid' : 'bad';
  const colorText = tone === 'good' ? 'text-[#22c55e]' : tone === 'mid' ? 'text-[#f59e0b]' : 'text-[#ef4444]';
  const colorBar = tone === 'good' ? '#22c55e' : tone === 'mid' ? '#f59e0b' : '#ef4444';
  const pct = Math.min(100, Math.round((value / (warn * 1.2)) * 100));
  return (
    <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-3">
      <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest">{label}</div>
      <div className={`text-[20px] font-bold mt-1 ${colorText}`}>{value.toFixed(unit === '' ? 3 : 0)}{unit}</div>
      <div className="mt-2 h-1.5 bg-[var(--brand-surface-3)]] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colorBar }} />
      </div>
      <div className="flex justify-between text-[8px] text-[var(--brand-surface-4)]] mt-1">
        <span>\u2264 {good}{unit}</span>
        <span>&gt; {warn}{unit}</span>
      </div>
    </div>
  );
}

export default function PerformanceTab({ page }: { page: any; hasTrend?: boolean }) {
  const lcp = Number(getMetric(page, 'lcp') || page?.lcp || 0) || null;
  const cls = Number(getMetric(page, 'cls') || page?.cls || 0) || null;
  const inp = Number(getMetric(page, 'inp') || page?.inp || 0) || null;
  const ttfb = Number(getMetric(page, 'loadTime') || page?.loadTime || 0) || null;
  const domNodes = Number(getMetric(page, 'domNodeCount') || page?.domNodeCount || 0);
  const renderBlockingCss = Number(getMetric(page, 'renderBlockingCss') || page?.renderBlockingCss || 0);
  const renderBlockingJs = Number(getMetric(page, 'renderBlockingJs') || page?.renderBlockingJs || 0);
  const totalRenderBlocking = renderBlockingCss + renderBlockingJs;

  const totalSize = Number(getMetric(page, 'sizeBytes') || page?.sizeBytes || 0);
  const htmlSize = Number(getMetric(page, 'htmlSize') || page?.htmlSize || 0);
  const cssSize = Number(getMetric(page, 'cssSize') || page?.cssSize || 0);
  const jsSize = Number(getMetric(page, 'jsSize') || page?.jsSize || 0);
  const imgSize = Number(getMetric(page, 'imageSize') || page?.imageSize || 0);
  const fontSize = Number(getMetric(page, 'fontSize') || page?.fontSize || 0);
  const otherSize = Math.max(0, totalSize - htmlSize - cssSize - jsSize - imgSize - fontSize);

  const imgCount = Number(getMetric(page, 'imgCount') || page?.imgCount || page?.imageCount || 0);
  const imgLazyCount = Number(getMetric(page, 'lazyLoadedImages') || page?.lazyLoadedImages || 0);
  const imgSrcsetCount = Number(getMetric(page, 'srcsetImages') || page?.srcsetImages || 0);
  const imgMissingDimensions = Number(getMetric(page, 'imagesMissingDimensions') || page?.imagesMissingDimensions || 0);

  const sizeBreakdown = [
    { label: 'HTML', size: htmlSize, color: '#60a5fa' },
    { label: 'CSS', size: cssSize, color: '#a78bfa' },
    { label: 'JS', size: jsSize, color: '#f59e0b' },
    { label: 'Images', size: imgSize, color: '#22c55e' },
    { label: 'Fonts', size: fontSize, color: '#f472b6' },
    { label: 'Other', size: otherSize, color: '#6b7280' },
  ].filter(s => s.size > 0);

  return (
    <div className="space-y-4">
      {/* CWV */}
      <div className="grid grid-cols-3 gap-2">
        <CwvGauge label="LCP" value={lcp} unit="ms" good={2500} warn={4000} />
        <CwvGauge label="CLS" value={cls} unit="" good={0.1} warn={0.25} />
        <CwvGauge label="INP" value={inp} unit="ms" good={200} warn={500} />
      </div>

      {/* Timing */}
      <Card title="Timing & rendering">
        <div className="grid grid-cols-4 gap-2 mb-3">
          <MetricPill label="TTFB" value={formatDuration(ttfb)} good={ttfb !== null && ttfb < 800} />
          <MetricPill label="DOM nodes" value={formatNumber(domNodes)} good={domNodes < 800} />
          <MetricPill label="Render blocking" value={formatNumber(totalRenderBlocking)} good={totalRenderBlocking === 0} />
          <MetricPill label="3P scripts" value={formatNumber(getMetric(page, 'thirdPartyScriptCount') || page?.thirdPartyScriptCount)} />
        </div>
        <DataRow label="HTTP version" value={getMetric(page, 'httpVersion') || page?.httpVersion || '\u2014'} />
        <DataRow label="DNS time" value={formatDuration(getMetric(page, 'dnsResolutionTime') || page?.dnsResolutionTime)} />
      </Card>

      {/* Images */}
      <Card title="Image optimization">
        <div className="grid grid-cols-4 gap-2 mb-3">
          <MetricPill label="Total" value={formatNumber(imgCount)} />
          <MetricPill label="Lazy" value={`${formatNumber(imgLazyCount)}/${formatNumber(imgCount)}`} good={imgCount > 0 && imgLazyCount / imgCount > 0.5} />
          <MetricPill label="Srcset" value={`${formatNumber(imgSrcsetCount)}/${formatNumber(imgCount)}`} good={imgSrcsetCount > 0} />
          <MetricPill label="Missing dims" value={formatNumber(imgMissingDimensions)} good={imgMissingDimensions === 0} />
        </div>
        <DataRow label="Alt text missing" value={formatNumber(getMetric(page, 'imgMissingAlt') || page?.imgMissingAlt || getMetric(page, 'imagesMissingAlt') || page?.imagesMissingAlt)}
          status={Number(getMetric(page, 'imgMissingAlt') || page?.imgMissingAlt || getMetric(page, 'imagesMissingAlt') || page?.imagesMissingAlt || 0) > 0 ? 'warn' : 'pass'} />
      </Card>

      {/* Page weight */}
      <Card title="Page weight">
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[var(--brand-text-faint)]]">Total</span>
            <span className="text-[var(--brand-text-strong)] font-bold">{formatBytes(totalSize)}</span>
          </div>
          {totalSize > 0 && (
            <div className="h-2 bg-[var(--brand-surface-3)]] rounded-full overflow-hidden flex">
              {sizeBreakdown.map(s => (
                <div
                  key={s.label}
                  style={{ width: `${(s.size / totalSize) * 100}%`, background: s.color }}
                  className="h-full"
                  title={`${s.label}: ${formatBytes(s.size)}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-0">
          {sizeBreakdown.map(s => (
            <div key={s.label} className="flex items-center justify-between text-[11px] py-1 border-b border-[var(--brand-surface-2)]] last:border-b-0">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-[var(--brand-text-mid)]]">{s.label}</span>
              </span>
              <span className="text-[var(--brand-text-mid)]] font-mono">{formatBytes(s.size)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
