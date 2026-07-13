import React, { useMemo, useState } from 'react';
import { Donut } from '../../_shared/Donut';
import { useContentStats } from '../selectors/useContentStats';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

type Tab = 'near' | 'exact' | 'cannibal';
type TabDef = { id: Tab; label: string };

const TABS: TabDef[] = [
  { id: 'near', label: 'Near-dupes' },
  { id: 'exact', label: 'Exact dupes' },
  { id: 'cannibal', label: 'Cannibalization' },
];

const PANEL = 'rounded border border-[#1a1a1a] bg-[#0a0a0a]';
const LABEL = 'text-[10px] uppercase tracking-wider text-[#666] mb-2';

// ─── Types ────────────────────────────────────────────────────────────────

type Group = {
  id: number;
  pages: {
    url: string;
    path: string;
    similarity: number;
    quality: number;
    clicks: number;
    title: string;
  }[];
  avgSim: number;
  topPage: string;
  topClicks: number;
  recommendation: string;
};

type CannibalPair = {
  query: string;
  pageA: { url: string; path: string; position: number; clicks: number };
  pageB: { url: string; path: string; position: number; clicks: number };
  recommendation: string;
};

// ─── Main Component ───────────────────────────────────────────────────────

export default function ContentDuplicatesView() {
  const [tab, setTab] = useState<Tab>('near');
  const [threshold, setThreshold] = useState(70);
  const stats = useContentStats();
  const { pages = [], setSelectedPageUrl, setInspectorOpen } = useSeoCrawler() as any;

  const html = useMemo(() => pages.filter((p: any) => p.isHtmlPage !== false), [pages]);

  // Build near-dupe groups from page duplicates
  const nearGroups = useMemo(() => {
    const groupMap = new Map<string, Group>();
    let gid = 0;

    for (const p of html) {
      const dups = p.duplicates ?? [];
      for (const d of dups) {
        if ((d.similarity ?? 0) * 100 < threshold) continue;
        const key = [p.url, d.url].sort().join('|');
        if (groupMap.has(key)) continue;

        // Find all pages connected to this pair
        const connected = new Set<string>([p.url, d.url]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const cp of html) {
            if (connected.has(cp.url)) continue;
            for (const cd of cp.duplicates ?? []) {
              if ((cd.similarity ?? 0) * 100 < threshold) continue;
              if (connected.has(cd.url)) { connected.add(cp.url); changed = true; }
            }
          }
        }

        const pages = [...connected].map(url => {
          const pg = html.find((x: any) => x.url === url);
          return {
            url,
            path: url.replace(/https?:\/\/[^/]+/, ''),
            similarity: pg?.duplicates?.find((d: any) => connected.has(d.url))?.similarity ?? 0,
            quality: pg?.qualityScore ?? pg?.contentQualityScore ?? 50,
            clicks: pg?.clicks ?? 0,
            title: pg?.title ?? '',
          };
        }).sort((a, b) => b.clicks - a.clicks);

        const avgSim = pages.reduce((a, p) => a + p.similarity, 0) / pages.length;
        const topPage = pages[0]?.path ?? '';
        const topClicks = pages[0]?.clicks ?? 0;

        let recommendation = 'Review';
        if (pages.length === 2 && pages[1].clicks < pages[0].clicks * 0.1) {
          recommendation = 'Keep top; merge other';
        } else if (pages.every(p => p.quality < 50)) {
          recommendation = 'Both weak → consolidate';
        } else if (pages.length > 2) {
          recommendation = `Keep top; merge ${pages.length - 1}`;
        }

        groupMap.set(key, { id: gid++, pages, avgSim, topPage, topClicks, recommendation });
      }
    }
    return [...groupMap.values()].sort((a, b) => b.avgSim - a.avgSim);
  }, [html, threshold]);

  // Exact dupe groups (same hash)
  const exactGroups = useMemo(() => {
    const byHash = new Map<string, any[]>();
    for (const p of html) {
      if (!p.exactDuplicate) continue;
      const hash = p.hash ?? p.url;
      if (!byHash.has(hash)) byHash.set(hash, []);
      byHash.get(hash)!.push(p);
    }
    let gid = 0;
    return [...byHash.values()]
      .filter(g => g.length >= 2)
      .map(pages => {
        const sorted = pages.map((p: any) => ({
          url: p.url,
          path: p.url.replace(/https?:\/\/[^/]+/, ''),
          similarity: 1,
          quality: p.qualityScore ?? p.contentQualityScore ?? 50,
          clicks: p.clicks ?? 0,
          title: p.title ?? '',
        })).sort((a, b) => b.clicks - a.clicks);

        return {
          id: gid++,
          pages: sorted,
          avgSim: 1,
          topPage: sorted[0]?.path ?? '',
          topClicks: sorted[0]?.clicks ?? 0,
          recommendation: sorted.length === 2
            ? 'Canonical to one; noindex other'
            : `Canonical to best; noindex ${sorted.length - 1}`,
        };
      })
      .sort((a, b) => b.pages.length - a.pages.length);
  }, [html]);

  // Cannibalization — pages with same keyword overlap
  const cannibalPairs = useMemo(() => {
    const pairs: CannibalPair[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < html.length; i++) {
      for (let j = i + 1; j < html.length; j++) {
        const a = html[i], b = html[j];
        if (a.topicCluster !== b.topicCluster && a.topicCluster && b.topicCluster) continue;

        const kwA = new Set<string>((a.keywords ?? []).map((k: any) => String(k.keyword ?? k).toLowerCase()));
        const kwB = new Set<string>((b.keywords ?? []).map((k: any) => String(k.keyword ?? k).toLowerCase()));
        const shared = [...kwA].filter(k => kwB.has(k));
        if (shared.length === 0) continue;
        const query: string = shared[0];

        const key = [a.url, b.url].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);

        const posA = a.position ?? a.avgPosition ?? 50;
        const posB = b.position ?? b.avgPosition ?? 50;
        const clkA = a.clicks ?? 0;
        const clkB = b.clicks ?? 0;

        let recommendation = 'Merge into stronger page';
        if (posA < 10 && posB > 20) recommendation = `Keep ${a.url.replace(/https?:\/\/[^/]+/, '')}; deprecate other`;
        else if (posB < 10 && posA > 20) recommendation = `Keep ${b.url.replace(/https?:\/\/[^/]+/, '')}; deprecate other`;
        else if (clkA > clkB * 5) recommendation = 'Merge into higher-traffic page';
        else if (Math.abs(posA - posB) < 5) recommendation = 'Consolidate into one';

        pairs.push({
          query,
          pageA: { url: a.url, path: a.url.replace(/https?:\/\/[^/]+/, ''), position: posA, clicks: clkA },
          pageB: { url: b.url, path: b.url.replace(/https?:\/\/[^/]+/, ''), position: posB, clicks: clkB },
          recommendation,
        });
      }
    }
    return pairs.sort((a, b) => {
      const simA = Math.abs(a.pageA.position - a.pageB.position);
      const simB = Math.abs(b.pageA.position - b.pageB.position);
      return simA - simB;
    }).slice(0, 20);
  }, [html]);

  // Similarity heatmap — top N most-duped pages
  const heatmapData = useMemo(() => {
    const dupeCounts = new Map<string, number>();
    for (const p of html) {
      const count = p.duplicates?.length ?? 0;
      if (count > 0) dupeCounts.set(p.url, count);
    }
    const top = [...dupeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([url]) => url);

    if (top.length < 2) return null;

    const simMatrix: number[][] = [];
    for (const a of top) {
      const row: number[] = [];
      for (const b of top) {
        if (a === b) { row.push(1); continue; }
        const pa = html.find((p: any) => p.url === a);
        const d = pa?.duplicates?.find((d: any) => d.url === b);
        row.push(d?.similarity ?? 0);
      }
      simMatrix.push(row);
    }
    return { urls: top, matrix: simMatrix };
  }, [html]);

  const activeGroups = tab === 'near' ? nearGroups : exactGroups;

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-12 gap-3 auto-rows-min">
      {/* Tab bar + threshold — full width */}
      <div className={`${PANEL} col-span-12`}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-0.5 bg-[#111] rounded p-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`h-[24px] px-3 text-[10px] rounded transition-colors ${
                  tab === t.id ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#aaa]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab !== 'cannibal' && (
            <div className="flex items-center gap-2 text-[10px] text-[#666]">
              <span>Threshold</span>
              <input
                type="range"
                min={50}
                max={100}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-20 accent-[#a78bfa]"
              />
              <span className="w-8 text-right text-[#888]">{threshold}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary row — full width */}
      <div className={`${PANEL} col-span-12`}>
        <div className="flex items-center gap-6 p-2 text-[11px]">
          <span className="text-[#888]">{activeGroups.length} groups</span>
          <span className="text-[#888]">
            {activeGroups.reduce((a, g) => a + g.pages.length, 0)} pages
          </span>
          {tab === 'near' && (
            <span className="text-[#888]">
              Avg sim {activeGroups.length > 0
                ? Math.round(activeGroups.reduce((a, g) => a + g.avgSim, 0) / activeGroups.length * 100)
                : 0}%
            </span>
          )}
          {tab === 'cannibal' && (
            <span className="text-[#888]">{cannibalPairs.length} competing pairs</span>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className={`${PANEL} col-span-12`}>
        {tab === 'cannibal' ? (
          <CannibalTable pairs={cannibalPairs} onSelect={setSelectedPageUrl} onOpen={setInspectorOpen} />
        ) : activeGroups.length > 0 ? (
          <GroupsTable groups={activeGroups} tab={tab} onSelect={setSelectedPageUrl} onOpen={setInspectorOpen} />
        ) : (
          <div className="flex items-center justify-center h-[120px] text-[11px] text-[#555]">
            {tab === 'near' ? 'No near-duplicate groups found' : 'No exact duplicates found'}
          </div>
        )}
      </div>

      {/* Similarity heatmap */}
      {heatmapData && tab !== 'cannibal' && (
        <SimilarityHeatmap data={heatmapData} html={html} onSelect={setSelectedPageUrl} onOpen={setInspectorOpen} />
      )}
    </div>
  );
}

// ─── Groups Table (Near-dupes / Exact dupes) ──────────────────────────────

function GroupsTable({
  groups, tab, onSelect, onOpen,
}: {
  groups: Group[];
  tab: 'near' | 'exact';
  onSelect: (url: string) => void;
  onOpen: (open: boolean) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="max-h-[400px] overflow-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-[#666] border-b border-[#111] sticky top-0 bg-[#0a0a0a]">
        <span className="w-8">#</span>
        <span className="w-8">Pages</span>
        <span className="w-14 text-right">{tab === 'near' ? 'Avg sim' : 'Type'}</span>
        <span className="flex-1">Top page</span>
        <span className="w-[140px]">Recommendation</span>
      </div>
      {/* Rows */}
      <div className="divide-y divide-[#111]">
        {groups.map(g => {
          const isOpen = expanded.has(g.id);
          return (
            <div key={g.id}>
              {/* Group header */}
              <button
                onClick={() => toggle(g.id)}
                className="w-full flex items-center gap-3 px-3 py-1.5 text-left hover:bg-[#111] transition-colors"
              >
                <span className="w-8 text-[10px] text-[#666] tabular-nums">{g.id + 1}</span>
                <span className="w-8 text-[10px] text-[#888] tabular-nums">{g.pages.length}</span>
                <span className="w-14 text-[10px] text-right tabular-nums text-[#888]">
                  {tab === 'near' ? `${Math.round(g.avgSim * 100)}%` : 'exact'}
                </span>
                <span className="flex-1 text-[11px] text-[#ccc] truncate">{g.topPage}</span>
                <span className="w-[140px] text-[10px] text-[#a78bfa] truncate">{g.recommendation}</span>
              </button>
              {/* Expanded pages */}
              {isOpen && (
                <div className="bg-[#0a0a0a] border-t border-[#111]">
                  {g.pages.map(p => (
                    <button
                      key={p.url}
                      onClick={() => { onSelect(p.url); onOpen(true); }}
                      className="w-full flex items-center gap-3 pl-14 pr-3 py-1 text-left hover:bg-[#111] transition-colors"
                    >
                      <span className="text-[10px] text-[#bdb6ff] truncate flex-1 min-w-0">{p.path}</span>
                      {tab === 'near' && (
                        <span className="text-[10px] text-[#888] tabular-nums w-14 text-right">
                          {Math.round(p.similarity * 100)}%
                        </span>
                      )}
                      <span className="text-[10px] text-[#888] tabular-nums w-14 text-right">{p.clicks}</span>
                      <span className={`text-[10px] tabular-nums w-8 text-right ${
                        p.quality >= 75 ? 'text-[#22c55e]' : p.quality >= 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                      }`}>
                        {p.quality}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cannibalization Table ────────────────────────────────────────────────

function CannibalTable({
  pairs, onSelect, onOpen,
}: {
  pairs: CannibalPair[];
  onSelect: (url: string) => void;
  onOpen: (open: boolean) => void;
}) {
  if (pairs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-[11px] text-[#555]">
        No cannibalization detected
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-auto custom-scrollbar">
      <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-[#666] border-b border-[#111] sticky top-0 bg-[#0a0a0a]">
        <span className="w-[120px]">Query</span>
        <span className="flex-1">Page A</span>
        <span className="flex-1">Page B</span>
        <span className="w-[160px]">Recommendation</span>
      </div>
      <div className="divide-y divide-[#111]">
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-[#0f0f0f]">
            <span className="w-[120px] text-[10px] text-[#f59e0b] truncate">"{p.query}"</span>
            <button
              onClick={() => { onSelect(p.pageA.url); onOpen(true); }}
              className="flex-1 text-left min-w-0"
            >
              <div className="text-[10px] text-[#bdb6ff] truncate">{p.pageA.path}</div>
              <div className="text-[9px] text-[#666]">pos {p.pageA.position} / {p.pageA.clicks} clk</div>
            </button>
            <button
              onClick={() => { onSelect(p.pageB.url); onOpen(true); }}
              className="flex-1 text-left min-w-0"
            >
              <div className="text-[10px] text-[#bdb6ff] truncate">{p.pageB.path}</div>
              <div className="text-[9px] text-[#666]">pos {p.pageB.position} / {p.pageB.clicks} clk</div>
            </button>
            <span className="w-[160px] text-[10px] text-[#a78bfa] truncate">{p.recommendation}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Similarity Heatmap ───────────────────────────────────────────────────

function SimilarityHeatmap({
  data, html, onSelect, onOpen,
}: {
  data: { urls: string[]; matrix: number[][] };
  html: any[];
  onSelect: (url: string) => void;
  onOpen: (open: boolean) => void;
}) {
  const n = data.urls.length;
  const cellSize = Math.min(16, Math.floor(600 / n));

  return (
    <div className={`${PANEL} col-span-12`}>
      <div className={LABEL}>Similarity heatmap ({n}×{n} most-duped pages)</div>
      <div className="overflow-auto custom-scrollbar">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-6" />
              {data.urls.map((url, i) => (
                <th
                  key={i}
                  className="text-[8px] text-[#666] font-normal px-px cursor-pointer hover:text-white"
                  style={{ width: cellSize, maxWidth: cellSize }}
                  onClick={() => { onSelect(url); onOpen(true); }}
                  title={url}
                >
                  <div className="truncate" style={{ width: cellSize }}>{i + 1}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.urls.map((url, row) => (
              <tr key={row}>
                <td
                  className="text-[8px] text-[#666] text-right pr-1 cursor-pointer hover:text-white"
                  onClick={() => { onSelect(url); onOpen(true); }}
                  title={url}
                >
                  {row + 1}
                </td>
                {data.matrix[row].map((sim, col) => {
                  const pct = Math.round(sim * 100);
                  const bg = row === col
                    ? '#a78bfa'
                    : sim >= 0.7 ? `rgba(167,139,250,${0.3 + sim * 0.5})`
                    : sim >= 0.4 ? `rgba(245,158,11,${sim * 0.6})`
                    : sim > 0 ? `rgba(59,130,246,${sim * 0.4})`
                    : 'transparent';
                  return (
                    <td
                      key={col}
                      className="border border-[#0a0a0a]"
                      style={{ width: cellSize, height: cellSize, background: bg }}
                      title={row === col ? data.urls[row] : `${data.urls[row]} ↔ ${data.urls[col]}: ${pct}%`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
