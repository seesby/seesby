import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useAiEntities() {
  const { pages = [] } = useSeoCrawler() as any;
  return useMemo(() => {
    const map = new Map<string, { id: string; label: string; size: number; type: string; pages: Set<string> }>();
    for (const p of pages) {
      for (const e of p.entities ?? []) {
        const key = `${e.type}:${e.id}`;
        const cur = map.get(key) ?? { id: key, label: e.name, size: 0, type: e.type, pages: new Set() };
        cur.size += 1;
        cur.pages.add(p.url);
        map.set(key, cur);
      }
    }
    const nodes = Array.from(map.values()).map(e => ({
      id: e.id,
      label: e.label,
      size: Math.max(2, Math.sqrt(e.size) * 4),
      group: e.type,
      color: e.type === 'brand' ? '#d946ef' : e.type === 'product' ? '#3b82f6' : e.type === 'person' ? '#22c55e' : '#666',
    }));
    // Edges between entities co-occurring on the same page.
    const edges = new Map<string, number>();
    for (const p of pages) {
      const ids = (p.entities ?? []).map((e: any) => `${e.type}:${e.id}`);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const k = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`;
        edges.set(k, (edges.get(k) ?? 0) + 1);
      }
    }
    const links = [...edges.entries()].map(([k, weight]) => {
      const [a, b] = k.split('|');
      return { source: a, target: b, weight };
    });
    return { nodes, links };
  }, [pages]);
}
