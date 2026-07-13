import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { ForceGraph } from '../../_shared/ForceGraph';
import { RadialTree } from '../../_shared/RadialTree';
import { TreeView } from '../../_shared/TreeView';
import { EmptyView } from '../../_shared/EmptyView';
import { useFullAuditSiteMap, type ColorBy } from '../selectors/useFullAuditSiteMap';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS_HEX } from '../../_shared/shared-columns';

type LayerMode = 'force' | 'tree' | 'radial';

const MAX_VISIBLE_NODES = 2000;

const LEGEND_BY_COLORBY: Record<ColorBy, { color: string; label: string }[]> = {
  status: [
    { color: STATUS_HEX.good, label: 'OK' },
    { color: STATUS_HEX.warn, label: 'Warn' },
    { color: STATUS_HEX.bad, label: 'Error' },
  ],
  depth: [
    { color: STATUS_HEX.good, label: 'Shallow' },
    { color: STATUS_HEX.warn, label: 'Mid' },
    { color: STATUS_HEX.bad, label: 'Deep' },
  ],
  render: [
    { color: STATUS_HEX.good, label: 'Fast' },
    { color: STATUS_HEX.warn, label: 'Moderate' },
    { color: STATUS_HEX.bad, label: 'Slow' },
  ],
  index: [
    { color: STATUS_HEX.good, label: 'Indexable' },
    { color: STATUS_HEX.bad, label: 'Non-indexable' },
  ],
};

export default function FullAuditSiteMapView() {
  const [layer, setLayer] = useState<LayerMode>('force');
  const [colorBy, setColorBy] = useState<ColorBy>('status');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { setSelectedPageUrl, setInspectorOpen } = useSeoCrawler();
  const { nodes, links } = useFullAuditSiteMap(colorBy);

  const filtered = useMemo(() => {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes.filter((n: any) => n.id?.toLowerCase().includes(q));
  }, [nodes, query]);

  const allowed = useMemo(() => new Set(filtered.map((n: any) => n.id)), [filtered]);
  const filteredLinks = useMemo(() => links.filter(l => allowed.has(l.source) && allowed.has(l.target)), [links, allowed]);

  const capped = filtered.length > MAX_VISIBLE_NODES;
  const visible = capped ? filtered.slice(0, MAX_VISIBLE_NODES) : filtered;
  const visibleLinks = capped
    ? filteredLinks.filter(l => allowed.has(l.source) && allowed.has(l.target))
    : filteredLinks;

  const stats = useMemo(() => ({
    total: nodes.length,
    rendered: visible.length,
  }), [nodes, visible]);

  const breadcrumb = useMemo(() => {
    if (!selectedId) return null;
    const parts = selectedId.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
    return ['/', ...parts];
  }, [selectedId]);

  const handleClick = (id: string) => {
    setSelectedId(id);
    setSelectedPageUrl?.(id);
    setInspectorOpen?.(true);
  };

  const legend = LEGEND_BY_COLORBY[colorBy];

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Controls bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0a0a0acc] backdrop-blur p-1.5 rounded border border-[#1a1a1a]">
        {/* Layer switcher */}
        <div className="flex bg-[#111] rounded p-0.5">
          {(['force', 'tree', 'radial'] as LayerMode[]).map(m => (
            <button
              key={m}
              onClick={() => setLayer(m)}
              className={`h-6 px-2 text-[10px] uppercase tracking-wider rounded transition-colors ${
                layer === m ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]'
              }`}
            >{m}</button>
          ))}
        </div>

        <div className="w-px h-4 bg-[#1a1a1a]" />

        {/* Color by */}
        <select
          value={colorBy}
          onChange={e => setColorBy(e.target.value as ColorBy)}
          className="h-6 px-2 bg-[#0c0c0c] border border-[#1a1a1a] rounded text-[10px] text-[#ccc] focus:outline-none"
        >
          <option value="status">Color: Status</option>
          <option value="depth">Color: Depth</option>
          <option value="render">Color: Render</option>
          <option value="index">Color: Index</option>
        </select>

        <div className="w-px h-4 bg-[#1a1a1a]" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#666]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-6 pl-6 pr-2 bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] focus:outline-none w-36"
          />
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-3 bg-[#0a0a0acc] backdrop-blur p-2 rounded border border-[#1a1a1a] text-[10px]">
        <span className="text-[#888]">{stats.rendered}/{stats.total} nodes</span>
      </div>

      {/* Large dataset warning */}
      {capped && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#7f1d1dcc] backdrop-blur px-3 py-1.5 rounded border border-[#ef444444] text-[10px] text-[#fca5a5]">
          <AlertTriangle className="w-3 h-3" />
          Showing {MAX_VISIBLE_NODES} of {nodes.length} nodes — use search to narrow results
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-[#0a0a0acc] backdrop-blur p-2 rounded border border-[#1a1a1a] text-[10px]">
        {legend.map(item => (
          <span key={item.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-[#0a0a0acc] backdrop-blur p-2 rounded border border-[#1a1a1a] text-[10px] text-[#888]">
          {breadcrumb.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[#555]">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-[#ccc]' : ''}>{part}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main visualization */}
      {visible.length === 0 ? (
        <EmptyView title="No pages match the current filter." />
      ) : layer === 'force' ? (
        <ForceGraph nodes={visible} links={visibleLinks} onNodeClick={handleClick} />
      ) : layer === 'radial' ? (
        <RadialTree nodes={visible} onNodeClick={handleClick} />
      ) : (
        <TreeView nodes={visible} onNodeClick={handleClick} />
      )}
    </div>
  );
}
