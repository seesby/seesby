import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import {
  urlColumn, statusColumn, cwvBucketColumn, secGradeColumn, scoreBarColumn,
  TITLE_COLUMN, WORD_COUNT_COLUMN, DEPTH_COLUMN, LCP_COLUMN, CLS_COLUMN, INP_COLUMN,
  INLINKS_COLUMN, OUTLINKS_COLUMN, CLICKS_COLUMN, IMPRESSIONS_COLUMN,
  SESSIONS_COLUMN,
} from '../../_shared/shared-columns';

export type FullAuditPageRow = {
  id: string;
  url: string;
  title: string;
  h1: string;
  indexable: boolean | string;
  issues: number;
  statusCode: number;
  crawlDepth: number;
  contentScore: number;
  technicalScore: number;
  cwvScore: number;
  inlinks: number;
  outlinks: number;
  wordCount: number;
  ttfb: number;
  lcp: number;
  cls: number;
  inp: number;
  lastCrawled: string;
  actions?: any[];
  [key: string]: any;
};

export function useFullAuditPages() {
  const { pages = [], visibleColumns = [], foundationActionsMap } = useSeoCrawler() as any;

  const rows = useMemo<FullAuditPageRow[]>(() =>
    pages.map((p: any) => {
      const actions = foundationActionsMap?.get?.(p.url) ?? p.actions ?? [];
      return {
        ...p,
        id: p.url ?? p.id,
        url: p.url,
        title: p.title ?? '',
        h1: p.h1 ?? p.headings?.h1?.[0] ?? '',
        indexable: p.indexable ?? p.meta?.robots ?? true,
        issues: p.issues?.length ?? 0,
        statusCode: p.statusCode ?? 200,
        crawlDepth: p.depth ?? 0,
        contentScore: p.scores?.content ?? 0,
        technicalScore: p.scores?.technical ?? 0,
        cwvScore: p.scores?.cwv ?? 0,
        inlinks: p.links?.internal ?? 0,
        outlinks: p.links?.external ?? 0,
        wordCount: p.content?.wordCount ?? 0,
        ttfb: p.cwv?.ttfb ?? 0,
        lcp: p.cwv?.lcp ?? 0,
        cls: p.cwv?.cls ?? 0,
        inp: p.cwv?.inp ?? 0,
        lastCrawled: p.lastCrawledAt ?? '',
        actions,
      };
    }), [pages, foundationActionsMap]);

  const columns = useMemo(() => {
    const allCols = [
      urlColumn<FullAuditPageRow>(),
      { accessorKey: 'h1', id: 'h1', header: 'H1', size: 220, cell: c => <span className="truncate">{String(c.getValue() ?? '-')}</span> },
      statusColumn<FullAuditPageRow>(),
      TITLE_COLUMN as ColumnDef<FullAuditPageRow>,
      WORD_COUNT_COLUMN as ColumnDef<FullAuditPageRow>,
      CLICKS_COLUMN as ColumnDef<FullAuditPageRow>,
      IMPRESSIONS_COLUMN as ColumnDef<FullAuditPageRow>,
      SESSIONS_COLUMN as ColumnDef<FullAuditPageRow>,
      cwvBucketColumn<FullAuditPageRow>(),
      scoreBarColumn('p.content.eeatScore', { header: 'Content', size: 80, accessorFn: (row) => row.contentScore }),
      scoreBarColumn('p.tech.cwv.bucket', { header: 'Tech', size: 80, accessorFn: (row) => row.technicalScore }),
      secGradeColumn<FullAuditPageRow>(),
      DEPTH_COLUMN as ColumnDef<FullAuditPageRow>,
      INLINKS_COLUMN as ColumnDef<FullAuditPageRow>,
      OUTLINKS_COLUMN as ColumnDef<FullAuditPageRow>,
      LCP_COLUMN as ColumnDef<FullAuditPageRow>,
      CLS_COLUMN as ColumnDef<FullAuditPageRow>,
      INP_COLUMN as ColumnDef<FullAuditPageRow>,
    ];

    return allCols.filter(col => {
      const colId = (col as any).id;
      return colId ? visibleColumns.includes(colId) : true;
    });
  }, [visibleColumns]);

  const distributions = useMemo(() => {
    const statusBuckets: Record<string, number> = {};
    const depthBuckets: Record<string, number> = {};
    for (const p of pages) {
      const code = p.statusCode ?? 200;
      const bucket = code >= 500 ? '5xx' : code >= 400 ? '4xx' : code >= 300 ? '3xx' : '2xx';
      statusBuckets[bucket] = (statusBuckets[bucket] ?? 0) + 1;
      const depth = p.depth ?? 0;
      const dKey = `d${depth}`;
      depthBuckets[dKey] = (depthBuckets[dKey] ?? 0) + 1;
    }
    return { statusBuckets, depthBuckets };
  }, [pages]);

  return { rows, columns, distributions };
}
