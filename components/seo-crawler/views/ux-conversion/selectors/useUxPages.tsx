import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtMs, fmtPct, fmtUrl } from '../../_shared/formatters';
import { filterByVisibleColumns } from '../../_shared/filterByVisibleColumns';

export type UxRow = {
  id: string;
  url: string;
  bounceRate: number;
  avgTime: number;        // seconds
  rageClicks: number;
  deadClicks: number;
  errorClicks: number;
  scrollDepth: number;
  formStarts: number;
  formCompletes: number;
  cwvLcp: number;
  cwvCls: number;
  cwvInp: number;
  ctaClicks: number;
  actions?: any[];
};

export function useUxPages() {
  const { pages = [], visibleColumns = [], foundationActionsMap } = useSeoCrawler() as any;
  const rows: UxRow[] = useMemo(() => pages.map((p: any) => ({
    id: p.url,
    url: p.url,
    bounceRate: p.ux?.bounceRate ?? 0,
    avgTime: p.ux?.avgTime ?? 0,
    rageClicks: p.ux?.rageClicks ?? 0,
    deadClicks: p.ux?.deadClicks ?? 0,
    errorClicks: p.ux?.errorClicks ?? 0,
    scrollDepth: p.ux?.scrollDepth ?? 0,
    formStarts: p.ux?.formStarts ?? 0,
    formCompletes: p.ux?.formCompletes ?? 0,
    cwvLcp: p.cwv?.lcp ?? 0,
    cwvCls: p.cwv?.cls ?? 0,
    cwvInp: p.cwv?.inp ?? 0,
    ctaClicks: p.ux?.ctaClicks ?? 0,
    actions: foundationActionsMap?.get?.(p.url) ?? p.actions ?? [],
  })), [pages, foundationActionsMap]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { id: 'p.identity.url',       header: 'URL',         size: 320, accessorFn: (row: any) => row.url, cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string)}</span> },
    { id: 'p.ga.bounce',          header: 'Bounce',      size: 80, accessorFn: (row: any) => row.bounceRate, cell: c => fmtPct(c.getValue() as number) },
    { accessorKey: 'avgTime',     header: 'Avg time',    size: 90, cell: c => `${Math.round(c.getValue() as number)}s` },
    { accessorKey: 'scrollDepth', header: 'Scroll',      size: 80, cell: c => fmtPct(c.getValue() as number) },
    { accessorKey: 'rageClicks',  header: 'Rage',        size: 70 },
    { accessorKey: 'deadClicks',  header: 'Dead',        size: 70 },
    { accessorKey: 'errorClicks', header: 'Error',       size: 70 },
    { accessorKey: 'cwvLcp', header: 'LCP',         size: 70, cell: c => fmtMs(c.getValue() as number) },
    { accessorKey: 'cwvInp', header: 'INP',         size: 70, cell: c => fmtMs(c.getValue() as number) },
    { accessorKey: 'cwvCls', header: 'CLS',         size: 70 },
    { accessorKey: 'formStarts',  header: 'F-start',     size: 80 },
    { accessorKey: 'formCompletes', header: 'F-complete', size: 100 },
    { accessorKey: 'ctaClicks',   header: 'CTA',         size: 70 },
  ], []);

  const filtered = useMemo(
    () => filterByVisibleColumns(columns, visibleColumns),
    [columns, visibleColumns],
  );

  return { rows, columns: filtered };
}
