import type { MetricFormat } from '@seesby/types';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import { getMetricDef } from '@seesby/metrics';
import { resolveCellValue } from './resolve-cell-value';

// Format a cell value based on its metric format type
export function formatCellValue(value: unknown, format?: MetricFormat, unit?: string): string {
  if (value === null || value === undefined) return '\u2014';

  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'percent':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value);
    case 'duration':
      return typeof value === 'number' ? formatDuration(value) : String(value);
    case 'bytes':
      return typeof value === 'number' ? formatBytes(value) : String(value);
    case 'date':
      return value instanceof Date ? value.toLocaleDateString() : String(value);
    case 'money':
      return typeof value === 'number'
        ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : String(value);
    case 'score':
      return typeof value === 'number' ? `${Math.round(value)}/100` : String(value);
    case 'boolean':
      return value ? '\u2713' : '\u2717';
    case 'url':
      return String(value);
    case 'list':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'enum':
      return String(value);
    case 'text':
    default:
      return String(value);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Get a CSS color class based on score value (0-100)
export function scoreColor(value: number): string {
  if (value >= 80) return 'text-emerald-400';
  if (value >= 60) return 'text-blue-400';
  if (value >= 40) return 'text-yellow-400';
  if (value >= 20) return 'text-orange-400';
  return 'text-red-400';
}

// Get a CSS color class for CWV bucket
export function cwvBucketColor(bucket: string): string {
  switch (bucket) {
    case 'good': return 'text-emerald-400';
    case 'needs-improvement': return 'text-yellow-400';
    case 'poor': return 'text-red-400';
    default: return 'text-[#666]';
  }
}

// Get a CSS color class for security grade
export function secGradeColor(grade: string): string {
  if (['A'].includes(grade)) return 'text-emerald-400';
  if (['B'].includes(grade)) return 'text-blue-400';
  if (['C'].includes(grade)) return 'text-yellow-400';
  if (['D', 'E', 'F'].includes(grade)) return 'text-red-400';
  return 'text-[#666]';
}

// ---------------------------------------------------------------------------
// TanStack-compatible cell factories
// ---------------------------------------------------------------------------

/**
 * Creates a TanStack cell renderer that resolves the value via
 * `resolveCellValue` (canonical -> legacy fallback) and formats it
 * with `formatCellValue` using the metric definition's `format`.
 *
 * Usage in column definitions:
 * ```ts
 * { accessorKey: 'p.tech.perf.loadMs', header: 'Load Time', cell: metricCell('p.tech.perf.loadMs') }
 * ```
 */
export function metricCell<T>(metricKey: string, opts?: { className?: string }) {
  const def = getMetricDef(metricKey);
  const format = def?.format as MetricFormat | undefined;
  const unit = def?.unit;

  return (ctx: CellContext<T, unknown>) => {
    const raw = ctx.getValue();
    // If the accessor already resolved a value, use it; otherwise fall through
    // to resolveCellValue using the accessorKey as the column key.
    const resolved = raw !== undefined ? raw
      : resolveCellValue(ctx.row.original as Record<string, unknown>, metricKey);

    const text = formatCellValue(resolved, format, unit);
    return <span className={opts?.className}>{text}</span>;
  };
}

/**
 * Creates a full TanStack `ColumnDef` with metric-aware rendering.
 *
 * Usage:
 * ```ts
 * metricColumn('p.tech.perf.loadMs', { header: 'Load Time', size: 100 })
 * ```
 */
export function metricColumn<T>(
  metricKey: string,
  opts?: {
    header?: string;
    size?: number;
    className?: string;
    accessorFn?: (row: T) => unknown;
  },
): ColumnDef<T> {
  const def = getMetricDef(metricKey);
  const format = def?.format as MetricFormat | undefined;
  const unit = def?.unit;

  return {
    id: metricKey,
    accessorFn: opts?.accessorFn,
    header: opts?.header ?? def?.i18nLabelKey?.split('.').pop() ?? metricKey,
    size: opts?.size ?? 100,
    cell: (ctx) => {
      const raw = ctx.getValue();
      const resolved = raw !== undefined ? raw
        : resolveCellValue(ctx.row.original as Record<string, unknown>, metricKey);
      const text = formatCellValue(resolved, format, unit);
      return <span className={opts?.className}>{text}</span>;
    },
  };
}
