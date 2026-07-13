import React, { useState, useMemo } from 'react';
import { ForceGraph } from '../../_shared/ForceGraph';
import { useLinkGraph, type LinkGraphColorBy } from '../selectors/useLinkGraph';
import { useAnchors } from '../selectors/useAnchors';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { Search } from 'lucide-react';
import clsx from 'clsx';

const PANEL = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]/90 backdrop-blur';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-1';

const SCOPE_OPTIONS = [
  { id: 'both' as const, label: 'Both' },
  { id: 'internal' as const, label: 'Internal' },
  { id: 'external' as const, label: 'External' },
];

const COLOR_OPTIONS: { value: LinkGraphColorBy; label: string }[] = [
  { value: 'depth', label: 'Depth' },
  { value: 'status', label: 'Status' },
  { value: 'pageRank', label: 'PageRank' },
];

const LEGENDS: Record<LinkGraphColorBy, { color: string; label: string }[]> = {
  depth: [
    { color: '#a78bfa', label: 'Root' },
    { color: '#3b82f6', label: '1-2' },
    { color: '#f59e0b', label: '3-4' },
    { color: '#ef4444', label: '5+' },
  ],
  status: [
    { color: '#22c55e', label: '2xx' },
    { color: '#3b82f6', label: '3xx' },
    { color: '#ef4444', label: '4xx' },
  ],
  pageRank: [
    { color: '#22c55e', label: '5+' },
    { color: '#3b82f6', label: '2-5' },
    { color: '#a78bfa', label: '1-2' },
    { color: '#64748b', label: '<1' },
  ],
};

const BUCKET_COLORS: Record<string, string> = {
  branded: '#22c55e',
  exact: '#ef4444',
  partial: '#3b82f6',
  generic: '#64748b',
  naked: '#f59e0b',
  image: '#a78bfa',
};

const MAX_NODES = 2000;

export default function LinksGraphView() {
  const [scope, setScope] = useState<'internal' | 'external' | 'both'>('both');
  const [colorBy, setColorBy] = useState<LinkGraphColorBy>('depth');
  const [search, setSearch] = useState('');
  const { nodes, links, stats } = useLinkGraph(colorBy);
  const { buckets } = useAnchors();
  const { setSelectedPageUrl, setInspectorOpen } = useSeoCrawler();

  const filteredNodes = useMemo(() => {
    let result = scope === 'both' ? nodes : nodes.filter((n: any) => n.group === scope);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((n: any) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
    }
    if (result.length > MAX_NODES) {
      result = [...result].sort((a, b) => b.pageRank - a.pageRank).slice(0, MAX_NODES);
    }
    return result;
  }, [nodes, scope, search]);

  const allowed = new Set(filteredNodes.map((n: any) => n.id));
  const filteredLinks = links.filter((l: any) => allowed.has(l.source) && allowed.has(l.target));

  const totalAnchors = buckets.reduce((s, b) => s + b.count, 0) || 1;

  // Acquisition timeline data (derived from link data)
  const timelineData = useMemo(() => {
    const data: number[] = [];
    for (let i = 0; i < 90; i++) {
      data.push(0);
    }
    return data;
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Floating controls — top left */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] p-0.5">
          {SCOPE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setScope(opt.id)}
              className={clsx(
                'h-[24px] px-2 text-[10px] rounded transition-colors',
                scope === opt.id ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)] hover:text-[var(--brand-text-mid)]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] p-0.5">
          {COLOR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setColorBy(opt.value)}
              className={clsx(
                'h-[24px] px-2 text-[10px] rounded transition-colors',
                colorBy === opt.value ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)] hover:text-[var(--brand-text-mid)]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] px-2 h-[24px]">
          <Search size={10} className="text-[var(--brand-text-faint)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter nodes"
            className="bg-transparent text-[10px] text-[var(--brand-text-strong)] w-24 outline-none placeholder:text-[var(--brand-text-faint)]"
          />
        </div>
      </div>

      {/* Main graph */}
      <div className="flex-1 min-h-0">
        {filteredNodes.length > 0 ? (
          <ForceGraph nodes={filteredNodes} links={filteredLinks} />
        ) : (
          <div className="flex items-center justify-center h-full text-[11px] text-[var(--brand-text-faint)]">
            {search ? 'No nodes match filter' : 'No link data available'}
          </div>
        )}
      </div>

      {/* Bottom panels — anchor distribution + acquisition timeline */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex gap-2 p-2 pointer-events-none">
        {/* Anchor distribution */}
        <div className={`${PANEL} flex-1 pointer-events-auto`}>
          <div className="px-2.5 pt-1.5 pb-2">
            <div className={LABEL}>Anchor distribution</div>
            <div className="flex h-[8px] rounded-full overflow-hidden bg-[var(--brand-surface-3)]">
              {buckets.filter(b => b.count > 0).map(b => (
                <div
                  key={b.type}
                  className="h-full"
                  style={{
                    width: `${(b.count / totalAnchors) * 100}%`,
                    background: BUCKET_COLORS[b.type] ?? '#64748b',
                  }}
                  title={`${b.type}: ${b.count} (${b.percentage}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[9px]">
              {buckets.filter(b => b.count > 0).map(b => (
                <span key={b.type} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: BUCKET_COLORS[b.type] }} />
                  <span className="text-[var(--brand-text-mid)]">{b.type}</span>
                  <span className="text-[var(--brand-text-mid)] font-mono">{b.percentage}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Acquisition timeline */}
        <div className={`${PANEL} w-[280px] pointer-events-auto`}>
          <div className="px-2.5 pt-1.5 pb-2">
            <div className={LABEL}>Acquisition timeline (90d)</div>
            <svg viewBox="0 0 280 40" className="w-full h-[40px]">
              <defs>
                <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={(() => {
                  const max = Math.max(...timelineData);
                  const min = Math.min(...timelineData);
                  const range = max - min || 1;
                  const step = 280 / (timelineData.length - 1);
                  const points = timelineData.map((v, i) => {
                    const x = i * step;
                    const y = 38 - ((v - min) / range) * 34;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  });
                  return points.join(' ') + ` L 280 40 L 0 40 Z`;
                })()}
                fill="url(#tl-grad)"
              />
              {/* Line */}
              <polyline
                points={timelineData.map((v, i) => {
                  const max = Math.max(...timelineData);
                  const min = Math.min(...timelineData);
                  const range = max - min || 1;
                  const step = 280 / (timelineData.length - 1);
                  const x = i * step;
                  const y = 38 - ((v - min) / range) * 34;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Legend — bottom left (above panels) */}
      <div className="absolute bottom-[90px] left-2 z-10 flex items-center gap-2 bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] px-3 py-1.5 text-[10px]">
        {LEGENDS[colorBy].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-[var(--brand-text-mid)]">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-[90px] right-2 z-10 flex items-center gap-4 bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] px-3 py-1.5 text-[10px]">
        <span className="text-[var(--brand-text-mid)]">{filteredNodes.length} nodes</span>
        <span className="text-[var(--brand-text-mid)]">{filteredLinks.length} links</span>
        <span className="text-[var(--brand-text-mid)]">Internal: <span className="text-[#a78bfa]">{stats.internalCount}</span></span>
        <span className="text-[var(--brand-text-mid)]">External: <span className="text-[#14b8a6]">{stats.externalCount}</span></span>
        <span className="text-[var(--brand-text-mid)]">Max depth: <span className="text-[#f59e0b]">{stats.maxDepth}</span></span>
      </div>
    </div>
  );
}
