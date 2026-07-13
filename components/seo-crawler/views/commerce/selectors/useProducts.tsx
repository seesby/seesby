import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtCompact, fmtPct, fmtUrl } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type ProductRow = {
  id: string;
  url: string;
  title: string;
  template: string;
  inStock: boolean;
  price: number;
  currency: string;
  gtin: boolean;
  schemaValid: boolean;
  feedStatus: 'ok' | 'warn' | 'err' | 'missing' | 'none';
  clicks: number;
};

export type FeedSegment = {
  label: string;
  count: number;
  color: string;
};

export function useProducts() {
  const { products = [], feedDiagnostics = [] } = useSeoCrawler() as any;

  const feedMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of feedDiagnostics) {
      map.set(d.url, d.severity ?? 'warn');
    }
    return map;
  }, [feedDiagnostics]);

  const rows: ProductRow[] = useMemo(() => products.map((p: any) => {
    const feedSev = feedMap.get(p.url);
    let feedStatus: ProductRow['feedStatus'] = 'none';
    if (feedSev === 'critical') feedStatus = 'err';
    else if (feedSev === 'warn') feedStatus = 'warn';
    else if (feedSev === 'info') feedStatus = 'ok';
    else if (feedDiagnostics.length > 0) feedStatus = 'missing';

    return {
      id: p.url,
      url: p.url,
      title: p.title,
      template: p.template ?? '',
      inStock: !!p.inStock,
      price: p.price ?? 0,
      currency: p.currency ?? 'USD',
      gtin: !!(p.gtin || p.upc || p.ean || p.mpn),
      schemaValid: !!(p.schema?.types?.includes('Product')),
      feedStatus,
      clicks: p.analytics?.clicks30d ?? p.analytics?.views30d ?? 0,
    };
  }), [products, feedMap, feedDiagnostics]);

  const feedSegments: FeedSegment[] = useMemo(() => {
    const counts = { ok: 0, warn: 0, err: 0, missing: 0 };
    for (const r of rows) {
      if (r.feedStatus in counts) counts[r.feedStatus as keyof typeof counts] += 1;
    }
    const segs: FeedSegment[] = [];
    if (counts.ok > 0) segs.push({ label: 'ok', count: counts.ok, color: STATUS_HEX.good });
    if (counts.warn > 0) segs.push({ label: 'warn', count: counts.warn, color: STATUS_HEX.warn });
    if (counts.err > 0) segs.push({ label: 'err', count: counts.err, color: STATUS_HEX.bad });
    if (counts.missing > 0) segs.push({ label: 'missing', count: counts.missing, color: '#71717a' });
    return segs;
  }, [rows]);

  const columns: ColumnDef<ProductRow>[] = [
    { accessorKey: 'url', header: 'URL', size: 280, cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string)}</span> },
    { accessorKey: 'template', header: 'Tmpl', size: 120 },
    { accessorKey: 'inStock', header: 'Stock', size: 70, cell: c => c.getValue() ? <span className="text-[#22c55e]">\u2713</span> : <span className="text-[#ef4444]">\u2717</span> },
    { accessorKey: 'price', header: 'Price', size: 90, cell: c => `${(c.row.original as ProductRow).currency} ${(c.getValue() as number).toFixed(0)}` },
    { accessorKey: 'gtin', header: 'GTIN', size: 70, cell: c => c.getValue() ? <span className="text-[#22c55e]">\u2713</span> : <span className="text-[#ef4444]">\u2717</span> },
    { accessorKey: 'schemaValid', header: 'Schema', size: 90, cell: c => c.getValue() ? <span className="text-[#22c55e]">valid</span> : <span className="text-[#ef4444]">invalid</span> },
    { accessorKey: 'feedStatus', header: 'Feed', size: 80, cell: c => {
      const v = c.getValue() as string;
      const colors: Record<string, string> = { ok: 'text-[#22c55e]', warn: 'text-[#f59e0b]', err: 'text-[#ef4444]', missing: 'text-[#71717a]', none: 'text-[#555]' };
      return <span className={colors[v] ?? ''}>{v}</span>;
    }},
    { accessorKey: 'clicks', header: 'Clicks', size: 80, cell: c => fmtCompact(c.getValue() as number) },
  ];

  return { rows, columns, feedSegments };
}
