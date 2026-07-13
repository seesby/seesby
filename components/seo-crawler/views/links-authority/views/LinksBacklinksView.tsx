import React, { useState, useMemo } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useBacklinks } from '../selectors/useBacklinks';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { RowSelectionState } from '@tanstack/react-table';
import clsx from 'clsx';

const PANEL = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]]';

const SCOPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New 90d' },
  { id: 'lost', label: 'Lost 90d' },
  { id: 'toxic', label: 'Toxic' },
];

const SORT_OPTIONS = [
  { id: 'firstSeen', label: 'First seen' },
  { id: 'dr', label: 'DR' },
  { id: 'toxicity', label: 'Toxicity' },
];

export default function LinksBacklinksView() {
  const ctx = useSeoCrawler() as any;
  const { setSelectedPageUrl, setInspectorOpen, selectedRows, setSelectedRows } = ctx;
  const { rows, columns, metrics } = useBacklinks();
  const [density] = useDensity();
  const [scope, setScope] = useState('all');
  const [sort, setSort] = useState('firstSeen');

  const selected: RowSelectionState = {};
  if (selectedRows) {
    for (const id of selectedRows) selected[id] = true;
  }

  const handleSelectedChange = (next: RowSelectionState) => {
    const ids = new Set(Object.keys(next).filter(k => next[k]));
    setSelectedRows(ids);
  };

  const relColors: Record<string, string> = {
    follow: '#22c55e',
    nofollow: '#f59e0b',
    sponsored: '#ef4444',
    ugc: '#a78bfa',
  };

  const totalRel = metrics.relDistribution.reduce((s, r) => s + r.count, 0) || 1;

  // Filter rows by scope
  const filteredRows = useMemo(() => {
    if (scope === 'all') return rows;
    if (scope === 'toxic') return rows.filter(r => r.toxicity >= 0.7);
    if (scope === 'new') return rows.filter(r => r.firstSeen && (Date.now() - new Date(r.firstSeen).getTime()) < 90 * 86400000);
    if (scope === 'lost') return rows.filter(r => r.lostAt && (Date.now() - new Date(r.lostAt).getTime()) < 90 * 86400000);
    return rows;
  }, [rows, scope]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto custom-scrollbar">
      {/* Controls */}
      <div className="flex items-center gap-4 p-3 pb-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--brand-text-faint)]] mr-1">Scope:</span>
          {SCOPE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setScope(f.id)}
              className={clsx(
                'h-[22px] px-2 text-[10px] rounded transition-colors',
                scope === f.id ? 'bg-[var(--brand-surface-3)]] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)]] hover:text-[var(--brand-text-mid)]]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--brand-text-faint)]] mr-1">Sort:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="h-[22px] px-2 text-[10px] bg-[var(--brand-surface-2)]] text-[var(--brand-text-mid)]] border border-[var(--brand-surface-3)]] rounded outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data table */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        <DataTable
          key={density}
          rows={filteredRows}
          columns={columns}
          getRowId={r => r.id}
          density={density}
          selected={selected}
          onSelectedChange={handleSelectedChange}
          onOpenInspector={(id) => { setSelectedPageUrl?.(id); setInspectorOpen?.(true); }}
          emptyText="No backlink data available."
        />
      </div>

      {/* Breakdown strips */}
      <div className={`${PANEL} mx-3 mb-3`}>
        <div className="px-3 py-2 space-y-2">
          {/* DR distribution */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--brand-text-faint)]] w-[24px] shrink-0">DR</span>
            <div className="flex-1 flex h-[6px] rounded-full overflow-hidden bg-[var(--brand-surface-3)]]">
              {metrics.drDistribution.map(d => (
                <div
                  key={d.range}
                  className="h-full"
                  style={{
                    width: `${(d.count / metrics.total) * 100}%`,
                    background: d.range.includes('90') ? '#22c55e' : d.range.includes('70') ? '#3b82f6' : d.range.includes('40') ? '#f59e0b' : '#64748b',
                  }}
                  title={`DR ${d.range}: ${d.count}`}
                />
              ))}
            </div>
            <div className="flex gap-2 text-[9px] text-[var(--brand-text-faint)]] shrink-0">
              {metrics.drDistribution.map(d => (
                <span key={d.range}>{d.range} {d.count}</span>
              ))}
            </div>
          </div>

          {/* Rel distribution */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--brand-text-faint)]] w-[24px] shrink-0">Rel</span>
            <div className="flex-1 flex h-[6px] rounded-full overflow-hidden bg-[var(--brand-surface-3)]]">
              {metrics.relDistribution.map(r => (
                <div
                  key={r.rel}
                  className="h-full"
                  style={{
                    width: `${(r.count / totalRel) * 100}%`,
                    background: relColors[r.rel] ?? '#64748b',
                  }}
                  title={`${r.rel}: ${r.count}`}
                />
              ))}
            </div>
            <div className="flex gap-2 text-[9px] text-[var(--brand-text-faint)]] shrink-0">
              {metrics.relDistribution.map(r => (
                <span key={r.rel} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: relColors[r.rel] }} />
                  {r.rel} {Math.round((r.count / totalRel) * 100)}%
                </span>
              ))}
            </div>
          </div>

          {/* 90d trend */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--brand-text-faint)]] w-[24px] shrink-0">90d</span>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-[9px] text-[var(--brand-text-faint)]]">New</span>
                <Sparkline data={metrics.trendNew} color="#22c55e" />
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-[9px] text-[var(--brand-text-faint)]]">Lost</span>
                <Sparkline data={metrics.trendLost} color="#ef4444" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const h = 16;
  const step = w / (data.length - 1 || 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - (v / max) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-1">
      <polygon points={areaPoints} fill={color} opacity={0.15} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}
