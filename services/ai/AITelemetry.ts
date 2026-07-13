import type { AIProvider } from './types';

export interface ProviderTelemetry {
  provider: AIProvider;
  successCount: number;
  errorCount: number;
  avgLatency: number;
  lastError?: string;
  lastSuccessAt?: number;
  errors24h: number;
}

const TELEMETRY_KEY = 'seesby:ai-telemetry';

export class AITelemetry {
  private stats: Map<AIProvider, ProviderTelemetry> = new Map();

  constructor() {
    this.load();
  }

  recordSuccess(provider: AIProvider, latencyMs: number) {
    const stat = this.getOrCreateStat(provider);
    stat.successCount++;
    stat.lastSuccessAt = Date.now();
    // Rolling average
    stat.avgLatency = stat.avgLatency === 0 
      ? latencyMs 
      : (stat.avgLatency * 0.9) + (latencyMs * 0.1);
    this.save();
  }

  recordError(provider: AIProvider, error: string) {
    const stat = this.getOrCreateStat(provider);
    stat.errorCount++;
    stat.errors24h++; // Simplified, ideally rolling
    stat.lastError = error;
    this.save();
  }

  getStats(): ProviderTelemetry[] {
    return Array.from(this.stats.values());
  }

  private getOrCreateStat(provider: AIProvider): ProviderTelemetry {
    let stat = this.stats.get(provider);
    if (!stat) {
      stat = {
        provider,
        successCount: 0,
        errorCount: 0,
        avgLatency: 0,
        errors24h: 0
      };
      this.stats.set(provider, stat);
    }
    return stat;
  }

  private load() {
    try {
      const raw = localStorage.getItem(TELEMETRY_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      for (const item of data) {
        this.stats.set(item.provider, item);
      }
    } catch { /* ignore */ }
  }

  private save() {
    try {
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(this.getStats()));
    } catch { /* ignore */ }
  }
}

let _telemetry: AITelemetry | null = null;
export function getAITelemetry(): AITelemetry {
  if (!_telemetry) _telemetry = new AITelemetry();
  return _telemetry;
}
