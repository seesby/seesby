import { fetchWithRetry } from '../utils/fetchWithRetry';
import type { AIProviderAdapter, AIRequest, AIResponse } from '../types';

// IBM watsonx — enterprise AI platform
export function createIBMAdapter(apiKey: string): AIProviderAdapter {
  const BASE = 'https://us-south.ml.cloud.ibm.com/ml/v1/text/chat';

  const MODEL_MAP: Record<string, string> = {
    classify:  'ibm/granite-8b-japanese',
    summarize: 'ibm/granite-70b-latinum',
    extract:   'ibm/granite-8b-japanese',
    generate:  'ibm/granite-70b-latinum',
    score:     'ibm/granite-8b-japanese',
  };

  return {
    provider: 'ibm',
    async isAvailable() { return Boolean(apiKey); },
    async getQuotaRemaining() { return -1; },

    async complete(request: AIRequest): Promise<AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      // IBM watsonx uses a custom messages format
      const messages: Array<{ role: string; content: string }> = [];
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.prompt });

      const res = await fetchWithRetry(`${BASE}?version=2024-03-01`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: model,
          messages,
          max_tokens: request.maxTokens || 512,
          temperature: request.temperature ?? 0.3,
          ...(request.format === 'json'
            ? { response_format: { type: 'json_object' } }
            : {}),
        }),
        timeout: 15000,
      });

      if (!res.ok) throw new Error(`IBM watsonx error ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        provider: 'ibm',
        model,
        tokensUsed: data.usage?.total_tokens || 0,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },

    async *completeStream(request: AIRequest): AsyncGenerator<string, AIResponse> {
      const model = MODEL_MAP[request.taskType] || MODEL_MAP.classify;
      const start = Date.now();

      const messages: Array<{ role: string; content: string }> = [];
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.prompt });

      const res = await fetchWithRetry(`${BASE}?version=2024-03-01`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: model,
          messages,
          max_tokens: request.maxTokens || 512,
          temperature: request.temperature ?? 0.3,
          stream: true,
        }),
        timeout: 30000,
      });

      if (!res.ok) throw new Error(`IBM watsonx stream error ${res.status}`);

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
        provider: 'ibm',
        model,
        tokensUsed: accumulatedText.length / 4,
        latencyMs: Date.now() - start,
        fromCache: false,
      };
    },
  };
}
