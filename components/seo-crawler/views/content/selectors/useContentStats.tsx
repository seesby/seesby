import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

const safePct = (num: number, den: number) =>
  den > 0 ? Math.round((num / den) * 100) : 0;

export function useContentStats() {
  const { pages = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    const html = pages.filter((p: any) => p.isHtmlPage !== false);
    const total = html.length;
    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 };

    // Unique pages (no exact or near-duplicate)
    const exactDupes = html.filter((p: any) => p.exactDuplicate).length;
    const nearDupes = html.filter((p: any) => p.nearDuplicateGroup).length;
    const unique = total - exactDupes - nearDupes;

    // Word count
    const wordCounts = html.map((p: any) => num(p.wordCount) || 0);
    const totalWords = wordCounts.reduce((a: number, b: number) => a + b, 0);
    const avgWords = total > 0 ? Math.round(totalWords / total) : 0;
    const thin = html.filter((p: any) => num(p.wordCount) < 300).length;

    // Quality scores
    const scores = html.map((p: any) => num(p.qualityScore) || num(p.contentQualityScore) || 50);
    const avgQuality = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bands = {
      excellent: scores.filter((s: number) => s >= 90).length,
      good: scores.filter((s: number) => s >= 75 && s < 90).length,
      fair: scores.filter((s: number) => s >= 60 && s < 75).length,
      poor: scores.filter((s: number) => s >= 40 && s < 60).length,
      critical: scores.filter((s: number) => s < 40).length,
    };

    // Freshness
    const freshness = {
      live: html.filter((p: any) => num(p.freshnessDays) < 7).length,
      recent: html.filter((p: any) => num(p.freshnessDays) >= 7 && num(p.freshnessDays) < 30).length,
      fresh: html.filter((p: any) => num(p.freshnessDays) >= 30 && num(p.freshnessDays) < 90).length,
      ok: html.filter((p: any) => num(p.freshnessDays) >= 90 && num(p.freshnessDays) < 180).length,
      stale: html.filter((p: any) => num(p.freshnessDays) >= 180).length,
    };
    const freshPct = safePct(freshness.live + freshness.recent + freshness.fresh, total);

    // Clusters — same fallback logic as useClusters
    const getCluster = (p: any) => {
      const explicit = p.topicCluster || p.cluster;
      if (explicit && explicit !== 'misc') return explicit;
      try {
        const url = new URL(p.url);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length >= 2) return segments[0];
        if (segments.length === 1) return segments[0];
      } catch { /* ignore */ }
      if (p.category && p.category !== 'other') return p.category;
      if (p.pageType || p.type) return p.pageType ?? p.type;
      return 'uncategorized';
    };
    const clusterMap: Record<string, any[]> = {};
    html.forEach((p: any) => {
      const c = getCluster(p);
      if (!clusterMap[c]) clusterMap[c] = [];
      clusterMap[c].push(p);
    });
    const clusterCount = Object.keys(clusterMap).length;
    const hubs = Object.values(clusterMap).filter(pages => pages.length >= 3).length;
    const pagesInClusters = Object.values(clusterMap).reduce((a, arr) => a + arr.length, 0);
    const clusterCoverage = safePct(pagesInClusters, total);

    // Intent
    const intentMap: Record<string, number> = {};
    html.forEach((p: any) => {
      const intent = p.searchIntent || p.intent || 'unknown';
      intentMap[intent] = (intentMap[intent] || 0) + 1;
    });

    // Cannibalization
    const cannibal = html.filter((p: any) => p.cannibalizedBy).length;

    // E-E-A-T
    const eeat = {
      bylines: html.filter((p: any) => p.hasByline).length,
      bios: html.filter((p: any) => p.hasAuthorBio).length,
      citations: html.filter((p: any) => num(p.externalCitations) > 0).length,
      updated: html.filter((p: any) => p.updatedDateVisible).length,
    };

    // Schema
    const withSchema = html.filter((p: any) => p.schemaTypes && p.schemaTypes.length > 0).length;

    // Readability
    const readabilityAvg = total > 0
      ? Math.round(html.reduce((s: number, p: any) => s + num(p.readability), 0) / total)
      : 0;

    // Category mix
    const categoryMap: Record<string, number> = {};
    html.forEach((p: any) => {
      const cat = p.category || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryMix = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      total,
      unique,
      exactDupes,
      nearDupes,
      totalWords,
      avgWords,
      thin,
      avgQuality,
      bands,
      freshness,
      freshPct,
      clusterCount,
      hubs,
      clusterCoverage,
      pagesInClusters,
      intentMap,
      cannibal,
      eeat,
      withSchema,
      schemaPct: safePct(withSchema, total),
      readabilityAvg,
      categoryMix,
    };
  }, [pages]);
}
