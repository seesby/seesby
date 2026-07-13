import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useProfiles() {
  const { social = {} } = useSeoCrawler() as any;
  return useMemo(() => social.profiles ?? [], [social.profiles]);
}
