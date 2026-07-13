// packages/actions/src/forecasting/Predictor.ts
import type { ActionDescriptor } from '@seesby/types';
import { FeatureExtractor, type ActionFeatures, type PageData, codeToDomain } from './FeatureExtractor';
import { ModelStore, type TrainedModel } from './ModelStore';

// ─── Types ────────────────────────────────────────────

/** Prediction result for a single action. */
export interface Prediction {
  /** Predicted change (sessions, rank, CVR) — positive is improvement. */
  predictedDelta: number;
  /** Confidence in the prediction (0-1). */
  confidence: number;
  /** Which model produced this prediction. */
  modelSource: 'trained' | 'industry-default' | 'rule-based';
  /** Days since the trained model was last updated. */
  modelAge?: number;
  /** Number of training samples used to build the model. */
  sampleCount?: number;
}

// ─── Industry Default Deltas ──────────────────────────
// Fallback when no trained model exists. Keyed by industry, then by action code.
// Values represent expected delta (session / rank / CVR improvement) for that action.

const INDUSTRY_DEFAULTS: Record<string, Record<string, number>> = {
  ecommerce: { C01: 15, C02: 10, C03: 25, C04: 30, T01: 40, T08: 20, S01: 30, A01: 10, U01: 18, E01: 22 },
  saas:      { C01: 12, C02: 8,  C03: 20, C04: 22, T01: 35, T08: 18, S01: 25, A01: 8,  U01: 15, E01: 0 },
  blog:      { C01: 10, C02: 7,  C03: 15, C04: 18, T01: 30, T08: 12, S01: 20, A01: 5,  U01: 10, E01: 0 },
  news:      { C01: 8,  C02: 5,  C03: 12, C04: 14, T01: 25, T08: 10, S01: 15, A01: 4,  U01: 8,  E01: 0 },
  finance:   { C01: 14, C02: 9,  C03: 22, C04: 25, T01: 38, T08: 22, S01: 28, A01: 7,  U01: 16, E01: 0 },
  education: { C01: 11, C02: 7,  C03: 18, C04: 20, T01: 32, T08: 15, S01: 22, A01: 6,  U01: 12, E01: 0 },
  healthcare:{ C01: 13, C02: 8,  C03: 20, C04: 22, T01: 35, T08: 20, S01: 25, A01: 6,  U01: 14, E01: 0 },
  local:     { C01: 10, C02: 6,  C03: 14, C04: 16, T01: 28, T08: 12, S01: 18, A01: 5,  U01: 10, E01: 0 },
  media:     { C01: 9,  C02: 6,  C03: 14, C04: 16, T01: 28, T08: 11, S01: 18, A01: 5,  U01: 9,  E01: 0 },
  general:   { C01: 10, C02: 7,  C03: 15, C04: 18, T01: 30, T08: 15, S01: 20, A01: 5,  U01: 12, E01: 0 },
};

const DEFAULT_DELTA: Record<string, number> = {
  content: 10,
  tech: 20,
  links: 15,
  search: 18,
  ai: 6,
  paid: 12,
  ux: 14,
  social: 8,
  commerce: 16,
  local: 10,
  unknown: 10,
};

/** Maximum age (in days) for a trained model to still be considered current. */
const MODEL_STALE_DAYS = 90;

// ─── Implementation ───────────────────────────────────

/**
 * Predicts the expected delta for an action on a page.
 *
 * Prefers a trained model when available and recent enough, then falls
 * back to industry-specific defaults, then to domain-level defaults.
 */
export class Predictor {
  private featureExtractor: FeatureExtractor;
  private modelStore: ModelStore;

  constructor(modelStore?: ModelStore) {
    this.modelStore = modelStore ?? new ModelStore();
    this.featureExtractor = new FeatureExtractor();
  }

  /**
   * Predict the expected delta for a single action.
   */
  predict(page: PageData, action: ActionDescriptor, sourceTier: number): Prediction {
    const domain = codeToDomain(action.code);

    // Try trained model
    const model = this.modelStore.load(domain);
    if (model) {
      const features = this.featureExtractor.extract(page, action, sourceTier);
      return this.predictWithModel(features, model, page);
    }

    // Fall back to defaults
    return this.predictWithDefaults(action, page.industry);
  }

  /**
   * Predict for multiple actions on the same page (shared context).
   */
  predictBatch(
    page: PageData,
    actions: ActionDescriptor[],
    sourceTier: number,
  ): Prediction[] {
    return actions.map(action => this.predict(page, action, sourceTier));
  }

  // ─── Private ────────────────────────────────────────

  /**
   * Run inference through a trained model.
   */
  private predictWithModel(
    features: ActionFeatures,
    model: TrainedModel,
    page: PageData,
  ): Prediction {
    const vec = this.featureExtractor.toNumericVector(features);
    const delta = this.modelPredict(vec, model);
    const confidence = this.estimateConfidence(model, features);
    const ageDays = this.modelAgeDays(model.trainedAt);

    return {
      predictedDelta: Math.max(0, delta),
      confidence,
      modelSource: 'trained',
      modelAge: ageDays,
      sampleCount: model.sampleCount,
    };
  }

  /**
   * Run simplified model inference.
   * In a real implementation this would call ONNX Runtime or similar.
   * Here we use a weighted sum of features as a proxy for a small tree ensemble.
   */
  private modelPredict(vec: number[], model: TrainedModel): number {
    let prediction = model.intercepts[0] ?? 0;

    // Simple linear combination (proxy for boosted trees)
    for (let i = 0; i < vec.length && i < model.weights.length; i++) {
      prediction += vec[i] * (model.weights[i]?.[0] ?? 0);
    }

    return prediction;
  }

  /**
   * Fall back to industry-specific or domain-level defaults.
   */
  private predictWithDefaults(
    action: ActionDescriptor,
    industry?: string,
  ): Prediction {
    const domain = codeToDomain(action.code);
    const ind = industry ?? 'general';

    // Try industry-specific defaults first
    const industryDefaults = INDUSTRY_DEFAULTS[ind];
    if (industryDefaults && action.code in industryDefaults) {
      return {
        predictedDelta: industryDefaults[action.code],
        confidence: 0.3,
        modelSource: 'industry-default',
      };
    }

    // Fall back to domain-level default
    const domainDelta = DEFAULT_DELTA[domain] ?? DEFAULT_DELTA.unknown;
    return {
      predictedDelta: domainDelta,
      confidence: 0.15,
      modelSource: 'rule-based',
    };
  }

  /**
   * Estimate confidence based on model quality and feature coverage.
   */
  private estimateConfidence(model: TrainedModel, features: ActionFeatures): number {
    // Start with sample count factor (more samples = more confidence, caps at 200)
    const sampleFactor = Math.min(1, model.sampleCount / 200);

    // RMSE factor (lower error = more confidence)
    const rmseFactor = Math.max(0, 1 - model.rmse / 50);

    // Age penalty (older models lose confidence)
    const ageDays = this.modelAgeDays(model.trainedAt);
    const ageFactor = ageDays > MODEL_STALE_DAYS
      ? Math.max(0.3, 1 - (ageDays - MODEL_STALE_DAYS) / 180)
      : 1;

    // Combine: weighted geometric mean
    const confidence = Math.pow(sampleFactor, 0.4) * Math.pow(rmseFactor, 0.4) * Math.pow(ageFactor, 0.2);

    return Math.max(0.05, Math.min(0.95, confidence));
  }

  /**
   * Calculate the age of a model in days from an ISO timestamp.
   */
  private modelAgeDays(trainedAt: string): number {
    const trained = new Date(trainedAt).getTime();
    const now = Date.now();
    return Math.max(0, (now - trained) / (24 * 60 * 60 * 1000));
  }
}
