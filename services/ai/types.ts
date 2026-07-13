// ─── Core Types ─────────────────────────────────────
export type AIProvider =
  | 'local'           // Browser WASM/WebGPU
  | 'cloudflare'      // Cloudflare Workers AI
  | 'github'          // GitHub Models API
  | 'gemini'          // Google Gemini Flash
  | 'groq'            // Groq (Llama/Mixtral)
  | 'huggingface'     // HuggingFace Inference
  | 'openai'          // User-provided key (optional)
  | 'anthropic'       // User-provided key (optional)
  | 'server'          // Custom server-side implementation
  | 'together'        // Together AI
  | 'openrouter'      // OpenRouter
  | 'deepseek'        // DeepSeek AI
  | 'mistral'         // Mistral Le Chat
  | 'cohere'          // Cohere
  | 'ai21'            // AI21 Labs
  | 'fireworks'       // Fireworks AI
  | 'replicate'       // Replicate
  | 'nvidia'          // NVIDIA NIM
  | 'cerebras'        // Cerebras Inference
  | 'ibm'             // IBM watsonx
  | 'tencent'         // Tencent Hunyuan
  | 'zhipu';          // Zhipu GLM

export type AITaskType =
  | 'classify'        // Intent, sentiment, category
  | 'summarize'       // Page summary, crawl narrative
  | 'extract'         // Keywords, entities, topics
  | 'generate'        // Meta descriptions, alt text, fix suggestions
  | 'score'           // Content quality, E-E-A-T, priority
  | 'embed';          // Text embeddings for similarity/clustering

export interface AIRequest {
  taskType: AITaskType;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  format?: 'json' | 'text';
  stream?: boolean;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  fromCache: boolean;
}

export interface AIProviderAdapter {
  provider: AIProvider;
  isAvailable: () => Promise<boolean>;
  getQuotaRemaining: () => Promise<number>; // -1 = unlimited
  complete: (request: AIRequest) => Promise<AIResponse>;
  completeStream?: (request: AIRequest) => AsyncGenerator<string, AIResponse>;
}

export interface AIProviderConfig {
  provider: AIProvider;
  enabled: boolean;
  priority: number; // lower = tried first
  apiKey?: string;
  endpoint?: string;
  models: Record<AITaskType, string>;
  quotaLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerDay: number;
  };
}

export interface AIQuotaState {
  provider: AIProvider;
  requestsToday: number;
  tokensToday: number;
  requestsThisMinute: number;
  lastResetMinute: number;
  lastResetDay: string; // YYYY-MM-DD
}
