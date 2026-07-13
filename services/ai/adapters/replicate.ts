import { fetchWithRetry } from '../utils/fetchWithRetry';
import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// Replicate — async predictions with polling
export function createReplicateAdapter(apiKey: string): AIProviderAdapter {
  const MODEL_MAP: Record<string, string> = {
    classify:  'meta/meta-llama-3-8b-instruct',
    summarize: 'meta/meta-llama-3-70b-instruct',
    extract:   'meta/meta-llama-3-8b-instruct',
    generate:  'meta/meta-llama-3-70b-instruct',
    score:     'meta/meta-llama-3-8b-instruct',
  };

  /**
   * Polls a Replicate prediction until it completes or fails.
   */
  async function pollPrediction(url: string): Promise<{ output: string; model: string }> {
    const maxAttempts = 60;
    const pollInterval = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (!res.ok) throw new Error(`Replicate poll error ${res.status}`);
      const data = await res.json();

      if (data.status === 'succeeded') {
        const output = Array.isArray(data.output)
          ? data.output.join('')
          : typeof data.output === 'string'
            ? data.output
            : JSON.stringify(data.output);
        return { output, model: data.version || MODEL_MAP.classify };
      }

      if (data.status === 'failed' || data.status === 'canceled') {
        throw new Error(`Replicate prediction ${data.status}: ${data.error || 'unknown'}`);
      }

      // Still processing, wait and retry
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Replicate prediction timed out');
  }

  return {
    provider: 'replicate',
    async isAvailable() { return Boolean(apiKey); },
    async getQuotaRemaining() { return -1; },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      const prompt = request.systemPrompt
        ? `${request.systemPrompt}\n\n${request.prompt}`
        : request.prompt;

      // Create prediction
      const createRes = await fetchWithRetry('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: model,
          input: {
            prompt,
            max_new_tokens: request.maxTokens || 512,
            temperature: request.temperature ?? 0.3,
          },
        }),
        timeout: 15000,
      });

      if (!createRes.ok) throw new Error(`Replicate create error ${createRes.status}`);
      const prediction = await createRes.json();

      // Poll until done
      const { output, model: usedModel } = await pollPrediction(prediction.urls.get);

      return {
        text: output,
        provider: 'replicate',
        model: usedModel,
        tokensUsed: output.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },

    async *completeStream(request: AIRequest): AsyncGenerator<string, AIResponse> {
      // Replicate does not support true SSE streaming; yield the full result
      const result = await this.complete(request);
      yield result.text;
      return result;
    },
  };
}
