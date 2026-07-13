import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, formatBytes, getMetric,
} from '../../shared';

export default function DomTab({ page }: { page: any }) {
  const renderType = page?.renderType || page?.jsRenderDiff
    ? (Number(page?.jsRenderDiff?.textDiffPercent || 0) > 10 ? 'CSR' : 'SSR')
    : 'static';

  const jsDiff = page?.jsRenderDiff || {};
  const textDiffPct = Number(jsDiff.textDiffPercent || 0);
  const hasDiff = textDiffPct > 0;

  const domNodes = Number(getMetric(page, 'domNodeCount') || page?.domNodeCount || 0);
  const domDepth = Number(page?.domDepth || 0);
  const sizeBytes = Number(getMetric(page, 'sizeBytes') || page?.sizeBytes || 0);
  const transferredBytes = Number(page?.transferredBytes || 0);

  const thirdPartyScripts = Array.isArray(page?.thirdPartyScripts) ? page.thirdPartyScripts : [];
  const thirdPartyCount = Number(getMetric(page, 'thirdPartyScriptCount') || page?.thirdPartyScriptCount || thirdPartyScripts.length);

  const inlineStyles = Number(page?.inlineStyleCount || 0);
  const inlineScripts = Number(page?.inlineScriptCount || 0);
  const externalCss = Number(page?.externalCssCount || 0);
  const externalJs = Number(page?.externalJsCount || 0);

  const preloadLinks = Number(page?.preloadLinkCount || 0);
  const prefetchLinks = Number(page?.prefetchLinkCount || 0);

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Render" value={renderType} good={renderType !== 'CSR'} />
        <MetricPill label="DOM Nodes" value={formatNumber(domNodes)} good={domNodes < 800} />
        <MetricPill label="DOM Depth" value={formatNumber(domDepth)} good={domDepth <= 32} />
        <MetricPill label="3P Scripts" value={formatNumber(thirdPartyCount)} good={thirdPartyCount <= 5} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* DOM size */}
        <Card title="DOM size">
          <DataRow label="DOM nodes" value={formatNumber(domNodes)} status={domNodes > 1500 ? 'warn' : domNodes > 3000 ? 'fail' : 'pass'} />
          <DataRow label="DOM depth" value={formatNumber(domDepth)} status={domDepth > 32 ? 'warn' : 'pass'} />
          <DataRow label="HTML size" value={formatBytes(page?.htmlSize)} />
          <DataRow label="Transferred" value={formatBytes(transferredBytes)} />
          <DataRow label="DOM size" value={formatBytes(sizeBytes)} />
        </Card>

        {/* Resource breakdown */}
        <Card title="Resources">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <MetricPill label="Ext CSS" value={formatNumber(externalCss)} />
            <MetricPill label="Ext JS" value={formatNumber(externalJs)} />
            <MetricPill label="Inline CSS" value={formatNumber(inlineStyles)} />
            <MetricPill label="Inline JS" value={formatNumber(inlineScripts)} />
          </div>
          <DataRow label="Preload links" value={formatNumber(preloadLinks)} />
          <DataRow label="Prefetch links" value={formatNumber(prefetchLinks)} />
        </Card>
      </div>

      {/* Render diff */}
      {hasDiff && (
        <Card title="Render diff">
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-[var(--brand-text-faint)]]">Text diff</span>
              <span className={`font-bold ${textDiffPct > 10 ? 'text-[#f59e0b]' : 'text-[#22c55e]'}`}>{textDiffPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-[var(--brand-surface-3)]] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, textDiffPct)}%`, background: textDiffPct > 10 ? '#f59e0b' : '#22c55e' }}
              />
            </div>
          </div>
          <DataRow label="Render type" value={renderType} />
          <DataRow label="Diff percentage" value={`${textDiffPct.toFixed(1)}%`} status={textDiffPct > 10 ? 'warn' : 'pass'} />
          {jsDiff.addedNodes !== undefined && <DataRow label="Added nodes" value={formatNumber(jsDiff.addedNodes)} />}
          {jsDiff.removedNodes !== undefined && <DataRow label="Removed nodes" value={formatNumber(jsDiff.removedNodes)} />}
        </Card>
      )}

      {/* Third-party scripts */}
      {thirdPartyScripts.length > 0 && (
        <Card title={`Third-party scripts (${thirdPartyCount})`}>
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-3)]] rounded-lg overflow-hidden max-h-[180px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]]">
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)]] uppercase tracking-widest text-[9px] font-bold">Script</th>
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)]] uppercase tracking-widest text-[9px] font-bold">Type</th>
                </tr>
              </thead>
              <tbody>
                {thirdPartyScripts.map((s: any, i: number) => (
                  <tr key={i} className={`border-b border-[var(--brand-surface-2)]] ${i % 2 === 0 ? '' : 'bg-[var(--brand-surface-0)]]'} hover:bg-[var(--brand-surface-2)]]`}>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]] font-mono break-all">{typeof s === 'string' ? s : s?.url || s?.name || '—'}</td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]]">{typeof s === 'object' ? (s?.category || s?.type || '—') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
