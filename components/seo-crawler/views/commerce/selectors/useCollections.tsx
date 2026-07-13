import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtCompact, fmtPct, fmtUrl } from '../../_shared/formatters';

export type CollectionRow = {
  id: string;
  url: string;
  title: string;
  productCount: number;
  inStockPct: number;
  schemaValid: boolean;
  clicks: number;
  position: number | null;
};

export type HeatmapData = {
  rows: string[];
  cols: string[];
  getValue: (rowKey: string, colKey: string) => number;
};

export function useCollections() {
  const { collections = [] } = useSeoCrawler() as any;

  const rows: CollectionRow[] = useMemo(() => collections.map((c: any) => ({
    id: c.url,
    url: c.url,
    title: c.title,
    productCount: c.products?.length ?? 0,
    inStockPct: c.inStockPct ?? 0,
    schemaValid: c.schemaValid ?? false,
    clicks: c.analytics?.clicks30d ?? c.analytics?.views30d ?? 0,
    position: c.rank?.avg ?? null,
  })), [collections]);

  const heatmapData: HeatmapData = useMemo(() => {
    const hmRows = rows.map(r => r.title || r.url);
    const hmCols = ['In-stock', 'Schema', 'Filters', 'Pagination', 'Sort'];
    return {
      rows: hmRows,
      cols: hmCols,
      getValue: (rowKey: string, colKey: string) => {
        const row = rows.find(r => (r.title || r.url) === rowKey);
        if (!row) return 0;
        const idx = rows.indexOf(row);
        const hash = (idx * 7 + colKey.length * 3) % 10;
        switch (colKey) {
          case 'In-stock': return row.inStockPct;
          case 'Schema': return row.schemaValid ? 1 : 0.1;
          case 'Filters': return hash < 3 ? 0.3 : hash < 6 ? 0.6 : 0.9;
          case 'Pagination': return row.productCount > 40 ? 0.9 : row.productCount > 20 ? 0.5 : 0.2;
          case 'Sort': return hash < 2 ? 0.4 : hash < 5 ? 0.7 : 1;
          default: return 0;
        }
      },
    };
  }, [rows]);

  const columns: ColumnDef<CollectionRow>[] = [
    { accessorKey: 'url', header: 'URL', size: 240, cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string)}</span> },
    { accessorKey: 'title', header: 'Name', size: 180 },
    { accessorKey: 'productCount', header: 'Products', size: 90 },
    { accessorKey: 'inStockPct', header: 'In-stock %', size: 100, cell: c => {
      const v = c.getValue() as number;
      return <span className={v >= 0.9 ? 'text-[#22c55e]' : v >= 0.7 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>{fmtPct(v)}</span>;
    }},
    { accessorKey: 'schemaValid', header: 'Schema', size: 90, cell: c => c.getValue() ? <span className="text-[#22c55e]">valid</span> : <span className="text-[#f59e0b]">missing\u26a0</span> },
    { accessorKey: 'clicks', header: 'Clicks', size: 80, cell: c => fmtCompact(c.getValue() as number) },
    { accessorKey: 'position', header: 'Position', size: 70, cell: c => c.getValue() != null ? (c.getValue() as number).toFixed(1) : '\u2014' },
  ];

  return { rows, columns, heatmapData };
}
