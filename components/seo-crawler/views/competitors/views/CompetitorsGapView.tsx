import React, { useMemo, useState } from 'react';
import { Treemap } from '../../_shared/Treemap';
import { Quadrant } from '../../_shared/Quadrant';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { useCompetitorGap, type GapRow, type TopicGap } from '../selectors/useCompetitorGap';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { fmtCompact } from '../../_shared/formatters';
import type { ColumnDef } from '@tanstack/react-table';
import { STATUS_HEX } from '../../_shared/shared-columns';
import clsx from 'clsx';

type GapMode = 'topics' | 'keywords';

const PANEL = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]]';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]]';

export default function CompetitorsGapView() {
  const ctx = useSeoCrawler() as any;
  const { setSelectedPageUrl, setInspectorOpen, setRsTab, selectedRows, setSelectedRows } = ctx;
  const { rows, topicGaps, stats } = useCompetitorGap();
  const [mode, setMode] = useState<GapMode>('topics');
  const [density] = useDensity();

  useExportRegistration(
    () => (mode === 'topics' ? topicGaps : rows) as ReadonlyArray<any>,
    () => mode === 'topics'
      ? [{ key: 'topic', label: 'Topic' }, { key: 'volume', label: 'Volume' }]
      : columns.map(c => ({ key: String((c as any).accessorKey ?? (c as any).id), label: String((c as any).header) })),
  );

  const selected: Record<string, boolean> = {};
  if (selectedRows) for (const id of selectedRows) selected[id] = true;

  const points = useMemo(() => rows.map(r => ({
    id: r.id,
    x: r.difficulty,
    y: r.volume,
    label: r.keyword,
    color: r.ourRank === null ? STATUS_HEX.bad : r.ourRank <= 3 ? STATUS_HEX.good : r.ourRank <= 10 ? STATUS_HEX.warn : STATUS_HEX.bad,
  })), [rows]);

  const columns: ColumnDef<GapRow>[] = useMemo(() => [
    {
      accessorKey: 'keyword',
      header: 'Keyword',
      size: 200,
      cell: c => (
        <span className="flex items-center gap-2">
          <span className="text-[var(--brand-text-strong)] truncate">{c.getValue() as string}</span>
          <GapBadge type={(c.row.original as GapRow).gapType} />
        </span>
      ),
    },
    {
      accessorKey: 'volume',
      header: 'Volume',
      size: 70,
      cell: c => <span className="tabular-nums text-[var(--brand-text-mid)]]">{fmtCompact(c.getValue())}</span>,
    },
    {
      accessorKey: 'ourRank',
      header: 'Us',
      size: 55,
      cell: c => {
        const val = c.getValue() as number | null;
        return (
          <span className={`tabular-nums font-medium ${val === null ? 'text-[#ef4444]' : val <= 3 ? 'text-[#22c55e]' : val <= 10 ? 'text-[#f59e0b]' : 'text-[var(--brand-text-strong)]'}`}>
            {val ?? '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'bestRank',
      header: 'Best',
      size: 55,
      cell: c => <span className="tabular-nums text-[#a78bfa]">{c.getValue() as number}</span>,
    },
    {
      accessorKey: 'bestCompetitor',
      header: 'Who',
      size: 80,
      cell: c => <span className="text-[var(--brand-text-mid)]] truncate">{String(c.getValue() ?? '').replace(/\..+/, '')}</span>,
    },
    {
      accessorKey: 'delta',
      header: 'Gap',
      size: 55,
      cell: c => {
        const val = c.getValue() as number;
        const row = c.row.original as GapRow;
        if (row.ourRank === null) return <span className="text-[10px] text-[#ef4444] font-medium">miss</span>;
        return (
          <span className={`tabular-nums ${val > 0 ? 'text-[#22c55e]' : val < 0 ? 'text-[#ef4444]' : 'text-[var(--brand-text-faint)]]'}`}>
            {val > 0 ? `+${val}` : val}
          </span>
        );
      },
    },
    {
      accessorKey: 'intent',
      header: 'Intent',
      size: 70,
      cell: c => (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--brand-border-2)]] text-[var(--brand-text-mid)]]">
          {c.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'cluster',
      header: 'Topic',
      size: 100,
      cell: c => <span className="text-[var(--brand-text-mid)]] truncate">{c.getValue() as string}</span>,
    },
    {
      accessorKey: 'opportunity',
      header: 'Opp',
      size: 70,
      cell: c => {
        const val = c.getValue() as number;
        return (
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`inline-block w-1.5 h-1.5 rounded-full ${i < val ? 'bg-[#a78bfa]' : 'bg-[var(--brand-border-2)]]'}`} />
            ))}
          </span>
        );
      },
    },
  ], []);

  const treemapData = useMemo(() => topicGaps.map(t => ({
    name: t.topic,
    size: t.volume,
    color: t.gapDepth >= 4 ? STATUS_HEX.bad : t.gapDepth >= 2 ? STATUS_HEX.warn : STATUS_HEX.good,
  })), [topicGaps]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Mode toggle + scope */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 border-b border-[var(--brand-surface-3)]]">
        <div className="flex items-center gap-0.5 bg-[var(--brand-surface-1)]] rounded border border-[var(--brand-surface-3)]] p-0.5">
          {(['topics', 'keywords'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={clsx(
                'h-[22px] px-3 text-[10px] rounded transition-colors',
                mode === m ? 'bg-[var(--brand-surface-3)]] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-2)]]',
              )}>
              {m === 'topics' ? 'Topics' : 'Keywords'}
            </button>
          ))}
        </div>
        <span className={LABEL}>{mode === 'topics' ? `${topicGaps.length} topics` : `${rows.length} keywords`}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        {mode === 'topics' ? (
          <div className="flex flex-col gap-3">
            <div className={`${PANEL} p-3`}>
              <div className={`${LABEL} mb-2`}>Topic gap treemap</div>
              <Treemap data={treemapData} height={180} />
            </div>
            <TopicList topics={topicGaps} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className={`${PANEL} p-3`}>
              <div className={`${LABEL} mb-2`}>Difficulty vs volume</div>
              <Quadrant points={points} height={220}
                xLabel="Difficulty" yLabel="Volume"
                quadrants={['Easy Win', 'Hard Target', 'Quick Skip', 'Long Shot']} />
            </div>
            <DataTable
              key={density}
              rows={rows}
              columns={columns}
              getRowId={r => r.id}
              density={density}
              selected={selected}
              onSelectedChange={(next: Record<string, boolean>) => {
                const ids = new Set(Object.keys(next).filter(k => next[k]));
                setSelectedRows(ids);
              }}
              onOpenInspector={(id: string) => {
                setSelectedPageUrl?.(id);
                setRsTab?.('competitors', 'comp_overview');
                setInspectorOpen?.(true);
              }}
              emptyText="No keyword gaps found. Add competitors from the left sidebar."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function GapBadge({ type }: { type: 'miss' | 'behind' | 'ahead' }) {
  const styles = {
    miss: 'bg-[#ef4444]/15 text-[#ef4444]',
    behind: 'bg-[#f59e0b]/15 text-[#f59e0b]',
    ahead: 'bg-[#22c55e]/15 text-[#22c55e]',
  };
  return (
    <span className={`text-[8px] px-1 py-0.5 rounded font-medium ${styles[type]}`}>
      {type}
    </span>
  );
}

function TopicList({ topics }: { topics: TopicGap[] }) {
  const maxVol = Math.max(...topics.map(t => t.volume), 1);

  return (
    <div className={`${PANEL}`}>
      <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
        <span className={LABEL}>Topic breakdown</span>
      </div>
      <div className="divide-y divide-[var(--brand-surface-3)]]">
        {topics.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--brand-surface-1)]] transition-colors">
            <span className="text-[11px] text-[var(--brand-text-strong)] truncate min-w-0 flex-1">{t.topic}</span>
            <span className="text-[10px] tabular-nums text-[var(--brand-text-mid)]] shrink-0">{fmtCompact(t.volume)}</span>
            <div className="w-20 h-1.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden shrink-0">
              <div className="h-full rounded-full bg-[#a78bfa] transition-all"
                style={{ width: `${(t.volume / maxVol) * 100}%` }} />
            </div>
            <div className="flex gap-0.5 shrink-0">
              {t.competitors.map((c, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${c.ranking ? 'bg-[#22c55e]' : 'bg-[var(--brand-surface-3)]]'}`}
                  title={`${c.host}: ${c.ranking ? 'ranking' : 'not ranking'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
