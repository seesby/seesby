import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink, Maximize2, Minimize2,
} from 'lucide-react';
import { useSeoCrawler, type InspectorTab } from '../../../contexts/SeoCrawlerContext';
import { getInspectorTabsFor, getTabComponent } from './InspectorRegistry';
import { useHasTrend } from '../right-sidebar/_hooks/useSessionsCount';
import { SURFACE, TEXT, STATUS, R, S } from '../views/_shared/tokens';

export default function InspectorShell() {
  const {
    mode, selectedPage, setSelectedPage,
    detailsHeight, setIsDraggingDetails,
    activeTab, setActiveTab,
    inspectorCollapsed, setInspectorCollapsed,
    foundationMetricsMap, foundationActionsMap, foundationHydrated, crawlerFoundationEnabled,
  } = useSeoCrawler();

  const hasTrend = useHasTrend();
  const tabs = useMemo(() => getInspectorTabsFor(mode), [mode]);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const useFoundation = mode === 'wqa' && crawlerFoundationEnabled && foundationHydrated;
  const hydratedPage = useMemo(() => {
    if (!selectedPage || !useFoundation) return selectedPage;
    return {
      ...selectedPage,
      foundationMetrics: foundationMetricsMap.get(selectedPage.url) || {},
      foundationActions: foundationActionsMap.get(selectedPage.url) || [],
    };
  }, [selectedPage, foundationMetricsMap, foundationActionsMap, useFoundation]);

  // Reset to first tab when mode changes
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [mode, tabs, activeTab, setActiveTab]);

  // Animate indicator to active tab
  useEffect(() => {
    const el = tabRefs.current.get(activeTab);
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab, tabs]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!selectedPage) return;
    const handler = (e: KeyboardEvent) => {
      const ids = tabs.map(t => t.id);
      const idx = ids.indexOf(activeTab);
      if ((e.ctrlKey || e.metaKey) && e.key === '[' && idx > 0) {
        e.preventDefault();
        setActiveTab(ids[idx - 1]);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ']' && idx < tabs.length - 1) {
        e.preventDefault();
        setActiveTab(ids[idx + 1]);
      }
      if (e.key === 'Escape') setSelectedPage(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedPage, activeTab, tabs, setActiveTab, setSelectedPage]);

  if (!selectedPage) return null;

  // Collapsed state
  if (inspectorCollapsed) {
    return (
      <div
        className="flex items-center justify-between shrink-0"
        style={{ height: 40, borderTop: `1px solid ${SURFACE.br1}`, background: SURFACE.bg1, padding: '0 16px' }}
      >
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: TEXT.muted }} className="truncate">
          <span style={{ color: STATUS.bad, fontWeight: 600 }}>{selectedPage.url}</span>
        </div>
        <button
          onClick={() => setInspectorCollapsed(false)}
          style={{ color: TEXT.muted, padding: 4, borderRadius: R.md, transition: 'all 0.15s' }}
          title="Expand"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    );
  }

  const ActiveTabComponent = getTabComponent(mode, activeTab);

  return (
    <div
      style={{ height: detailsHeight, borderTop: `1px solid ${SURFACE.br1}`, background: SURFACE.bg1 }}
      className="flex flex-col shrink-0 relative"
    >
      {/* Resize handle */}
      <div
        onMouseDown={() => setIsDraggingDetails(true)}
        className="absolute top-0 left-0 right-0 h-1 -mt-0.5 cursor-ns-resize z-50 group"
      >
        <div
          className="mx-auto w-10 h-[3px] rounded-full"
          style={{ background: SURFACE.br3, transition: 'background 0.15s' }}
        />
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ height: 32, borderBottom: `1px solid ${SURFACE.br1}`, background: SURFACE.bg0, padding: '0 12px' }}
      >
        {/* Tabs */}
        <div className="relative flex items-center overflow-x-auto custom-scrollbar-hidden flex-1 mr-3">
          {/* Animated indicator */}
          <div
            className="absolute bottom-0 h-[2px] rounded-full"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: SURFACE.br3,
              transition: 'all 0.2s ease-out',
            }}
          />

          {tabs.map(({ id, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                ref={(el) => { if (el) tabRefs.current.set(id, el); }}
                onClick={() => setActiveTab(id)}
                style={{
                  position: 'relative',
                  padding: '8px 12px',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  color: active ? TEXT.primary : TEXT.muted,
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center shrink-0" style={{ gap: 2 }}>
          <button
            onClick={() => window.open(selectedPage.url, '_blank', 'noopener,noreferrer')}
            style={{ color: SURFACE.br3, padding: 4, borderRadius: R.sm, transition: 'all 0.15s' }}
            title="Open"
          >
            <ExternalLink size={11} />
          </button>
          <button
            onClick={() => setInspectorCollapsed(true)}
            style={{ color: SURFACE.br3, padding: 4, borderRadius: R.sm, transition: 'all 0.15s' }}
            title="Collapse"
          >
            <Minimize2 size={11} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto custom-scrollbar"
        style={{ background: SURFACE.bg0, padding: 16 }}
      >
        <Suspense fallback={
          <div className="flex items-center" style={{ gap: 8, color: TEXT.muted, fontSize: 11, padding: 16 }}>
            <div
              className="w-3 h-3 rounded-full animate-spin"
              style={{ border: `2px solid ${SURFACE.br3}`, borderTopColor: SURFACE.br3 }}
            />
            Loading...
          </div>
        }>
          {ActiveTabComponent ? (
            <ActiveTabComponent page={hydratedPage} hasTrend={hasTrend} />
          ) : (
            <div style={{ color: TEXT.muted, fontSize: 11, padding: 16 }}>Tab not available</div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
