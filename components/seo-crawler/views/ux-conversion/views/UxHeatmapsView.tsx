import React, { useState } from 'react';
import { useHeatmaps } from '../selectors/useHeatmaps.tsx';
import { fmtDate, fmtCompact } from '../../_shared/formatters';

type FilterType = 'all' | 'click' | 'move' | 'scroll' | 'attention';
type FilterDevice = 'all' | 'desktop' | 'mobile' | 'tablet';

const TYPE_LABELS: Record<FilterType, string> = {
  all: 'All types', click: 'Click', move: 'Move', scroll: 'Scroll', attention: 'Attention',
};
const DEVICE_LABELS: Record<FilterDevice, string> = {
  all: 'All devices', desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet',
};
const DEVICE_ICON: Record<string, string> = {
  desktop: '🖥', mobile: '📱', tablet: '📟',
};

export default function UxHeatmapsView() {
  const list = useHeatmaps();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterDevice, setFilterDevice] = useState<FilterDevice>('all');
  const filtered = list.filter((h: any) =>
    (filterType === 'all' || h.type === filterType) &&
    (filterDevice === 'all' || h.device === filterDevice)
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] shrink-0">
        <span className="text-[11px] text-[var(--brand-text-faint)] uppercase tracking-wider">
          {filtered.length} capture{filtered.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Pills value={filterType} onChange={setFilterType} options={['all', 'click', 'move', 'scroll', 'attention']} labels={TYPE_LABELS} />
          <div className="w-px h-4 bg-[var(--brand-border-2)]" />
          <Pills value={filterDevice} onChange={setFilterDevice} options={['all', 'desktop', 'mobile', 'tablet']} labels={DEVICE_LABELS} />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-3 gap-3">
        {filtered.map((h: any, i: number) => (
          <a
            key={i}
            href={h.thumbUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="group rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] overflow-hidden hover:border-[#f43f5e]/30 transition-colors flex flex-col"
          >
            {h.thumbUrl ? (
              <img src={h.thumbUrl} alt="" className="block w-full aspect-[3/4] object-cover" />
            ) : (
              <div className="aspect-[3/4] grid place-items-center bg-[var(--brand-surface-2)]">
                <span className="text-[11px] text-[var(--brand-border-2)]">No preview</span>
              </div>
            )}
            <div className="px-2.5 py-2 flex flex-col gap-1">
              <div className="text-[11px] text-[var(--brand-text-strong)] truncate">{h.pageUrl}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    h.type === 'click' ? 'bg-[#f43f5e]' :
                    h.type === 'scroll' ? 'bg-[#3b82f6]' :
                    h.type === 'attention' ? 'bg-[#f59e0b]' : 'bg-[var(--brand-text-mid)]'
                  }`} />
                  <span className="text-[10px] text-[var(--brand-text-mid)] capitalize">{h.type}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--brand-text-faint)]">
                  <span>{DEVICE_ICON[h.device] || ''}</span>
                  <span>{fmtCompact(h.sampleSize)} samples</span>
                  <span>·</span>
                  <span>{fmtDate(h.capturedAt)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--brand-surface-2)] grid place-items-center mb-3">
              <span className="text-[20px]">🗺</span>
            </div>
            <div className="text-[12px] text-[var(--brand-text-mid)]">
              {list.length === 0
                ? 'No heatmaps captured yet. Connect a recorder from the left sidebar.'
                : 'No captures match the current filters.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Pills<T extends string>({
  value, onChange, options, labels,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  labels: Record<T, string>;
}) {
  return (
    <div className="flex gap-0.5 text-[10px]">
      {options.map(k => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`h-6 px-2 rounded transition-colors ${
            value === k ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] hover:bg-[var(--brand-surface-2)]'
          }`}
        >
          {labels[k] ?? k}
        </button>
      ))}
    </div>
  );
}
