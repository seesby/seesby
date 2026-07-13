import React, { useMemo, useState } from 'react';
import { DiffViewer } from '../../_shared/DiffViewer';
import { KpiStrip } from '../../_shared/KpiStrip';
import { useRenderDiff } from '../selectors/useRenderDiff';
import { fmtBytes, fmtMs } from '../../_shared/formatters';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import clsx from 'clsx';

const SEVERITY_BADGE: Record<string, { bg: string; text: string }> = {
  severe: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
  moderate: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
  mild: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  none: { bg: 'bg-[var(--brand-surface-3)] border-[var(--brand-border-2)]', text: 'text-[var(--brand-text-faint)]' },
};

export default function RenderDiffView() {
  const { rows, summary, renderGapPages } = useRenderDiff();
  const { pages = [] } = useSeoCrawler() as any;
  const [selected, setSelected] = useState<string | null>(rows[0]?.id ?? null);

  const row = useMemo(() => rows.find(r => r.id === selected) ?? rows[0], [rows, selected]);
  const page = useMemo(() => pages.find((p: any) => p.url === row?.id) ?? null, [pages, row]);

  if (rows.length === 0) {
    return (
      <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]">
        No pages crawled yet.
      </div>
    );
  }

  if (summary.pagesWithRender === 0) {
    return (
      <div className="flex-1 grid place-items-center p-6">
        <div className="text-center">
          <div className="text-[14px] text-[var(--brand-text-strong)] font-semibold mb-1">No render captures available</div>
          <div className="text-[12px] text-[var(--brand-text-mid)]">Render diff data will appear after the crawler captures both static and rendered HTML.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* KPI summary strip */}
      <KpiStrip
        cols={5}
        items={[
          { label: 'Content hidden', value: summary.contentInvisibleCount, tone: summary.contentInvisibleCount > 0 ? 'warn' : 'good' },
          { label: 'Links hidden', value: summary.linksInvisibleCount, tone: summary.linksInvisibleCount > 0 ? 'warn' : 'good' },
          { label: 'Schema hidden', value: summary.schemaInvisibleCount, tone: summary.schemaInvisibleCount > 0 ? 'warn' : 'good' },
          { label: 'Avg hydration', value: fmtMs(summary.avgHydrationMs), tone: 'neutral' },
          { label: 'Avg LCP delta', value: fmtMs(summary.avgLcpDelta), tone: summary.avgLcpDelta > 0 ? 'warn' : 'good' },
        ]}
      />

      {/* Severe render gaps list */}
      {renderGapPages.length > 0 && (
        <div className="shrink-0 max-h-28 overflow-auto border-b border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]">
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]">
            Pages with render gaps ({renderGapPages.length})
          </div>
          <div className="px-3 pb-2 space-y-0.5">
            {renderGapPages.map(r => {
              const badge = SEVERITY_BADGE[r.severity];
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors',
                    selected === r.id ? 'bg-[var(--brand-surface-3)]' : 'hover:bg-[var(--brand-surface-1)]',
                  )}
                >
                  <span className={clsx('text-[9px] px-1 py-0.5 rounded border uppercase', badge.bg, badge.text)}>
                    {r.severity}
                  </span>
                  <span className="text-[11px] text-[#bdb6ff] truncate flex-1">{r.url}</span>
                  <span className="text-[10px] font-mono text-[var(--brand-text-mid)]">{r.renderGapPct}% gap</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Page selector + metrics */}
      <div className="shrink-0 flex items-center gap-4 px-3 py-2 border-b border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]">
        <select
          className="h-7 px-2 text-[11px] bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] text-[var(--brand-text-mid)] rounded outline-none focus:border-[#F59E0B] max-w-xs"
          value={selected ?? ''}
          onChange={e => setSelected(e.target.value)}
        >
          {rows.filter(r => r.hasRender).map(r => (
            <option key={r.id} value={r.id}>{r.url}</option>
          ))}
        </select>

        {row && row.hasRender && (
          <div className="flex items-center gap-3 text-[10px] text-[var(--brand-text-mid)]">
            <MetricPill label="Static" value={fmtBytes(row.staticBytes)} />
            <MetricPill label="Rendered" value={fmtBytes(row.renderedBytes)} />
            <MetricPill label="JS added" value={fmtBytes(row.jsAddedBytes)} accent={row.jsAddedBytes > 0} />
            <MetricPill label="Hydration" value={fmtMs(row.hydrationMs)} />
            <MetricPill
              label="LCP delta"
              value={`${row.cwvBefore > 0 ? fmtMs(row.cwvBefore) : '—'} → ${row.cwvAfter > 0 ? fmtMs(row.cwvAfter) : '—'}`}
              accent={row.cwvAfter > row.cwvBefore}
            />
          </div>
        )}
      </div>

      {/* Diff viewer */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[var(--brand-surface-0)] relative">
        {row && row.hasRender ? (
          <DiffViewer
            left={page?.render?.static?.html ?? '<!-- no static capture -->'}
            right={page?.render?.rendered?.html ?? '<!-- no rendered capture -->'}
          />
        ) : row ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-4 py-3 bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] rounded text-[12px] text-[var(--brand-text-mid)]">
              Rendered capture not available for this page.
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-[var(--brand-text-faint)] p-4">Select a page to view its render diff.</div>
        )}
      </div>
    </div>
  );
}

function MetricPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[var(--brand-text-faint)]">{label}</span>
      <span className={clsx('font-mono font-medium', accent ? 'text-amber-400' : 'text-[var(--brand-text-strong)]')}>{value}</span>
    </div>
  );
}
