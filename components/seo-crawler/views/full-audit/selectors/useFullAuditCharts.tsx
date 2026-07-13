import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { getPageIssues, UNIFIED_ISSUE_TAXONOMY } from '@/services/UnifiedIssueTaxonomy';

export function useFullAuditCharts() {
  const { pages = [], sessions = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    // Status code breakdown
    const statusCounts: Record<string, number> = {};
    for (const p of pages) {
      const code = p.statusCode ?? 200;
      const bucket = code >= 500 ? '5xx' : code >= 400 ? '4xx' : code >= 300 ? '3xx' : '2xx';
      statusCounts[bucket] = (statusCounts[bucket] ?? 0) + 1;
    }
    const statusDonut = ['2xx', '3xx', '4xx', '5xx'].map(k => ({ name: k, value: statusCounts[k] ?? 0 }));

    // Pages by crawl depth
    const byDepth = Array.from({ length: 8 }).map((_, d) => ({
      depth: `d${d}`,
      pages: pages.filter((p: any) => (p.depth ?? 0) === d).length,
    }));

    // Indexability stack
    const indexabilityCounts: Record<string, number> = { Indexable: 0, Noindex: 0, Blocked: 0, 'Canon≠': 0 };
    for (const p of pages) {
      if (p.noindex) indexabilityCounts['Noindex']++;
      else if (p.blocked) indexabilityCounts['Blocked']++;
      else if (p.canonical !== p.url) indexabilityCounts['Canon≠']++;
      else indexabilityCounts['Indexable']++;
    }
    const indexabilityStack = Object.entries(indexabilityCounts).map(([label, count]) => ({ label, count }));

    // Issue category treemap — uses getPageIssues which evaluates conditions per page
    // Build lookup from issue ID → group category
    const issueCategoryMap: Record<string, string> = {};
    for (const group of UNIFIED_ISSUE_TAXONOMY) {
      for (const issue of group.issues) {
        issueCategoryMap[issue.id] = group.category;
      }
    }
    const issueCategories: Record<string, number> = {};
    for (const p of pages) {
      for (const issue of getPageIssues(p)) {
        const cat = issueCategoryMap[issue.id] ?? 'Other';
        issueCategories[cat] = (issueCategories[cat] ?? 0) + 1;
      }
    }
    const issueCategoryTreemap = Object.entries(issueCategories)
      .map(([name, size]) => ({ name, size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 8);

    // Content quality radar (uses flat page properties with fallbacks)
    const contentQualityRadar = [
      { axis: 'Quality', value: avgScore(pages, p => p.qualityScore ?? p.contentQualityScore) },
      { axis: 'Content', value: avgScore(pages, p => p.contentQualityScore ?? p.readability) },
      { axis: 'Technical', value: avgScore(pages, p => p.techHealthScore ?? p.securityScore) },
      { axis: 'Performance', value: avgScore(pages, p => p.lighthousePerformance ?? (p.cwv?.lcp ? Math.round(100 - (p.cwv.lcp / 100)) : undefined)) },
    ];

    // Score histogram
    const scoreBuckets = [
      { label: '0-20', min: 0, max: 20 },
      { label: '20-40', min: 20, max: 40 },
      { label: '40-60', min: 40, max: 60 },
      { label: '60-80', min: 60, max: 80 },
      { label: '80-100', min: 80, max: 101 },
    ];
    const scoreHistogram = scoreBuckets.map(b => ({
      label: b.label,
      count: pages.filter((p: any) => {
        const s = p.scores?.content ?? p.qualityScore ?? p.contentQualityScore;
        if (s == null) return false;
        return s >= b.min && s < b.max;
      }).length,
    }));

    // Performance heatmap (template × metric)
    const templateMap: Record<string, any[]> = {};
    for (const p of pages) {
      const tmpl = p.category ?? 'other';
      if (!templateMap[tmpl]) templateMap[tmpl] = [];
      templateMap[tmpl].push(p);
    }
    const perfHeatmap = Object.entries(templateMap)
      .slice(0, 6)
      .map(([template, ps]) => ({
        template,
        metrics: [
          { name: 'LCP', value: median(ps.map((p: any) => p.cwv?.lcp ?? 0).filter((v: number) => v > 0)) },
          { name: 'INP', value: median(ps.map((p: any) => p.cwv?.inp ?? 0).filter((v: number) => v > 0)) },
          { name: 'CLS', value: median(ps.map((p: any) => p.cwv?.cls ?? 0)) },
          { name: 'TTFB', value: median(ps.map((p: any) => p.cwv?.ttfb ?? 0).filter((v: number) => v > 0)) },
        ],
      }));

    // Crawl over time (from sessions)
    const crawlOverTime = (sessions ?? []).map((s: any) => ({
      pages: s.pages ?? 0,
      issues: s.issues ?? 0,
      score: s.avgScore ?? 0,
    }));
    const maxCrawlPages = Math.max(...crawlOverTime.map((s: any) => s.pages), 1);
    const maxCrawlIssues = Math.max(...crawlOverTime.map((s: any) => s.issues), 1);

    return {
      statusDonut,
      byDepth,
      indexabilityStack,
      issueCategoryTreemap,
      contentQualityRadar,
      scoreHistogram,
      perfHeatmap,
      crawlOverTime,
      maxCrawlPages,
      maxCrawlIssues,
    };
  }, [pages, sessions]);
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function avgScore(pages: any[], resolver: (p: any) => number | undefined): number {
  const scores = pages.map(resolver).filter((s): s is number => s != null && s > 0);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
}
