import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useEngagement() {
  const { social = {} } = useSeoCrawler() as any;
  return useMemo(() => social.engagement ?? { daily: [], byNetwork: [], byContentType: [] }, [social.engagement]);
}
