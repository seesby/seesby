import React, { useState } from 'react';
import { useAnchors } from '../selectors/useAnchors';
import type { AnchorPhraseWithClass } from '../selectors/useAnchors';
import clsx from 'clsx';

const PANEL = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2';

const BUCKET_COLORS: Record<string, string> = {
  branded: '#22c55e',
  exact: '#ef4444',
  partial: '#3b82f6',
  generic: '#64748b',
  naked: '#f59e0b',
  image: '#a78bfa',
};

const GROUP_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'exact', label: 'Exact' },
  { id: 'partial', label: 'Partial' },
  { id: 'branded', label: 'Brand' },
  { id: 'generic', label: 'Generic' },
  { id: 'naked', label: 'URL' },
];

export default function LinksAnchorsView() {
  const { buckets, topWithClass, targetMix, overOptimized } = useAnchors();
  const [scope, setScope] = useState<'internal' | 'external'>('internal');
  const [group, setGroup] = useState('all');

  const filtered = group === 'all'
    ? topWithClass
    : topWithClass.filter(p => p.cls === group);

  const maxVal = filtered.length > 0 ? filtered[0].value : 1;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto custom-scrollbar">
      {/* Controls */}
      <div className="flex items-center gap-4 p-3 pb-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--brand-text-faint)] mr-1">Scope:</span>
          {(['internal', 'external'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={clsx(
                'h-[22px] px-2 text-[10px] rounded transition-colors',
                scope === s ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)] hover:text-[var(--brand-text-mid)]'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--brand-text-faint)] mr-1">Group:</span>
          {GROUP_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setGroup(f.id)}
              className={clsx(
                'h-[22px] px-2 text-[10px] rounded transition-colors',
                group === f.id ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)] hover:text-[var(--brand-text-mid)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-12 gap-3">
        {/* Anchor cloud / bar chart — full width */}
        <div className={`${PANEL} col-span-12`}>
          <div className="px-3 pt-2 pb-1">
            <div className={LABEL}>Anchor cloud</div>
          </div>
          <div className="px-3 pb-3">
            {filtered.length > 0 ? (
              <div className="space-y-[5px]">
                {filtered.map((p, i) => (
                  <AnchorBar key={i} item={p} max={maxVal} />
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[var(--brand-text-faint)] py-6 text-center">No anchor data</div>
            )}
          </div>
        </div>

        {/* Anchor mix per target — full width */}
        <div className={`${PANEL} col-span-12`}>
          <div className="px-3 pt-2 pb-1">
            <div className={LABEL}>Anchor mix per target (top 10 target pages)</div>
          </div>
          <div className="px-3 pb-3 overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-[var(--brand-text-faint)] border-b border-[var(--brand-surface-3)]">
                  <th className="text-left py-1 pr-4 font-normal">Target</th>
                  <th className="text-right py-1 px-2 font-normal">Brand</th>
                  <th className="text-right py-1 px-2 font-normal">Exact</th>
                  <th className="text-right py-1 px-2 font-normal">Partial</th>
                  <th className="text-right py-1 px-2 font-normal">Generic</th>
                  <th className="text-right py-1 px-2 font-normal">URL</th>
                  <th className="text-right py-1 pl-2 font-normal">Image</th>
                </tr>
              </thead>
              <tbody>
                {targetMix.length > 0 ? targetMix.map((t, i) => (
                  <tr key={i} className="border-b border-[var(--brand-surface-2)]">
                    <td className="py-1 pr-4 text-[var(--brand-text-mid)] truncate max-w-[200px]">{shortUrl(t.target)}</td>
                    <td className="py-1 px-2 text-right font-mono">{t.branded}%</td>
                    <td className={clsx('py-1 px-2 text-right font-mono', t.exact > 30 ? 'text-[#ef4444]' : '')}>{t.exact}%</td>
                    <td className="py-1 px-2 text-right font-mono">{t.partial}%</td>
                    <td className="py-1 px-2 text-right font-mono text-[var(--brand-text-faint)]">{t.generic}%</td>
                    <td className="py-1 px-2 text-right font-mono text-[var(--brand-text-faint)]">{t.naked}%</td>
                    <td className="py-1 pl-2 text-right font-mono text-[var(--brand-text-faint)]">{t.image}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-[var(--brand-text-faint)]">No anchor data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Over-optimization flags */}
        {overOptimized.length > 0 && (
          <div className={`${PANEL} col-span-12`}>
            <div className="px-3 pt-2 pb-1">
              <div className={LABEL}>Over-optimization flags</div>
            </div>
            <div className="px-3 pb-3 space-y-1">
              {overOptimized.map((o, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="text-[var(--brand-text-mid)]">{shortUrl(o.target)}</span>
                  <span className="text-[var(--brand-text-faint)]">—</span>
                  <span className={o.severity === 'bad' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}>
                    exact-match ratio {o.exactRatio}% (threshold 30%)
                  </span>
                  <span className={o.severity === 'bad' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}>
                    {o.severity === 'bad' ? '\u26A0\u26A0' : '\u26A0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnchorBar({ item, max }: { item: AnchorPhraseWithClass; max: number }) {
  const pct = max > 0 ? (item.value / max) * 100 : 0;
  const color = BUCKET_COLORS[item.cls] ?? '#64748b';
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-[10px] text-[var(--brand-text-mid)] w-[140px] truncate shrink-0" title={item.name}>
        {item.name || '(empty)'}
      </span>
      <div className="flex-1 h-[7px] bg-[var(--brand-surface-3)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-[var(--brand-text-mid)] w-[40px] text-right shrink-0 tabular-nums">
        {item.value}
      </span>
      {item.warning && (
        <span className={clsx(
          'text-[9px] shrink-0',
          item.warning.includes('high') ? 'text-[#ef4444]' :
          item.warning === 'generic' ? 'text-[#f59e0b]' :
          'text-[var(--brand-text-faint)]'
        )}>
          {item.warning === 'generic' && '\u26A0 '}
          {item.warning === 'url' && 'url'}
          {item.warning.includes('exact-match') && item.warning}
        </span>
      )}
    </div>
  );
}

function shortUrl(raw: string): string {
  if (!raw) return '—';
  try {
    const u = new URL(raw);
    const path = u.pathname + u.search;
    const text = `${u.hostname.replace(/^www\./, '')}${path}`;
    return text.length > 40 ? text.slice(0, 39) + '\u2026' : text;
  } catch {
    return raw.length > 40 ? raw.slice(0, 39) + '\u2026' : raw;
  }
}
