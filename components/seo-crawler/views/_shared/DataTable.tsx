import React, { useRef, useMemo, useCallback, useState } from 'react';
import {
  ColumnDef, flexRender, getCoreRowModel, getSortedRowModel,
  RowSelectionState, SortingState, useReactTable, ColumnSizingState,
  ColumnOrderState, ColumnPinningState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { DENSITY, type Density, SURFACE, TEXT, R, S } from './tokens';
import { resolveCellValue } from './resolve-cell-value';
import { formatCellValue } from './metric-cell-renderers';
import { MetricCellContent } from './MetricCellContent';
import { getMetricDef } from '@seesby/metrics';
import type { MetricFormat, SourceTier } from '@seesby/types';
import { ACTION_COLUMN } from './ActionCellRenderer';

// Wrap a column to add a default metric-aware cell renderer when no custom
// `cell` is defined.  This ensures every column that uses a canonical metric
// key automatically resolves + formats its value.
function wrapWithMetricRenderer<T>(col: ColumnDef<T>): ColumnDef<T> {
  // Skip columns that already provide their own cell, or are checkbox/placeholder
  if (col.cell || col.id === '_select') return col;

  // Derive the column key — prefer `accessorKey`, fall back to `id`
  const key = (col as any).accessorKey as string | undefined ?? col.id;
  if (!key) return col;

  // Try the metric catalog for format info; fall back gracefully
  const def = getMetricDef(key);
  const format = def?.format as MetricFormat | undefined;
  const unit = def?.unit;

  return {
    ...col,
    cell: (ctx) => {
      const raw = ctx.getValue();
      const resolved = raw !== undefined
        ? raw
        : resolveCellValue(ctx.row.original as Record<string, unknown>, key);
      const text = formatCellValue(resolved, format, unit);

      // Try to extract source stamp from foundation metrics map
      const row = ctx.row.original as any;
      const foundationMap = row?.foundationMetricsMap
        ?? row?._foundationMetricsMap;
      const metricEntry = foundationMap?.get?.(key) ?? foundationMap?.get?.(row?.url)?.[key];
      const tier = (metricEntry?.stamp?.tier ?? metricEntry?.sourceTier) as SourceTier | undefined;
      const provider = metricEntry?.stamp?.provider as string | undefined;
      const observedAt = metricEntry?.stamp?.observedAt as string | undefined;

      return (
        <MetricCellContent tier={tier} provider={provider} observedAt={observedAt}>
          {text}
        </MetricCellContent>
      );
    },
  };
}

export type DataTableProps<T> = {
  rows: ReadonlyArray<T>;
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  density?: Density;
  selected?: RowSelectionState;
  onSelectedChange?: (next: RowSelectionState) => void;
  onOpenInspector?: (id: string) => void;
  onPeek?: (id: string) => void;
  className?: string;
  emptyText?: string;
  accent?: string;
};

const CHECKBOX_COL: ColumnDef<any> = {
  id: '_select',
  size: 32,
  header: ({ table }) => {
    const checked = table.getIsAllPageRowsSelected();
    const indeterminate = table.getIsSomePageRowsSelected();
    return (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          ref={el => { if (el) el.indeterminate = indeterminate; }}
          onChange={e => table.toggleAllPageRowsSelected(e.target.checked)}
          onClick={e => e.stopPropagation()}
          className="w-3.5 h-3.5 accent-[#a78bfa] cursor-pointer"
        />
      </div>
    );
  },
  cell: ({ row }) => (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={e => {
          e.stopPropagation();
          row.toggleSelected(e.target.checked);
        }}
        onClick={e => e.stopPropagation()}
        className="w-3.5 h-3.5 accent-[#a78bfa] cursor-pointer"
      />
    </div>
  ),
  enableSorting: false,
  enableHiding: false,
  enableResizing: false,
};

export function DataTable<T>({
  rows, columns, getRowId,
  density = 'comfy', selected, onSelectedChange,
  onOpenInspector, onPeek, className, emptyText = 'No rows.', accent,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [internalSel, setInternalSel] = React.useState<RowSelectionState>({});
  const sel = selected ?? internalSel;

  // Drag-and-drop state for column reordering
  const [dragColId, setDragColId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Column pinning state: { left: string[], right: string[] }
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });

  const setSel = React.useCallback((next: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => {
    const resolved = typeof next === 'function' ? next(sel) : next;
    if (onSelectedChange) onSelectedChange(resolved);
    else setInternalSel(resolved);
  }, [onSelectedChange, sel]);

  const allColumns = useMemo(
    () => [
      CHECKBOX_COL as ColumnDef<T>,
      ...columns.map(c => wrapWithMetricRenderer(c)),
      ACTION_COLUMN as ColumnDef<T>,
    ],
    [columns],
  );

  const table = useReactTable({
    data: rows as T[],
    columns: allColumns,
    state: { sorting, rowSelection: sel, columnSizing, columnOrder, columnPinning },
    getRowId,
    columnResizeMode: 'onChange',
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sel) : updater;
      setSel(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Freeze up to a given column (like Google Sheets: "Freeze up to this column")
  const freezeUpToColumn = useCallback((colId: string) => {
    const colOrder = table.getState().columnOrder;
    const allCols = colOrder.length > 0 ? colOrder : allColumns.map(c => c.id!);
    const targetIdx = allCols.indexOf(colId);

    // If this column is already the freeze boundary, unfreeze all (keep _select)
    const currentFrozenCols = columnPinning.left.filter(id => id !== '_select');
    if (currentFrozenCols.length > 0) {
      const lastFrozenIdx = allCols.indexOf(currentFrozenCols[currentFrozenCols.length - 1]);
      if (lastFrozenIdx === targetIdx) {
        setColumnPinning(prev => ({ ...prev, left: [] }));
        return;
      }
    }

    // Freeze all columns up to and including targetIdx
    const colsToFreeze = allCols
      .slice(0, targetIdx + 1)
      .filter(id => id !== '_select' && id !== ACTION_COLUMN.id);

    setColumnPinning(prev => ({ ...prev, left: ['_select', ...colsToFreeze] }));
  }, [table, allColumns, columnPinning.left]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowH = DENSITY[density];
  const v = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowH,
    overscan: 16,
  });

  const items = v.getVirtualItems();
  const total = v.getTotalSize();

  const totalColWidth = useMemo(
    () => table.getVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0),
    [table, columnSizing],
  );

  // Compute sticky left offsets for pinned columns
  const pinnedLeftOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let acc = 0;
    for (const colId of columnPinning.left) {
      const col = table.getColumn(colId);
      if (col) {
        offsets[colId] = acc;
        acc += col.getSize();
      }
    }
    return offsets;
  }, [columnPinning.left, table, columnSizing]);

  const handleRowClick = useCallback((id: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      setSel(prev => {
        const next = { ...prev };
        if (next[id]) delete next[id];
        else next[id] = true;
        return next;
      });
    } else {
      onOpenInspector?.(id);
    }
  }, [onOpenInspector, setSel]);

  // Column drag-and-drop handlers
  const handleColDragStart = useCallback((colId: string, e: React.DragEvent) => {
    setDragColId(colId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colId);
  }, []);

  const handleColDragOver = useCallback((colId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(colId);
  }, []);

  const handleColDrop = useCallback((targetColId: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = dragColId;
    if (!sourceId || sourceId === targetColId) {
      setDragColId(null);
      setDropTargetId(null);
      return;
    }

    // Don't allow reordering checkbox or action columns
    if (sourceId === '_select' || targetColId === '_select' ||
        sourceId === ACTION_COLUMN.id || targetColId === ACTION_COLUMN.id) {
      setDragColId(null);
      setDropTargetId(null);
      return;
    }

    setColumnOrder(prev => {
      const current = prev.length > 0 ? prev : allColumns.map(c => c.id!);
      const fromIdx = current.indexOf(sourceId);
      const toIdx = current.indexOf(targetColId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...current];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, sourceId);
      return next;
    });

    setDragColId(null);
    setDropTargetId(null);
  }, [dragColId, allColumns]);

  const handleColDragEnd = useCallback(() => {
    setDragColId(null);
    setDropTargetId(null);
  }, []);

  if (rows.length === 0) {
    return (
      <div className="flex-1 grid place-items-center" style={{ fontSize: 12, color: TEXT.tertiary }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div ref={parentRef} className={clsx('flex-1 min-h-0 overflow-auto custom-scrollbar', className)}>
      <div style={{ minWidth: totalColWidth, width: '100%' }}>
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10"
          style={{ background: SURFACE.bg0, borderBottom: `1px solid ${SURFACE.br0}` }}
        >
          {table.getHeaderGroups().map(hg => (
            <div
              key={hg.id}
              className="flex items-center"
              style={{ height: 32, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT.tertiary, minWidth: totalColWidth }}
            >
              {hg.headers.map(h => {
                const isDraggable = h.id !== '_select' && h.column.id !== ACTION_COLUMN.id;
                const isDragging = dragColId === h.column.id;
                const isDropTarget = dropTargetId === h.column.id && dragColId !== h.column.id;

                // Compute sticky left offset for pinned columns
                const stickyOffset = pinnedLeftOffsets[h.column.id];
                const isSticky = stickyOffset !== undefined;

                // Determine freeze boundary: the last pinned column (excluding _select)
                const frozenColsExceptSelect = columnPinning.left.filter(id => id !== '_select');
                const freezeBoundaryId = frozenColsExceptSelect.length > 0
                  ? frozenColsExceptSelect[frozenColsExceptSelect.length - 1]
                  : null;
                const isFreezeBoundary = h.column.id === freezeBoundaryId;

                return (
                <div
                  key={h.id}
                  className={clsx(
                    'select-none min-w-0 group/col shrink-0',
                    h.id === '_select' ? 'cursor-default' : 'cursor-pointer',
                  )}
                  style={{
                    padding: `0 ${S[3]}px`,
                    width: h.getSize(),
                    transition: 'color 0.1s, opacity 0.15s, background 0.1s',
                    position: isSticky ? 'sticky' as const : 'relative' as const,
                    left: isSticky ? stickyOffset : undefined,
                    zIndex: isSticky ? 15 : undefined,
                    opacity: isDragging ? 0.4 : 1,
                    background: isDropTarget ? 'rgba(59,130,246,0.08)' : isSticky ? SURFACE.bg0 : 'transparent',
                    borderRight: isDropTarget ? '2px solid #3b82f6' : undefined,
                  }}
                  draggable={isDraggable}
                  onDragStart={isDraggable ? (e) => handleColDragStart(h.column.id, e) : undefined}
                  onDragOver={isDraggable ? (e) => handleColDragOver(h.column.id, e) : undefined}
                  onDrop={isDraggable ? (e) => handleColDrop(h.column.id, e) : undefined}
                  onDragEnd={handleColDragEnd}
                  onMouseEnter={e => { if (h.id !== '_select') e.currentTarget.style.color = TEXT.primary; }}
                  onMouseLeave={e => { if (h.id !== '_select') e.currentTarget.style.color = TEXT.tertiary; }}
                  onClick={h.id !== '_select' ? h.column.getToggleSortingHandler() : undefined}
                  role="columnheader"
                >
                  <span className="pointer-events-none overflow-hidden whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</span>
                  {h.id !== '_select' && h.column.getIsSorted() === 'asc' ? ' ▲' : h.id !== '_select' && h.column.getIsSorted() === 'desc' ? ' ▼' : ''}
                  {/* Pin icon on hover */}
                  {isDraggable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); freezeUpToColumn(h.column.id); }}
                      className={clsx(
                        'absolute top-0.5 right-1.5 p-0.5 rounded z-20 transition-opacity cursor-pointer',
                        isFreezeBoundary ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover/col:opacity-60 hover:!opacity-100',
                      )}
                      style={{ color: isFreezeBoundary ? '#3b82f6' : TEXT.tertiary, background: 'none', border: 'none' }}
                      title={isFreezeBoundary ? 'Unfreeze columns' : `Freeze columns up to "${h.column.columnDef.header}"`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="17" x2="12" y2="22"/>
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                      </svg>
                    </button>
                  )}
                  {/* Resize handle */}
                  {h.id !== '_select' && h.column.getCanResize() && (
                    <div
                      draggable={false}
                      onDragStart={e => e.preventDefault()}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); h.getResizeHandler()(e); }}
                      onTouchStart={(e) => { e.stopPropagation(); h.getResizeHandler()(e); }}
                      onClick={e => e.stopPropagation()}
                      data-resize-handle
                      className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-20 group/resize"
                      style={{ userSelect: 'none', touchAction: 'none' }}
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 w-[1px] transition-colors"
                        style={{
                          background: h.column.getIsResizing()
                            ? '#3b82f6'
                            : 'transparent',
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-[3px] opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        style={{
                          background: '#3b82f6',
                          opacity: h.column.getIsResizing() ? 1 : undefined,
                        }}
                      />
                    </div>
                  )}
                  {/* Hover column border */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-px opacity-0 group-hover/col:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: SURFACE.br0 }}
                  />
                </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Virtualizer body */}
        <div style={{ height: total, position: 'relative', width: '100%' }}>
          {items.map(vi => {
            const r = table.getRowModel().rows[vi.index];
            if (!r) return null;
            const isSel = !!sel[r.id];
            return (
              <div
                key={r.id}
                role="row"
                tabIndex={0}
                onClick={(e) => handleRowClick(r.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onOpenInspector?.(r.id);
                  if (e.key === ' ') { e.preventDefault(); onPeek?.(r.id); }
                }}
                className="absolute flex items-center cursor-pointer"
                style={{
                  left: 0,
                  right: 0,
                  transform: `translateY(${vi.start}px)`,
                  height: rowH,
                  fontSize: 12,
                  color: TEXT.primary,
                  borderBottom: `1px solid ${SURFACE.br0}`,
                  background: isSel ? SURFACE.bg2 : 'transparent',
                  outline: 'none',
                  transition: 'background 0.08s',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = SURFACE.bg1; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
              >
                {r.getVisibleCells().map(c => {
                  const stickyOffset = pinnedLeftOffsets[c.column.id];
                  const isSticky = stickyOffset !== undefined;
                  return (
                  <div
                    key={c.id}
                    className="truncate min-w-0 shrink-0"
                    style={{
                      padding: `0 ${S[3]}px`,
                      width: c.column.getSize(),
                      position: isSticky ? 'sticky' as const : undefined,
                      left: isSticky ? stickyOffset : undefined,
                      zIndex: isSticky ? 5 : undefined,
                      background: isSticky ? SURFACE.bg0 : undefined,
                    }}
                  >
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
