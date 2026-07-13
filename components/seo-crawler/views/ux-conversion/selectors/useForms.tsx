import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type Form = {
  id: string;
  pageUrl: string;
  name: string;
  starts: number;
  completes: number;
  abandonRate: number;
  topAbandonField: string | null;
  errorRate: number;
  fields: { id: string; label: string; abandonRate: number; errorRate: number; avgFillMs: number }[];
};

export function useForms() {
  const { forms = [] } = useSeoCrawler() as any;
  return useMemo<Form[]>(() => forms, [forms]);
}
