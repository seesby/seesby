import React, { useState, useMemo } from 'react';
import { ForceGraph } from '../../_shared/ForceGraph';
import { TreeView } from '../../_shared/TreeView';
import { RadialTree } from '../../_shared/RadialTree';
import { DistributionStrip } from '../../_shared/DistributionStrip';
import { useCrawlMap } from '../selectors/useCrawlMap';
import type { CrawlColorBy } from '../selectors/useCrawlMap';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { fmtCompact } from '../../_shared/formatters';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { STATUS_HEX } from '../../_shared/shared-columns';

const MAX_NODES = 2000;

const LAYOUTS = [
  { id: 'force' as const, label: 'Force' },
  { id: 'tree' as const, label: 'Tree' },
  { id: 'radial' as const, label: 'Radial' },
];

const COLOR_OPTIONS: { value: CrawlColorBy; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'depth', label: 'Depth' },
  { value: 'indexability', label: 'Index' },
  { value: 'render', label: 'Render' },
];

const LEGENDS: Record<CrawlColorBy, { color: string; label: string }[]> = {
  status: [
    { color: STATUS_HEX.good, label: 'OK' },
    { color: STATUS_HEX.info, label: 'Redirect' },
    { color: STATUS_HEX.bad, label: 'Error' },
    { color: '#64748b', label: 'Blocked' },
  ],
  depth: [
    { color: STATUS_HEX.good, label: '0-2' },
    { color: STATUS_HEX.warn, label: '3-4' },
    { color: STATUS_HEX.bad, label: '5+' },
  ],
  indexability: [
    { color: STATUS_HEX.good, label: 'Indexable' },
    { color: STATUS_HEX.warn, label: 'Noindex' },
    { color: STATUS_HEX.bad, label: 'Blocked' },
  ],
  render: [
    { color: STATUS_HEX.good, label: 'Static' },
    { color: STATUS_HEX.info, label: 'SSR' },
    { color: STATUS_HEX.bad, label: 'CSR' },
    { color: 'text-[var(--brand-text-faint)]', label: 'Unknown' },
  ],
};

export default function CrawlMapView() {
  const [layout, setLayout] = useState<'force' | 'tree' | 'radial'>('force');
  const [colorBy, setColorBy] = useState<CrawlColorBy>('status');
  const [query, setQuery] = useState('');
  const { nodes, links, depthDistribution, healthSummary } = useCrawlMap(colorBy);
  const { setSelectedPageUrl, setInspectorOpen, setRsTab } = useSeoCrawler();

  const queryLower = query.toLowerCase();
  const searched = useMemo(() => {
    if (!queryLower) return nodes;
    return nodes.filter(n => n.id.toLowerCase().includes(queryLower) || n.label.toLowerCase().includes(queryLower));
  }, [nodes, queryLower]);

  const capped = searched.length > MAX_NODES;
  const displayNodes = capped ? searched.slice(0, MAX_NODES) : searched;
  const visibleIds = new Set(displayNodes.map(n => n.id));
  const displayLinks = links.filter(l => visibleIds.has(l.source) && visibleIds.has(l.target));

  const handleClick = (id: string) => {
    setSelectedPageUrl?.(id);
    setRsTab?.('technical', 'crawl');
    setInspectorOpen?.(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Controls bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[var(--brand-surface-0)]cc] backdrop-blur p-1.5 rounded border border-[var(--brand-surface-3)]]">
        {/* Layout switcher */}
        <div className="flex items-center bg-[var(--brand-surface-1)]] rounded border border-[var(--brand-surface-3)]] p-0.5">
          {LAYOUTS.map(l => (
            <button
              key={l.id}
              onClick={() => setLayout(l.id)}
              className={clsx(
                'h-6 px-2 text-[10px] rounded transition-colors',
                layout === l.id ? 'bg-[var(--brand-surface-3)]] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)]] hover:text-[var(--brand-text-mid)]]',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Color by */}
        <select
          value={colorBy}
          onChange={e => setColorBy(e.target.value as CrawlColorBy)}
          className="h-6 px-1.5 text-[10px] bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]] rounded outline-none cursor-pointer"
        >
          {COLOR_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative">
          <Search size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--brand-text-faint)]]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-6 w-32 pl-5 pr-2 text-[10px] bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]] rounded outline-none focus:border-[var(--brand-surface-4)]] placeholder:text-[var(--brand-border-2)]]"
          />
        </div>
      </div>

      {/* Stats + cap warning */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {capped && (
          <div className="px-2 py-1 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded text-[10px] text-[#f59e0b]">
            Showing {fmtCompact(MAX_NODES)} of {fmtCompact(searched.length)} pages
          </div>
        )}
        <div className="px-2 py-1 bg-[var(--brand-surface-0)]cc] backdrop-blur rounded border border-[var(--brand-surface-3)]] text-[10px] text-[var(--brand-text-mid)]]">
          {fmtCompact(displayNodes.length)} nodes · {fmtCompact(displayLinks.length)} links
        </div>
      </div>

      {/* Cap warning banner */}
      {capped && (
        <div className="shrink-0 bg-[#f59e0b]/5 border-b border-[#f59e0b]/20 px-3 py-1.5 text-[11px] text-[#f59e0b]">
          Graph capped at {fmtCompact(MAX_NODES)} nodes for performance. Refine your search to see more.
        </div>
      )}

      {/* Graph area */}
      <div className="flex-1 min-h-0 relative">
        {displayNodes.length === 0 ? (
          <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]]">
            {query ? 'No pages match your search.' : 'No pages crawled yet.'}
          </div>
        ) : layout === 'force' ? (
          <ForceGraph nodes={displayNodes} links={displayLinks} onNodeClick={handleClick} />
        ) : layout === 'tree' ? (
          <TreeView nodes={displayNodes} onNodeClick={handleClick} />
        ) : (
          <RadialTree nodes={displayNodes} onNodeClick={handleClick} />
        )}
      </div>

      {/* Bottom bar: depth + legend + health */}
      <div className="shrink-0 border-t border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] px-3 py-1.5 flex items-center gap-4 text-[10px]">
        <DistributionStrip
          title="Depth"
          segments={depthDistribution.map(d => ({
            label: d.label,
            count: d.value,
            color: d.label === 'D5+' ? STATUS_HEX.bad : Number(d.label.slice(1)) <= 2 ? STATUS_HEX.good : STATUS_HEX.warn,
          }))}
        />
        <span className="text-[var(--brand-surface-4)]]">|</span>
        <div className="flex items-center gap-2">
          {LEGENDS[colorBy].map(l => (
            <span key={l.label} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-[var(--brand-text-mid)]]">{l.label}</span>
            </span>
          ))}
        </div>
        <span className="text-[var(--brand-surface-4)]]">|</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-[var(--brand-text-mid)]]">Err</span><span className="font-mono text-[var(--brand-text-strong)]">{healthSummary.errors}</span></span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" /><span className="text-[var(--brand-text-mid)]]">Blocked</span><span className="font-mono text-[var(--brand-text-strong)]">{healthSummary.blocked}</span></span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[var(--brand-text-mid)]]">Redir</span><span className="font-mono text-[var(--brand-text-strong)]">{healthSummary.redirects}</span></span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="text-[var(--brand-text-mid)]]">Orphan</span><span className="font-mono text-[var(--brand-text-strong)]">{healthSummary.orphans}</span></span>
        </div>
      </div>
    </div>
  );
}
