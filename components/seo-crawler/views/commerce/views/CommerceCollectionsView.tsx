import React from 'react';
import { DataTable } from '../../_shared/DataTable';
import { Heatmap } from '../../_shared/Heatmap';
import { useDensity } from '../../_hooks/useDensity';
import { useCollections } from '../selectors/useCollections.tsx';
import { useExportRegistration } from '../../_hooks/useExportRegistration';

const CARD = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 min-h-0';

export default function CommerceCollectionsView() {
  const { rows, columns, heatmapData } = useCollections();
  const [density] = useDensity();

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey ?? c.id, label: (c as any).header ?? c.id }))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="p-3">
          <DataTable key={density} rows={rows} columns={columns} getRowId={r => r.id} density={density} emptyText="No collections found." />
        </div>

        {heatmapData.rows.length > 0 && (
          <div className={`${CARD} mx-3 mb-3`}>
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-3">Collection coverage</div>
            <div className="overflow-x-auto">
              <Heatmap
                rows={heatmapData.rows}
                cols={heatmapData.cols}
                getValue={heatmapData.getValue}
                accentColor="#10b981"
                cellSize={40}
                fullWidth
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
