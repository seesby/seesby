import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type AnchorBucket = {
  type: string;
  count: number;
  samples: string[];
  percentage: number;
};

export type AnchorPhrase = { name: string; value: number };

export type AnchorPhraseWithClass = AnchorPhrase & {
  cls: string;
  warning?: string;
};

export type TargetMixRow = {
  target: string;
  branded: number;
  exact: number;
  partial: number;
  generic: number;
  naked: number;
  image: number;
  total: number;
};

export type OverOptRow = {
  target: string;
  exactRatio: number;
  severity: 'warn' | 'bad';
};

export type AnchorMetrics = {
  uniqueAnchors: number;
  totalAnchors: number;
  diversity: number;
  brandedShare: number;
  exactShare: number;
};

export function useAnchors() {
  const { backlinks = [], pages = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    const buckets: Record<string, AnchorBucket> = {
      branded: { type: 'branded', count: 0, samples: [], percentage: 0 },
      exact: { type: 'exact', count: 0, samples: [], percentage: 0 },
      partial: { type: 'partial', count: 0, samples: [], percentage: 0 },
      generic: { type: 'generic', count: 0, samples: [], percentage: 0 },
      naked: { type: 'naked', count: 0, samples: [], percentage: 0 },
      image: { type: 'image', count: 0, samples: [], percentage: 0 },
    };

    const counts: Record<string, number> = {};
    let totalAnchors = 0;

    for (const b of backlinks) {
      const k = classify(b.anchor ?? '', b.type === 'image');
      buckets[k].count += 1;
      totalAnchors += 1;
      if (buckets[k].samples.length < 3) buckets[k].samples.push(b.anchor ?? '—');
      counts[b.anchor ?? ''] = (counts[b.anchor ?? ''] ?? 0) + 1;
    }

    for (const b of Object.values(buckets)) {
      b.percentage = totalAnchors > 0 ? Math.round((b.count / totalAnchors) * 100) : 0;
    }

    // Top phrases with classification and warnings
    const topWithClass: AnchorPhraseWithClass[] = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([k, v]) => {
        const cls = classify(k, false);
        let warning: string | undefined;
        if (cls === 'generic') warning = 'generic';
        else if (cls === 'naked') warning = 'url';
        else if (cls === 'exact') {
          const exactTotal = buckets.exact.count;
          const ratio = totalAnchors > 0 ? exactTotal / totalAnchors : 0;
          warning = ratio > 0.3 ? 'exact-match (high)' : 'exact-match (ok ratio)';
        }
        return { name: k, value: v, cls, warning };
      });

    // Also keep simple top for backward compat
    const top: AnchorPhrase[] = topWithClass.map(p => ({ name: p.name, value: p.value }));

    // Per-target anchor mix — group backlinks by target URL
    const targetGroups: Record<string, Record<string, number>> = {};
    for (const b of backlinks) {
      const target = b.to ?? '';
      if (!target) continue;
      if (!targetGroups[target]) {
        targetGroups[target] = { branded: 0, exact: 0, partial: 0, generic: 0, naked: 0, image: 0 };
      }
      const cls = classify(b.anchor ?? '', b.type === 'image');
      targetGroups[target][cls] = (targetGroups[target][cls] || 0) + 1;
    }

    const targetMix: TargetMixRow[] = Object.entries(targetGroups)
      .map(([target, counts]) => {
        const total = Object.values(counts).reduce((s, v) => s + v, 0);
        return {
          target,
          branded: total > 0 ? Math.round((counts.branded / total) * 100) : 0,
          exact: total > 0 ? Math.round((counts.exact / total) * 100) : 0,
          partial: total > 0 ? Math.round((counts.partial / total) * 100) : 0,
          generic: total > 0 ? Math.round((counts.generic / total) * 100) : 0,
          naked: total > 0 ? Math.round((counts.naked / total) * 100) : 0,
          image: total > 0 ? Math.round((counts.image / total) * 100) : 0,
          total,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Over-optimization — targets where exact-match ratio > 30%
    const overOptimized: OverOptRow[] = targetMix
      .filter(t => t.exact > 30)
      .map(t => ({
        target: t.target,
        exactRatio: t.exact,
        severity: t.exact > 50 ? 'bad' : 'warn',
      }));

    const uniqueAnchors = Object.keys(counts).length;
    const diversity = totalAnchors > 0 ? uniqueAnchors / totalAnchors : 0;
    const brandedShare = buckets.branded.percentage / 100;
    const exactShare = buckets.exact.percentage / 100;

    return {
      buckets: Object.values(buckets),
      top,
      topWithClass,
      targetMix,
      overOptimized,
      metrics: {
        uniqueAnchors,
        totalAnchors,
        diversity: Math.round(diversity * 100),
        brandedShare: Math.round(brandedShare * 100),
        exactShare: Math.round(exactShare * 100),
      },
    };
  }, [backlinks, pages]);
}

function classify(a: string, isImage: boolean): 'branded' | 'exact' | 'partial' | 'generic' | 'naked' | 'image' {
  if (isImage) return 'image';
  if (!a) return 'naked';
  if (/^https?:\/\//.test(a)) return 'naked';
  if (/^(here|click|read more|this site|website|visit|go to)$/i.test(a.trim())) return 'generic';
  const trimmed = a.trim();
  if (trimmed.length < 30 && !/^[A-Z]/.test(trimmed) && !trimmed.includes(' ') && !trimmed.includes('-')) return 'exact';
  if (/^[A-Z]/.test(trimmed)) return 'branded';
  return 'partial';
}
