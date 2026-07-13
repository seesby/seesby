import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtCompact, fmtUrl, fmtDate } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type BacklinkRow = {
  id: string;
  fromUrl: string;
  fromDr: number;
  fromTraffic: number;
  toUrl: string;
  anchor: string;
  rel: 'follow' | 'nofollow' | 'sponsored' | 'ugc';
  type: 'text' | 'image' | 'redirect' | 'frame';
  firstSeen: string;
  lostAt: string | null;
  toxicity: number;
};

export type BacklinksMetrics = {
  total: number;
  refDomains: number;
  avgDr: number;
  toxicCount: number;
  drDistribution: { range: string; count: number }[];
  relDistribution: { rel: string; count: number }[];
  trendNew: number[];
  trendLost: number[];
};

export function useBacklinks() {
  const { backlinks = [] } = useSeoCrawler() as any;

  const rows: BacklinkRow[] = useMemo(() => backlinks.map((b: any, i: number) => ({
    id: b.id ?? `${b.from}|${b.to}|${i}`,
    fromUrl: b.from,
    fromDr: b.sourceMetrics?.dr ?? 0,
    fromTraffic: b.sourceMetrics?.traffic ?? 0,
    toUrl: b.to,
    anchor: b.anchor ?? '',
    rel: b.rel ?? 'follow',
    type: b.type ?? 'text',
    firstSeen: b.firstSeen ?? '',
    lostAt: b.lostAt ?? null,
    toxicity: b.toxicity ?? 0,
  })), [backlinks]);

  const metrics: BacklinksMetrics = useMemo(() => {
    const total = backlinks.length;
    const domainSet = new Set(backlinks.map((b: any) => {
      try { return new URL(b.from).hostname; } catch { return b.from; }
    }));
    const refDomains = domainSet.size;

    const drValues = backlinks.map((b: any) => b.sourceMetrics?.dr ?? 0).filter((v: number) => v > 0);
    const avgDr = drValues.length ? drValues.reduce((a: number, b: number) => a + b, 0) / drValues.length : 0;

    const toxicCount = backlinks.filter((b: any) => (b.toxicity ?? 0) >= 0.7).length;

    const dr90 = drValues.filter(v => v >= 90).length;
    const dr70 = drValues.filter(v => v >= 70 && v < 90).length;
    const dr40 = drValues.filter(v => v >= 40 && v < 70).length;
    const dr20 = drValues.filter(v => v >= 20 && v < 40).length;
    const dr0 = drValues.filter(v => v < 20).length;

    const relCounts: Record<string, number> = {};
    for (const b of backlinks) {
      const rel = b.rel ?? 'follow';
      relCounts[rel] = (relCounts[rel] || 0) + 1;
    }

    // 90d trend — group by week
    const now = Date.now();
    const day = 86400000;
    const trendNew: number[] = [];
    const trendLost: number[] = [];
    for (let w = 11; w >= 0; w--) {
      const weekStart = now - (w + 1) * 7 * day;
      const weekEnd = now - w * 7 * day;
      let newCount = 0;
      let lostCount = 0;
      for (const b of backlinks) {
        const fs = b.firstSeen ? new Date(b.firstSeen).getTime() : 0;
        const la = b.lostAt ? new Date(b.lostAt).getTime() : 0;
        if (fs >= weekStart && fs < weekEnd) newCount++;
        if (la >= weekStart && la < weekEnd) lostCount++;
      }
      trendNew.push(newCount);
      trendLost.push(lostCount);
    }

    return {
      total,
      refDomains,
      avgDr: Math.round(avgDr),
      toxicCount,
      drDistribution: [
        { range: '90+', count: dr90 },
        { range: '70-89', count: dr70 },
        { range: '40-69', count: dr40 },
        { range: '20-39', count: dr20 },
        { range: '0-19', count: dr0 },
      ].filter(d => d.count > 0),
      relDistribution: Object.entries(relCounts)
        .map(([rel, count]) => ({ rel, count }))
        .sort((a, b) => b.count - a.count),
      trendNew,
      trendLost,
    };
  }, [backlinks]);

  const columns: ColumnDef<BacklinkRow>[] = [
    { accessorKey: 'fromUrl', header: 'Referring domain', size: 200, cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string, 30)}</span> },
    { accessorKey: 'fromDr', header: 'DR', size: 50, cell: c => {
      const v = c.getValue() as number;
      const color = v >= 50 ? STATUS_HEX.good : v >= 20 ? STATUS_HEX.info : '#64748b';
      return <span style={{ color }}>{v}</span>;
    }},
    { accessorKey: 'fromUrl', header: 'Page', size: 160, cell: c => {
      const v = c.getValue() as string;
      try { return fmtUrl(new URL(v).pathname, 24); } catch { return fmtUrl(v, 24); }
    }},
    { accessorKey: 'anchor', header: 'Anchor', size: 160, cell: c => <span className="truncate max-w-[140px] block">"{c.getValue() as string}"</span> },
    { accessorKey: 'rel', header: 'Rel', size: 70, cell: c => {
      const v = c.getValue() as string;
      const color = v === 'nofollow' ? STATUS_HEX.warn : v === 'sponsored' ? STATUS_HEX.bad : v === 'ugc' ? '#a78bfa' : STATUS_HEX.good;
      return <span style={{ color }}>{v}</span>;
    }},
    { accessorKey: 'firstSeen', header: 'First', size: 70, cell: c => fmtDate(c.getValue()) },
    { accessorKey: 'toUrl', header: 'Target', size: 140, cell: c => fmtUrl(c.getValue() as string, 20) },
  ];

  return { rows, columns, metrics };
}

function ToxBar({ v }: { v: number }) {
  const tone = v >= 0.7 ? STATUS_HEX.bad : v >= 0.4 ? STATUS_HEX.warn : STATUS_HEX.good;
  const barStyle: React.CSSProperties = { width: `${Math.round(v * 100)}%`, background: tone };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded bg-[var(--brand-surface-3)]] overflow-hidden">
        <div className="h-full" style={barStyle} />
      </div>
      <span className="w-10 text-right font-mono">{Math.round(v * 100)}</span>
    </div>
  );
}
