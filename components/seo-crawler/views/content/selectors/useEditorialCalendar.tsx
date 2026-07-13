import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type CalendarEntry = {
  id: string;
  url: string;
  title: string;
  cluster: string;
  publishedAt: string;
  author: string;
  views: number;
  status: 'published' | 'draft' | 'scheduled';
};

export function useEditorialCalendar() {
  const { pages = [] } = useSeoCrawler() as any;
  return useMemo<CalendarEntry[]>(() =>
    pages.filter((p: any) => p.published || p.scheduled).map((p: any) => ({
      id: p.url,
      url: p.url,
      title: p.title ?? p.url,
      cluster: p.cluster ?? 'misc',
      publishedAt: p.published ?? p.scheduled ?? '',
      author: p.content?.authors?.[0] ?? '',
      views: p.analytics?.views30d ?? 0,
      status: p.published ? 'published' : p.scheduled ? 'scheduled' : 'draft',
    })), [pages]);
}
