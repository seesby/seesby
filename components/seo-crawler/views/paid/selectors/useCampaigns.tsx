import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtCompact } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type CampaignRow = {
  id: string; name: string; network: string;
  status: string; budget: number; spend: number; clicks: number;
  impressions: number; ctr: number; conv: number; revenue: number;
  cpa: number; roas: number; qualityScore: number;
  lpScore: number; issues: number; delta7d: number;
};

function statusDot(s: string) {
  const hex = s === 'enabled' || s === 'active' ? STATUS_HEX.good
    : s === 'paused' ? STATUS_HEX.warn
    : s === 'learning' ? STATUS_HEX.info : STATUS_HEX.bad;
  return <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: hex }} />;
}

function statusColor(s: string) {
  if (s === 'enabled' || s === 'active') return STATUS_HEX.good;
  if (s === 'paused') return STATUS_HEX.warn;
  if (s === 'learning') return STATUS_HEX.info;
  return STATUS_HEX.bad;
}

function qsColor(qs: number) {
  if (qs >= 7) return STATUS_HEX.good;
  if (qs >= 5) return STATUS_HEX.warn;
  return STATUS_HEX.bad;
}

function roasColor(roas: number) {
  if (roas >= 3) return STATUS_HEX.good;
  if (roas >= 1) return STATUS_HEX.warn;
  return STATUS_HEX.bad;
}

function lpScoreColor(s: number) {
  if (s >= 80) return STATUS_HEX.good;
  if (s >= 60) return STATUS_HEX.warn;
  return STATUS_HEX.bad;
}

export function useCampaigns() {
  const { paid = {} } = useSeoCrawler() as any;

  const rows: CampaignRow[] = useMemo(() => (paid.campaigns ?? []).map((c: any) => ({
    id: c.id, name: c.name, network: c.network ?? '',
    status: c.status ?? 'active', budget: c.budget ?? 0, spend: c.spend ?? 0, clicks: c.clicks ?? 0,
    impressions: c.impressions ?? 0, ctr: c.ctr ?? 0, conv: c.conv ?? 0,
    revenue: c.revenue ?? 0, cpa: c.cpa ?? 0, roas: c.roas ?? 0,
    qualityScore: c.qualityScore ?? 0,
    lpScore: c.lpScore ?? 0, issues: c.issues ?? 0, delta7d: c.delta7d ?? 0,
  })), [paid.campaigns]);

  const columns: ColumnDef<CampaignRow>[] = [
    { accessorKey: 'name', header: 'Campaign', size: 220 },
    { accessorKey: 'network', header: 'Network', size: 80 },
    {
      accessorKey: 'status', header: 'Status', size: 80,
      cell: c => {
        const v = c.getValue() as string;
        return <span style={{ color: statusColor(v) }}>{statusDot(v)}{v}</span>;
      },
    },
    {
      accessorKey: 'budget', header: 'Budget', size: 80,
      cell: c => {
        const v = c.getValue() as number;
        return <span className="text-[#aaa]">{v > 0 ? `$${fmtCompact(v)}/d` : '—'}</span>;
      },
    },
    { accessorKey: 'spend', header: 'Spend 30d', size: 90, cell: c => fmtCompact(c.getValue() as number) },
    {
      accessorKey: 'ctr', header: 'CPC', size: 70,
      cell: c => {
        const row = c.row.original;
        const cpc = row.clicks > 0 ? row.spend / row.clicks : 0;
        return `$${fmtCompact(cpc)}`;
      },
    },
    { accessorKey: 'conv', header: 'Conv', size: 70 },
    {
      accessorKey: 'cpa', header: 'CPA', size: 80,
      cell: c => {
        const v = c.getValue() as number;
        return <span style={{ color: v > 0 && v < 50 ? STATUS_HEX.good : v < 100 ? STATUS_HEX.warn : STATUS_HEX.bad }}>${fmtCompact(v)}</span>;
      },
    },
    {
      accessorKey: 'roas', header: 'ROAS', size: 70,
      cell: c => {
        const v = c.getValue() as number;
        return <span style={{ color: roasColor(v) }}>{v.toFixed(1)}×</span>;
      },
    },
    {
      accessorKey: 'qualityScore', header: 'Quality Score', size: 90,
      cell: c => {
        const v = c.getValue() as number;
        return v > 0 ? <span style={{ color: qsColor(v) }}>{v.toFixed(1)}</span> : '—';
      },
    },
    {
      accessorKey: 'lpScore', header: 'LP score', size: 70,
      cell: c => {
        const v = c.getValue() as number;
        return v > 0 ? <span style={{ color: lpScoreColor(v) }}>{v}</span> : '—';
      },
    },
    {
      accessorKey: 'issues', header: 'Issues', size: 60,
      cell: c => {
        const v = c.getValue() as number;
        return v > 0
          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{v} ⚠</span>
          : <span className="text-[#555]">0</span>;
      },
    },
    {
      accessorKey: 'delta7d', header: 'Δ 7d', size: 70,
      cell: c => {
        const v = c.getValue() as number;
        if (v === 0) return <span className="text-[#555]">—</span>;
        return (
          <span style={{ color: v > 0 ? STATUS_HEX.good : STATUS_HEX.bad }}>
            {v > 0 ? '▲' : '▼'} {Math.abs(v)}%
          </span>
        );
      },
    },
  ];

  return { rows, columns };
}
