import type { ColumnDef, RowData } from '@tanstack/react-table';
import { ALL_COLUMNS } from '../../constants';

const METRIC_KEYS = new Set(ALL_COLUMNS.map(c => c.key));

export function filterByVisibleColumns<TData extends RowData>(
    columns: ColumnDef<TData>[],
    visibleColumns: string[],
): ColumnDef<TData>[] {
    if (visibleColumns.length === 0) return columns;
    return columns.filter((col) => {
        const key = (col as any).id ?? (col as any).accessorKey;
        if (!key) return true;
        // If this column isn't in the metric registry, always show it
        if (!METRIC_KEYS.has(key)) return true;
        return visibleColumns.includes(key);
    });
}
