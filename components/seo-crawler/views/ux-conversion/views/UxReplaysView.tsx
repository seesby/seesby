import React, { useState } from 'react';
import { useReplays } from '../selectors/useReplays.tsx';
import { fmtDate } from '../../_shared/formatters';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

const DEVICE_ICON: Record<string, string> = {
  desktop: '🖥', mobile: '📱', tablet: '📟',
};

export default function UxReplaysView() {
  const list = useReplays();
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.id ?? null);
  const selected = list.find((r: any) => r.id === selectedId) ?? list[0];
  const { ReplayPlayer } = useSeoCrawler() as any;

  return (
    <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
      {/* Replay list */}
      <div className="col-span-5 border-r border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] flex flex-col min-h-0">
        <div className="h-9 px-3 flex items-center border-b border-[var(--brand-surface-3)]] shrink-0">
          <span className="text-[11px] text-[var(--brand-text-faint)]] uppercase tracking-wider">
            {list.length} replay{list.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          {list.length === 0 ? (
            <div className="p-4 text-[12px] text-[var(--brand-text-faint)]]">No replays captured.</div>
          ) : (
            list.map((r: any) => {
              const sel = r.id === selectedId;
              const friction = (r.rageClicks ?? 0) + (r.errorClicks ?? 0);
              const duration = Math.round(r.durationMs / 1000);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[var(--brand-surface-2)]] transition-colors ${
                    sel ? 'bg-[var(--brand-surface-1)]]' : 'hover:bg-[var(--brand-surface-1)]]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--brand-text-strong)] truncate flex-1">{r.pageUrl}</span>
                    <span className="text-[10px]">{DEVICE_ICON[r.device] || ''}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-[var(--brand-text-mid)]]">{duration}s</span>
                    {friction > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        friction > 3 ? 'bg-[#ef4444]/15 text-[#ef4444]' : 'bg-[#f59e0b]/15 text-[#f59e0b]'
                      }`}>
                        {r.rageClicks} rage · {r.errorClicks} err
                      </span>
                    )}
                    {r.source && r.source !== 'custom' && (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--brand-border-2)]] text-[var(--brand-text-mid)]] text-[9px]">{r.source}</span>
                    )}
                    <span className="text-[var(--brand-text-faint)]] ml-auto">{fmtDate(r.startedAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Player area */}
      <div className="col-span-7 bg-[var(--brand-surface-0)]] flex flex-col min-h-0">
        {selected ? (
          <>
            {/* Metadata bar */}
            <div className="h-9 px-3 flex items-center gap-4 border-b border-[var(--brand-surface-3)]] shrink-0">
              <span className="text-[11px] text-[var(--brand-text-faint)]] truncate">{selected.pageUrl}</span>
              <div className="flex-1" />
              <span className="text-[10px] text-[var(--brand-text-mid)]]">{Math.round(selected.durationMs / 1000)}s</span>
              <span className="text-[10px]">{DEVICE_ICON[selected.device] || ''} {selected.device}</span>
              {(selected.rageClicks > 0 || selected.errorClicks > 0) && (
                <span className="text-[10px] text-[#f43f5e]">
                  {selected.rageClicks} rage · {selected.errorClicks} err
                </span>
              )}
            </div>
            {/* Player */}
            <div className="flex-1 min-h-0 overflow-auto">
              {ReplayPlayer ? (
                <ReplayPlayer replayId={selected.id} src={selected.source} />
              ) : (
                <div className="h-full grid place-items-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--brand-surface-2)]] grid place-items-center mx-auto mb-3">
                      <span className="text-[24px]">▶</span>
                    </div>
                    <div className="text-[13px] text-[var(--brand-text-mid)]] mb-1">Replay player</div>
                    <div className="text-[11px] text-[var(--brand-text-faint)]]">Connect a replay provider to watch sessions</div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]]">
            Select a replay to watch.
          </div>
        )}
      </div>
    </div>
  );
}
