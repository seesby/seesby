// useViewMode.ts
import { useEffect } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { Mode } from '@seesby/types';

/** Wraps context.currentView and syncs to ?view=… in the URL. */
export function useViewMode(mode: Mode) {
  const { getCurrentView, setCurrentView } = useSeoCrawler() as any;
  const view = getCurrentView(mode);

  // URL → state on mount and when mode changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const fromUrl = sp.get('view');
    if (fromUrl && fromUrl !== view) setCurrentView(mode, fromUrl);
     
  }, [mode]);

  // state → URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('view') === view) return;
    sp.set('view', view);
    const next = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', next);
  }, [view]);

  const set = (id: string) => setCurrentView(mode, id);
  return [view, set] as const;
}
