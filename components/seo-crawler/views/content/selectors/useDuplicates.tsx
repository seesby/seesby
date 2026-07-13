import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtUrl } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type DupRow = {
  id: string;
  url: string;
  matchUrl: string;
  similarity: number;
  reason: 'title' | 'h1' | 'meta' | 'body' | 'shingle' | 'canonical';
  cluster: string;
};

export function useDuplicates() {
  const { pages = [] } = useSeoCrawler() as any;
  const rows: DupRow[] = useMemo(() => {
    const out: DupRow[] = [];
    for (const p of pages) {
      for (const d of p.duplicates ?? []) {
        out.push({
          id: `${p.url}|${d.url}|${d.reason}`,
          url: p.url,
          matchUrl: d.url,
          similarity: d.similarity ?? 0,
          reason: d.reason ?? 'shingle',
          cluster: p.topicCluster ?? p.cluster ?? 'misc',
        });
      }
    }
    return out;
  }, [pages]);

  const columns: ColumnDef<DupRow>[] = [
    {
      accessorKey: 'url',
      header: 'Page',
      size: 260,
      cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string)}</span>,
    },
    {
      accessorKey: 'matchUrl',
      header: 'Matches',
      size: 260,
      cell: c => <span className="text-[var(--brand-text-mid)]]">{fmtUrl(c.getValue() as string)}</span>,
    },
    {
      accessorKey: 'similarity',
      header: 'Match %',
      size: 100,
      cell: c => {
        const v = c.getValue() as number;
        const pct = Math.round(v * 100);
        const tone = v >= 0.9 ? STATUS_HEX.bad : v >= 0.7 ? STATUS_HEX.warn : STATUS_HEX.info;
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-14 h-1.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
            </div>
            <span className="text-[10px] tabular-nums text-[var(--brand-text-mid)]]">{pct}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      size: 100,
      cell: c => {
        const v = c.getValue() as string;
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]]">{v}</span>
        );
      },
    },
    {
      accessorKey: 'cluster',
      header: 'Cluster',
      size: 120,
      cell: c => {
        const v = c.getValue() as string;
        return <span className="text-[10px] text-[var(--brand-text-faint)]]">{v}</span>;
      },
    },
  ];

  return { rows, columns };
}
