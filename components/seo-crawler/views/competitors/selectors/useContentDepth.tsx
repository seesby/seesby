import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type ContentDepthData = {
  scatterPoints: { id: string; host: string; words: number; backlinks: number; clicks: number; isUs: boolean; page: string }[];
  radarData: { dimension: string; us: number; competitors: { host: string; value: number }[] }[];
  formatGaps: { format: string; us: boolean; competitors: { host: string; present: boolean }[] }[];
  topics: string[];
  summary: { usAvg: number; compAvg: number; diff: number };
};

function uniqueHosts(list: any[], self: string): string[] {
  const hosts = new Set<string>();
  for (const c of list) { if (c.host && c.host !== self) hosts.add(c.host); }
  return [...hosts];
}

export function useContentDepth(): ContentDepthData {
  const { competitors = [], fingerprint, pages = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    const us = fingerprint?.host ?? '';
    const compList = competitors;
    const compHosts = uniqueHosts(compList, us);

    const scatterPoints = pages
      .filter((p: any) => p.url)
      .map((p: any, i: number) => ({
        id: `${i}`,
        host: p.url.includes(us) ? us : compHosts.find(h => p.url.includes(h)) ?? '',
        words: p.words ?? 0,
        backlinks: p.backlinks ?? 0,
        clicks: p.clicks ?? 0,
        isUs: p.url.includes(us),
        page: new URL(p.url).pathname,
      }));

    const radarData: ContentDepthData['radarData'] = [];

    const formatGaps: ContentDepthData['formatGaps'] = [];

    const topicCounts: Record<string, number> = {}
    pages.forEach((p: any) => {
      const t = p.topicCluster || p.topic
      if (t) topicCounts[t] = (topicCounts[t] || 0) + 1
    })
    const topics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)

    const usWords = scatterPoints.filter(p => p.isUs).map(p => p.words);
    const compWords = scatterPoints.filter(p => !p.isUs).map(p => p.words);
    const usAvg = usWords.length ? Math.round(usWords.reduce((a, b) => a + b, 0) / usWords.length) : 0;
    const compAvg = compWords.length ? Math.round(compWords.reduce((a, b) => a + b, 0) / compWords.length) : 0;

    return { scatterPoints, radarData, formatGaps, topics, summary: { usAvg, compAvg, diff: usAvg - compAvg } };
  }, [competitors, fingerprint, pages]);
}
