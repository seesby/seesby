import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtUrl } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type OrphanRow = {
  id: string;
  url: string;
  inLinks: number;
  outLinks: number;
  depth: number;
  inSitemap: boolean;
  template: string;
  flag: 'orphan' | 'deep' | 'sitemap-only' | 'ok';
};

export type OrphanMetrics = {
  total: number;
  orphanCount: number;
  deepCount: number;
  sitemapOnlyCount: number;
  depthDistribution: { depth: number; count: number }[];
  flagBreakdown: { flag: string; count: number }[];
};

export function useOrphansDepth() {
  const { pages = [] } = useSeoCrawler() as any;

  const rows: OrphanRow[] = useMemo(() => pages.map((p: any) => {
    const inL = p.links?.internal ?? p.inLinks ?? 0;
    const outL = p.outboundInternal?.length ?? 0;
    const depth = p.depth ?? 0;
    const inSitemap = !!p.sitemap?.present;
    const template = p.template ?? p.templateType ?? '—';
    const flag = inL === 0 && !inSitemap ? 'orphan'
      : depth >= 4 ? 'deep'
      : inL === 0 && inSitemap ? 'sitemap-only'
      : 'ok';
    return { id: p.url, url: p.url, inLinks: inL, outLinks: outL, depth, inSitemap, template, flag };
  }).filter((r: OrphanRow) => r.flag !== 'ok'), [pages]);

  const metrics: OrphanMetrics = useMemo(() => {
    const all = pages.map((p: any) => {
      const inL = p.links?.internal ?? p.inLinks ?? 0;
      const depth = p.depth ?? 0;
      const inSitemap = !!p.sitemap?.present;
      return { inLinks: inL, depth, inSitemap };
    });

    const total = all.length;
    const orphanCount = all.filter(p => p.inLinks === 0 && !p.inSitemap).length;
    const deepCount = all.filter(p => p.depth >= 4).length;
    const sitemapOnlyCount = all.filter(p => p.inLinks === 0 && p.inSitemap).length;

    const depthMap: Record<number, number> = {};
    for (const p of all) {
      depthMap[p.depth] = (depthMap[p.depth] || 0) + 1;
    }

    return {
      total,
      orphanCount,
      deepCount,
      sitemapOnlyCount,
      depthDistribution: Object.entries(depthMap)
        .map(([d, count]) => ({ depth: Number(d), count }))
        .sort((a, b) => a.depth - b.depth),
      flagBreakdown: [
        { flag: 'orphan', count: orphanCount },
        { flag: 'deep', count: deepCount },
        { flag: 'sitemap-only', count: sitemapOnlyCount },
      ],
    };
  }, [pages]);

  const columns: ColumnDef<OrphanRow>[] = [
    { accessorKey: 'url', header: 'URL', size: 380, cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string)}</span> },
    { accessorKey: 'flag', header: 'Flag', size: 110, cell: c => <Flag v={c.getValue() as any} /> },
    { accessorKey: 'inLinks', header: 'In links', size: 80, cell: c => {
      const v = c.getValue() as number;
      const color = v === 0 ? STATUS_HEX.bad : v <= 2 ? STATUS_HEX.warn : STATUS_HEX.good;
      return <span style={{ color }}>{v}</span>;
    }},
    { accessorKey: 'outLinks', header: 'Out links', size: 80 },
    { accessorKey: 'depth', header: 'Depth', size: 70, cell: c => {
      const v = c.getValue() as number;
      const color = v >= 4 ? STATUS_HEX.bad : v >= 3 ? STATUS_HEX.warn : STATUS_HEX.good;
      return <span style={{ color }}>{v}</span>;
    }},
    { accessorKey: 'inSitemap', header: 'Sitemap', size: 80, cell: c => c.getValue() ? <span className="text-[#22c55e]">yes</span> : <span className="text-[var(--brand-text-faint)]]">no</span> },
    { accessorKey: 'template', header: 'Template', size: 120, cell: c => <span className="text-[var(--brand-text-mid)]] truncate max-w-[100px]">{c.getValue() as string}</span> },
  ];
  return { rows, columns, metrics };
}

function Flag({ v }: { v: 'orphan' | 'deep' | 'sitemap-only' }) {
  const map = { orphan: [STATUS_HEX.bad, 'Orphan'], deep: [STATUS_HEX.warn, 'Deep'], 'sitemap-only': [STATUS_HEX.info, 'Sitemap-only'] } as const;
  const [color, label] = map[v];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border uppercase"
      style={{ color, borderColor: color + '44', background: color + '11' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
