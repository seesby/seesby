import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useServiceAreas() {
  const { locations = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    return locations.map((l: any) => ({
      id: l.id ?? l.url,
      name: l.name,
      lat: l.lat,
      lng: l.lng,
      grid: l.geogrid ?? [],
      keyword: l.geogridKeyword ?? '',
      city: l.city ?? '',
      state: l.state ?? '',
    }));
  }, [locations]);
}
