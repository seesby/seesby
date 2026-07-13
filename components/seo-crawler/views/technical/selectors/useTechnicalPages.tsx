'use client'

import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import {
  urlColumn, statusColumn, LCP_COLUMN, CLS_COLUMN, INP_COLUMN,
  ttfbColumn, sizeColumn, requestsColumn, renderModeColumn,
  indexableColumn, canonicalColumn, robotsColumn, redirectsColumn,
  schemaColumn, certColumn, securityColumn, a11yColumn,
} from '../../_shared/shared-columns';
import { filterByVisibleColumns } from '../../_shared/filterByVisibleColumns';

export type RenderMode = 'static' | 'ssr' | 'csr' | 'hybrid' | 'unknown';
export type Indexability = 'indexable' | 'noindex' | 'blocked';

export type PageFilters = {
  status: Set<string>;
  render: Set<string>;
  indexability: Set<string>;
  security: Set<string>;
};

export const EMPTY_FILTERS: PageFilters = {
  status: new Set(),
  render: new Set(),
  indexability: new Set(),
  security: new Set(),
};

export type TechnicalRow = {
  id: string;
  url: string;
  status: number;
  ttfb: number;
  lcp: number;
  inp: number;
  cls: number;
  bytes: number;
  requests: number;
  jsBytes: number;
  cssBytes: number;
  imgBytes: number;
  blocked: boolean;
  noindex: boolean;
  canonicalOk: boolean;
  canonUrl: string;
  robotsOk: boolean;
  robotsDirectives: string;
  sitemapOk: boolean;
  hreflangOk: boolean;
  schemaCount: number;
  redirectChain: number;
  certDays: number | null;
  renderMode: RenderMode;
  indexability: Indexability;
  securityPass: boolean;
  accessibility: number;
  depth: number;
  actions?: any[];
};

export function useTechnicalPages() {
  const { pages = [], visibleColumns = [], foundationActionsMap } = useSeoCrawler() as any;

  const rows: TechnicalRow[] = useMemo(() =>
    pages.map((p: any) => {
      const isBlocked = !!p.robots?.blocked;
      const isNoindex = !!p.indexing?.noindex;
      const idx: Indexability = isBlocked ? 'blocked' : isNoindex ? 'noindex' : 'indexable';

      let render: RenderMode = 'unknown';
      if (p.renderingMode) render = p.renderingMode;
      else if (p.renderType) render = p.renderType;
      else if (p.render?.diff?.textDiffPercent > 10) render = 'csr';
      else if (p.render?.diff?.textDiffPercent > 0) render = 'ssr';

      return {
        id: p.url,
        url: p.url,
        status: p.statusCode ?? 200,
        ttfb: p.cwv?.ttfb ?? 0,
        lcp: p.cwv?.lcp ?? 0,
        inp: p.cwv?.inp ?? 0,
        cls: p.cwv?.cls ?? 0,
        bytes: p.transfer?.totalBytes ?? 0,
        requests: p.transfer?.requests ?? 0,
        jsBytes: p.transfer?.js ?? 0,
        cssBytes: p.transfer?.css ?? 0,
        imgBytes: p.transfer?.images ?? 0,
        blocked: isBlocked,
        noindex: isNoindex,
        canonicalOk: p.canonical?.valid ?? true,
        canonUrl: p.canonical?.url || 'self',
        robotsOk: !isBlocked,
        robotsDirectives: p.robots?.directives || (isBlocked ? 'noindex, nofollow' : 'index, follow'),
        sitemapOk: !!p.sitemap?.present,
        hreflangOk: p.hreflang?.valid ?? true,
        schemaCount: p.schema?.types?.length ?? 0,
        redirectChain: p.redirects?.length ?? 0,
        certDays: p.security?.certExpiresInDays ?? null,
        renderMode: render,
        indexability: idx,
        securityPass: p.sslValid !== false && !p.hasMixedContent,
        accessibility: p.a11yScore ?? (p.a11y?.violations?.length > 0 ? p.a11y.violations.length : -1),
        depth: Number(p.depth ?? p.crawlDepth ?? 0),
        actions: foundationActionsMap?.get?.(p.url) ?? p.actions ?? [],
      };
    }), [pages, foundationActionsMap]);

  const columns: ColumnDef<TechnicalRow>[] = useMemo(() => [
    urlColumn<TechnicalRow>(),
    statusColumn<TechnicalRow>({ accessorFn: (r) => r.status }),
    ttfbColumn<TechnicalRow>({ accessorFn: (r) => r.ttfb }),
    LCP_COLUMN,
    INP_COLUMN,
    CLS_COLUMN,
    sizeColumn<TechnicalRow>({ accessorFn: (r) => r.bytes }),
    requestsColumn<TechnicalRow>({ accessorFn: (r) => r.requests }),
    renderModeColumn<TechnicalRow>({ accessorFn: (r) => r.renderMode }),
    indexableColumn<TechnicalRow>({ accessorFn: (r) => r.indexability }),
    canonicalColumn<TechnicalRow>({ accessorFn: (r) => r.canonUrl }),
    robotsColumn<TechnicalRow>({ accessorFn: (r) => r.robotsDirectives }),
    redirectsColumn<TechnicalRow>({ accessorFn: (r) => r.redirectChain }),
    schemaColumn<TechnicalRow>({ accessorFn: (r) => r.schemaCount }),
    certColumn<TechnicalRow>({ accessorFn: (r) => r.certDays }),
    securityColumn<TechnicalRow>({ accessorFn: (r) => r.securityPass }),
    a11yColumn<TechnicalRow>({ accessorFn: (r) => r.accessibility }),
  ], []);

  const filtered = useMemo(
    () => filterByVisibleColumns(columns, visibleColumns),
    [columns, visibleColumns],
  );

  return { rows, columns: filtered };
}

export function useTechnicalPageFilters(rows: TechnicalRow[], filters: PageFilters) {
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filters.status.size > 0) {
        const sc = String(r.status);
        const group = sc.startsWith('2') ? '2xx' : sc.startsWith('3') ? '3xx' : sc.startsWith('4') ? '4xx' : sc.startsWith('5') ? '5xx' : '';
        if (!filters.status.has(group)) return false;
      }
      if (filters.render.size > 0 && !filters.render.has(r.renderMode)) return false;
      if (filters.indexability.size > 0 && !filters.indexability.has(r.indexability)) return false;
      if (filters.security.size > 0) {
        const sec = r.securityPass ? 'pass' : 'fail';
        if (!filters.security.has(sec)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  return filtered;
}
