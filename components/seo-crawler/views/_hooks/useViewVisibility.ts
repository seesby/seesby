// useViewVisibility.ts — fingerprint-based gate for which views show in the toolbar.
import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { getMode } from '@seesby/modes';
import type { Mode } from '@seesby/types';

export function useVisibleViews(mode: Mode) {
  const { fingerprint, integrationConnections } = useSeoCrawler() as any;
  const def = getMode(mode);
  return useMemo(() => {
    return def.views.filter(v => {
      // v.requires is { capabilities?, industries?, languages?, cms? }
      const req: any = (v as any).requires;
      if (!req) return true;
      if (req.industries && !req.industries.includes(fingerprint?.industry)) return false;
      if (req.languages  && !req.languages.includes(fingerprint?.language?.primary)) return false;
      if (req.cms        && !req.cms.includes(fingerprint?.cms)) return false;
      if (req.capabilities) {
        for (const c of req.capabilities) {
          if (!integrationConnections?.[c]) return false;
        }
      }
      return true;
    });
  }, [def, fingerprint, integrationConnections]);
}
