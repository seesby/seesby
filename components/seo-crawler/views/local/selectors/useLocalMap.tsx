import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS_HEX } from '../../_shared/shared-columns';

export function useLocalMap() {
  const { locations = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    return locations.map((l: any) => ({
      id: l.id ?? l.url,
      lng: l.lng,
      lat: l.lat,
      color: (l.gbpVerified ?? l.gbp?.verified) ? STATUS_HEX.good : STATUS_HEX.warn,
      label: l.name,
      inPack: (l.rankAvg ?? l.rank?.avg) != null,
      reviewCount: l.reviewCount ?? l.reviews?.count ?? 0,
      rating: l.rating ?? l.reviews?.rating ?? 0,
      state: l.state ?? '',
      city: l.city ?? '',
    }));
  }, [locations]);
}
