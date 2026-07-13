import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type HeatmapEntry = {
  pageUrl: string;
  type: 'click' | 'move' | 'scroll' | 'attention';
  device: 'desktop' | 'mobile' | 'tablet';
  capturedAt: string;
  thumbUrl: string | null;     // pre-rendered thumbnail of the page with overlay
  sampleSize: number;
};

export function useHeatmaps() {
  const { heatmaps = [] } = useSeoCrawler() as any;
  return useMemo<HeatmapEntry[]>(() => heatmaps, [heatmaps]);
}
