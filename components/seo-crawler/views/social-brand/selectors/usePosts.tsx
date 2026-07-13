import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function usePosts() {
  const { social = {} } = useSeoCrawler() as any;
  return useMemo(() => social.posts ?? [], [social.posts]);
}
