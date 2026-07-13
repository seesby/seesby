import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type GapRow = {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  ourRank: number | null;
  bestRank: number;
  bestCompetitor: string;
  delta: number;
  intent: string;
  cluster: string;
  opportunity: number;
  gapType: 'miss' | 'behind' | 'ahead';
};

export type TopicGap = {
  id: string;
  topic: string;
  volume: number;
  gapDepth: number;
  opportunity: number;
  competitors: { host: string; ranking: boolean }[];
};

function uniqueHosts(list: any[], self: string): string[] {
  const hosts = new Set<string>();
  for (const c of list) { if (c.host && c.host !== self) hosts.add(c.host); }
  return [...hosts];
}

export function useCompetitorGap() {
  const { gapKeywords = [], competitors = [], fingerprint } = useSeoCrawler() as any;

  return useMemo(() => {
    const kwList = gapKeywords;
    const compList = competitors;
    const us = fingerprint?.host ?? '';
    const comps = uniqueHosts(compList, us);

    const rows: GapRow[] = kwList.map((kw: any, i: number) => {
      const cr: Record<string, number | null> = {};
      for (const h of comps) {
        if (kw.competitorRanks && h in kw.competitorRanks) cr[h] = kw.competitorRanks[h];
        else if (Array.isArray(kw.competitorRanks)) {
          const f = kw.competitorRanks.find((r: any) => r.host === h);
          cr[h] = f?.rank ?? null;
        } else cr[h] = null;
      }
      const ourRank = kw.ourRank ?? null;
      const bestRank = Math.min(...Object.values(cr).filter((v): v is number => v !== null), Infinity);
      const bestHost = comps.find(h => cr[h] === bestRank) ?? '';
      const delta = ourRank !== null ? ourRank - bestRank : -999;
      let gapType: GapRow['gapType'] = 'miss';
      if (ourRank !== null) gapType = delta <= 0 ? 'ahead' : 'behind';

      return {
        id: `${i}`,
        keyword: kw.keyword,
        volume: kw.volume ?? 0,
        difficulty: kw.difficulty ?? 50,
        ourRank,
        bestRank: bestRank === Infinity ? 0 : bestRank,
        bestCompetitor: bestHost.replace(/\..+/, ''),
        delta,
        intent: kw.intent ?? 'info',
        cluster: kw.cluster ?? '',
        opportunity: kw.opportunity ?? 1,
        gapType,
      };
    });

    const topicGaps: TopicGap[] = [];

    const stats = {
      total: rows.length,
      missing: rows.filter(r => r.gapType === 'miss').length,
      behind: rows.filter(r => r.gapType === 'behind').length,
      ahead: rows.filter(r => r.gapType === 'ahead').length,
      topics: topicGaps.length || new Set(rows.map(r => r.cluster)).size,
    };

    return { rows, topicGaps, stats };
  }, [gapKeywords, competitors, fingerprint]);
}
