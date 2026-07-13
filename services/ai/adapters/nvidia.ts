import { fetchWithRetry } from '../utils/fetchWithRetry';
import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// NVIDIA NIM — GPU-optimized inference from NVIDIA
export function createNvidiaAdapter(apiKey: string): AIProviderAdapter {
  const BASE = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const MODEL_MAP: Record<string, string> = {
    classify:  'nvidia/llama-3.1-8b-instruct',
    summarize: 'nvidia/llama-3.1-70b-instruct',
    extract:   'nvidia/llama-3.1-8b-instruct',
    generate:  'nvidia/llama-3.1-70b-instruct',
    score:     'nvidia/llama-3.1-8b-instruct',
  };

  return {
    provider: 'nvidia',
    async isAvailable() { return Boolean(apiKey); },
    async getQuotaRemaining() { return -1; },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      const res = await fetchWithRetry(BASE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(request.systemPrompt
              ? [{ role: 'system', content: request.systemPrompt }]
              : []),
            { role: 'user', content: request.prompt },
          ],
          max_tokens: request.maxTokens || 512,
          temperature: request.temperature ?? 0.3,
          ...(request.format === 'json'
            ? { response_format: { type: 'json_object' } }
            : {}),
        }),
        timeout: 15000,
      });

      if (!res.ok) throw new Error(`NVIDIA error ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        provider: 'nvidia',
        model,
        tokensUsed: data.usage?.total_tokens || 0,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },

    async *completeStream(request: AIRequest): AsyncGenerator<string, AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      const body = {
        model,
        stream: true,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        max_tokens: request.maxTokens || 512,
        temperature: request.temperature ?? 0.3,
      };

      const res = await fetchWithRetry(BASE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        timeout: 30000,
      });

      if (!res.ok) throw new Error(`NVIDIA stream error ${res.status}`);

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
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices?.[0]?.delta?.content || '';
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
        provider: 'nvidia',
        model,
        tokensUsed: accumulatedText.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
