/**
 * AI Response Cache
 *
 * Content-addressed cache targeting ~40% hit rate during crawl sessions.
 * Keys are SHA-256 hashes of (input + prompt), so identical HTML + identical
 * prompt always returns a cached response without hitting any provider.
 *
 * TTL strategy:
 *   - Classify / score results:  30 min  (schema rarely changes)
 *   - Summarize / generate:       5 min  (content may shift)
 *   - Embed:                     60 min  (deterministic for same input)
 */

import type { AIRequest } from '../ai/types';

// ─── Internal types ────────────────────────────────
interface CacheEntry {
  response: any;
  expiry: number;
  hits: number;
  createdAt: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;          // 0-1
  memoryEstimateBytes: number;
  oldestEntryAge: number;   // ms
  newestEntryAge: number;   // ms
}

// ─── TTL by task category (ms) ─────────────────────
const TASK_TTL: Record<string, number> = {
  classify: 30 * 60_000,
  score:    30 * 60_000,
  embed:    60 * 60_000,
  extract:   5 * 60_000,
  summarize: 5 * 60_000,
  generate:  5 * 60_000,
};

const DEFAULT_TTL = 5 * 60_000;

// ─── Hashing ───────────────────────────────────────
// Subtle: we use crypto.subtle.digest when available (browsers + Node 20+)
// and fall back to a fast djb2-style hash for environments without it.
async function sha256hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: FNV-1a 64-bit (good enough for cache keys)
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x811c9dc5);
  }
  return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
}

// ─── Class ─────────────────────────────────────────
const STORAGE_KEY = 'seesby:ai-response-cache';
const MAX_ENTRIES = 2000;          // cap to prevent unbounded memory growth
const PURGE_BATCH = 400;           // remove this many when over cap

export class AIResponseCache {
  private entries: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;

  constructor(private opts?: { maxEntries?: number; storageKey?: string }) {
    this.maxEntries = opts?.maxEntries ?? MAX_ENTRIES;
    this.storageKey = opts?.storageKey ?? STORAGE_KEY;
    this.load();
  }

  private maxEntries: number;
  private storageKey: string;

  // ─── Public API ──────────────────────────────────

  /**
   * Build a deterministic cache key from input HTML + prompt + system prompt.
   * Returns a hex string suitable for use as a Map key.
   */
  async getCacheKey(input: string, prompt: string, systemPrompt?: string): Promise<string> {
    const composite = `v1:${systemPrompt ?? ''}::${prompt}::${input}`;
    return sha256hex(composite);
  }

  /**
   * Convenience: build key from an AIRequest (uses prompt + systemPrompt).
   * Caller is responsible for including the page HTML in the prompt.
   */
  async getKeyForRequest(request: AIRequest): Promise<string> {
    return this.getCacheKey(request.prompt, request.prompt, request.systemPrompt);
  }

  /**
   * Retrieve a cached response. Returns null on miss or expiry.
   * Updates internal hit/miss counters for stats.
   */
  get(key: string): any | null {
    const entry = this.entries.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (entry.expiry < Date.now()) {
      this.entries.delete(key);
      this.misses++;
      return null;
    }
    entry.hits++;
    this.hits++;
    return entry.response;
  }

  /**
   * Store a response with an optional TTL override.
   * Falls back to task-type-based TTL when ttlMs is omitted.
   */
  set(key: string, response: any, ttlMs?: number, taskType?: string): void {
    const ttl = ttlMs ?? TASK_TTL[taskType ?? ''] ?? DEFAULT_TTL;
    this.entries.set(key, {
      response,
      expiry: Date.now() + ttl,
      hits: 0,
      createdAt: Date.now(),
    });

    // Evict oldest entries when over cap
    if (this.entries.size > this.maxEntries) {
      this.evict(this.maxEntries - PURGE_BATCH);
    }

    this.persist();
  }

  /**
   * Remove all expired entries and persist.
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.entries) {
      if (entry.expiry < now) {
        this.entries.delete(key);
        pruned++;
      }
    }
    if (pruned > 0) this.persist();
    return pruned;
  }

  /**
   * Clear everything.
   */
  clear(): void {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
    try { localStorage.removeItem(this.storageKey); } catch { /* noop */ }
  }

  /**
   * Current cache statistics.
   */
  stats(): CacheStats {
    const now = Date.now();
    let oldest = now;
    let newest = 0;
    let estBytes = 0;

    for (const entry of this.entries.values()) {
      if (entry.createdAt < oldest) oldest = entry.createdAt;
      if (entry.createdAt > newest) newest = entry.createdAt;
      // Rough estimate: JSON size + 200 bytes overhead per entry
      try {
        estBytes += JSON.stringify(entry.response).length + 200;
      } catch {
        estBytes += 1000; // fallback estimate
      }
    }

    const total = this.hits + this.misses;
    return {
      totalEntries: this.entries.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      memoryEstimateBytes: estBytes,
      oldestEntryAge: this.entries.size > 0 ? now - oldest : 0,
      newestEntryAge: this.entries.size > 0 ? now - newest : 0,
    };
  }

  /**
   * Reset hit/miss counters (useful at session boundary).
   */
  resetCounters(): void {
    this.hits = 0;
    this.misses = 0;
  }

  // ─── Internal ────────────────────────────────────

  /**
   * Evict down to `targetSize` by removing least-recently-used entries.
   */
  private evict(targetSize: number): void {
    // Sort by hits (ascending) then by creation time (ascending)
    const sorted = [...this.entries.entries()].sort((a, b) => {
      if (a[1].hits !== b[1].hits) return a[1].hits - b[1].hits;
      return a[1].createdAt - b[1].createdAt;
    });

    const toRemove = this.entries.size - targetSize;
    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      this.entries.delete(sorted[i][0]);
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw) as [string, CacheEntry][];
      for (const [key, entry] of data) {
        if (entry.expiry > Date.now()) {
          this.entries.set(key, entry);
        }
      }
    } catch { /* ignore corrupt data */ }
  }

  private persist(): void {
    try {
      const data: [string, CacheEntry][] = [];
      for (const [key, entry] of this.entries) {
        if (entry.expiry > Date.now()) {
          data.push([key, entry]);
        }
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch { /* quota exceeded, ignore */ }
  }
}

// ─── Singleton ─────────────────────────────────────
let _cache: AIResponseCache | null = null;
export function getAIResponseCache(): AIResponseCache {
  if (!_cache) _cache = new AIResponseCache();
  return _cache;
}
