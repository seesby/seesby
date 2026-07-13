import React from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useOrphansDepth } from '../selectors/useOrphansDepth';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { BarChart } from '../../_shared/BarChart';
import type { RowSelectionState } from '@tanstack/react-table';

const PANEL = 'rounded border border-[#1a1a1a] bg-[#0a0a0a]';
const LABEL = 'text-[10px] uppercase tracking-wider text-[#666] mb-2';

export default function LinksOrphansDepthView() {
  const ctx = useSeoCrawler() as any;
  const { setSelectedPageUrl, setInspectorOpen, selectedRows, setSelectedRows } = ctx;
  const { rows, columns, metrics } = useOrphansDepth();
  const [density] = useDensity();

  const selected: RowSelectionState = {};
  if (selectedRows) {
    for (const id of selectedRows) selected[id] = true;
  }

  const handleSelectedChange = (next: RowSelectionState) => {
    const ids = new Set(Object.keys(next).filter(k => next[k]));
    setSelectedRows(ids);
  };

  const depthColors = ['#a78bfa', '#3b82f6', '#3b82f6', '#f59e0b', '#f59e0b', '#ef4444', '#ef4444'];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto custom-scrollbar">
      {/* Depth distribution */}
      <div className={`${PANEL} mx-3 mt-3`}>
        <div className="px-3 pt-2 pb-1">
          <div className={LABEL}>Depth distribution (pages)</div>
        </div>
        <div className="px-3 pb-3">
          <BarChart
            data={metrics.depthDistribution.map(d => ({
              depth: `d${d.depth}`,
              count: d.count,
            }))}
            x="depth"
            y="count"
            color={depthColors}
            height={100}
          />
        </div>
      </div>

      {/* Orphan pages table */}
      <div className={`${PANEL} mx-3 mt-3`}>
        <div className="px-3 pt-2 pb-1">
          <div className={LABEL}>Orphan pages (no internal in-links)</div>
        </div>
        <div className="flex-1 min-h-0 px-3 pb-3">
          <DataTable
            key={density}
            rows={rows.filter(r => r.flag === 'orphan')}
            columns={columns.filter(c => (c as any).accessorKey !== 'flag')}
            getRowId={r => r.id}
            density={density}
            selected={selected}
            onSelectedChange={handleSelectedChange}
            onOpenInspector={(id) => { setSelectedPageUrl?.(id); setInspectorOpen?.(true); }}
            emptyText="No orphan pages found."
          />
        </div>
      </div>

      {/* Deep pages table */}
      <div className={`${PANEL} mx-3 mt-3 mb-3`}>
        <div className="px-3 pt-2 pb-1">
          <div className={LABEL}>Pages too deep (depth {'>'}4) with traffic</div>
        </div>
        <div className="flex-1 min-h-0 px-3 pb-3">
          <DataTable
            key={density}
            rows={rows.filter(r => r.flag === 'deep')}
            columns={columns.filter(c => (c as any).accessorKey !== 'flag')}
            getRowId={r => r.id}
            density={density}
            selected={selected}
            onSelectedChange={handleSelectedChange}
            onOpenInspector={(id) => { setSelectedPageUrl?.(id); setInspectorOpen?.(true); }}
            emptyText="No deep pages found."
          />
        </div>
      </div>
    </div>
  );
}
