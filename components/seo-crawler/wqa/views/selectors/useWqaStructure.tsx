import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type StructureColorBy = 'quality' | 'depth' | 'cluster';

export type ClusterInfo = {
  name: string;
  size: number;
  avgQuality: number;
  isWeakHub: boolean;
  orphanCount: number;
  color: string;
  pages: string[];
};

export type LinkMetrics = {
  avgLinksPerPage: number;
  hubToSpokePct: number;
  spokeToHubPct: number;
};

export type GraphMetrics = {
  density: number;
  modularity: number;
  connectedComponents: number;
  orphanNodes: number;
};

export function qualityColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function depthColor(depth: number, maxDepth: number): string {
  const t = maxDepth > 0 ? depth / maxDepth : 0;
  if (t < 0.33) return '#22c55e';
  if (t < 0.66) return '#f59e0b';
  return '#ef4444';
}

const CLUSTER_COLORS = [
  '#a78bfa', '#3b82f6', '#14b8a6', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#f43f5e', '#F59E0B', '#10b981',
];

const DEFAULT_LINK_METRICS: LinkMetrics = { avgLinksPerPage: 0, hubToSpokePct: 0, spokeToHubPct: 0 };

export function useWqaStructure(colorBy: StructureColorBy = 'quality') {
  const { pages = [] } = useSeoCrawler() as any;

  return useMemo(() => {
    const maxDepth = Math.max(1, ...pages.map((p: any) => p.depth ?? 0));

    // Tree from URL paths
    const root: any = { name: '/', children: [] };
    const ensure = (parent: any, name: string) => {
      let n = parent.children.find((c: any) => c.name === name);
      if (!n) { n = { name, children: [] }; parent.children.push(n); }
      return n;
    };
    for (const p of pages) {
      try {
        const u = new URL(p.url);
        const parts = u.pathname.split('/').filter(Boolean);
        let cur = root;
        for (const seg of parts) cur = ensure(cur, seg);
        cur.value = (cur.value ?? 0) + 1;
        cur.id = p.url;
        cur.quality = p.qualityScore ?? p.scores?.quality ?? 0;
        cur.clicks = p.gscClicks ?? p.clicks ?? 0;
        cur.delta = p.clicksDelta ?? 0;
        cur.statusCode = p.statusCode ?? 200;
        cur.isLeaf = true;
      } catch {}
    }

    // Clusters: group pages, compute per-cluster metrics
    const clusterPages: Record<string, string[]> = {};
    const clusterQualitySum: Record<string, number> = {};
    for (const p of pages) {
      const k = p.cluster ?? 'misc';
      if (!clusterPages[k]) { clusterPages[k] = []; clusterQualitySum[k] = 0; }
      clusterPages[k].push(p.url);
      clusterQualitySum[k] += p.qualityScore ?? p.scores?.quality ?? 0;
    }

    // Build cluster color map
    const clusterNames = Object.keys(clusterPages);
    const clusterColorMap: Record<string, string> = {};
    clusterNames.forEach((name, i) => {
      clusterColorMap[name] = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
    });

    // Enriched cluster info
    const clusters: ClusterInfo[] = clusterNames.map(name => {
      const pagesInCluster = clusterPages[name];
      const size = pagesInCluster.length;
      const avgQuality = size > 0 ? Math.round(clusterQualitySum[name] / size) : 0;
      const orphanCount = pages.filter((p: any) =>
        (p.cluster ?? 'misc') === name && (p.links?.internal ?? 0) === 0 && (p.depth ?? 0) > 0
      ).length;
      return {
        name,
        size,
        avgQuality,
        isWeakHub: avgQuality < 60,
        orphanCount,
        color: clusterColorMap[name],
        pages: pagesInCluster,
      };
    });

    // Build lookup for hub detection: find the page with most outbound internal links per cluster
    const clusterOutlinks: Record<string, number> = {};
    for (const p of pages) {
      const c = p.cluster ?? 'misc';
      const outCount = (p.outboundInternal ?? []).length;
      if (!clusterOutlinks[c] || outCount > clusterOutlinks[c]) {
        clusterOutlinks[c] = outCount;
      }
    }

    // Hub pages: the page with hubSpoke.role === 'hub', or the one with most outbound links
    const hubPages: Record<string, string> = {};
    for (const p of pages) {
      if (p.hubSpoke?.role === 'hub') {
        hubPages[p.cluster ?? 'misc'] = p.url;
      }
    }
    // Fallback: highest outlink page per cluster
    for (const c of clusterNames) {
      if (!hubPages[c]) {
        let best = '', bestCount = -1;
        for (const p of pages) {
          if ((p.cluster ?? 'misc') === c) {
            const count = (p.outboundInternal ?? []).length;
            if (count > bestCount) { bestCount = count; best = p.url; }
          }
        }
        if (best) hubPages[c] = best;
      }
    }

    // Link directionality metrics
    let hubToSpokeCount = 0, spokeToHubCount = 0, totalInternalLinks = 0;
    const hubPageSet = new Set(Object.values(hubPages));
    for (const p of pages) {
      const outlinks = p.outboundInternal ?? [];
      totalInternalLinks += outlinks.length;
      const isHub = hubPageSet.has(p.url);
      const pageCluster = p.cluster ?? 'misc';
      const clusterPageSet = new Set(clusterPages[pageCluster] ?? []);
      for (const target of outlinks) {
        if (!clusterPageSet.has(target)) continue;
        if (isHub) hubToSpokeCount++;
        else if (hubPages[pageCluster] === target) spokeToHubCount++;
      }
    }
    const intraClusterLinks = hubToSpokeCount + spokeToHubCount;
    const linkMetrics: LinkMetrics = pages.length > 0 ? {
      avgLinksPerPage: Math.round((totalInternalLinks / pages.length) * 10) / 10,
      hubToSpokePct: intraClusterLinks > 0 ? Math.round((hubToSpokeCount / intraClusterLinks) * 100) : 0,
      spokeToHubPct: intraClusterLinks > 0 ? Math.round((spokeToHubCount / intraClusterLinks) * 100) : 0,
    } : DEFAULT_LINK_METRICS;

    // Links
    const links: { source: string; target: string }[] = [];
    for (const p of pages) {
      for (const out of p.outboundInternal ?? []) {
        links.push({ source: p.url, target: out });
      }
    }

    // In-link counts (must be before nodes.map)
    const inLinkMap = new Map<string, number>();
    for (const link of links) {
      inLinkMap.set(link.target, (inLinkMap.get(link.target) ?? 0) + 1);
    }

    // Nodes for force graph
    const nodes = pages.map((p: any) => {
      const cluster = p.cluster ?? 'misc';
      const quality = p.qualityScore ?? p.scores?.quality ?? 0;
      let color: string;
      if (colorBy === 'quality') {
        color = qualityColor(quality);
      } else if (colorBy === 'depth') {
        color = depthColor(p.depth ?? 0, maxDepth);
      } else {
        color = clusterColorMap[cluster] ?? 'text-[var(--brand-text-faint)]';
      }
      return {
        id: p.url,
        label: p.title ?? p.url,
        size: Math.max(2, quality),
        group: cluster,
        color,
        quality,
        contentScore: quality,
        depth: p.depth ?? 0,
        statusCode: p.statusCode ?? 200,
        wordCount: p.content?.wordCount ?? 0,
        inLinks: inLinkMap.get(p.url) ?? 0,
      };
    });

    // Graph metrics
    const nodeCount = pages.length;
    const edgeCount = links.length;
    const density = nodeCount > 1 ? edgeCount / (nodeCount * (nodeCount - 1)) : 0;

    // Modularity: intra-cluster links / total links
    let modularityIntraLinks = 0;
    for (const p of pages) {
      const pageCluster = p.cluster ?? 'misc';
      for (const out of p.outboundInternal ?? []) {
        const targetPage = pages.find((tp: any) => tp.url === out);
        if (targetPage && (targetPage.cluster ?? 'misc') === pageCluster) {
          modularityIntraLinks++;
        }
      }
    }
    const modularity = edgeCount > 0 ? modularityIntraLinks / edgeCount : 0;

    // Connected components via BFS (undirected)
    const adj: Record<string, Set<string>> = {};
    for (const p of pages) adj[p.url] = new Set();
    for (const link of links) {
      adj[link.source]?.add(link.target);
      adj[link.target]?.add(link.source);
    }
    const visited = new Set<string>();
    let components = 0;
    for (const p of pages) {
      if (visited.has(p.url)) continue;
      components++;
      const queue = [p.url];
      while (queue.length) {
        const cur = queue.pop()!;
        if (visited.has(cur)) continue;
        visited.add(cur);
        for (const neighbor of adj[cur] ?? []) {
          if (!visited.has(neighbor)) queue.push(neighbor);
        }
      }
    }

    // Orphan nodes: 0 in-links AND 0 out-links
    const outLinkCounts = new Map<string, number>();
    for (const p of pages) {
      const count = (p.outboundInternal ?? []).length;
      if (count > 0) outLinkCounts.set(p.url, count);
    }
    const orphanNodes = pages.filter((p: any) =>
      (inLinkMap.get(p.url) ?? 0) === 0 && (outLinkCounts.get(p.url) ?? 0) === 0
    ).length;

    const graphMetrics: GraphMetrics = {
      density: Math.round(density * 100) / 100,
      modularity: Math.round(modularity * 100) / 100,
      connectedComponents: components,
      orphanNodes,
    };

    // Stats
    const avgQuality = pages.length
      ? Math.round(pages.reduce((a: number, p: any) => a + (p.qualityScore ?? p.scores?.quality ?? 0), 0) / pages.length)
      : 0;
    const avgDepth = pages.length
      ? Math.round(pages.reduce((a: number, p: any) => a + (p.depth ?? 0), 0) / pages.length * 10) / 10
      : 0;
    const orphans = pages.filter((p: any) => (p.links?.internal ?? 0) === 0 && (p.depth ?? 0) > 0).length;

    return { tree: root, clusters, nodes, links, stats: { avgQuality, avgDepth, orphans, clusterCount: clusters.length }, linkMetrics, inLinkCounts: inLinkMap, graphMetrics };
  }, [pages, colorBy]);
}
