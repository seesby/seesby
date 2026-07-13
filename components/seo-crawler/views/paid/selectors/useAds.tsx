import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type AdCard = {
  id: string;
  network: string;
  campaign: string;
  status: string;
  type: 'rsa' | 'image' | 'video' | 'shopping' | string;
  headlines: string[];
  descriptions: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  impressions: number;
  ctr: number;
  conv: number;
  spend: number;
  fatigue: number;
  assetCoverage: number;
};

export function useAds() {
  const { paid = {} } = useSeoCrawler() as any;
  return useMemo<AdCard[]>(() => paid.ads ?? [], [paid.ads]);
}
