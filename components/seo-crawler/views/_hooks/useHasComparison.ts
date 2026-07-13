import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useHasComparison(): boolean {
  const ctx = useSeoCrawler() as any;
  return useMemo(() => {
    const sessions = ctx?.sessions ?? ctx?.crawlSessions ?? [];
    return sessions.length > 1;
  }, [ctx?.sessions, ctx?.crawlSessions]);
}
