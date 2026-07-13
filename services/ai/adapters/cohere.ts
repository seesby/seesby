import { fetchWithRetry } from '../utils/fetchWithRetry';
import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// Cohere — Command models with custom chat format
export function createCohereAdapter(apiKey: string): AIProviderAdapter {
  const BASE = 'https://api.cohere.ai/v1/chat';

  const MODEL_MAP: Record<string, string> = {
    classify:  'command-r',
    summarize: 'command-r-plus',
    extract:   'command-r',
    generate:  'command-r-plus',
    score:     'command-r',
  };

  return {
    provider: 'cohere',
    async isAvailable() { return Boolean(apiKey); },
    async getQuotaRemaining() { return -1; },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      // Cohere chat API uses a custom format with message + preamble
      const body: Record<string, unknown> = {
        model,
        message: request.prompt,
        max_tokens: request.maxTokens || 512,
        temperature: request.temperature ?? 0.3,
      };

      if (request.systemPrompt) {
        body.preamble = request.systemPrompt;
      }

      if (request.format === 'json') {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetchWithRetry(BASE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        timeout: 15000,
      });

      if (!res.ok) throw new Error(`Cohere error ${res.status}`);
      const data = await res.json();
      const text = data.message?.content?.[0]?.text || data.text || '';

      return {
        text,
        provider: 'cohere',
        model,
        tokensUsed: data.meta?.tokens?.input_tokens
          ? data.meta.tokens.input_tokens + (data.meta.tokens.output_tokens || 0)
          : 0,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },

    async *completeStream(request: AIRequest): AsyncGenerator<string, AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      const body: Record<string, unknown> = {
        model,
        message: request.prompt,
        max_tokens: request.maxTokens || 512,
        temperature: request.temperature ?? 0.3,
        stream: true,
      };

      if (request.systemPrompt) {
        body.preamble = request.systemPrompt;
      }

      const res = await fetchWithRetry(BASE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        timeout: 30000,
      });

      if (!res.ok) throw new Error(`Cohere stream error ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'content-delta') {
                const delta = data.delta?.message?.content?.text || '';
                if (delta) {
                  accumulatedText += delta;
                  yield delta;
                }
              }
              if (data.type === 'message-end') break;
            } catch { /* skip parse errors */ }
          }
        }
      }

      return {
        text: accumulatedText,
        provider: 'cohere',
        model,
        tokensUsed: accumulatedText.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
