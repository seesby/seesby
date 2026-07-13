import React, { useMemo, useState } from 'react';
import { ForceGraph } from '../../_shared/ForceGraph';
import { Treemap } from '../../_shared/Treemap';
import { useClusters } from '../selectors/useClusters';
import { CHART_PALETTE } from '../../_shared/tokens';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { Search } from 'lucide-react';

type Layout = 'graph' | 'treemap';

export default function ContentClustersView() {
  const { list, nodes, links } = useClusters();
  const [layout, setLayout] = useState<Layout>('graph');
  const [search, setSearch] = useState('');
  const { pages = [], setSelectedPageUrl, setInspectorOpen, setRsTab } = useSeoCrawler() as any;

  const treemapData = useMemo(
    () => list.slice(0, 32).map((c, i) => ({
      name: c.id,
      size: c.size,
      color: CHART_PALETTE[i % CHART_PALETTE.length],
    })),
    [list],
  );

  const filteredNodes = useMemo(() => {
    if (!search) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(n => n.id.toLowerCase().includes(q));
  }, [nodes, search]);

  const filteredLinks = useMemo(() => {
    if (!search) return links;
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
  }, [links, filteredNodes, search]);

  // Cannibalization heatmap data — pages with duplicate issues
  const cannibalRows = useMemo(() => {
    const html = pages.filter((p: any) => p.isHtmlPage !== false);
    const getCluster = (p: any) => {
      const explicit = p.topicCluster ?? p.cluster;
      if (explicit && explicit !== 'misc') return explicit;
      try {
        const url = new URL(p.url);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length >= 1) return segments[0];
      } catch { /* ignore */ }
      return 'uncategorized';
    };

    const rows: { url: string; path: string; cluster: string; intensity: number; flags: string[] }[] = [];
    for (const p of html) {
      const flags: string[] = [];
      if (p.exactDuplicate) flags.push('exact');
      if (p.isDuplicateTitle) flags.push('title');
      if (p.isDuplicateMetaDesc) flags.push('meta');
      if (p.isDuplicateH1) flags.push('h1');
      if (flags.length === 0) continue;

      const intensity = flags.length / 4;
      let path = p.url;
      try { path = new URL(p.url).pathname; } catch { /* keep full url */ }
      rows.push({
        url: p.url,
        path: p.url,
        cluster: getCluster(p),
        intensity,
        flags,
      });
    }
    return rows.sort((a, b) => b.intensity - a.intensity).slice(0, 15);
  }, [pages]);

  const singleCluster = list.length === 1;
  const noLinks = links.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Floating controls — top left */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
        <div className="flex items-center bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] p-0.5">
          {(['graph', 'treemap'] as Layout[]).map(l => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`h-[24px] px-2 text-[10px] rounded transition-colors ${
                layout === l ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)] hover:text-[var(--brand-text-mid)]'
              }`}
            >
              {l === 'graph' ? 'Graph' : 'Treemap'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] px-2 h-[24px]">
          <Search size={10} className="text-[var(--brand-text-faint)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter clusters"
            className="bg-transparent text-[10px] text-[var(--brand-text-strong)] w-24 outline-none placeholder:text-[var(--brand-text-faint)]"
          />
        </div>
      </div>

      {/* Floating stats — top right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-3 bg-[var(--brand-surface-1)]/90 backdrop-blur rounded border border-[var(--brand-surface-3)] px-3 py-1.5 text-[10px]">
        <span className="text-[var(--brand-text-mid)]">{list.length} clusters</span>
        <span className="text-[var(--brand-text-mid)]">{nodes.length} nodes</span>
        <span className="text-[var(--brand-text-mid)]">{links.length} links</span>
      </div>

      {/* Main graph/treemap area */}
      <div className="flex-1 min-h-0 relative" style={{ flex: '1 1 60%' }}>
        {layout === 'graph' ? (
          filteredNodes.length > 0 && !noLinks ? (
            <ForceGraph nodes={filteredNodes as any} links={filteredLinks as any} />
          ) : singleCluster ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 rounded-full bg-[#a78bfa]/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-[#a78bfa]">{list[0].size}</span>
                </div>
                <div className="text-[13px] text-[var(--brand-text-mid)] mb-1">{list[0].id}</div>
                <div className="text-[11px] text-[var(--brand-text-faint)]">
                  All pages are in one cluster. Topic clustering needs more diverse content to create connections.
                </div>
              </div>
            </div>
          ) : filteredNodes.length > 0 ? (
            <ForceGraph nodes={filteredNodes as any} links={filteredLinks as any} />
          ) : (
            <div className="flex items-center justify-center h-full text-[11px] text-[var(--brand-text-faint)]">
              {search ? 'No clusters match filter' : 'No clusters found'}
            </div>
          )
        ) : (
          treemapData.length > 0 ? (
            <div className="h-full overflow-auto custom-scrollbar p-3">
              <Treemap data={treemapData} height={Math.max(300, list.length * 40)} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[11px] text-[var(--brand-text-faint)]">
              No clusters detected
            </div>
          )
        )}
      </div>

      {/* Cannibalization heatmap */}
      {cannibalRows.length > 0 && (
        <div className="shrink-0 mx-2 mb-2 rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] max-h-[120px] overflow-auto custom-scrollbar">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] border-b border-[var(--brand-surface-2)] sticky top-0 bg-[var(--brand-surface-0)]">
            Cannibalization heatmap ({cannibalRows.length} pages)
          </div>
          <div className="divide-y divide-[var(--brand-surface-2)]">
            {cannibalRows.map((row) => (
              <button
                key={row.url}
                onClick={() => { setSelectedPageUrl?.(row.url); setInspectorOpen?.(true); }}
                className="w-full flex items-center gap-3 px-3 py-1 text-left hover:bg-[var(--brand-surface-2)] transition-colors"
              >
                <span className="text-[10px] text-[var(--brand-text-mid)] min-w-0 flex-1 truncate">{row.path}</span>
                <span className="text-[9px] text-[var(--brand-text-faint)] shrink-0 truncate max-w-[120px]">
                  {row.flags.join(', ')}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex gap-px">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const filled = i < Math.round(row.intensity * 8);
                      return (
                        <div
                          key={i}
                          className="w-2 h-3 rounded-sm"
                          style={{
                            background: filled
                              ? row.intensity >= 0.7 ? '#ef4444' : row.intensity >= 0.4 ? '#f59e0b' : '#3b82f6'
                              : 'bg-[var(--brand-surface-3)]',
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[9px] text-[var(--brand-text-faint)] w-7 text-right">
                    {Math.round(row.intensity * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar — cluster list */}
      {list.length > 0 && (
        <div className="shrink-0 border-t border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] max-h-[120px] overflow-auto custom-scrollbar">
          <div className="flex items-center gap-4 px-3 py-1.5 text-[10px] text-[var(--brand-text-faint)] border-b border-[var(--brand-surface-2)] sticky top-0 bg-[var(--brand-surface-0)]">
            <span>Cluster</span>
            <span className="ml-auto">Pages</span>
            <span>Top intent</span>
          </div>
          <div className="divide-y divide-[var(--brand-surface-2)]">
            {list.slice(0, 20).map((c, i) => {
              const topIntent = Object.entries(c.intent)
                .sort(([, a], [, b]) => b - a)[0];
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedPageUrl?.(c.pages[0]);
                    setRsTab?.('content', 'topics');
                    setInspectorOpen?.(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-1 text-left hover:bg-[var(--brand-surface-2)] transition-colors text-[11px]"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }}
                  />
                  <span className="text-[var(--brand-text-mid)] truncate min-w-0 flex-1">{c.id}</span>
                  <span className="text-[var(--brand-text-mid)] tabular-nums shrink-0 w-12 text-right">{c.size}</span>
                  <span className="text-[var(--brand-text-faint)] shrink-0 w-20">{topIntent?.[0] ?? '—'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
