import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type RenderSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export type RenderRow = {
  id: string;
  url: string;
  hasRender: boolean;
  staticBytes: number;
  renderedBytes: number;
  jsAddedBytes: number;
  reqDelta: number;
  blockingScripts: number;
  hydrationMs: number;
  cwvBefore: number;
  cwvAfter: number;
  renderGapPct: number;
  contentInvisibleToBots: boolean;
  linksInvisibleToBots: boolean;
  schemaInvisibleToBots: boolean;
  severity: RenderSeverity;
};

export type RenderSummary = {
  totalPages: number;
  pagesWithRender: number;
  contentInvisibleCount: number;
  linksInvisibleCount: number;
  schemaInvisibleCount: number;
  avgHydrationMs: number;
  avgLcpDelta: number;
};

function computeSeverity(gapPct: number, hasRender: boolean): RenderSeverity {
  if (!hasRender) return 'none';
  if (gapPct >= 80) return 'severe';
  if (gapPct >= 40) return 'moderate';
  if (gapPct >= 15) return 'mild';
  return 'none';
}

export function useRenderDiff() {
  const { pages = [] } = useSeoCrawler() as any;

  const rows: RenderRow[] = useMemo(() =>
    pages.map((p: any) => {
      const hasRender = !!p.render;
      const staticBytes = p.render?.static?.bytes ?? 0;
      const renderedBytes = p.render?.rendered?.bytes ?? 0;
      const jsAddedBytes = p.render?.diff?.jsBytes ?? 0;
      const cwvBefore = p.render?.cwvBefore?.lcp ?? 0;
      const cwvAfter = p.render?.cwvAfter?.lcp ?? 0;

      const renderGapPct = staticBytes > 0
        ? Math.round(((renderedBytes - staticBytes) / staticBytes) * 100)
        : 0;

      const contentInvisibleToBots = hasRender && renderedBytes > staticBytes * 1.5;
      const linksInvisibleToBots = hasRender && (p.render?.diff?.links ?? 0) > 0;
      const schemaInvisibleToBots = hasRender && !!(p.render?.diff?.schemaAdded);

      return {
        id: p.url,
        url: p.url,
        hasRender,
        staticBytes,
        renderedBytes,
        jsAddedBytes,
        reqDelta: p.render?.diff?.requests ?? 0,
        blockingScripts: p.render?.blockingScripts ?? 0,
        hydrationMs: p.render?.hydrationMs ?? 0,
        cwvBefore,
        cwvAfter,
        renderGapPct,
        contentInvisibleToBots,
        linksInvisibleToBots,
        schemaInvisibleToBots,
        severity: computeSeverity(renderGapPct, hasRender),
      };
    }), [pages]);

  const summary: RenderSummary = useMemo(() => {
    const withRender = rows.filter(r => r.hasRender);
    return {
      totalPages: rows.length,
      pagesWithRender: withRender.length,
      contentInvisibleCount: rows.filter(r => r.contentInvisibleToBots).length,
      linksInvisibleCount: rows.filter(r => r.linksInvisibleToBots).length,
      schemaInvisibleCount: rows.filter(r => r.schemaInvisibleToBots).length,
      avgHydrationMs: withRender.length
        ? withRender.reduce((s, r) => s + r.hydrationMs, 0) / withRender.length
        : 0,
      avgLcpDelta: withRender.length
        ? withRender.reduce((s, r) => s + (r.cwvAfter - r.cwvBefore), 0) / withRender.length
        : 0,
    };
  }, [rows]);

  const renderGapPages = useMemo(() =>
    rows
      .filter(r => r.hasRender && r.severity !== 'none')
      .sort((a, b) => b.renderGapPct - a.renderGapPct)
      .slice(0, 20),
  [rows]);

  return { rows, summary, renderGapPages };
}
