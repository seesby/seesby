import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type CrawlColorBy = 'status' | 'depth' | 'indexability' | 'render';

export type CrawlNode = {
  id: string;
  label: string;
  size: number;
  color: string;
  group: string;
  depth: number;
  statusCode: number;
  renderMode: string;
  indexability: string;
};

function colorByStatus(p: any): { color: string; group: string } {
  const s = p.statusCode ?? 200;
  if (s >= 500) return { color: STATUS_HEX.bad, group: 'error' };
  if (s >= 400) return { color: STATUS_HEX.bad, group: 'broken' };
  if (s >= 300) return { color: STATUS_HEX.info, group: 'redirect' };
  if (p.robots?.blocked) return { color: '#64748b', group: 'blocked' };
  return { color: STATUS_HEX.good, group: 'ok' };
}

function colorByDepth(depth: number): { color: string; group: string } {
  if (depth <= 2) return { color: STATUS_HEX.good, group: 'shallow' };
  if (depth <= 4) return { color: STATUS_HEX.warn, group: 'medium' };
  return { color: STATUS_HEX.bad, group: 'deep' };
}

function colorByIndexability(p: any): { color: string; group: string } {
  if (p.robots?.blocked) return { color: STATUS_HEX.bad, group: 'blocked' };
  if (p.indexing?.noindex) return { color: STATUS_HEX.warn, group: 'noindex' };
  return { color: STATUS_HEX.good, group: 'indexable' };
}

function colorByRender(p: any): { color: string; group: string } {
  const r = p.renderingMode || p.renderType || 'unknown';
  if (r === 'static') return { color: STATUS_HEX.good, group: 'static' };
  if (r === 'ssr') return { color: STATUS_HEX.info, group: 'ssr' };
  if (r === 'csr') return { color: STATUS_HEX.bad, group: 'csr' };
  return { color: '#666', group: 'unknown' };
}

function pickColor(p: any, colorBy: CrawlColorBy) {
  switch (colorBy) {
    case 'depth': return colorByDepth(Number(p.depth ?? p.crawlDepth ?? 0));
    case 'indexability': return colorByIndexability(p);
    case 'render': return colorByRender(p);
    default: return colorByStatus(p);
  }
}

export function useCrawlMap(colorBy: CrawlColorBy = 'status') {
  const { pages = [] } = useSeoCrawler() as any;
  return useMemo(() => {
    const nodes: CrawlNode[] = pages.map((p: any) => {
      const { color, group } = pickColor(p, colorBy);
      const depth = Number(p.depth ?? p.crawlDepth ?? 0);
      return {
        id: p.url,
        label: p.title ?? p.url,
        size: Math.max(2, depth) * 2,
        color,
        group,
        depth,
        statusCode: p.statusCode ?? 200,
        renderMode: p.renderingMode || p.renderType || 'unknown',
        indexability: p.robots?.blocked ? 'blocked' : p.indexing?.noindex ? 'noindex' : 'indexable',
      };
    });

    const links: { source: string; target: string; weight: number }[] = [];
    for (const p of pages) {
      for (const o of p.outboundInternal ?? []) {
        links.push({ source: p.url, target: o, weight: 1 });
      }
    }

    const depthDistribution = [0, 1, 2, 3, 4, 5].map(d => ({
      label: d < 5 ? `D${d}` : 'D5+',
      value: pages.filter((p: any) => {
        const depth = Number(p.depth ?? p.crawlDepth ?? 0);
        return d < 5 ? depth === d : depth >= 5;
      }).length,
    }));

    const errors = pages.filter((p: any) => (p.statusCode ?? 200) >= 400).length;
    const blocked = pages.filter((p: any) => p.robots?.blocked).length;
    const redirects = pages.filter((p: any) => (p.statusCode ?? 200) >= 300 && (p.statusCode ?? 200) < 400).length;
    const orphans = pages.filter((p: any) => Number(p.inlinks ?? 0) === 0 && Number(p.depth ?? p.crawlDepth ?? 0) > 0).length;

    return {
      nodes,
      links,
      depthDistribution,
      healthSummary: { errors, blocked, redirects, orphans, total: pages.length },
    };
  }, [pages, colorBy]);
}
