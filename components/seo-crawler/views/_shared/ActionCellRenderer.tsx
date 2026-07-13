import React from 'react';
import type { ColumnDef, RowData } from '@tanstack/react-table';

// ─── Band color mapping ────────────────────────────────────────────────
const BAND_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  BLOCKING:      { bg: 'bg-red-500/15',  text: 'text-red-400',    ring: 'ring-red-500/30' },
  REVENUE_LOSS:  { bg: 'bg-orange-500/15', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  HIGH_LEVERAGE: { bg: 'bg-amber-500/15', text: 'text-amber-400',  ring: 'ring-amber-500/30' },
  STRATEGIC:     { bg: 'bg-blue-500/15',   text: 'text-blue-400',   ring: 'ring-blue-500/30' },
  HYGIENE:       { bg: 'bg-zinc-500/15',   text: 'text-zinc-400',   ring: 'ring-zinc-500/30' },
};

const DEFAULT_BAND_STYLE = BAND_STYLES.HYGIENE;

// ─── Types ─────────────────────────────────────────────────────────────

export interface ActionItem {
  code?: string;
  title?: string;
  name?: string;
  band?: string;
  priorityBand?: string;
  score?: number;
  definition?: {
    code?: string;
    name?: string;
    priorityBand?: string;
  };
}

interface ActionCellRendererProps {
  actions?: ActionItem[];
  getValue?: () => unknown;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function resolveAction(raw: ActionItem) {
  const code = raw.code ?? raw.definition?.code ?? '';
  const title = raw.title ?? raw.name ?? raw.definition?.name ?? '';
  const band = raw.band ?? raw.priorityBand ?? raw.definition?.priorityBand ?? 'HYGIENE';
  const score = raw.score ?? 0;
  return { code, title, band, score };
}

function getBandStyle(band: string) {
  return BAND_STYLES[band] ?? DEFAULT_BAND_STYLE;
}

// ─── Component ─────────────────────────────────────────────────────────

export default function ActionCellRenderer({ actions, getValue }: ActionCellRendererProps) {
  // Support both direct prop and TanStack cell getValue pattern
  const rawActions = (actions ?? (getValue?.() as ActionItem[] | undefined)) ?? [];
  if (!rawActions.length) {
    return <span className="text-zinc-600 text-xs">-</span>;
  }

  const sorted = [...rawActions]
    .map(resolveAction)
    .sort((a, b) => b.score - a.score);

  const top = sorted[0];
  const remaining = sorted.length - 1;
  const bandStyle = getBandStyle(top.band);

  return (
    <div className="flex items-center gap-1 min-w-0">
      {/* Top action chip */}
      <span
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
          leading-tight ring-1 ring-inset truncate max-w-[120px]
          ${bandStyle.bg} ${bandStyle.text} ${bandStyle.ring}
        `}
        title={`${top.code}: ${top.title}`}
      >
        <span className="font-semibold shrink-0">{top.code}</span>
        <span className="truncate opacity-80">{top.title}</span>
      </span>

      {/* Overflow badge */}
      {remaining > 0 && (
        <span
          className="
            inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium
            leading-tight bg-zinc-800 text-zinc-400 ring-1 ring-inset ring-zinc-700
          "
          title={sorted
            .slice(1)
            .map(a => `${a.code}: ${a.title}`)
            .join('\n')}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

// ─── Reusable column definition ────────────────────────────────────────

/**
 * The "Actions" column for the DataTable grid.
 * Always visible, shows the highest-priority triggered action per page.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ACTION_COLUMN: ColumnDef<RowData> = {
  id: 'actions',
  header: 'Actions',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessorFn: (row: any) => row.actions ?? row.foundationActions ?? [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cell: ({ getValue }: any) => <ActionCellRenderer getValue={getValue} />,
  size: 200,
  minSize: 150,
  enableHiding: false,
  enableResizing: false,
};
