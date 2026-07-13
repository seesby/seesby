/**
 * AI Rotation System — Tiered Provider Routing
 *
 * Manages a pool of 25+ free-tier AI providers organized into four tiers:
 *   XS  — tiny local model (WebGPU)          → language detection, PII, classification
 *   S   — Groq / Workers AI Llama 8B         → entity extraction, intent, readability
 *   M   — Gemini Flash / Cerebras Llama 70B  → action reasoning, briefs, strategic
 *   L   — GitHub Models / OpenRouter 70B     → narratives, crisis draft, rewrite
 *
 * Includes per-provider quota tracking, daily pre-allocation, rotation-aware
 * 429 handling (exponential backoff + jitter), and persistent state.
 */

import type { AIProvider } from '../ai/types';

// ─── Tier definitions ──────────────────────────────
export type ModelTier = 'XS' | 'S' | 'M' | 'L';

export interface TieredProvider {
  name: AIProvider;
  tier: ModelTier;
  models: string[];                 // model IDs at this provider
  dailyQuota: number;               // max requests per day
  tokensPerDay: number;             // max tokens per day
  rpm: number;                      // requests per minute
  priority: number;                 // lower = preferred (within tier)
  supportsStream: boolean;
  avgLatencyMs: number;             // observed rolling average
}

// ─── Provider registry (recurring-free tiers) ──────
const TIERED_PROVIDERS: TieredProvider[] = [
  // ── XS: local WebGPU ────────────────────────────
  {
    name: 'local',
    tier: 'XS',
    models: ['transformers.js', 'webllm-mlc', 'llamaedge-webgpu', 'onnx-runtime-web'],
    dailyQuota: 999_999,
    tokensPerDay: 999_999,
    rpm: 9999,
    priority: 0,
    supportsStream: false,
    avgLatencyMs: 50,
  },

  // ── S: fast small models ────────────────────────
  {
    name: 'groq',
    tier: 'S',
    models: ['llama-3.1-8b-instant', 'llama-3.2-1b-preview'],
    dailyQuota: 14_400,
    tokensPerDay: 500_000,
    rpm: 30,
    priority: 10,
    supportsStream: true,
    avgLatencyMs: 200,
  },
  {
    name: 'cloudflare',
    tier: 'S',
    models: ['@cf/meta/llama-3.2-1b-instruct', '@cf/tinyllama'],
    dailyQuota: 10_000,
    tokensPerDay: 300_000,
    rpm: 50,
    priority: 11,
    supportsStream: true,
    avgLatencyMs: 300,
  },
  {
    name: 'cerebras',
    tier: 'S',
    models: ['llama-3.1-8b-instruct'],
    dailyQuota: 1_000,
    tokensPerDay: 100_000,
    rpm: 30,
    priority: 12,
    supportsStream: true,
    avgLatencyMs: 250,
  },

  // ── M: mid-tier reasoning ───────────────────────
  {
    name: 'gemini',
    tier: 'M',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
    dailyQuota: 1_500,
    tokensPerDay: 1_000_000,
    rpm: 15,
    priority: 20,
    supportsStream: true,
    avgLatencyMs: 500,
  },
  {
    name: 'cerebras',
    tier: 'M',
    models: ['llama-3.3-70b-instruct'],
    dailyQuota: 1_000,
    tokensPerDay: 100_000,
    rpm: 30,
    priority: 21,
    supportsStream: true,
    avgLatencyMs: 400,
  },
  {
    name: 'fireworks',
    tier: 'M',
    models: ['accounts/fireworks/models/llama-v3p3-70b-instruct', 'accounts/fireworks/models/mixtral-8x22b-instruct'],
    dailyQuota: 1_000,
    tokensPerDay: 500_000,
    rpm: 60,
    priority: 22,
    supportsStream: true,
    avgLatencyMs: 600,
  },
  {
    name: 'together',
    tier: 'M',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
    dailyQuota: 1_000,
    tokensPerDay: 500_000,
    rpm: 60,
    priority: 23,
    supportsStream: true,
    avgLatencyMs: 600,
  },
  {
    name: 'deepseek',
    tier: 'M',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    dailyQuota: 1_000,
    tokensPerDay: 500_000,
    rpm: 60,
    priority: 24,
    supportsStream: true,
    avgLatencyMs: 700,
  },
  {
    name: 'nvidia',
    tier: 'M',
    models: ['nvidia/llama-3.3-nemotron-super-49b-v1', 'nvidia/llama-3.1-nemotron-70b-instruct'],
    dailyQuota: 1_000,
    tokensPerDay: 500_000,
    rpm: 20,
    priority: 25,
    supportsStream: true,
    avgLatencyMs: 800,
  },
  {
    name: 'mistral',
    tier: 'M',
    models: ['mistral-large-latest', 'mistral-small-latest'],
    dailyQuota: 2_000,
    tokensPerDay: 500_000,
    rpm: 60,
    priority: 26,
    supportsStream: true,
    avgLatencyMs: 600,
  },

  // ── L: large / premium free ─────────────────────
  {
    name: 'github',
    tier: 'L',
    models: ['meta-llama-3.3-70b-instruct', 'mistral-large-latest'],
    dailyQuota: 1_500,
    tokensPerDay: 150_000,
    rpm: 15,
    priority: 30,
    supportsStream: true,
    avgLatencyMs: 900,
  },
  {
    name: 'openrouter',
    tier: 'L',
    models: ['meta-llama/llama-3.3-70b-instruct:free', 'mistralai/mistral-large-2407:free'],
    dailyQuota: 200,
    tokensPerDay: 100_000,
    rpm: 20,
    priority: 31,
    supportsStream: true,
    avgLatencyMs: 1000,
  },
  {
    name: 'cohere',
    tier: 'L',
    models: ['command-r-plus', 'command-r'],
    dailyQuota: 1_000,
    tokensPerDay: 100_000,
    rpm: 10,
    priority: 32,
    supportsStream: true,
    avgLatencyMs: 800,
  },
  {
    name: 'ai21',
    tier: 'L',
    models: ['jamba-1.5-large', 'jamba-1.5-mini'],
    dailyQuota: 65,
    tokensPerDay: 100_000,
    rpm: 10,
    priority: 33,
    supportsStream: true,
    avgLatencyMs: 900,
  },
  {
    name: 'replicate',
    tier: 'L',
    models: ['meta/meta-llama-3.3-70b-instruct', 'mistralai/mistral-7b-instruct-v0.3'],
    dailyQuota: 500,
    tokensPerDay: 100_000,
    rpm: 10,
    priority: 34,
    supportsStream: false,
    avgLatencyMs: 1200,
  },
  {
    name: 'ibm',
    tier: 'L',
    models: ['ibm/granite-3.0-8b-instruct', 'ibm/granite-3.3-8b-instruct'],
    dailyQuota: 500,
    tokensPerDay: 100_000,
    rpm: 20,
    priority: 35,
    supportsStream: true,
    avgLatencyMs: 900,
  },
  {
    name: 'tencent',
    tier: 'L',
    models: ['hunyuan-latest'],
    dailyQuota: 1_000,
    tokensPerDay: 100_000,
    rpm: 20,
    priority: 36,
    supportsStream: true,
    avgLatencyMs: 1000,
  },
  {
    name: 'zhipu',
    tier: 'L',
    models: ['glm-4-flash'],
    dailyQuota: 1_000,
    tokensPerDay: 100_000,
    rpm: 20,
    priority: 37,
    supportsStream: true,
    avgLatencyMs: 900,
  },
  {
    name: 'huggingface',
    tier: 'L',
    models: ['meta-llama/Meta-Llama-3.3-70B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3'],
    dailyQuota: 1_000,
    tokensPerDay: 100_000,
    rpm: 10,
    priority: 38,
    supportsStream: false,
    avgLatencyMs: 1500,
  },
];

// ─── Per-provider runtime quota state ──────────────
interface ProviderQuotaState {
  requestsToday: number;
  tokensToday: number;
  requestsThisMinute: number;
  lastResetMinute: number;
  lastResetDay: string;              // YYYY-MM-DD
  consecutive429: number;            // for exponential backoff
  backoffUntil: number;              // timestamp (ms) — 0 if not backing off
  lastUsedAt: number;
}

// ─── Provider key ──────────────────────────────────
// A TieredProvider can appear twice (same name, different tier — e.g. cerebras S vs M).
// We use composite key "name@tier" for the quota map.
function providerKey(p: TieredProvider): string {
  return `${p.name}@${p.tier}`;
}

// ─── Daily quota pre-allocation map ────────────────
// In a multi-concurrent-session environment you can split daily quota.
const PREALLOC_KEY = 'seesby:ai-prealloc';

interface DailyAllocation {
  date: string;
  allocated: Record<string, number>; // providerKey -> allocated requests
}

// ─── Quota Tracker ─────────────────────────────────
export class AIQuotaTracker {
  private states: Map<string, ProviderQuotaState> = new Map();

  constructor() {
    this.load();
  }

  getState(provider: TieredProvider): ProviderQuotaState {
    const key = providerKey(provider);
    let state = this.states.get(key);
    if (!state) {
      state = this.emptyState();
      this.states.set(key, state);
    }
    return state;
  }

  /** Check whether a provider still has daily + RPM quota. */
  checkQuota(provider: TieredProvider): boolean {
    const state = this.getState(provider);
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Day rollover
    if (state.lastResetDay !== today) {
      state.requestsToday = 0;
      state.tokensToday = 0;
      state.lastResetDay = today;
      state.consecutive429 = 0;
      state.backoffUntil = 0;
    }

    // Minute rollover
    if (now - state.lastResetMinute > 60_000) {
      state.requestsThisMinute = 0;
      state.lastResetMinute = now;
    }

    // Still in backoff window?
    if (state.backoffUntil > now) return false;

    return (
      state.requestsToday < provider.dailyQuota &&
      state.tokensToday < provider.tokensPerDay &&
      state.requestsThisMinute < provider.rpm
    );
  }

  /** Record a successful request. */
  recordUsage(provider: TieredProvider, tokens: number): void {
    const state = this.getState(provider);
    state.requestsToday++;
    state.requestsThisMinute++;
    state.tokensToday += tokens;
    state.lastUsedAt = Date.now();
    state.consecutive429 = 0;
    state.backoffUntil = 0;
    this.save();
  }

  /**
   * Record a 429 rate-limit response.
   * Computes exponential backoff with jitter and marks provider unavailable
   * until backoffUntil.
   */
  recordRateLimit(provider: TieredProvider, retryAfterMs?: number): void {
    const state = this.getState(provider);
    state.consecutive429++;

    // Exponential backoff: 2^consecutive * 500ms, capped at 30 min, + jitter
    const base = Math.min(500 * Math.pow(2, state.consecutive429), 30 * 60_000);
    const jitter = Math.random() * base * 0.3; // up to 30% jitter
    state.backoffUntil = retryAfterMs
      ? Date.now() + retryAfterMs
      : Date.now() + base + jitter;

    this.save();
  }

  /** Get remaining quota for a provider (for dashboards). */
  getRemainingQuota(provider: TieredProvider): { requests: number; tokens: number } {
    const state = this.getState(provider);
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    if (state.lastResetDay !== today) {
      return { requests: provider.dailyQuota, tokens: provider.tokensPerDay };
    }

    return {
      requests: Math.max(0, provider.dailyQuota - state.requestsToday),
      tokens: Math.max(0, provider.tokensPerDay - state.tokensToday),
    };
  }

  /** Reset all state (new day or manual). */
  reset(): void {
    this.states.clear();
    this.save();
  }

  // ─── Persistence ─────────────────────────────────
  private load(): void {
    try {
      const raw = localStorage.getItem('seesby:ai-quota-tracker');
      if (!raw) return;
      const data = JSON.parse(raw) as [string, ProviderQuotaState][];
      for (const [key, state] of data) {
        this.states.set(key, state);
      }
    } catch { /* ignore corrupt data */ }
  }

  private save(): void {
    try {
      const data: [string, ProviderQuotaState][] = [];
      for (const [key, state] of this.states) {
        data.push([key, state]);
      }
      localStorage.setItem('seesby:ai-quota-tracker', JSON.stringify(data));
    } catch { /* quota exceeded */ }
  }

  private emptyState(): ProviderQuotaState {
    return {
      requestsToday: 0,
      tokensToday: 0,
      requestsThisMinute: 0,
      lastResetMinute: Date.now(),
      lastResetDay: new Date().toISOString().split('T')[0],
      consecutive429: 0,
      backoffUntil: 0,
      lastUsedAt: 0,
    };
  }
}

// ─── Rotation Router ───────────────────────────────
export class AIRotationRouter {
  private quotaTracker: AIQuotaTracker;
  private providers: TieredProvider[];

  constructor(opts?: { providers?: TieredProvider[] }) {
    this.quotaTracker = new AIQuotaTracker();
    this.providers = opts?.providers ?? TIERED_PROVIDERS;
  }

  /**
   * Return the next available provider for a given required tier.
   * Selection criteria (in order):
   *   1. Tier match (>= requiredTier by size: XS < S < M < L)
   *   2. Within daily + RPM quota
   *   3. Not in 429 backoff
   *   4. Lowest priority number within tier
   *   5. Lowest average latency as tiebreaker
   */
  rotateProvider(taskType: string, requiredTier: ModelTier): TieredProvider | null {
    const tierOrder: ModelTier[] = ['XS', 'S', 'M', 'L'];
    const minIdx = tierOrder.indexOf(requiredTier);

    // Collect eligible providers (matching or higher tier)
    const eligible: TieredProvider[] = [];
    for (const p of this.providers) {
      const pIdx = tierOrder.indexOf(p.tier);
      if (pIdx < minIdx) continue; // tier too small
      if (!this.quotaTracker.checkQuota(p)) continue; // quota exhausted or backing off
      eligible.push(p);
    }

    if (eligible.length === 0) return null;

    // Sort by: tier ascending → priority → avg latency
    eligible.sort((a, b) => {
      const tierDiff = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
      if (tierDiff !== 0) return tierDiff;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.avgLatencyMs - b.avgLatencyMs;
    });

    return eligible[0];
  }

  /**
   * Get all providers that are currently available (within quota + not backing off),
   * optionally filtered by tier.
   */
  getAvailableProviders(tier?: ModelTier): TieredProvider[] {
    return this.providers.filter(p => {
      if (tier && p.tier !== tier) return false;
      return this.quotaTracker.checkQuota(p);
    });
  }

  /** Proxy: check quota for a specific provider. */
  checkQuota(provider: TieredProvider): boolean {
    return this.quotaTracker.checkQuota(provider);
  }

  /** Proxy: record usage after a successful call. */
  recordUsage(provider: TieredProvider, tokens: number): void {
    this.quotaTracker.recordUsage(provider, tokens);
  }

  /** Proxy: record a 429 hit. */
  recordRateLimit(provider: TieredProvider, retryAfterMs?: number): void {
    this.quotaTracker.recordRateLimit(provider, retryAfterMs);
  }

  /** Get the underlying quota tracker (for telemetry / dashboards). */
  getQuotaTracker(): AIQuotaTracker {
    return this.quotaTracker;
  }

  /** All registered providers. */
  getAllProviders(): TieredProvider[] {
    return [...this.providers];
  }

  /** Providers grouped by tier. */
  getProvidersByTier(): Record<ModelTier, TieredProvider[]> {
    const result: Record<ModelTier, TieredProvider[]> = { XS: [], S: [], M: [], L: [] };
    for (const p of this.providers) {
      result[p.tier].push(p);
    }
    return result;
  }
}

// ─── Singleton ─────────────────────────────────────
let _rotation: AIRotationRouter | null = null;
export function getAIRotationRouter(): AIRotationRouter {
  if (!_rotation) _rotation = new AIRotationRouter();
  return _rotation;
}
