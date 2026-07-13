import React, { useState } from 'react';
import {
  DataRow, StatusBadge, Card, MetricPill,
  formatNumber, formatBytes, getMetric,
} from '../../shared';
import CollapseGroup from './CollapseGroup';

export default function HtmlTab({ page }: { page: any; hasTrend?: boolean }) {
  const [showFullHtml, setShowFullHtml] = useState(false);
  const rawHtml: string = page?.rawHtml || page?.htmlSource || '';
  const lines = rawHtml.split('\n');
  const previewLines = showFullHtml ? lines : lines.slice(0, 50);

  const title = getMetric(page, 'title') || page?.title || '';
  const titleLen = Number(getMetric(page, 'titleLength') || title.length || 0);
  const metaDesc = getMetric(page, 'metaDesc') || page?.metaDesc || '';
  const metaDescLen = Number(getMetric(page, 'metaDescLength') || metaDesc.length || 0);
  const robots = getMetric(page, 'metaRobots1') || page?.metaRobots1 || page?.metaRobots;
  const canonical = getMetric(page, 'canonical') || page?.canonical;
  const hreflangCount = Number(getMetric(page, 'hreflangCount') || page?.hreflangCount || 0);
  const h1Count = Number(getMetric(page, 'h1Count') || page?.h1Count || 0);
  const h2Count = Number(getMetric(page, 'h2Count') || page?.h2Count || 0);
  const imgCount = Number(getMetric(page, 'imgCount') || page?.imageCount || 0);
  const imgMissingAlt = Number(getMetric(page, 'imgMissingAlt') || page?.imgMissingAlt || 0);
  const scriptCount = Number(getMetric(page, 'scriptCount') || page?.scriptCount || 0);
  const cssCount = Number(getMetric(page, 'cssCount') || page?.cssCount || 0);
  const ogTitle = getMetric(page, 'ogTitle') || page?.ogTitle;
  const ogDesc = getMetric(page, 'ogDescription') || page?.ogDescription;
  const ogImage = getMetric(page, 'ogImage') || page?.ogImage;
  const twitterCard = getMetric(page, 'twitterCard') || page?.twitterCard;
  const ogFields = [ogTitle, ogDesc, ogImage, twitterCard].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Title" value={`${titleLen} chars`} good={titleLen >= 30 && titleLen <= 60} />
        <MetricPill label="Meta desc" value={`${metaDescLen} chars`} good={metaDescLen >= 120 && metaDescLen <= 155} />
        <MetricPill label="OG" value={`${ogFields}/4`} good={ogFields === 4} />
        <MetricPill label="HTML" value={formatBytes(getMetric(page, 'htmlSize') || page?.htmlSize)} />
      </div>

      {/* SEO checks */}
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={titleLen >= 30 && titleLen <= 60 ? 'pass' : 'warn'} label={`Title ${titleLen >= 30 && titleLen <= 60 ? 'OK' : titleLen < 30 ? 'Short' : 'Long'}`} />
        <StatusBadge status={metaDescLen >= 120 && metaDescLen <= 155 ? 'pass' : metaDescLen > 0 ? 'warn' : 'fail'} label={`Meta ${metaDescLen >= 120 && metaDescLen <= 155 ? 'OK' : metaDescLen > 0 ? 'Off' : 'Missing'}`} />
        <StatusBadge status={h1Count === 1 ? 'pass' : 'warn'} label={`H1: ${h1Count}`} />
        <StatusBadge status={canonical ? 'pass' : 'warn'} label={canonical ? 'Canonical' : 'No canonical'} />
        <StatusBadge status={robots && String(robots).includes('noindex') ? 'fail' : 'pass'} label={robots && String(robots).includes('noindex') ? 'Noindexed' : 'Indexable'} />
        {hreflangCount > 0 && <StatusBadge status="info" label={`${hreflangCount} hreflang`} />}
      </div>

      {/* Metadata */}
      <Card title="Metadata">
        <DataRow label="Title" value={title || '\u2014'} />
        <DataRow label="Meta description" value={metaDesc || '\u2014'} />
        <DataRow label="Canonical" value={canonical || '\u2014'} mono status={canonical ? 'pass' : 'warn'} />
        <DataRow label="Robots" value={robots || '\u2014'} status={robots && String(robots).includes('noindex') ? 'fail' : 'pass'} />
        <DataRow label="OG title" value={ogTitle || '\u2014'} status={ogTitle ? 'pass' : 'warn'} />
        <DataRow label="OG description" value={ogDesc || '\u2014'} status={ogDesc ? 'pass' : 'warn'} />
        <DataRow label="OG image" value={ogImage ? 'Present' : 'Missing'} status={ogImage ? 'pass' : 'warn'} />
        <DataRow label="Twitter card" value={twitterCard || '\u2014'} status={twitterCard ? 'pass' : 'info'} />
        <DataRow label="Hreflang" value={formatNumber(hreflangCount)} />
        <DataRow label="Language" value={getMetric(page, 'language') || page?.language || '\u2014'} />
      </Card>

      {/* Structure */}
      <Card title="Document structure">
        <div className="grid grid-cols-4 gap-2 mb-3">
          <MetricPill label="H1" value={formatNumber(h1Count)} good={h1Count === 1} />
          <MetricPill label="H2" value={formatNumber(h2Count)} />
          <MetricPill label="Images" value={formatNumber(imgCount)} />
          <MetricPill label="Missing alt" value={formatNumber(imgMissingAlt)} good={imgMissingAlt === 0} />
        </div>
        <DataRow label="Scripts" value={formatNumber(scriptCount)} />
        <DataRow label="Stylesheets" value={formatNumber(cssCount)} />
      </Card>

      {/* Size */}
      <Card title="Size">
        <DataRow label="Raw HTML" value={formatBytes(getMetric(page, 'htmlSize') || page?.htmlSize)} />
        <DataRow label="Gzipped" value={formatBytes(getMetric(page, 'gzippedSize') || page?.gzippedSize)} />
        <DataRow label="Total page" value={formatBytes(getMetric(page, 'sizeBytes') || page?.sizeBytes)} />
        <DataRow label="Transferred" value={formatBytes(getMetric(page, 'transferredBytes') || page?.transferredBytes)} />
      </Card>

      {/* Raw HTML */}
      {rawHtml && (
        <CollapseGroup title="Raw HTML source" defaultOpen={false}>
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden max-h-[360px] overflow-y-auto custom-scrollbar">
            <pre className="p-3 text-[11px] font-mono leading-relaxed text-[var(--brand-text-faint)] whitespace-pre-wrap break-all">
              {previewLines.map((line: string, i: number) => (
                <div key={i} className="flex">
                  <span className="text-[var(--brand-border-2)] w-[32px] shrink-0 text-right mr-3 select-none">{i + 1}</span>
                  <span className="min-w-0" dangerouslySetInnerHTML={{ __html: colorizeHtml(line) }} />
                </div>
              ))}
            </pre>
          </div>
          {lines.length > 50 && (
            <button
              onClick={() => setShowFullHtml(!showFullHtml)}
              className="mt-2 text-[11px] text-[#F59E0B] hover:text-[#F59E0B]/80 transition-colors"
            >
              {showFullHtml ? 'Show first 50 lines' : `Show all ${lines.length} lines`}
            </button>
          )}
        </CollapseGroup>
      )}
    </div>
  );
}

function colorizeHtml(line: string): string {
  return line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#F59E0B">$2</span>')
    .replace(/([\w-]+)(=)/g, '<span style="color:#60a5fa">$1</span>$2')
    .replace(/"([^"]*)"/g, '"<span style="color:#86efac">$1</span>"')
    .replace(/(&lt;!--.*?--&gt;)/g, '<span style="color:bg-[var(--brand-surface-4)]">$1</span>');
}
