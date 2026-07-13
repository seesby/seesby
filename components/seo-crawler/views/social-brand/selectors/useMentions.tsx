import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useMentions() {
  const { social = {} } = useSeoCrawler() as any;
  return useMemo(() => social.mentions ?? [], [social.mentions]);
}
