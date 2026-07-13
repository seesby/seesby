import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

function getCluster(p: any): string {
  // Prefer explicit cluster data
  const explicit = p.topicCluster ?? p.cluster;
  if (explicit && explicit !== 'misc') return explicit;

  // Fallback: derive from URL path segments
  try {
    const url = new URL(p.url);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length >= 2) return segments[0];
    if (segments.length === 1) return segments[0];
  } catch { /* ignore */ }

  // Fallback: derive from category
  if (p.category && p.category !== 'other') return p.category;

  // Fallback: derive from page type
  if (p.pageType || p.type) return p.pageType ?? p.type;

  return 'uncategorized';
}

export function useClusters() {
  const { pages = [] } = useSeoCrawler() as any;
  return useMemo(() => {
    const html = pages.filter((p: any) => p.isHtmlPage !== false);
    const clusters: Record<string, { id: string; size: number; pages: string[]; intent: Record<string, number>; topic: string }> = {};

    for (const p of html) {
      const c = getCluster(p);
      if (!clusters[c]) clusters[c] = { id: c, size: 0, pages: [], intent: {}, topic: c };
      clusters[c].size += 1;
      clusters[c].pages.push(p.url);
      const i = p.searchIntent ?? p.intent ?? 'unknown';
      clusters[c].intent[i] = (clusters[c].intent[i] ?? 0) + 1;
    }

    const list = Object.values(clusters).sort((a, b) => b.size - a.size);

    // Build force-graph from cluster co-occurrence based on internal links between pages.
    const clusterOf = (url: string) => {
      const p = html.find((p: any) => p.url === url);
      return p ? getCluster(p) : 'uncategorized';
    };

    const nodes = list.map(c => ({
      id: c.id,
      label: c.id,
      size: Math.max(4, Math.min(c.size, 30)), // cap at 30 to prevent huge nodes
      group: c.id,
    }));

    const seen = new Map<string, number>();
    for (const p of html) {
      const a = clusterOf(p.url);
      for (const out of p.outboundInternal ?? []) {
        const b = clusterOf(out);
        if (a === b) continue;
        const k = a < b ? `${a}|${b}` : `${b}|${a}`;
        seen.set(k, (seen.get(k) ?? 0) + 1);
      }
    }

    const links = [...seen.entries()].map(([k, weight]) => {
      const [s, t] = k.split('|');
      return { source: s, target: t, weight };
    });

    return { list, nodes, links };
  }, [pages]);
}
