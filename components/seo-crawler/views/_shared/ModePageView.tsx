import React, { useCallback } from 'react';
import { DataTable } from './DataTable';
import { useDensity } from '../_hooks/useDensity';
import { useExportRegistration } from '../_hooks/useExportRegistration';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import type { Density } from './tokens';

type UseRowsResult<R> = { rows: R[]; columns: ColumnDef<R>[] };

/**
 * Wraps the repeated pattern used by most page views:
 * selector hook → DataTable → selection → export → inspector open.
 *
 * Pass `onInspect` to customise what happens when a row is opened.
 * Omit `selectedRows`/`setSelectedRows` if the view has no selection.
 */
export function ModePageView<R extends { id: string }>({
  useRows,
  emptyText,
  onInspect,
  selectedRows: selectedRowsProp,
  setSelectedRows: setSelectedRowsProp,
  footerSlot,
  children,
}: {
  useRows: () => UseRowsResult<R>;
  emptyText: string;
  onInspect?: (id: string) => void;
  selectedRows?: Set<string> | null;
  setSelectedRows?: (ids: Set<string>) => void;
  footerSlot?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ctx = useSeoCrawler() as any;
  const { setSelectedPageUrl, setInspectorOpen, setRsTab, selectedRows: ctxRows, setSelectedRows: ctxSetRows } = ctx;
  const { rows, columns } = useRows();
  const [density] = useDensity();

  const selectedRows = selectedRowsProp ?? ctxRows ?? null;
  const setSelectedRows = setSelectedRowsProp ?? ctxSetRows;

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey ?? (c as any).id, label: String((c as any).header ?? (c as any).id) })),
  );

  // Selection
  const selected: RowSelectionState = {};
  if (selectedRows) {
    for (const id of selectedRows) selected[id] = true;
  }

  const handleSelectedChange = useCallback((next: RowSelectionState) => {
    if (!setSelectedRows) return;
    const ids = new Set(Object.keys(next).filter(k => next[k]));
    setSelectedRows(ids);
  }, [setSelectedRows]);

  const handleOpenInspector = useCallback((id: string) => {
    if (onInspect) {
      onInspect(id);
    } else {
      setSelectedPageUrl?.(id);
      setInspectorOpen?.(true);
    }
  }, [onInspect, setSelectedPageUrl, setInspectorOpen]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {children}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DataTable
          key={density}
          rows={rows}
          columns={columns}
          getRowId={(r: any) => r.id}
          density={density as Density}
          selected={selectedRows ? selected : undefined}
          onSelectedChange={setSelectedRows ? handleSelectedChange : undefined}
          onOpenInspector={handleOpenInspector}
          emptyText={emptyText}
        />
      </div>
      {footerSlot}
    </div>
  );
}
