import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useSocialMeta() {
  const { social = {} } = useSeoCrawler() as any;
  const rows = useMemo(() => social.meta ?? [], [social.meta]);
  const columns = useMemo(() => [
    { accessorKey: 'url', header: 'URL' },
    { accessorKey: 'ogTitle', header: 'og:title' },
    { accessorKey: 'ogDesc', header: 'og:description' },
    { accessorKey: 'ogImage', header: 'og:image' },
    { accessorKey: 'ogType', header: 'og:type' },
    { accessorKey: 'twitterCard', header: 'tw:card' },
  ], []);
  return { rows, columns };
}
