import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtUrl, fmtCompact } from '../../../views/_shared/formatters';
import { filterByVisibleColumns } from '../../../views/_shared/filterByVisibleColumns';

export type WqaPageRow = {
  id: string;
  url: string;
  category: string;
  quality: number;
  clicksDelta: number;
  impressionsDelta: number;
  position: number;
  topKeyword: string;
  backlinks: number;
  [key: string]: any;
};

export function useWqaPages() {
  const { pages = [], visibleColumns = [], foundationActionsMap } = useSeoCrawler() as any;

  const rows = useMemo<WqaPageRow[]>(() =>
    pages.map((p: any) => ({
      ...p,
      id: p.url,
      url: p.url,
      category: p.category ?? p.pageCategory ?? '',
      quality: Math.round(p.scores?.quality ?? p.pageValue ?? 0),
      clicksDelta: p.clicksDelta ?? 0,
      impressionsDelta: p.sessionsDeltaAbsolute ?? 0,
      position: p.gscPosition ?? p.gscAvgPos ?? 0,
      topKeyword: p.mainKeyword ?? p.mainKw ?? '',
      backlinks: p.backlinks ?? 0,
      actions: foundationActionsMap?.get?.(p.url) ?? p.actions ?? [],
    })), [pages, foundationActionsMap]);

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const result: ColumnDef<any>[] = [
      {
        id: 'p.identity.url', header: 'URL', size: 280,
        accessorFn: (row: WqaPageRow) => row.url,
        cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string)}</span>,
      },
      {
        accessorKey: 'category', header: 'Category', size: 100,
        accessorFn: (row: WqaPageRow) => row.category,
        cell: c => <span className="text-[11px]">{c.getValue() as string}</span>,
      },
      {
        accessorKey: 'quality', header: 'Quality', size: 70,
        cell: c => {
          const v = c.getValue() as number;
          const color = v >= 80 ? '#22c55e' : v >= 60 ? '#f59e0b' : '#ef4444';
          return <span className="font-mono text-[11px] font-medium" style={{ color }}>{v}</span>;
        },
      },
      {
        accessorKey: 'clicksDelta', header: 'Clicks Δ', size: 80,
        cell: c => {
          const v = c.getValue() as number;
          if (!v) return <span className="text-[11px] text-[var(--brand-text-faint)]">--</span>;
          const color = v > 0 ? '#22c55e' : '#ef4444';
          const arrow = v > 0 ? '+' : '';
          const formatted = Math.abs(v) >= 1000 ? fmtCompact(v) : String(Math.round(v));
          return <span className="font-mono text-[11px]" style={{ color }}>{arrow}{formatted}</span>;
        },
      },
      {
        accessorKey: 'impressionsDelta', header: 'Impr Δ', size: 80,
        cell: c => {
          const v = c.getValue() as number;
          if (!v) return <span className="text-[11px] text-[var(--brand-text-faint)]">--</span>;
          const color = v > 0 ? '#22c55e' : '#ef4444';
          const arrow = v > 0 ? '+' : '';
          const formatted = Math.abs(v) >= 1000 ? fmtCompact(v) : String(Math.round(v));
          return <span className="font-mono text-[11px]" style={{ color }}>{arrow}{formatted}</span>;
        },
      },
      {
        id: 'p.search.gsc.position', header: 'Position', size: 70,
        accessorFn: (row: WqaPageRow) => row.position,
        cell: c => {
          const v = c.getValue() as number;
          if (!v) return <span className="text-[11px] text-[var(--brand-text-faint)]">--</span>;
          return <span className="font-mono text-[11px]">{v.toFixed(1)}</span>;
        },
      },
      {
        id: 'p.search.mainKw', header: 'Top Keyword', size: 140,
        accessorFn: (row: WqaPageRow) => row.topKeyword,
        cell: c => {
          const v = c.getValue() as string;
          if (!v) return <span className="text-[11px] text-[var(--brand-text-faint)]">-- no kw</span>;
          return <span className="text-[11px] text-[var(--brand-text-mid)] truncate block">{v}</span>;
        },
      },
      {
        id: 'p.links.backlinks', header: 'Backlinks', size: 70,
        accessorFn: (row: WqaPageRow) => row.backlinks,
        cell: c => <span className="font-mono text-[11px]">{fmtCompact(c.getValue() as number)}</span>,
      },
    ];

    return result;
  }, []);

  const filtered = useMemo(
    () => filterByVisibleColumns(columns, visibleColumns),
    [columns, visibleColumns],
  );

  return { rows, columns: filtered };
}
