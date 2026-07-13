import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useSocialTraffic() {
  const { social = {} } = useSeoCrawler() as any;
  return useMemo(() => social.traffic ?? { daily: [], funnel: [], platformBreakdown: [], topLandings: [], messageMatch: [] }, [social.traffic]);
}
