import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

function num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function useWqaPerformance() {
  const { pages = [], history = [], sessions = [], crawlSessions = [] } = useSeoCrawler() as any;

  const allSessions = sessions.length ? sessions : crawlSessions;
  const hasComparison = allSessions.length > 1;

  return useMemo(() => {
    // ── Quality distribution ──
    const bands = [
      { label: 'Excellent (≥90)', count: pages.filter((p: any) => num(p.scores?.quality ?? p.qualityScore) >= 90).length },
      { label: 'Good (75-89)', count: pages.filter((p: any) => { const s = num(p.scores?.quality ?? p.qualityScore); return s >= 75 && s < 90; }).length },
      { label: 'Fair (60-74)', count: pages.filter((p: any) => { const s = num(p.scores?.quality ?? p.qualityScore); return s >= 60 && s < 75; }).length },
      { label: 'Poor (40-59)', count: pages.filter((p: any) => { const s = num(p.scores?.quality ?? p.qualityScore); return s >= 40 && s < 60; }).length },
      { label: 'Critical (<40)', count: pages.filter((p: any) => num(p.scores?.quality ?? p.qualityScore) < 40).length },
    ];

    // ── Score histogram ──
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
        const s = num(p.scores?.quality ?? p.qualityScore);
        return s >= b.min && s < b.max;
      }).length,
    }));

    // ── Template breakdown ──
    const templateMap: Record<string, any[]> = {};
    for (const p of pages) {
      const tmpl = p.category ?? 'uncategorized';
      if (!templateMap[tmpl]) templateMap[tmpl] = [];
      templateMap[tmpl].push(p);
    }
    const templateBreakdown = Object.entries(templateMap)
      .map(([template, ps]) => ({
        template,
        count: ps.length,
        avgQuality: Math.round(ps.reduce((a: number, p: any) => a + num(p.scores?.quality ?? p.qualityScore), 0) / ps.length),
        avgWords: Math.round(ps.reduce((a: number, p: any) => a + num(p.content?.wordCount ?? p.wordCount), 0) / ps.length),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── Click depth vs quality ──
    const depthQuality = Array.from({ length: 7 }, (_, d) => {
      const atDepth = pages.filter((p: any) => num(p.depth ?? p.crawlDepth) === d);
      return {
        depth: `d${d}`,
        avgQuality: atDepth.length
          ? Math.round(atDepth.reduce((a: number, p: any) => a + num(p.scores?.quality ?? p.qualityScore), 0) / atDepth.length)
          : 0,
        pages: atDepth.length,
      };
    });

    // ── Search performance ──
    const totalClicks = pages.reduce((a: number, p: any) => a + num(p.gscClicks), 0);
    const totalImpr = pages.reduce((a: number, p: any) => a + num(p.gscImpr ?? p.gscImpressions), 0);
    // Only count pages that actually have position data
    const pagesWithPos = pages.filter((p: any) => {
      const pos = num(p.gscPosition ?? p.gscAvgPos);
      return pos > 0;
    });
    const avgPos = pagesWithPos.length
      ? pagesWithPos.reduce((a: number, p: any) => a + num(p.gscPosition ?? p.gscAvgPos), 0) / pagesWithPos.length
      : 0;
    const ctr = totalImpr > 0 ? (totalClicks / totalImpr * 100) : 0;

    // Search deltas from session comparison
    const prevSession = hasComparison ? allSessions[allSessions.length - 2] : null;
    const prevSearch = prevSession?.summary?.search ?? null;
    const clicksDelta = prevSearch ? totalClicks - num(prevSearch.clicks) : null;
    const clicksDeltaPct = prevSearch && num(prevSearch.clicks) > 0
      ? Math.round((totalClicks - num(prevSearch.clicks)) / num(prevSearch.clicks) * 100)
      : null;
    const imprDeltaPct = prevSearch && num(prevSearch.impr) > 0
      ? Math.round((totalImpr - num(prevSearch.impr)) / num(prevSearch.impr) * 100)
      : null;

    const searchPerf = {
      totalClicks, totalImpr,
      avgPos: Math.round(avgPos * 10) / 10,
      ctr: Math.round(ctr * 10) / 10,
      clicksDeltaPct, imprDeltaPct,
    };

    // ── Position distribution ──
    const positionBuckets = [
      { label: '1-3', count: 0 },
      { label: '4-10', count: 0 },
      { label: '11-20', count: 0 },
      { label: '21-50', count: 0 },
      { label: '51+', count: 0 },
    ];
    for (const p of pages) {
      const pos = num(p.gscPosition ?? p.gscAvgPos);
      if (pos <= 0) continue;
      if (pos <= 3) positionBuckets[0].count++;
      else if (pos <= 10) positionBuckets[1].count++;
      else if (pos <= 20) positionBuckets[2].count++;
      else if (pos <= 50) positionBuckets[3].count++;
      else positionBuckets[4].count++;
    }

    // ── Category heatmap ──
    const catMap: Record<string, { clicks: number; impr: number; pos: number; count: number }> = {};
    for (const p of pages) {
      const cat = p.category ?? p.pageCategory ?? 'other';
      if (!catMap[cat]) catMap[cat] = { clicks: 0, impr: 0, pos: 0, count: 0 };
      catMap[cat].clicks += num(p.gscClicks);
      catMap[cat].impr += num(p.gscImpr ?? p.gscImpressions);
      catMap[cat].count++;
      catMap[cat].pos += num(p.gscPosition ?? p.gscAvgPos);
    }
    const categoryMetrics = Object.entries(catMap)
      .map(([category, m]) => ({
        category,
        clicks: m.clicks,
        impr: m.impr,
        ctr: m.impr > 0 ? Math.round(m.clicks / m.impr * 1000) / 10 : 0,
        pos: m.count ? Math.round(m.pos / m.count * 10) / 10 : 0,
        pages: m.count,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 8);

    // ── Winners / Losers ──
    const pairs = pages
      .filter((p: any) => p.clicksDelta != null && p.clicksDelta !== 0)
      .map((p: any) => ({ url: p.url, delta: num(p.clicksDelta) }));
    const sorted = [...pairs].sort((a, b) => b.delta - a.delta);
    const winners = sorted.filter(w => w.delta > 0).slice(0, 5);
    const losers = sorted.filter(l => l.delta < 0).slice(-5).reverse();

    // ── CTR vs benchmark (position-based) ──
    const ctrBench: Record<number, number> = { 1: 28, 2: 15, 3: 11, 4: 8, 5: 6 };
    const ctrBuckets = new Map<number, { c: number; i: number }>();
    for (const p of pages) {
      for (const k of (p.keywords ?? [])) {
        const pos = Math.round(num(k.position));
        if (pos < 1 || pos > 5) continue;
        const cur = ctrBuckets.get(pos) ?? { c: 0, i: 0 };
        cur.c += num(k.clicks);
        cur.i += num(k.impressions);
        ctrBuckets.set(pos, cur);
      }
    }
    const ctrVsBenchmark = [1, 2, 3, 4, 5]
      .map(pos => {
        const b = ctrBuckets.get(pos);
        if (!b || b.i === 0) return null;
        return { pos, us: Math.round(b.c / b.i * 1000) / 10, bench: ctrBench[pos] };
      })
      .filter((r): r is { pos: number; us: number; bench: number } => r !== null);

    // ── Timeline (only meaningful with comparison) ──
    const timeline = hasComparison
      ? (history.length ? history : []).map((h: any) => ({
          date: h.date,
          avg: Math.round(h.avg ?? 0),
          p50: Math.round(h.p50 ?? 0),
          p10: Math.round(h.p10 ?? 0),
        }))
      : [];

    // ── Top movers (only meaningful with comparison) ──
    const movers = hasComparison
      ? pages
          .map((p: any) => ({
            url: shorten(p.url),
            delta: num(p.scores?.quality ?? p.qualityScore) - num(p.previousScores?.quality),
          }))
          .filter((m: any) => m.delta !== 0)
          .sort((a: any, b: any) => Math.abs(b.delta) - Math.abs(a.delta))
          .slice(0, 12)
      : [];

    return {
      bands, scoreHistogram, templateBreakdown, depthQuality,
      timeline, movers, hasComparison,
      searchPerf, positionBuckets, categoryMetrics,
      winners, losers, ctrVsBenchmark,
    };
  }, [pages, history, hasComparison, allSessions]);
}

function shorten(u: string) {
  try { const x = new URL(u); return x.pathname.length > 24 ? '...' + x.pathname.slice(-22) : x.pathname; }
  catch { return u; }
}
