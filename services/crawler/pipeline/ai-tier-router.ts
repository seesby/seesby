/**
 * AI Tier Router — Orchestrates the full decision pipeline
 *
 * For every task that might use AI, this router:
 *   1. Checks whether it can be done deterministically (no AI needed)
 *   2. If deterministic result confidence > 95%, returns it directly
 *   3. Selects the minimum tier needed for the task
 *   4. Checks the response cache (same HTML + prompt = cached result)
 *   5. Picks a provider from the rotation pool
 *   6. Returns { provider, model, estimatedTokens } for the caller to invoke
 *
 * Integration points:
 *   - deterministic-checker  → fast path
 *   - ai-cache              → cache layer
 *   - ai-rotation           → provider selection
 *   - AITelemetry           → latency / error tracking
 */

import type { AIProvider, AITaskType, AIRequest } from '../ai/types';
import { canComputeDeterministically, computeDeterministically, type PageData, type DeterministicResult } from './deterministic-checker';
import { AIResponseCache, getAIResponseCache } from './ai-cache';
import { AIRotationRouter, getAIRotationRouter, type TieredProvider, type ModelTier } from './ai-rotation';

// ─── Types ─────────────────────────────────────────
export interface RoutingDecision {
  /** Whether AI was needed at all */
  deterministic: boolean;
  /** If deterministic, the pre-computed result */
  deterministicResult?: DeterministicResult;
  /** If AI needed: the selected provider */
  provider?: TieredProvider;
  /** Model ID to use */
  model?: string;
  /** Estimated token cost */
  estimatedTokens?: number;
  /** Whether the response was served from cache */
  fromCache?: boolean;
  /** Cached response if available */
  cachedResponse?: any;
  /** Selected tier */
  tier?: ModelTier;
  /** Why this route was chosen (for telemetry) */
  reason: string;
}

// ─── Task complexity → minimum tier mapping ─────────
// Each task type maps to a minimum required tier.
// Tasks may require higher tiers based on input analysis.

const TASK_MIN_TIER: Record<AITaskType, ModelTier> = {
  classify: 'XS',
  score:    'XS',
  extract:  'S',
  embed:    'S',
  summarize: 'M',
  generate:  'M',
};

// Sub-task overrides: some specific operations need higher tiers
const SUBTASK_TIER_OVERRIDES: Record<string, ModelTier> = {
  // XS-tier tasks (always local if available)
  'languageDetection':      'XS',
  'piiDetection':           'XS',
  'sentimentClassification': 'XS',
  'aiGeneratedDetection':   'XS',
  'contentTypeClassification': 'XS',

  // S-tier tasks
  'entityExtraction':       'S',
  'intentClassification':   'S',
  'readabilityAssist':      'S',
  'topicModeling':          'S',
  'keywordExtraction':      'S',

  // M-tier tasks
  'actionReasoning':        'M',
  'contentBrief':           'M',
  'strategicAnalysis':      'M',
  'competitiveAnalysis':    'M',
  'contentScoring':         'M',
  'metaGeneration':         'M',
  'altTextGeneration':      'M',
  'fixSuggestion':          'M',

  // L-tier tasks
  'reportNarrative':        'L',
  'crisisDraft':            'L',
  'rewriteSuggestion':      'L',
  'fullPageSummary':        'L',
  'competitorComparison':   'L',
  'executiveSummary':       'L',
};

// ─── Token estimation heuristics ───────────────────

function estimateTokens(text: string, taskType: AITaskType): number {
  // Rough heuristic: ~4 chars per token for English
  const inputTokens = Math.ceil(text.length / 4);

  const outputMultipliers: Record<AITaskType, number> = {
    classify: 0.05,    // very short output
    score: 0.1,        // numeric score + brief rationale
    extract: 0.3,      // structured extraction
    embed: 0,          // no text output
    summarize: 0.2,    // compressed summary
    generate: 0.5,     // longer generation
  };

  const outputTokens = Math.ceil(inputTokens * (outputMultipliers[taskType] ?? 0.2));

  // Embed tasks are measured differently
  if (taskType === 'embed') {
    return inputTokens; // only input matters for embeddings
  }

  return inputTokens + outputTokens;
}

// ─── Tier Router ───────────────────────────────────

export interface TierRouterOpts {
  cache?: AIResponseCache;
  rotation?: AIRotationRouter;
  /** Skip deterministic check (useful for testing) */
  skipDeterministic?: boolean;
  /** Skip cache check (useful for testing) */
  skipCache?: boolean;
  /** Confidence threshold for deterministic fast-path (default 0.95) */
  deterministicThreshold?: number;
}

export class TieredRouter {
  private cache: AIResponseCache;
  private rotation: AIRotationRouter;
  private skipDeterministic: boolean;
  private skipCache: boolean;
  private deterministicThreshold: number;

  constructor(opts?: TierRouterOpts) {
    this.cache = opts?.cache ?? getAIResponseCache();
    this.rotation = opts?.rotation ?? getAIRotationRouter();
    this.skipDeterministic = opts?.skipDeterministic ?? false;
    this.skipCache = opts?.skipCache ?? false;
    this.deterministicThreshold = opts?.deterministicThreshold ?? 0.95;
  }

  /**
   * Main entry point: route a task and return a routing decision.
   *
   * @param taskType  - The AITaskType (classify, extract, summarize, etc.)
   * @param input     - The full AI request including prompt + systemPrompt
   * @param pageData  - Page data for deterministic checks (optional)
   * @param subtask   - Specific subtask name for tier overrides (optional)
   * @returns RoutingDecision telling the caller how to proceed
   */
  async routeTask(
    taskType: AITaskType,
    input: AIRequest,
    pageData?: PageData,
    subtask?: string
  ): Promise<RoutingDecision> {

    // ── Step 1: Deterministic fast-path ────────────
    if (!this.skipDeterministic && pageData) {
      const metricKey = subtask ?? taskType;
      const isDeterministic = canComputeDeterministically(metricKey);

      if (isDeterministic) {
        const result = computeDeterministically(metricKey, pageData);
        if (result && result.confidence >= this.deterministicThreshold) {
          return {
            deterministic: true,
            deterministicResult: result,
            reason: `deterministic:${metricKey}:${result.confidence.toFixed(2)}:${result.method}`,
          };
        }
      }

      // Even if the specific subtask isn't fully deterministic,
      // check if any part of the task can be partially satisfied
      if (subtask) {
        // Try the generic task type as fallback
        const genericResult = computeDeterministically(taskType, pageData);
        if (genericResult && genericResult.confidence >= this.deterministicThreshold) {
          // We have a partial deterministic answer — still route to AI
          // but the deterministic result can be used as context
        }
      }
    }

    // ── Step 2: Tier selection ─────────────────────
    const tier = this.selectTier(taskType, subtask, input);

    // ── Step 3: Cache check ───────────────────────
    if (!this.skipCache) {
      const cacheKey = await this.cache.getCacheKey(
        input.prompt,
        input.prompt,
        input.systemPrompt
      );
      const cached = this.cache.get(cacheKey);
      if (cached !== null) {
        return {
          deterministic: false,
          fromCache: true,
          cachedResponse: cached,
          tier,
          reason: `cache-hit:${tier}`,
        };
      }
    }

    // ── Step 4: Provider selection ─────────────────
    const provider = this.rotation.rotateProvider(taskType, tier);
    if (!provider) {
      // No provider available at this tier — try one tier up
      const higherTier = this.promoteTier(tier);
      if (higherTier) {
        const higherProvider = this.rotation.rotateProvider(taskType, higherTier);
        if (higherProvider) {
          return {
            deterministic: false,
            provider: higherProvider,
            model: higherProvider.models[0],
            estimatedTokens: estimateTokens(input.prompt, taskType),
            tier: higherTier,
            reason: `tier-promoted:${tier}->${higherTier}:${higherProvider.name}`,
          };
        }
      }

      // Still no provider — return with reason for caller to handle
      return {
        deterministic: false,
        tier,
        reason: `no-provider-available:${tier}`,
      };
    }

    // ── Step 5: Model selection ────────────────────
    const model = this.selectModel(provider, taskType);

    return {
      deterministic: false,
      provider,
      model,
      estimatedTokens: estimateTokens(input.prompt, taskType),
      tier,
      reason: `provider-selected:${tier}:${provider.name}:${model}`,
    };
  }

  /**
   * Route a batch of tasks, optimizing for cache hits and provider rotation.
   * Returns decisions in the same order as inputs.
   */
  async routeBatch(
    tasks: Array<{
      taskType: AITaskType;
      input: AIRequest;
      pageData?: PageData;
      subtask?: string;
    }>
  ): Promise<RoutingDecision[]> {
    const decisions: RoutingDecision[] = [];

    for (const task of tasks) {
      decisions.push(
        await this.routeTask(task.taskType, task.input, task.pageData, task.subtask)
      );
    }

    return decisions;
  }

  /**
   * After a successful AI call, record the result in the cache and update
   * provider usage.
   */
  async recordSuccess(
    provider: TieredProvider,
    input: AIRequest,
    response: any,
    tokensUsed: number
  ): Promise<void> {
    // Record quota usage
    this.rotation.recordUsage(provider, tokensUsed);

    // Cache the response
    const cacheKey = await this.cache.getCacheKey(
      input.prompt,
      input.prompt,
      input.systemPrompt
    );
    this.cache.set(cacheKey, response, undefined, input.taskType);
  }

  /**
   * Record a provider failure (e.g. 429) and trigger rotation.
   */
  recordFailure(provider: TieredProvider, error: { status?: number; retryAfterMs?: number }): void {
    if (error.status === 429) {
      this.rotation.recordRateLimit(provider, error.retryAfterMs);
    }
    // Other errors are logged but don't trigger backoff
    // (the next rotateProvider call will naturally skip providers
    //  that are rate-limited)
  }

  /**
   * Get the estimated tier for a given task + subtask combination.
   * Useful for UI display and cost estimation.
   */
  getEstimatedTier(taskType: AITaskType, subtask?: string): ModelTier {
    return this.selectTier(taskType, subtask);
  }

  /**
   * Check if a task would be handled deterministically.
   */
  wouldBeDeterministic(taskType: AITaskType, pageData?: PageData, subtask?: string): boolean {
    if (!pageData) return false;
    const metricKey = subtask ?? taskType;
    return canComputeDeterministically(metricKey) !== false;
  }

  /**
   * Get cache stats for the router's cache layer.
   */
  getCacheStats() {
    return this.cache.stats();
  }

  /**
   * Get rotation stats for the router's rotation layer.
   */
  getRotationStats() {
    return {
      providers: this.rotation.getAllProviders(),
      byTier: this.rotation.getProvidersByTier(),
      available: {
        XS: this.rotation.getAvailableProviders('XS'),
        S: this.rotation.getAvailableProviders('S'),
        M: this.rotation.getAvailableProviders('M'),
        L: this.rotation.getAvailableProviders('L'),
      },
    };
  }

  // ─── Private helpers ─────────────────────────────

  /**
   * Determine the minimum tier needed for a task.
   */
  private selectTier(taskType: AITaskType, subtask?: string, input?: AIRequest): ModelTier {
    // Check subtask overrides first (most specific)
    if (subtask && SUBTASK_TIER_OVERRIDES[subtask]) {
      return SUBTASK_TIER_OVERRIDES[subtask];
    }

    // Fall back to task-type minimum
    const minTier = TASK_MIN_TIER[taskType] ?? 'M';

    // Input complexity bump: if prompt is long, bump up a tier
    if (input?.prompt) {
      const tokenEst = estimateTokens(input.prompt, taskType);
      if (tokenEst > 4000 && minTier === 'XS') return 'S';
      if (tokenEst > 8000 && minTier === 'S') return 'M';
      if (tokenEst > 16000 && minTier === 'M') return 'L';
    }

    return minTier;
  }

  /**
   * Promote to the next higher tier.
   */
  private promoteTier(tier: ModelTier): ModelTier | null {
    const order: ModelTier[] = ['XS', 'S', 'M', 'L'];
    const idx = order.indexOf(tier);
    if (idx < order.length - 1) return order[idx + 1];
    return null;
  }

  /**
   * Select the best model from a provider for a given task.
   * Prefers smaller/cheaper models when possible.
   */
  private selectModel(provider: TieredProvider, taskType: AITaskType): string {
    if (provider.models.length === 0) return 'default';
    if (provider.models.length === 1) return provider.models[0];

    // Prefer smaller model for simple tasks
    const simpleTasks: AITaskType[] = ['classify', 'score', 'extract'];
    if (simpleTasks.includes(taskType)) {
      return provider.models[0]; // first model is typically the smaller one
    }

    // Prefer larger model for generation tasks
    return provider.models[provider.models.length - 1];
  }
}

// ─── Singleton ─────────────────────────────────────
let _router: TieredRouter | null = null;
export function getTieredRouter(): TieredRouter {
  if (!_router) _router = new TieredRouter();
  return _router;
}
