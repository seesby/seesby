import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type Funnel = {
  id: string;
  name: string;
  steps: { id: string; label: string; selector: string }[];
  counts: number[];
  segments?: { name: string; counts: number[] }[];
};

export function useFunnels() {
  const { funnels = [] } = useSeoCrawler() as any;
  return useMemo<Funnel[]>(() => funnels, [funnels]);
}
