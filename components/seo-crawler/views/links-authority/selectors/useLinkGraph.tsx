import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type LinkGraphColorBy = 'depth' | 'status' | 'pageRank';

export function useLinkGraph(colorBy: LinkGraphColorBy = 'depth') {
  const { pages = [], backlinks = [] } = useSeoCrawler() as any;
  return useMemo(() => {
    const own = new Set(pages.map((p: any) => p.url));

    const depthColor = (d: number) =>
      d === 0 ? '#a78bfa' : d <= 2 ? STATUS_HEX.info : d <= 4 ? STATUS_HEX.warn : STATUS_HEX.bad;

    const statusColor = (code: number) =>
      code >= 400 ? STATUS_HEX.bad : code >= 300 ? STATUS_HEX.info : STATUS_HEX.good;

    const pageRankColor = (pr: number) =>
      pr >= 5 ? STATUS_HEX.good : pr >= 2 ? STATUS_HEX.info : pr >= 1 ? '#a78bfa' : '#64748b';

    const nodes: any[] = pages.map((p: any) => {
      const pr = p.linkMetrics?.pageRank ?? p.pageRank ?? 1;
      let color: string;
      if (colorBy === 'status') color = statusColor(p.statusCode ?? 200);
      else if (colorBy === 'pageRank') color = pageRankColor(pr);
      else color = depthColor(p.depth ?? 0);

      return {
        id: p.url,
        label: p.title ?? p.url,
        size: Math.max(2, pr * 8),
        color,
        group: 'internal',
        pageRank: pr,
        depth: p.depth ?? 0,
        status: p.statusCode ?? 200,
      };
    });

    const externalRoots = new Map<string, { count: number; dr: number }>();
    for (const b of backlinks) {
      const host = safeHost(b.from);
      const existing = externalRoots.get(host) ?? { count: 0, dr: 0 };
      existing.count += 1;
      existing.dr = Math.max(existing.dr, b.sourceMetrics?.dr ?? 0);
      externalRoots.set(host, existing);
    }

    for (const [host, { count, dr }] of externalRoots) {
      nodes.push({
        id: `ext:${host}`,
        label: host,
        size: Math.max(2, Math.log2(count + 1) * 4),
        color: dr >= 50 ? '#14b8a6' : dr >= 20 ? '#06b6d4' : '#64748b',
        group: 'external',
        pageRank: 0,
        depth: -1,
        status: 200,
      });
    }

    const links: any[] = [];
    for (const p of pages) {
      for (const out of p.outboundInternal ?? []) {
        if (own.has(out)) links.push({ source: p.url, target: out, weight: 1 });
      }
    }
    for (const b of backlinks) {
      links.push({ source: `ext:${safeHost(b.from)}`, target: b.to, weight: b.weight ?? 1 });
    }

    const internalCount = pages.length;
    const externalCount = externalRoots.size;
    const totalLinks = links.length;
    const maxDepth = pages.reduce((m: number, p: any) => Math.max(m, p.depth ?? 0), 0);

    return {
      nodes,
      links,
      stats: { internalCount, externalCount, totalLinks, maxDepth },
    };
  }, [pages, backlinks, colorBy]);
}

function safeHost(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
}
