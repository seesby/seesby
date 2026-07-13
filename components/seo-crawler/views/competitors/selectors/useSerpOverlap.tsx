import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type SerpOverlapData = {
  hosts: string[];
  matrix: Record<string, Record<string, number>>;
  pairOverlaps: { a: string; b: string; count: number; sharedKeywords: string[] }[];
  positionData: { keyword: string; us: number | null; competitors: { host: string; rank: number | null }[]; aiOverview: string | null; serpFeatures: string[] }[];
  aiOwnership: { host: string; count: number; pct: number }[];
  aiCitations: { keyword: string; cited: boolean; hosts: string[]; note: string }[];
};

function uniqueHosts(list: any[], self: string): string[] {
  const hosts = new Set<string>();
  for (const c of list) { if (c.host && c.host !== self) hosts.add(c.host); }
  return [...hosts];
}

function pickFeatures(kw: any): string[] {
  if (Array.isArray(kw.serpFeatures)) return kw.serpFeatures
  if (Array.isArray(kw.features)) return kw.features
  const feats: string[] = []
  if (kw.hasFeaturedSnippet) feats.push('featured snippet')
  if (kw.hasPeopleAlsoAsk || kw.hasPaa) feats.push('PAA')
  if (kw.hasVideoCarousel || kw.hasVideo) feats.push('video')
  if (kw.hasLocalPack) feats.push('local pack')
  if (kw.hasShopping) feats.push('shopping')
  if (kw.hasImagePack) feats.push('image pack')
  if (kw.hasAiOverview) feats.push('AI ov')
  return feats
}

export function useSerpOverlap(): SerpOverlapData {
  const { competitors = [], fingerprint, gapKeywords = [], pages = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    const kwList = gapKeywords;
    const compList = competitors;
    const us = fingerprint?.host ?? '';
    const comps = uniqueHosts(compList, us);
    const hosts = [us, ...comps];

    // Matrix
    const matrix: Record<string, Record<string, number>> = {};
    for (const a of hosts) {
      matrix[a] = {};
      for (const b of hosts) {
        if (a === b) { matrix[a][b] = 0; continue; }
        let shared = 0;
        for (const kw of kwList) {
          const ra = kw.ourRank ?? null;
          const rb = Array.isArray(kw.competitorRanks)
            ? kw.competitorRanks.find((r: any) => r.host === b)?.rank ?? null
            : kw.competitorRanks?.[b] ?? null;
          if (ra !== null && rb !== null) shared++;
        }
        matrix[a][b] = shared;
      }
    }

    // Pair overlaps
    const pairOverlaps = comps.map(b => {
      const shared = kwList.filter((kw: any) => {
        const ra = kw.ourRank ?? null;
        const rb = Array.isArray(kw.competitorRanks)
          ? kw.competitorRanks.find((r: any) => r.host === b)?.rank ?? null
          : kw.competitorRanks?.[b] ?? null;
        return ra !== null && rb !== null;
      }).map((kw: any) => kw.keyword);
      return { a: us, b, count: shared.length, sharedKeywords: shared };
    });

    // Position data
    const positionData = kwList.slice(0, 20).map((kw: any) => {
      const features = pickFeatures(kw);
      return {
        keyword: kw.keyword,
        us: kw.ourRank ?? null,
        competitors: comps.map(h => ({
          host: h,
          rank: Array.isArray(kw.competitorRanks)
            ? kw.competitorRanks.find((r: any) => r.host === h)?.rank ?? null
            : kw.competitorRanks?.[h] ?? null,
        })),
        aiOverview: kw.aiOverviewHost || (features.includes('AI ov') ? kw.aiOverviewHost || null : null),
        serpFeatures: features,
      };
    });

    // AI ownership
    const aiCounts: Record<string, number> = {};
    for (const p of positionData) {
      if (p.aiOverview) aiCounts[p.aiOverview] = (aiCounts[p.aiOverview] || 0) + 1;
    }
    const total = Object.values(aiCounts).reduce((a, b) => a + b, 0) || 1;
    const aiOwnership = Object.entries(aiCounts)
      .map(([host, count]) => ({ host, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    // AI citations
    const aiCitations = positionData.filter(p => p.aiOverview).map(p => {
      const cited = p.citors ?? [];
      const hosts = [p.aiOverview!];
      const isUs = hosts.includes(us);
      return {
        keyword: p.keyword,
        cited: isUs,
        hosts,
        note: isUs ? 'cites us' : 'we\'re out',
      };
    });

    return { hosts, matrix, pairOverlaps, positionData, aiOwnership, aiCitations };
  }, [competitors, gapKeywords, fingerprint]);
}
