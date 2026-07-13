import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type Review = {
  id: string;
  locationId: string;
  source: 'gbp' | 'yelp' | 'apple' | 'tripadvisor' | 'facebook' | string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  reply: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
};

export function useReviews() {
  const { locations = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    if (locations.length === 0) return [];

    const all: Review[] = locations.flatMap((l: any) =>
      (l.reviews?.items ?? []).map((r: any) => ({
        id: r.id,
        locationId: l.id ?? l.url,
        source: r.source,
        author: r.author,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        reply: r.reply ?? null,
        sentiment: r.sentiment ?? (r.rating >= 4 ? 'positive' : r.rating <= 2 ? 'negative' : 'neutral'),
      }))
    );
    return all.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [locations]);
}
