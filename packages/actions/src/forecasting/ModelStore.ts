// packages/actions/src/forecasting/ModelStore.ts
import type { ActionFeatures } from './FeatureExtractor';

// ─── Types ────────────────────────────────────────────

/** Metadata and weights for a trained model. */
export interface TrainedModel {
  /** Which domain this model covers (e.g. 'content', 'tech', 'links'). */
  actionDomain: string;
  /** ISO timestamp of when the model was trained. */
  trainedAt: string;
  /** How many training examples were used. */
  sampleCount: number;
  /** Root mean square error on the validation set. */
  rmse: number;
  /** Feature name -> importance weight (0-1, sums to 1). */
  featureImportance: Record<string, number>;
  /** Model weights (simplified — in production, use ONNX or similar). */
  weights: number[][];
  /** Model intercepts (one per boosting round). */
  intercepts: number[];
}

/** A single training observation. */
export interface TrainingExample {
  /** Numeric feature vector (matches FeatureExtractor output). */
  features: number[];
  /** Actual observed delta (sessions change, rank change, CVR change). */
  target: number;
  /** Action domain this example belongs to. */
  actionDomain: string;
  /** ISO timestamp of when the outcome was recorded. */
  timestamp: string;
}

// ─── Storage Keys ─────────────────────────────────────

const DEFAULT_STORAGE_KEY = 'hl_forecasting';
const MODELS_SUFFIX = '_models';
const EXAMPLES_SUFFIX = '_examples';

// ─── Implementation ───────────────────────────────────

/**
 * Per-action-type model storage.
 *
 * Stores trained models and training examples in localStorage/IndexedDB.
 * Falls back to an in-memory store when browser storage is unavailable.
 */
export class ModelStore {
  private storageKey: string;
  private memoryModels: Map<string, TrainedModel> = new Map();
  private memoryExamples: Map<string, TrainingExample[]> = new Map();

  constructor(storageKey?: string) {
    this.storageKey = storageKey ?? DEFAULT_STORAGE_KEY;
  }

  // ─── Model Persistence ──────────────────────────────

  /**
   * Load a trained model for a domain.
   * Returns null if no model exists for the domain.
   */
  load(domain: string): TrainedModel | null {
    // Try memory first
    if (this.memoryModels.has(domain)) {
      return this.memoryModels.get(domain)!;
    }
    // Try localStorage
    try {
      const raw = localStorage.getItem(this.modelsKey(domain));
      if (raw) {
        const model = JSON.parse(raw) as TrainedModel;
        this.memoryModels.set(domain, model);
        return model;
      }
    } catch {
      // localStorage unavailable or parse error — fall through
    }
    return null;
  }

  /**
   * Save a trained model for its domain.
   */
  save(model: TrainedModel): void {
    this.memoryModels.set(model.actionDomain, model);
    try {
      localStorage.setItem(this.modelsKey(model.actionDomain), JSON.stringify(model));
    } catch {
      // Storage quota exceeded or unavailable — model is still in memory
    }
  }

  /**
   * Delete a trained model for a domain.
   */
  delete(domain: string): void {
    this.memoryModels.delete(domain);
    try {
      localStorage.removeItem(this.modelsKey(domain));
    } catch {
      // Ignore
    }
  }

  // ─── Training Examples ──────────────────────────────

  /**
   * Add a training example to the store.
   */
  addExample(example: TrainingExample): void {
    const existing = this.memoryExamples.get(example.actionDomain) ?? [];
    existing.push(example);
    this.memoryExamples.set(example.actionDomain, existing);
    this.persistExamples(example.actionDomain, existing);
  }

  /**
   * Get all stored examples for a domain.
   */
  getExamples(domain: string): TrainingExample[] {
    if (this.memoryExamples.has(domain)) {
      return this.memoryExamples.get(domain)!;
    }
    // Try localStorage
    try {
      const raw = localStorage.getItem(this.examplesKey(domain));
      if (raw) {
        const examples = JSON.parse(raw) as TrainingExample[];
        this.memoryExamples.set(domain, examples);
        return examples;
      }
    } catch {
      // Fall through
    }
    return [];
  }

  /**
   * Check if enough examples exist for a domain to justify training.
   */
  hasEnoughSamples(domain: string, minSamples = 50): boolean {
    return this.getExamples(domain).length >= minSamples;
  }

  /**
   * Get sample counts per domain.
   */
  getSampleCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    // Scan localStorage keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storageKey + EXAMPLES_SUFFIX + '_')) {
          const domain = key.slice((this.storageKey + EXAMPLES_SUFFIX + '_').length);
          const raw = localStorage.getItem(key);
          if (raw) {
            counts[domain] = JSON.parse(raw).length;
          }
        }
      }
    } catch {
      // Ignore
    }
    // Merge in-memory counts (may be higher if not persisted yet)
    for (const [domain, examples] of this.memoryExamples) {
      counts[domain] = Math.max(counts[domain] ?? 0, examples.length);
    }
    return counts;
  }

  /**
   * Remove training examples older than maxAgeDays.
   */
  pruneOldExamples(maxAgeDays = 90): void {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoffISO = new Date(cutoff).toISOString();

    for (const [domain, examples] of this.memoryExamples) {
      const filtered = examples.filter(e => e.timestamp >= cutoffISO);
      this.memoryExamples.set(domain, filtered);
      this.persistExamples(domain, filtered);
    }

    // Also scan localStorage for domains not in memory
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.examplesKey(''))) {
          const domain = key.slice(this.examplesKey('').length);
          if (!this.memoryExamples.has(domain)) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const examples = JSON.parse(raw) as TrainingExample[];
              const filtered = examples.filter(e => e.timestamp >= cutoffISO);
              this.persistExamples(domain, filtered);
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // ─── Internal ───────────────────────────────────────

  private modelsKey(domain: string): string {
    return `${this.storageKey}${MODELS_SUFFIX}_${domain}`;
  }

  private examplesKey(domain: string): string {
    return `${this.storageKey}${EXAMPLES_SUFFIX}_${domain}`;
  }

  private persistExamples(domain: string, examples: TrainingExample[]): void {
    try {
      localStorage.setItem(this.examplesKey(domain), JSON.stringify(examples));
    } catch {
      // Storage quota exceeded — examples still in memory
    }
  }
}
