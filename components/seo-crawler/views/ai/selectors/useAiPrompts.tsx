import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type PromptRow = {
  id: string;
  prompt: string;
  intent: 'inform' | 'compare' | 'transact' | 'navigate';
  citations: { engine: string; url: string; rank: number }[];
  ourPosition: number | null;     // best position across engines (1=first), null = absent
  competitors: string[];          // unique competitor hosts cited
  lastChecked: string;
};

export function useAiPrompts() {
  const { aiPrompts = [], fingerprint } = useSeoCrawler() as any;
  return useMemo<PromptRow[]>(() => aiPrompts.map((p: any, i: number) => ({
    id: p.id ?? `prompt-${i}`,
    prompt: p.prompt,
    intent: p.intent ?? 'inform',
    citations: p.citations ?? [],
    ourPosition: bestPositionFor(p.citations ?? [], fingerprint?.host ?? ''),
    competitors: uniqueHosts((p.citations ?? []).map((c: any) => c.url), fingerprint?.host ?? ''),
    lastChecked: p.lastChecked ?? '',
  })), [aiPrompts, fingerprint]);
}

function bestPositionFor(cites: any[], host: string): number | null {
  const ours = cites.filter(c => safeHost(c.url) === host).map(c => c.rank);
  return ours.length ? Math.min(...ours) : null;
}
function uniqueHosts(urls: string[], excludeHost: string) {
  return Array.from(new Set(urls.map(safeHost))).filter(h => h !== excludeHost);
}
function safeHost(u: string) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
