import { fetchWithRetry } from '../utils/fetchWithRetry';
import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// AI21 Labs — Jurassic series with custom chat format
export function createAI21Adapter(apiKey: string): AIProviderAdapter {
  const MODEL_MAP: Record<string, string> = {
    classify:  'jamba-1.5-mini',
    summarize: 'jamba-1.5-large',
    extract:   'jamba-1.5-mini',
    generate:  'jamba-1.5-large',
    score:     'jamba-1.5-mini',
  };

  return {
    provider: 'ai21',
    async isAvailable() { return Boolean(apiKey); },
    async getQuotaRemaining() { return -1; },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      // AI21 uses model in URL path
      const url = `https://api.ai21.com/studio/v1/${model}/chat`;

      const messages: Array<{ text: string; role: string }> = [];
      if (request.systemPrompt) {
        messages.push({ text: request.systemPrompt, role: 'system' });
      }
      messages.push({ text: request.prompt, role: 'user' });

      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          max_tokens: request.maxTokens || 512,
          temperature: request.temperature ?? 0.3,
        }),
        timeout: 15000,
      });

      if (!res.ok) throw new Error(`AI21 error ${res.status}`);
      const data = await res.json();
      const text = data.outputs?.[0]?.text || '';

      return {
        text,
        provider: 'ai21',
        model,
        tokensUsed: data.usage?.total_tokens || 0,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },

    async *completeStream(request: AIRequest): AsyncGenerator<string, AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      const url = `https://api.ai21.com/studio/v1/${model}/chat`;

      const messages: Array<{ text: string; role: string }> = [];
      if (request.systemPrompt) {
        messages.push({ text: request.systemPrompt, role: 'system' });
      }
      messages.push({ text: request.prompt, role: 'user' });

      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          max_tokens: request.maxTokens || 512,
          temperature: request.temperature ?? 0.3,
          stream: true,
        }),
        timeout: 30000,
      });

      if (!res.ok) throw new Error(`AI21 stream error ${res.status}`);

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
              const delta = data.outputs?.[0]?.text || '';
              if (delta) {
                accumulatedText += delta;
                yield delta;
              }
            } catch { /* skip parse errors */ }
          }
        }
      }

      return {
        text: accumulatedText,
        provider: 'ai21',
        model,
        tokensUsed: accumulatedText.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
