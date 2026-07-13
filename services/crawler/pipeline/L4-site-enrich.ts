// services/crawler/pipeline/L4-site-enrich.ts
// ── L4 Site Enrich: Site-level aggregations computed after all pages enriched
//
// Link graph, topic clusters, entity resolution, site aggregations,
// duplicate groups, cannibalization detection

import type { FingerprintResult } from '@seesby/fingerprint';
import type { EnrichmentResult } from './L3-enrich';
import type { ExtractionResult } from './L2-extract';

// ── Types ───────────────────────────────────────────────────────────

export interface SiteEnrichmentResult {
  linkGraph: LinkGraph;
  topicClusters: TopicCluster[];
  entityResolution: EntityRecord[];
  siteAggregations: SiteAggregations;
  duplicateGroups: DuplicateGroup[];
  cannibalization: CannibalizationPair[];
}

export interface LinkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pageRank: Record<string, number>;
}

export interface GraphNode {
  url: string;
  inDegree: number;
  outDegree: number;
  depth: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  anchorText: string;
  isNofollow: boolean;
}

export interface TopicCluster {
  id: string;
  centerUrl: string;
  memberUrls: string[];
  topicLabel: string;
  size: number;
  avgEngagement: number;
}

export interface EntityRecord {
  name: string;
  type: string;
  mentions: { url: string; salience: number }[];
  totalSalience: number;
}

export interface SiteAggregations {
  totalPages: number;
  indexablePages: number;
  statusCodes: Record<number, number>;
  avgWordCount: number;
  medianWordCount: number;
  avgResponseMs: number;
  internalLinksTotal: number;
  externalLinksTotal: number;
  avgInternalLinks: number;
  avgExternalLinks: number;
  schemaTypesPresent: string[];
  avgReadabilityScore: number | null;
  avgImagesPerPage: number;
  avgMissingAlt: number;
  avgLcpMs: number | null;
  avgCls: number | null;
  avgInpMs: number | null;
  pagesBySchema: Record<string, number>;
  topInternalTargets: { url: string; count: number }[];
  orphanPages: string[];
}

export interface DuplicateGroup {
  id: string;
  urls: string[];
  similarity: number; // 0-1
  type: 'exact' | 'near';
}

export interface CannibalizationPair {
  url1: string;
  url2: string;
  sharedQueries: { keyword: string; url1Position: number; url2Position: number }[];
  severity: 'high' | 'medium' | 'low';
}

// ── Main Entry ──────────────────────────────────────────────────────

export function enrichSite(
  enrichedPages: EnrichmentResult[],
  fingerprint: FingerprintResult,
  extractions?: ExtractionResult[],
): SiteEnrichmentResult {
  const linkGraph = computeLinkGraph(enrichedPages, extractions);
  const topicClusters = computeTopicClusters(enrichedPages, extractions);
  const entityResolution = resolveEntities(enrichedPages);
  const siteAggregations = computeSiteAggregations(enrichedPages, linkGraph, extractions);
  const duplicateGroups = detectDuplicates(enrichedPages, extractions);
  const cannibalization = detectCannibalization(enrichedPages);

  return {
    linkGraph,
    topicClusters,
    entityResolution,
    siteAggregations,
    duplicateGroups,
    cannibalization,
  };
}

// ── Link Graph ──────────────────────────────────────────────────────

function computeLinkGraph(pages: EnrichmentResult[], extractions?: ExtractionResult[]): LinkGraph {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  // Index extraction data by URL for link graph construction
  const extractionByUrl = new Map<string, ExtractionResult>();
  if (extractions) {
    for (const ext of extractions) {
      extractionByUrl.set(ext.url, ext);
    }
  }

  // Build nodes from enriched pages
  for (const page of pages) {
    const url = page.url;
    if (!nodeMap.has(url)) {
      nodeMap.set(url, { url, inDegree: 0, outDegree: 0, depth: -1 });
    }
  }

  // Build edges and adjacency from extraction link data
  const outLinks: Record<string, string[]> = {};
  const inLinks: Record<string, string[]> = {};

  for (const [url] of nodeMap) {
    outLinks[url] = [];
    inLinks[url] = inLinks[url] || [];
  }

  for (const page of pages) {
    const ext = extractionByUrl.get(page.url);
    if (!ext?.links) continue;

    // Internal links -> edges
    for (const link of ext.links.internalLinks) {
      const target = link.href;
      if (!target || target === page.url) continue;

      // Ensure both endpoints have nodes
      if (!nodeMap.has(target)) {
        nodeMap.set(target, { url: target, inDegree: 0, outDegree: 0, depth: -1 });
      }

      outLinks[page.url].push(target);
      if (!inLinks[target]) inLinks[target] = [];
      inLinks[target].push(page.url);

      edges.push({
        from: page.url,
        to: target,
        anchorText: link.text || '',
        isNofollow: link.isNofollow ?? false,
      });
    }
  }

  // Simple PageRank: iteratively distribute importance
  const dampingFactor = 0.85;
  const iterations = 20;
  const nodeCount = nodeMap.size || 1;
  const pageRank: Record<string, number> = {};

  // Initialize all ranks to 1/N
  for (const [url] of nodeMap) {
    pageRank[url] = 1 / nodeCount;
  }

  // Iterate PageRank
  for (let i = 0; i < iterations; i++) {
    const newRank: Record<string, number> = {};

    for (const [url] of nodeMap) {
      let incomingRank = 0;
      const incoming = inLinks[url] ?? [];
      for (const source of incoming) {
        const sourceOutCount = (outLinks[source] ?? []).length || 1;
        incomingRank += pageRank[source] / sourceOutCount;
      }
      newRank[url] = (1 - dampingFactor) / nodeCount + dampingFactor * incomingRank;
    }

    // Copy new ranks
    for (const [url] of nodeMap) {
      pageRank[url] = newRank[url] ?? pageRank[url];
    }
  }

  // Compute degrees
  for (const [url, node] of nodeMap) {
    node.inDegree = (inLinks[url] ?? []).length;
    node.outDegree = (outLinks[url] ?? []).length;
  }

  const nodes = [...nodeMap.values()];
  return { nodes, edges, pageRank };
}

// ── Topic Clusters ──────────────────────────────────────────────────

function computeTopicClusters(pages: EnrichmentResult[], extractions?: ExtractionResult[]): TopicCluster[] {
  if (pages.length === 0) return [];

  // Build a lookup from URL to extraction data for title/h2-based clustering
  const extractionByUrl = new Map<string, ExtractionResult>();
  if (extractions) {
    for (const ext of extractions) {
      extractionByUrl.set(ext.url, ext);
    }
  }

  // Build feature vectors: title words + h2 words + URL path segments
  const urlToFeatures = new Map<string, Set<string>>();
  for (const page of pages) {
    const ext = extractionByUrl.get(page.url);
    const features = new Set<string>();

    // Add title words
    if (ext?.content?.title) {
      for (const word of ext.content.title.toLowerCase().split(/\s+/)) {
        if (word.length > 2) features.add(word);
      }
    }
    // Add H2 words (strong topic signal)
    if (ext?.content?.h2) {
      for (const h2 of ext.content.h2) {
        for (const word of h2.toLowerCase().split(/\s+/)) {
          if (word.length > 2) features.add(word);
        }
      }
    }
    // Add URL path segments
    try {
      const path = new URL(page.url).pathname;
      for (const seg of path.split('/').filter(Boolean)) {
        const clean = seg.replace(/[-_]/g, ' ').toLowerCase();
        for (const word of clean.split(/\s+/)) {
          if (word.length > 2) features.add(word);
        }
      }
    } catch { /* skip */ }

    urlToFeatures.set(page.url, features);
  }

  const assigned = new Set<string>();
  const clusters: TopicCluster[] = [];
  let clusterId = 0;

  for (const page of pages) {
    if (assigned.has(page.url)) continue;

    const features = urlToFeatures.get(page.url) ?? new Set();
    const members = [page.url];
    assigned.add(page.url);

    // Find pages with similar features (Jaccard similarity > 0.3)
    for (const other of pages) {
      if (assigned.has(other.url)) continue;
      const otherFeatures = urlToFeatures.get(other.url) ?? new Set();
      const similarity = jaccardSimilarity(features, otherFeatures);
      if (similarity > 0.3) {
        members.push(other.url);
        assigned.add(other.url);
      }
    }

    if (members.length > 1) {
      const ext = extractionByUrl.get(page.url);
      const topicLabel = ext?.content?.title
        ? ext.content.title.split(/\s+/).slice(0, 4).join(' ')
        : extractTopicLabel('', members);

      // Compute avg engagement from GA4 data if available
           let totalEngagement = 0;
      let engagementCount = 0;
      for (const memberUrl of members) {
        const memberPage = pages.find(p => p.url === memberUrl);
        if (memberPage?.ga4?.engagementRate) {
          totalEngagement += memberPage.ga4.engagementRate;
          engagementCount++;
        }
      }

      clusters.push({
        id: `cluster-${++clusterId}`,
        centerUrl: page.url,
        memberUrls: members,
        topicLabel,
        size: members.length,
        avgEngagement: engagementCount > 0 ? totalEngagement / engagementCount : 0,
      });
    }
  }

  return clusters;
}

// ── Entity Resolution ───────────────────────────────────────────────

function resolveEntities(pages: EnrichmentResult[]): EntityRecord[] {
  const entityMap = new Map<string, EntityRecord>();

  for (const page of pages) {
    const entities = page.ai?.entities;
    if (!entities || entities.length === 0) continue;

    for (const entity of entities) {
      const name = entity.name?.trim();
      if (!name) continue;

      const key = name.toLowerCase();
      const existing = entityMap.get(key);

      if (existing) {
        existing.mentions.push({ url: page.url, salience: entity.salience });
        existing.totalSalience += entity.salience;
      } else {
        entityMap.set(key, {
          name,
          type: entity.type ?? 'unknown',
          mentions: [{ url: page.url, salience: entity.salience }],
          totalSalience: entity.salience,
        });
      }
    }
  }

  return [...entityMap.values()]
    .sort((a, b) => b.totalSalience - a.totalSalience)
    .slice(0, 50);
}

// ── Site Aggregations ───────────────────────────────────────────────

function computeSiteAggregations(
  pages: EnrichmentResult[],
  linkGraph: LinkGraph,
  extractions?: ExtractionResult[],
): SiteAggregations {
  const totalPages = pages.length;

  if (totalPages === 0) {
    return {
      totalPages: 0,
      indexablePages: 0,
      statusCodes: {},
      avgWordCount: 0,
      medianWordCount: 0,
      avgResponseMs: 0,
      internalLinksTotal: 0,
      externalLinksTotal: 0,
      avgInternalLinks: 0,
      avgExternalLinks: 0,
      schemaTypesPresent: [],
      avgReadabilityScore: null,
      avgImagesPerPage: 0,
      avgMissingAlt: 0,
      avgLcpMs: null,
      avgCls: null,
      avgInpMs: null,
      pagesBySchema: {},
      topInternalTargets: [],
      orphanPages: [],
    };
  }

  // Build extraction lookup for content/image/schema data
  const extractionByUrl = new Map<string, ExtractionResult>();
  if (extractions) {
    for (const ext of extractions) {
      extractionByUrl.set(ext.url, ext);
    }
  }

  // Aggregate from link graph
   let totalInternalLinks = 0;
  let totalExternalLinks = 0;
  const statusCodes: Record<number, number> = {};
  const allSchemaTypes = new Set<string>();
  const pagesBySchema: Record<string, number> = {};
  const targetCounts: Record<string, number> = {};

  // Count internal link targets from edges
  for (const edge of linkGraph.edges) {
    targetCounts[edge.to] = (targetCounts[edge.to] ?? 0) + 1;
  }

  for (const node of linkGraph.nodes) {
    totalInternalLinks += node.outDegree;
  }

  // Aggregate from extraction data: word counts, schema, images, readability
  const wordCounts: number[] = [];
  const readabilityScores: number[] = [];
  const imagesPerPage: number[] = [];
  const missingAltCounts: number[] = [];
  const lcpValues: number[] = [];
  const clsValues: number[] = [];
  const inpValues: number[] = [];
  let indexablePages = 0;

  for (const page of pages) {
    const ext = extractionByUrl.get(page.url);

    // Word count
    if (ext?.content?.wordCount) {
      wordCounts.push(ext.content.wordCount);
    }

    // Readability
    if (ext?.content?.readabilityScore != null) {
      readabilityScores.push(ext.content.readabilityScore);
    }

    // Images
    if (ext?.images) {
      imagesPerPage.push(ext.images.total);
      missingAltCounts.push(ext.images.missingAlt);
    }

    // Schema types
    if (ext?.schema?.schemaTypes) {
      for (const st of ext.schema.schemaTypes) {
        allSchemaTypes.add(st);
        pagesBySchema[st] = (pagesBySchema[st] ?? 0) + 1;
      }
    }

    // Indexability
    if (ext?.robots?.isIndexable) {
      indexablePages++;
    }

    // CrUX data (from enrichment)
    if (page.crux?.lcp?.p75) lcpValues.push(page.crux.lcp.p75);
    if (page.crux?.cls?.p75) clsValues.push(page.crux.cls.p75);
    if (page.crux?.inp?.p75) inpValues.push(page.crux.inp.p75);

    // External links count from extraction
    if (ext?.links?.totalExternal) {
      totalExternalLinks += ext.links.totalExternal;
    }

    // Status code (from fetch data — we don't have it directly in enrichment, so estimate)
    // Pages that have extraction data = 200, otherwise unknown
  }

  // Compute averages
  const avgWordCount = wordCounts.length > 0 ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0;
  const medianWordCount = wordCounts.length > 0 ? median(wordCounts) : 0;
  const avgReadabilityScore = readabilityScores.length > 0
    ? readabilityScores.reduce((a, b) => a + b, 0) / readabilityScores.length
    : null;
  const avgImagesPerPage = imagesPerPage.length > 0 ? imagesPerPage.reduce((a, b) => a + b, 0) / imagesPerPage.length : 0;
  const avgMissingAlt = missingAltCounts.length > 0 ? missingAltCounts.reduce((a, b) => a + b, 0) / missingAltCounts.length : 0;
  const avgLcpMs = lcpValues.length > 0 ? lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length : null;
  const avgCls = clsValues.length > 0 ? clsValues.reduce((a, b) => a + b, 0) / clsValues.length : null;
  const avgInpMs = inpValues.length > 0 ? inpValues.reduce((a, b) => a + b, 0) / inpValues.length : null;

  const avgInternalLinks = totalPages > 0 ? totalInternalLinks / totalPages : 0;
  const avgExternalLinks = totalPages > 0 ? totalExternalLinks / totalPages : 0;

  // Orphan pages: nodes with zero in-degree (excluding the homepage which naturally has no in-links from discovered pages)
  const orphanPages = linkGraph.nodes
    .filter((n) => n.inDegree === 0 && n.depth !== 0)
    .map((n) => n.url);

  // Top internal link targets
  const topInternalTargets = Object.entries(targetCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([url, count]) => ({ url, count }));

  return {
    totalPages,
    indexablePages: extractionByUrl.size > 0 ? indexablePages : totalPages,
    statusCodes,
    avgWordCount: Math.round(avgWordCount),
    medianWordCount: Math.round(medianWordCount),
    avgResponseMs: 0, // Would come from L1 fetch timing data
    internalLinksTotal: totalInternalLinks,
    externalLinksTotal: totalExternalLinks,
    avgInternalLinks: Math.round(avgInternalLinks * 10) / 10,
    avgExternalLinks: Math.round(avgExternalLinks * 10) / 10,
    schemaTypesPresent: [...allSchemaTypes],
    avgReadabilityScore: avgReadabilityScore != null ? Math.round(avgReadabilityScore) : null,
    avgImagesPerPage: Math.round(avgImagesPerPage * 10) / 10,
    avgMissingAlt: Math.round(avgMissingAlt * 10) / 10,
    avgLcpMs,
    avgCls,
    avgInpMs,
    pagesBySchema,
    topInternalTargets,
    orphanPages,
  };
}

// ── Duplicate Detection ─────────────────────────────────────────────

function detectDuplicates(pages: EnrichmentResult[], extractions?: ExtractionResult[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  let groupId = 0;

  // Build extraction lookup for simhash values
  const extractionByUrl = new Map<string, ExtractionResult>();
  if (extractions) {
    for (const ext of extractions) {
      extractionByUrl.set(ext.url, ext);
    }
  }

  // Phase 1: Exact duplicates — same URL path (normalized)
  const pathGroups = new Map<string, string[]>();
  for (const page of pages) {
    try {
      const pathname = new URL(page.url).pathname
        .replace(/\/+$/, '')
        .toLowerCase() || '/';
      if (!pathGroups.has(pathname)) {
        pathGroups.set(pathname, []);
      }
      pathGroups.get(pathname)!.push(page.url);
    } catch {
      // skip invalid URLs
    }
  }

  for (const [, urls] of pathGroups) {
    if (urls.length > 1) {
      groups.push({
        id: `dup-${++groupId}`,
        urls,
        similarity: 1.0,
        type: 'exact',
      });
    }
  }

  // Phase 2: Near-duplicates — simhash Hamming distance
  // simhash produces 64-byte hex strings; we compare them via Hamming distance.
  // Threshold: Hamming distance <= 3 bits is considered near-duplicate (per simhash best practices).
  const simhashEntries: { url: string; simhash: string }[] = [];
  for (const page of pages) {
    const ext = extractionByUrl.get(page.url);
    if (ext?.contentHash?.simhash) {
      simhashEntries.push({ url: page.url, simhash: ext.contentHash.simhash });
    }
  }

  // Compare all pairs — O(n²) but simhash comparison is O(1) per pair
  const SIMHASH_THRESHOLD = 3;
  const alreadyGrouped = new Set<string>();

  for (let i = 0; i < simhashEntries.length; i++) {
    if (alreadyGrouped.has(simhashEntries[i].url)) continue;

    const groupUrls = [simhashEntries[i].url];
    for (let j = i + 1; j < simhashEntries.length; j++) {
      if (alreadyGrouped.has(simhashEntries[j].url)) continue;

      const distance = simhashHammingDistance(simhashEntries[i].simhash, simhashEntries[j].simhash);
      if (distance <= SIMHASH_THRESHOLD) {
        groupUrls.push(simhashEntries[j].url);
        alreadyGrouped.add(simhashEntries[j].url);
      }
    }

    if (groupUrls.length > 1) {
      alreadyGrouped.add(simhashEntries[i].url);
      groups.push({
        id: `dup-${++groupId}`,
        urls: groupUrls,
        similarity: 1 - (SIMHASH_THRESHOLD / 64), // approximate similarity
        type: 'near',
      });
    }
  }

  return groups;
}

// ── Cannibalization Detection ───────────────────────────────────────

function detectCannibalization(pages: EnrichmentResult[]): CannibalizationPair[] {
  const pairs: CannibalizationPair[] = [];

  // GSC-based cannibalization: find pages that share the same GSC queries
  // Build a map: query → list of {url, position}
  const queryToPages = new Map<string, Array<{ url: string; position: number }>>();

  for (const page of pages) {
    if (!page.gsc?.topQueries) continue;
    for (const q of page.gsc.topQueries) {
      const keyword = q.keyword?.toLowerCase().trim();
      if (!keyword) continue;
      if (!queryToPages.has(keyword)) {
        queryToPages.set(keyword, []);
      }
      queryToPages.get(keyword)!.push({ url: page.url, position: q.position });
    }
  }

  // For each query with 2+ pages, create cannibalization pairs
  for (const [keyword, pageEntries] of queryToPages) {
    if (pageEntries.length < 2) continue;

    // Sort by position (lower = better)
    pageEntries.sort((a, b) => a.position - b.position);

    for (let i = 0; i < pageEntries.length; i++) {
      for (let j = i + 1; j < pageEntries.length; j++) {
        const p1 = pageEntries[i];
        const p2 = pageEntries[j];

        // Determine severity based on position gap and both ranking in top 20
        const bothTop20 = p1.position <= 20 && p2.position <= 20;
        const bothTop10 = p1.position <= 10 && p2.position <= 10;
        const positionGap = Math.abs(p1.position - p2.position);

        let severity: 'high' | 'medium' | 'low' = 'low';
        if (bothTop10) severity = 'high';
        else if (bothTop20 && positionGap <= 5) severity = 'medium';

        pairs.push({
          url1: p1.url,
          url2: p2.url,
          sharedQueries: [{ keyword, url1Position: p1.position, url2Position: p2.position }],
          severity,
        });
      }
    }
  }

  // Merge pairs that share the same URL pair (multiple shared keywords)
  const mergedPairs = new Map<string, CannibalizationPair>();
  for (const pair of pairs) {
    const key = [pair.url1, pair.url2].sort().join('||');
    const existing = mergedPairs.get(key);
    if (existing) {
      existing.sharedQueries.push(...pair.sharedQueries);
      // Upgrade severity if the new pair is more severe
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[pair.severity] > severityOrder[existing.severity]) {
        existing.severity = pair.severity;
      }
    } else {
      mergedPairs.set(key, { ...pair, sharedQueries: [...pair.sharedQueries] });
    }
  }

  return [...mergedPairs.values()];
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Compute Jaccard similarity between two sets of strings.
 * |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/** Compute the median of a numeric array */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute the Hamming distance between two simhash values.
 * Simhash is stored as a hex string; we compare byte-by-byte.
 * Returns the number of differing bits (0 = identical, higher = more different).
 */
function simhashHammingDistance(hash1: string, hash2: string): number {
  if (hash1 === hash2) return 0;
  // Ensure both are the same length
  const len = Math.min(hash1.length, hash2.length);
  if (len === 0) return 64;

  let distance = 0;
  for (let i = 0; i < len; i += 2) {
    const b1 = parseInt(hash1.slice(i, i + 2), 16);
    const b2 = parseInt(hash2.slice(i, i + 2), 16);
    if (isNaN(b1) || isNaN(b2)) continue;
    // XOR to find differing bits, then count them
    const xor = b1 ^ b2;
    distance += popcount(xor);
  }
  return distance;
}

/** Count the number of set bits in a byte (population count) */
function popcount(n: number): number {
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

function titleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const aWords = new Set(a.toLowerCase().split(/[\s/\-_]+/).filter(Boolean));
  const bWords = new Set(b.toLowerCase().split(/[\s/\-_]+/).filter(Boolean));
  return jaccardSimilarity(aWords, bWords);
}

function extractTopicLabel(title: string, members: string[]): string {
  // Extract common path segment as topic label
  if (members.length === 0) return 'unknown';
  try {
    const parts = new URL(members[0]).pathname.split('/').filter(Boolean);
    return parts[parts.length - 1]?.replace(/[-_]/g, ' ') ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
