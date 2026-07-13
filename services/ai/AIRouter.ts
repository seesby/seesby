import type {
  AIProvider, AITaskType, AIRequest, AIResponse,
  AIProviderAdapter, AIQuotaState
} from './types';
import { getAITelemetry } from './AITelemetry';

// ─── Provider priority per task type ────────────────
// Order matters: first available + within quota wins
const TASK_PROVIDER_CHAIN: Record<AITaskType, AIProvider[]> = {
  classify:  ['local', 'cloudflare', 'github', 'gemini', 'anthropic', 'openai', 'groq', 'together', 'openrouter', 'deepseek', 'mistral', 'cohere', 'ai21', 'fireworks', 'replicate', 'nvidia', 'cerebras', 'ibm', 'tencent', 'zhipu', 'huggingface', 'server'],
  extract:   ['local', 'cloudflare', 'github', 'gemini', 'anthropic', 'openai', 'groq', 'together', 'openrouter', 'deepseek', 'mistral', 'cohere', 'ai21', 'fireworks', 'replicate', 'nvidia', 'cerebras', 'ibm', 'tencent', 'zhipu', 'huggingface', 'server'],
  summarize: ['cloudflare', 'github', 'gemini', 'anthropic', 'openai', 'groq', 'together', 'openrouter', 'deepseek', 'mistral', 'cohere', 'ai21', 'fireworks', 'replicate', 'nvidia', 'cerebras', 'ibm', 'tencent', 'zhipu', 'huggingface', 'local', 'server'],
  generate:  ['cloudflare', 'github', 'gemini', 'anthropic', 'openai', 'groq', 'together', 'openrouter', 'deepseek', 'mistral', 'cohere', 'ai21', 'fireworks', 'replicate', 'nvidia', 'cerebras', 'ibm', 'tencent', 'zhipu', 'huggingface', 'local', 'server'],
  score:     ['local', 'cloudflare', 'github', 'gemini', 'anthropic', 'openai', 'groq', 'together', 'openrouter', 'deepseek', 'mistral', 'cohere', 'ai21', 'fireworks', 'replicate', 'nvidia', 'cerebras', 'ibm', 'tencent', 'zhipu', 'huggingface', 'server'],
  embed:     ['cloudflare', 'github', 'gemini', 'openai', 'huggingface', 'local', 'server'],
};

// Default daily quota limits per provider (free tiers)
const DEFAULT_QUOTAS: Record<AIProvider, { rpm: number; rpd: number; tpd: number }> = {
  local:       { rpm: 9999, rpd: 999999, tpd: 999999 },
  cloudflare:  { rpm: 50,   rpd: 10000,  tpd: 300000 },
  github:      { rpm: 15,   rpd: 1500,   tpd: 150000 },
  gemini:      { rpm: 15,   rpd: 1500,   tpd: 1000000 },
  groq:        { rpm: 30,   rpd: 14400,  tpd: 500000 },
  huggingface: { rpm: 10,   rpd: 1000,   tpd: 100000 },
  openai:      { rpm: 60,   rpd: 99999,  tpd: 999999 },
  anthropic:   { rpm: 60,   rpd: 99999,  tpd: 999999 },
  together:    { rpm: 60,   rpd: 1000,   tpd: 500000 },
  openrouter:  { rpm: 20,   rpd: 200,    tpd: 100000 },
  deepseek:    { rpm: 60,   rpd: 1000,   tpd: 500000 },
  mistral:     { rpm: 60,   rpd: 2000,   tpd: 500000 },
  cohere:      { rpm: 10,   rpd: 1000,   tpd: 100000 },
  ai21:        { rpm: 10,   rpd: 65,     tpd: 100000 },
  fireworks:   { rpm: 60,   rpd: 1000,   tpd: 500000 },
  replicate:   { rpm: 10,   rpd: 500,    tpd: 100000 },
  nvidia:      { rpm: 20,   rpd: 1000,   tpd: 500000 },
  cerebras:    { rpm: 30,   rpd: 1000,   tpd: 100000 },
  ibm:         { rpm: 20,   rpd: 500,    tpd: 100000 },
  tencent:     { rpm: 20,   rpd: 1000,   tpd: 100000 },
  zhipu:       { rpm: 20,   rpd: 1000,   tpd: 100000 },
  server:      { rpm: 9999, rpd: 999999, tpd: 999999 },
};

const CACHE_KEY_PREFIX = 'seesby:ai-cache:';
const QUOTA_KEY = 'seesby:ai-quotas';

export class AIRouter {
  private adapters: Map<AIProvider, AIProviderAdapter> = new Map();
  private quotas: Map<AIProvider, AIQuotaState> = new Map();
  private cache: Map<string, { response: AIResponse; expiry: number }> = new Map();

  constructor() {
    this.loadQuotas();
  }

  // ─── Register adapters ────────────────────────────
  registerAdapter(adapter: AIProviderAdapter) {
    this.adapters.set(adapter.provider, adapter);
    if (!this.quotas.has(adapter.provider)) {
      this.quotas.set(adapter.provider, {
        provider: adapter.provider,
        requestsToday: 0,
        tokensToday: 0,
        requestsThisMinute: 0,
        lastResetMinute: Date.now(),
        lastResetDay: new Date().toISOString().split('T')[0],
      });
    }
  }

  // ─── Main entry point ─────────────────────────────
  async complete(request: AIRequest): Promise<AIResponse> {
    // 1. Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return { ...cached.response, fromCache: true };
    }

    // 2. Get provider chain for this task
    const chain = TASK_PROVIDER_CHAIN[request.taskType] || TASK_PROVIDER_CHAIN.classify;

    // 3. Try each provider in order
    const errors: string[] = [];

    for (const providerName of chain) {
      const adapter = this.adapters.get(providerName);
      if (!adapter) continue;

      // Check availability
      try {
        const available = await adapter.isAvailable();
        if (!available) continue;
      } catch {
        continue;
      }

      // Check quota
      if (!this.hasQuota(providerName)) {
        errors.push(`${providerName}: quota exhausted`);
        continue;
      }

      // Try the request
      try {
        const response = await adapter.complete(request);

        // Update quota
        this.recordUsage(providerName, response.tokensUsed);
        
        // Record telemetry
        getAITelemetry().recordSuccess(providerName, response.latencyMs);

        // Cache the result (5 min for summaries, 30 min for classifications)
        const ttl = request.taskType === 'classify' || request.taskType === 'score'
          ? 30 * 60 * 1000
          : 5 * 60 * 1000;
        this.cache.set(cacheKey, { response, expiry: Date.now() + ttl });

        return response;
      } catch (err: any) {
        errors.push(`${providerName}: ${err.message}`);
        
        // Record telemetry
        getAITelemetry().recordError(providerName, err.message);

        // Mark as rate-limited if 429
        if (err.message?.includes('429') || err.message?.includes('rate')) {
          const quota = this.quotas.get(providerName);
          if (quota) quota.requestsThisMinute = 9999; // force skip this minute
        }
        continue; // try next provider
      }
    }

    throw new Error(`All AI providers failed for ${request.taskType}: ${errors.join('; ')}`);
  }

  async *completeStream(request: AIRequest): AsyncGenerator<string, AIResponse> {
    const chain = TASK_PROVIDER_CHAIN[request.taskType] || TASK_PROVIDER_CHAIN.classify;
    const errors: string[] = [];

    for (const providerName of chain) {
      const adapter = this.adapters.get(providerName);
      if (!adapter || !adapter.completeStream) continue;

      // Check availability
      try {
        const available = await adapter.isAvailable();
        if (!available) continue;
      } catch { continue; }

      // Check quota
      if (!this.hasQuota(providerName)) continue;

      // Try streaming
      try {
        const generator = adapter.completeStream(request);
        let finalResponse: AIResponse | null = null;
        
        while (true) {
          const { done, value } = await generator.next();
          if (done) {
            finalResponse = value as AIResponse;
            break;
          }
          yield value;
        }

        if (finalResponse) {
          this.recordUsage(providerName, finalResponse.tokensUsed);
          getAITelemetry().recordSuccess(providerName, finalResponse.latencyMs);
          return finalResponse;
        }
      } catch (err: any) {
        errors.push(`${providerName}: ${err.message}`);
        getAITelemetry().recordError(providerName, err.message);
        continue;
      }
    }

    // Fall back to non-streaming if no streaming adapter worked
    const result = await this.complete({ ...request, stream: false });
    yield result.text;
    return result;
  }

  // ─── Batch processing ─────────────────────────────
  async completeBatch(
    requests: AIRequest[],
    concurrency: number = 3,
    onProgress?: (done: number, total: number) => void
  ): Promise<AIResponse[]> {
    const results: AIResponse[] = [];
    let done = 0;

    // Process in chunks to respect rate limits
    for (let i = 0; i < requests.length; i += concurrency) {
      const chunk = requests.slice(i, i + concurrency);
      const chunkResults = await Promise.allSettled(
        chunk.map(req => this.complete(req))
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            text: JSON.stringify({ error: result.reason?.message || 'Failed' }),
            provider: 'local' as AIProvider,
            model: 'error',
            tokensUsed: 0,
            latencyMs: 0,
            fromCache: false,
          });
        }
        done++;
        onProgress?.(done, requests.length);
      }

      // Rate limit pause between chunks (200ms per request in chunk)
      if (i + concurrency < requests.length) {
        await new Promise(r => setTimeout(r, 200 * concurrency));
      }
    }

    return results;
  }

  // ─── Quota management ─────────────────────────────
  private hasQuota(provider: AIProvider): boolean {
    const quota = this.quotas.get(provider);
    if (!quota) return true;
    const limits = DEFAULT_QUOTAS[provider];
    if (!limits) return true;

    // Reset daily counters
    const today = new Date().toISOString().split('T')[0];
    if (quota.lastResetDay !== today) {
      quota.requestsToday = 0;
      quota.tokensToday = 0;
      quota.lastResetDay = today;
    }

    // Reset minute counter
    if (Date.now() - quota.lastResetMinute > 60000) {
      quota.requestsThisMinute = 0;
      quota.lastResetMinute = Date.now();
    }

    return (
      quota.requestsThisMinute < limits.rpm &&
      quota.requestsToday < limits.rpd &&
      quota.tokensToday < limits.tpd
    );
  }

  private recordUsage(provider: AIProvider, tokens: number) {
    const quota = this.quotas.get(provider);
    if (!quota) return;
    quota.requestsToday++;
    quota.requestsThisMinute++;
    quota.tokensToday += tokens;
    this.saveQuotas();
  }

  // ─── Persistence (localStorage) ───────────────────
  private loadQuotas() {
    try {
      const raw = localStorage.getItem(QUOTA_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Record<string, AIQuotaState>;
      for (const [key, state] of Object.entries(data)) {
        this.quotas.set(key as AIProvider, state);
      }
    } catch { /* ignore */ }
  }

  private saveQuotas() {
    try {
      const data = Object.fromEntries(this.quotas.entries());
      localStorage.setItem(QUOTA_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  private getCacheKey(request: AIRequest): string {
    // Hash the task type + first 200 chars of prompt for cache key
    const input = `${request.taskType}:${request.prompt.slice(0, 200)}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    return CACHE_KEY_PREFIX + Math.abs(hash).toString(36);
  }

  // ─── Status / debugging ───────────────────────────
  getProviderStatus(): Array<{
    provider: AIProvider;
    available: boolean;
    quotaRemaining: { rpm: number; rpd: number; tpd: number };
  }> {
    return [...this.adapters.entries()].map(([name, adapter]) => {
      const quota = this.quotas.get(name);
      const limits = DEFAULT_QUOTAS[name] || { rpm: 0, rpd: 0, tpd: 0 };
      return {
        provider: name,
        available: true, // simplified; real check is async
        quotaRemaining: {
          rpm: limits.rpm - (quota?.requestsThisMinute || 0),
          rpd: limits.rpd - (quota?.requestsToday || 0),
          tpd: limits.tpd - (quota?.tokensToday || 0),
        },
      };
    });
  }
}
