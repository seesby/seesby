import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type ComparisonRow = {
  id: string;
  keyword: string;
  intent: string;
  volume: number;
  ourRank: number | null;
  competitorRanks: Record<string, number | null>;
  gap: number | null;
  gapType: 'win' | 'loss' | 'gap' | 'close';
  opportunity: number;
  cluster: string;
};

function uniqueHosts(list: any[], self: string): string[] {
  const hosts = new Set<string>();
  for (const c of list) { if (c.host && c.host !== self) hosts.add(c.host); }
  return [...hosts];
}

function getRank(row: any, host: string): number | null {
  if (row.competitorRanks && host in row.competitorRanks) return row.competitorRanks[host];
  if (Array.isArray(row.competitorRanks)) {
    const found = row.competitorRanks.find((r: any) => r.host === host);
    return found?.rank ?? null;
  }
  return null;
}

export function useCompetitorComparison() {
  const { competitors = [], fingerprint, gapKeywords = [], pages = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    const kwList = gapKeywords;
    const compList = competitors;
    const us = fingerprint?.host ?? '';
    const comps = uniqueHosts(compList, us);

    const rows: ComparisonRow[] = kwList.map((kw: any, i: number) => {
      const cr: Record<string, number | null> = {};
      for (const h of comps) cr[h] = getRank(kw, h);
      const ourRank = kw.ourRank ?? null;
      const bestCompRank = Math.min(...Object.values(cr).filter((v): v is number => v !== null), Infinity);
      const gap = ourRank !== null ? ourRank - bestCompRank : null;
      let gapType: ComparisonRow['gapType'] = 'gap';
      if (ourRank !== null) {
        if (gap! <= 3) gapType = 'win';
        else if (gap! < 0) gapType = 'close';
        else gapType = 'loss';
      }
      return {
        id: `${i}`,
        keyword: kw.keyword,
        intent: kw.intent ?? 'info',
        volume: kw.volume ?? 0,
        ourRank,
        competitorRanks: cr,
        gap,
        gapType,
        opportunity: kw.opportunity ?? 1,
        cluster: kw.cluster ?? '',
      };
    });

    const stats = {
      total: rows.length,
      wins: rows.filter(r => r.gapType === 'win').length,
      losses: rows.filter(r => r.gapType === 'loss').length,
      gaps: rows.filter(r => r.gapType === 'gap').length,
      highOpp: rows.filter(r => r.opportunity >= 4).length,
    };

    const columns: ColumnDef<ComparisonRow>[] = [
      {
        accessorKey: 'keyword',
        header: 'Topic / keyword',
        size: 300,
        cell: c => (
          <div className="flex flex-col">
            <span className="text-white truncate text-[11px]">{c.getValue() as string}</span>
            <span className="text-[9px] text-[#666]">{(c.row.original as ComparisonRow).cluster}</span>
          </div>
        ),
      },
      {
        accessorKey: 'intent',
        header: 'Intent',
        size: 100,
        cell: c => {
          const v = c.getValue() as string;
          const color = v === 'commercial' ? STATUS_HEX.good : v === 'informational' ? STATUS_HEX.info : STATUS_HEX.warn;
          return <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color, background: `${color}15` }}>{v}</span>;
        },
      },
      {
        accessorKey: 'volume',
        header: 'Volume',
        size: 90,
        cell: c => <span className="tabular-nums text-[#888] text-[11px]">{Number(c.getValue()).toLocaleString()}</span>,
      },
      {
        id: 'us',
        header: 'Us',
        size: 70,
        cell: c => {
          const row = c.row.original as ComparisonRow;
          const v = row.ourRank;
          if (v === null) return <span className="text-[#ef4444] text-[11px]">—</span>;
          return <span className={`tabular-nums font-medium text-[11px] ${v <= 3 ? 'text-[#22c55e]' : v <= 10 ? 'text-[#f59e0b]' : 'text-white'}`}>{v}</span>;
        },
      },
      ...comps.map(h => ({
        id: h,
        header: h.replace(/\..+/, '').slice(0, 6),
        size: 80,
        cell: (c: any) => {
          const row = c.row.original as ComparisonRow;
          const v = row.competitorRanks[h] ?? null;
          if (v === null) return <span className="text-[#555] text-[11px]">—</span>;
          return <span className={`tabular-nums text-[11px] ${v <= 3 ? 'text-[#22c55e]' : v <= 10 ? 'text-[#f59e0b]' : 'text-[#888]'}`}>{v}</span>;
        },
      })) as any,
      {
        id: 'gap',
        header: 'Gap',
        size: 70,
        cell: c => {
          const row = c.row.original as ComparisonRow;
          if (row.gapType === 'gap') return <span className="text-[10px] text-[#ef4444] font-medium">miss</span>;
          return <span className={`tabular-nums text-[11px] ${row.gap! <= 3 ? 'text-[#22c55e]' : row.gap! < 0 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{row.gap! > 0 ? `+${row.gap}` : row.gap}</span>;
        },
      },
      {
        id: 'opportunity',
        header: 'Opp',
        size: 80,
        cell: c => {
          const row = c.row.original as ComparisonRow;
          return (
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`inline-block w-1.5 h-1.5 rounded-full ${i < row.opportunity ? 'bg-[#a78bfa]' : 'bg-[#222]'}`} />
              ))}
            </span>
          );
        },
      },
    ];

    return { rows, columns, stats, hostList: comps };
  }, [competitors, gapKeywords, fingerprint]);
}
