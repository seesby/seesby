import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { TreeView } from '../../views/_shared/TreeView';
import { EmptyView } from '../../views/_shared/EmptyView';
import { ClusterModePanel } from './cluster/ClusterModePanel';
import { GraphModePanel } from './graph/GraphModePanel';
import type { GraphLayout, SizeBy } from './graph/GraphControls';
import { useWqaStructure, qualityColor, type StructureColorBy } from './selectors/useWqaStructure';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

type Sub = 'tree' | 'cluster' | 'graph';

const MAX_VISIBLE_NODES = 2000;

const COLOR_OPTIONS: { id: StructureColorBy; label: string }[] = [
  { id: 'quality', label: 'Quality' },
  { id: 'depth', label: 'Depth' },
  { id: 'cluster', label: 'Cluster' },
];

const QUALITY_LEGEND: { color: string; label: string }[] = [
  { color: '#22c55e', label: 'Good (≥80)' },
  { color: '#f59e0b', label: 'Needs work' },
  { color: '#ef4444', label: 'Poor (<60)' },
];

const DEPTH_LEGEND: { color: string; label: string }[] = [
  { color: '#22c55e', label: 'Shallow' },
  { color: '#f59e0b', label: 'Medium' },
  { color: '#ef4444', label: 'Deep' },
];

export default function WqaStructureView() {
  const [sub, setSub] = useState<Sub>('tree');
  const [colorBy, setColorBy] = useState<StructureColorBy>('quality');
  const [query, setQuery] = useState('');
  const [graphLayout, setGraphLayout] = useState<GraphLayout>('force');
  const [sizeBy, setSizeBy] = useState<SizeBy>('inLinks');
  const data = useWqaStructure(colorBy);
  const { setSelectedPageUrl, setInspectorOpen } = useSeoCrawler();

  const handleClick = (id: string) => {
    setSelectedPageUrl?.(id);
    setInspectorOpen?.(true);
  };

  // Filter nodes by search
  const filtered = useMemo(() => {
    if (!query.trim()) return data.nodes;
    const q = query.toLowerCase();
    return data.nodes.filter((n: any) => n.id?.toLowerCase().includes(q) || n.label?.toLowerCase().includes(q));
  }, [data.nodes, query]);

  const allowed = useMemo(() => new Set(filtered.map((n: any) => n.id)), [filtered]);
  const filteredLinks = useMemo(() => data.links.filter(l => allowed.has(l.source) && allowed.has(l.target)), [data.links, allowed]);

  const capped = filtered.length > MAX_VISIBLE_NODES;
  const visible = capped ? filtered.slice(0, MAX_VISIBLE_NODES) : filtered;
  const visibleLinks = capped ? filteredLinks.filter(l => allowed.has(l.source) && allowed.has(l.target)) : filteredLinks;

  // Build graph nodes with coloring and sizing (graph mode only; cluster mode uses ClusterGraph)
  const graphNodes = useMemo(() => {
    if (sub === 'graph') {
      return visible.map(n => {
        const node = n as any;
        let color: string;
        if (colorBy === 'quality') {
          color = qualityColor(node.quality ?? 0);
        } else if (colorBy === 'depth') {
          const depth = node.depth ?? 0;
          color = depth <= 2 ? '#22c55e' : depth <= 4 ? '#f59e0b' : '#ef4444';
        } else {
          color = node.color ?? 'text-[var(--brand-text-faint)]';
        }
        let size: number;
        if (sizeBy === 'inLinks') {
          size = Math.max(3, node.inLinks ?? 0);
        } else if (sizeBy === 'outLinks') {
          size = Math.max(3, (node as any).outLinks ?? 0);
        } else {
          size = Math.max(3, node.quality ?? 4);
        }
        return { ...node, color, size };
      });
    }
    return visible;
  }, [visible, sub, colorBy, sizeBy]);

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Controls bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[var(--brand-surface-0)]cc] backdrop-blur p-1.5 rounded border border-[var(--brand-surface-3)]">
        <div className="flex bg-[var(--brand-surface-2)] rounded p-0.5">
          {(['tree', 'cluster', 'graph'] as Sub[]).map(k => (
            <button
              key={k}
              onClick={() => setSub(k)}
              className={`h-6 px-2 text-[10px] uppercase tracking-wider rounded transition-colors ${
                sub === k ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)] hover:text-[var(--brand-text-mid)]'
              }`}
            >{k}</button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--brand-surface-3)]" />

        <select
          value={colorBy}
          onChange={e => setColorBy(e.target.value as StructureColorBy)}
          className="h-6 px-2 bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded text-[10px] text-[var(--brand-text-mid)] focus:outline-none"
        >
          {COLOR_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <div className="w-px h-4 bg-[var(--brand-surface-3)]" />

        <div className="relative">
          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--brand-text-faint)]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-6 pl-6 pr-2 bg-transparent text-[11px] text-[var(--brand-text-mid)] placeholder:text-[var(--brand-text-faint)] focus:outline-none w-36"
          />
        </div>
      </div>

      {/* Stats - hidden in cluster and graph modes (handled by their panels) */}
      {sub === 'tree' && (
        <div className="absolute top-3 right-3 z-10 bg-[var(--brand-surface-0)]cc] backdrop-blur px-3 py-2 rounded border border-[var(--brand-surface-3)] text-[10px] flex items-center gap-4">
          <span className="text-[var(--brand-text-mid)]">{visible.length}/{data.nodes.length} nodes</span>
          <span className="text-[var(--brand-surface-3)]">|</span>
          <span className="text-[var(--brand-text-mid)]">Avg quality <span className="text-[var(--brand-text-strong)] font-mono">{data.stats.avgQuality}</span></span>
          <span className="text-[var(--brand-text-mid)]">Avg depth <span className="text-[var(--brand-text-strong)] font-mono">{data.stats.avgDepth}</span></span>
          {data.stats.orphans > 0 && (
            <span className="text-[var(--brand-text-mid)]">Orphans <span className="text-[#f59e0b] font-mono">{data.stats.orphans}</span></span>
          )}
          <span className="text-[var(--brand-text-mid)]">{data.stats.clusterCount} categories</span>
        </div>
      )}

      {/* Cap warning */}
      {capped && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#7f1d1dcc] backdrop-blur px-3 py-1.5 rounded border border-[#ef444444] text-[10px] text-[#fca5a5]">
          <AlertTriangle className="w-3 h-3" />
          Showing {MAX_VISIBLE_NODES} of {data.nodes.length} nodes
        </div>
      )}

      {/* Legend - hidden in cluster and graph modes (handled by their panels) */}
      {sub === 'tree' && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-[var(--brand-surface-0)]cc] backdrop-blur p-2 rounded border border-[var(--brand-surface-3)] text-[10px]">
          {colorBy === 'quality' && QUALITY_LEGEND.map(item => (
            <span key={item.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
          {colorBy === 'depth' && DEPTH_LEGEND.map(item => (
            <span key={item.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
          {colorBy === 'cluster' && (
            <span className="text-[var(--brand-text-mid)]">Colors represent page categories</span>
          )}
        </div>
      )}

      {/* Visualization */}
      {visible.length === 0 ? (
        <EmptyView title="No pages match the current filter." />
      ) : sub === 'tree' ? (
        <TreeView nodes={visible as any} onNodeClick={handleClick} />
      ) : sub === 'cluster' ? (
        <ClusterModePanel
          clusters={data.clusters}
          nodes={visible}
          links={visibleLinks}
          linkMetrics={data.linkMetrics}
          onNodeClick={handleClick}
        />
      ) : (
        <GraphModePanel
          nodes={graphNodes}
          links={visibleLinks}
          onNodeClick={handleClick}
          layout={graphLayout}
          onLayoutChange={setGraphLayout}
          sizeBy={sizeBy}
          onSizeByChange={setSizeBy}
          colorBy={colorBy}
          inLinkCounts={data.inLinkCounts}
          graphMetrics={data.graphMetrics}
        />
      )}
    </div>
  );
}
