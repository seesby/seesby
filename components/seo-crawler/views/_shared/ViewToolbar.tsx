import React from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { getMode } from '@seesby/modes';
import type { Mode } from '@seesby/types';
import { MODE_ACCENT, SURFACE, TEXT, R, S } from './tokens';
import { useVisibleViews } from '../_hooks/useViewVisibility';
import { DensityToggle } from './DensityToggle';
import { ColumnPickerPopover } from './ColumnPickerPopover';
import { ExportMenu } from './ExportMenu';

type ViewToolbarProps = {
  mode: Mode;
  right?: React.ReactNode;
  showColumns?: boolean;
  showDensity?: boolean;
  showExport?: boolean;
};

export function ViewToolbar({
  mode, right, showColumns = true, showDensity = true, showExport = true,
}: ViewToolbarProps) {
  const { getCurrentView, setCurrentView } = useSeoCrawler() as any;
  const def = getMode(mode);
  const visibleViews = useVisibleViews(mode);
  const active = getCurrentView(mode);

  return (
    <div
      role="toolbar"
      aria-label={`${def.label} views`}
      className="flex items-center gap-2 shrink-0 h-full"
    >
      <div
        className="flex items-center p-0.5"
        style={{ background: SURFACE.bg1, borderRadius: R.md, border: `1px solid ${SURFACE.br1}` }}
      >
        {visibleViews.map(v => {
          const on = v.id === active;
          return (
            <button
              key={v.id}
              onClick={() => setCurrentView(mode, v.id)}
              style={{
                height: 26,
                padding: '0 10px',
                fontSize: 11,
                borderRadius: R.sm,
                color: on ? TEXT.primary : TEXT.tertiary,
                background: on ? SURFACE.bg3 : 'transparent',
                fontWeight: on ? 600 : 400,
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => {
                if (!on) e.currentTarget.style.color = TEXT.secondary;
              }}
              onMouseLeave={e => {
                if (!on) e.currentTarget.style.color = TEXT.tertiary;
              }}
              aria-pressed={on}
            >
              {v.label}
            </button>
          );
        })}
      </div>
      {right}
      {showColumns && <ColumnPickerPopover mode={mode} />}
      {showDensity && <DensityToggle />}
      {showExport && <ExportMenu />}
    </div>
  );
}
