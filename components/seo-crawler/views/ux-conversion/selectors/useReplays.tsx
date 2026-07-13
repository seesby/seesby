import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type Replay = {
  id: string;
  pageUrl: string;
  durationMs: number;
  rageClicks: number;
  errorClicks: number;
  device: 'desktop' | 'mobile' | 'tablet';
  startedAt: string;
  posterUrl: string | null;
  source: 'rrweb' | 'fullstory' | 'hotjar' | 'custom' | string;
};

export function useReplays() {
  const { replays = [] } = useSeoCrawler() as any;
  return useMemo<Replay[]>(() => replays, [replays]);
}
