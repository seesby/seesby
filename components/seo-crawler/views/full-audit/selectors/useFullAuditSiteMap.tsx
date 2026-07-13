import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type ColorBy = 'status' | 'depth' | 'render' | 'index';

export function useFullAuditSiteMap(colorBy: ColorBy = 'status') {
  const { pages = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    const maxDepth = Math.max(1, ...pages.map((p: any) => p.depth ?? 0));

    const nodes = pages.map((p: any) => ({
      id: p.url,
      label: trim(p.title ?? p.url),
      size: Math.max(2, (p.links?.internal ?? 0)),
      group: severity(p),
      color: colorForNode(p, colorBy, maxDepth),
      // Extra metadata for tooltips
      statusCode: p.statusCode ?? 200,
      depth: p.depth ?? 0,
      wordCount: p.content?.wordCount,
      lcp: p.cwv?.lcp,
      contentScore: p.scores?.content,
      renderBytes: p.render?.rendered?.bytes,
      hydrationMs: p.render?.hydrationMs,
    }));

    const links: { source: string; target: string; weight?: number }[] = [];
    for (const p of pages) {
      for (const out of p.outboundInternal ?? []) {
        links.push({ source: p.url, target: out, weight: 1 });
      }
    }

    return { nodes, links };
  }, [pages, colorBy]);
}

function colorForNode(p: any, colorBy: ColorBy, maxDepth: number): string {
  if (colorBy === 'depth') {
    const depth = p.depth ?? 0;
    const t = maxDepth > 0 ? depth / maxDepth : 0;
    // Green (shallow) -> Amber -> Red (deep)
    if (t < 0.33) return STATUS_HEX.good;
    if (t < 0.66) return STATUS_HEX.warn;
    return STATUS_HEX.bad;
  }
  if (colorBy === 'render') {
    const hydrationMs = p.render?.hydrationMs ?? 0;
    const jsBytes = p.render?.diff?.jsBytes ?? 0;
    // Low hydration + low JS = good, high = bad
    if (hydrationMs > 3000 || jsBytes > 500_000) return STATUS_HEX.bad;
    if (hydrationMs > 1000 || jsBytes > 200_000) return STATUS_HEX.warn;
    return STATUS_HEX.good;
  }
  if (colorBy === 'index') {
    const isIndexable = p.indexable ?? (p.meta?.robots !== 'noindex' && p.meta?.robots !== 'none');
    return isIndexable ? STATUS_HEX.good : STATUS_HEX.bad;
  }
  // Default: status-based severity
  return colorFor(severity(p));
}

function severity(p: any): 'good' | 'warn' | 'bad' {
  if ((p.statusCode ?? 200) >= 400) return 'bad';
  if ((p.scores?.content ?? 100) < 60 || (p.cwv?.lcp ?? 0) > 4000) return 'warn';
  return 'good';
}

function colorFor(s: 'good' | 'warn' | 'bad') {
  return s === 'bad' ? STATUS_HEX.bad : s === 'warn' ? STATUS_HEX.warn : STATUS_HEX.good;
}

function trim(s: string, n = 32) {
  return s && s.length > n ? s.slice(0, n - 1) + '…' : s;
}
