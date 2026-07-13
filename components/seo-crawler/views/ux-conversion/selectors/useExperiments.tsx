import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type Experiment = {
  id: string;
  name: string;
  pageUrl: string;
  status: 'running' | 'completed' | 'paused' | 'draft';
  startedAt: string;
  endedAt: string | null;
  variants: { id: string; name: string; users: number; conversion: number }[];
  control: string;
  metric: string;
  uplift: number | null;       // best variant - control, percentage points
  significance: number | null; // 0..1 confidence
};

export function useExperiments() {
  const { experiments = [] } = useSeoCrawler() as any;
  return useMemo<Experiment[]>(() => experiments, [experiments]);
}
