// packages/actions/src/forecasting/Trainer.ts
import { FeatureExtractor, type PageData } from './FeatureExtractor';
import { ModelStore, type TrainedModel, type TrainingExample } from './ModelStore';

// ─── Types ────────────────────────────────────────────

/** Configuration for the training process. */
export interface TrainConfig {
  /** Minimum samples required before training a model. */
  minSamples: number;
  /** Fraction of data held out for validation (0-1). */
  testSplit: number;
  /** Maximum depth of individual decision trees. */
  maxDepth: number;
  /** Learning rate (shrinkage) for each boosting round. */
  learningRate: number;
  /** Number of boosting rounds (trees in the ensemble). */
  nEstimators: number;
}

/** Internal tree node for the gradient-boosted model. */
interface TreeNode {
  featureIndex: number;
  threshold: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number; // leaf prediction value
}

/** Simplified gradient-boosted model used during training. */
interface GradientBoostedModel {
  trees: TreeNode[];
  learningRate: number;
  baseScore: number;
}

const DEFAULT_CONFIG: TrainConfig = {
  minSamples: 50,
  testSplit: 0.2,
  maxDepth: 4,
  learningRate: 0.1,
  nEstimators: 100,
};

// ─── Implementation ───────────────────────────────────

/**
 * Trains gradient-boosted regressor models from historical action outcomes.
 *
 * Uses a simplified decision-stump / small-tree ensemble rather than a
 * full XGBoost implementation. The model is lightweight enough to store
 * in localStorage/IndexedDB.
 *
 * Call `recordOutcome()` each time an action is executed and the actual
 * delta is measured. When enough samples accumulate, call `train()` or
 * `trainAll()` to rebuild the model.
 */
export class Trainer {
  private featureExtractor: FeatureExtractor;
  private modelStore: ModelStore;
  private config: TrainConfig;

  constructor(modelStore?: ModelStore, config?: Partial<TrainConfig>) {
    this.modelStore = modelStore ?? new ModelStore();
    this.featureExtractor = new FeatureExtractor();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── Public API ─────────────────────────────────────

  /**
   * Record the outcome of an action after it has been executed and measured.
   *
   * @param page         The page the action was applied to.
   * @param actionDomain The domain of the action (e.g. 'content', 'tech').
   * @param actionType   The action code (e.g. 'C01').
   * @param sourceTier   The source tier index (0-8).
   * @param actualDelta  The measured change (sessions, rank improvement, CVR delta).
   */
  recordOutcome(
    page: PageData,
    actionDomain: string,
    actionType: string,
    sourceTier: number,
    actualDelta: number,
  ): void {
    // Build a minimal ActionDescriptor-like object to extract features
    const fakeAction = {
      code: actionType,
      title: actionType,
      description: '',
      modes: [] as readonly string[],
      severity: 'MEDIUM' as const,
      effortMinutes: 30,
      impactHint: 'medium' as const,
      requires: [] as readonly string[],
      capabilityRequires: [] as readonly string[],
      triggerKey: '',
      forecastUnit: 'sessions' as const,
      bandHint: 'MEDIUM' as const,
      units: 'page' as const,
      autoRunCapable: false,
    };

    const features = this.featureExtractor.extract(page, fakeAction as any, sourceTier);
    const numericVector = this.featureExtractor.toNumericVector(features);

    const example: TrainingExample = {
      features: numericVector,
      target: actualDelta,
      actionDomain,
      timestamp: new Date().toISOString(),
    };

    this.modelStore.addExample(example);
  }

  /**
   * Train a model for a specific domain.
   *
   * Returns null if there are not enough samples. Saves the trained model
   * to the ModelStore on success.
   */
  async train(domain: string): Promise<TrainedModel | null> {
    const examples = this.modelStore.getExamples(domain);

    if (examples.length < this.config.minSamples) {
      return null;
    }

    const { X, y } = this.buildDataset(examples);

    if (X.length < this.config.minSamples) {
      return null;
    }

    // Train/test split
    const splitIdx = Math.floor(X.length * (1 - this.config.testSplit));
    const XTrain = X.slice(0, splitIdx);
    const yTrain = y.slice(0, splitIdx);
    const XTest = X.slice(splitIdx);
    const yTest = y.slice(splitIdx);

    // Train the gradient-boosted model
    const gbm = this.trainGBM(XTrain, yTrain);

    // Evaluate on test set
    const rmse = this.evaluate(gbm, XTest, yTest);

    // Extract feature importance
    const featureImportance = this.computeFeatureImportance(gbm);

    // Convert internal model to storage format
    const { weights, intercepts } = this.serializeModel(gbm);

    const model: TrainedModel = {
      actionDomain: domain,
      trainedAt: new Date().toISOString(),
      sampleCount: examples.length,
      rmse,
      featureImportance,
      weights,
      intercepts,
    };

    this.modelStore.save(model);
    return model;
  }

  /**
   * Train models for all domains that have enough samples.
   * Returns a map of domain -> model for successfully trained domains.
   */
  async trainAll(): Promise<Record<string, TrainedModel>> {
    const sampleCounts = this.modelStore.getSampleCounts();
    const results: Record<string, TrainedModel> = {};

    for (const [domain, count] of Object.entries(sampleCounts)) {
      if (count >= this.config.minSamples) {
        const model = await this.train(domain);
        if (model) {
          results[domain] = model;
        }
      }
    }

    return results;
  }

  // ─── Dataset Building ───────────────────────────────

  private buildDataset(examples: TrainingExample[]): { X: number[][]; y: number[] } {
    const X: number[][] = [];
    const y: number[] = [];

    for (const ex of examples) {
      if (ex.features.length > 0 && Number.isFinite(ex.target)) {
        X.push(ex.features);
        y.push(ex.target);
      }
    }

    return { X, y };
  }

  // ─── Gradient-Boosted Regression ────────────────────

  /**
   * Train a simplified gradient-boosted regression model.
   *
   * This is a trimmed-down version of gradient boosting that uses small
   * decision trees (stumps or depth-2). It minimizes squared error loss.
   */
  private trainGBM(X: number[][], y: number[]): GradientBoostedModel {
    const n = X.length;
    if (n === 0) {
      return { trees: [], learningRate: this.config.learningRate, baseScore: 0 };
    }

    // Base prediction: mean of targets
    const baseScore = y.reduce((sum, v) => sum + v, 0) / n;

    const trees: TreeNode[] = [];
    let residuals = y.map(v => v - baseScore);

    for (let t = 0; t < this.config.nEstimators; t++) {
      // Fit a tree to current residuals
      const tree = this.trainTree(X, residuals);
      trees.push(tree);

      // Update residuals: subtract (learningRate * tree prediction)
      for (let i = 0; i < n; i++) {
        residuals[i] -= this.config.learningRate * this.predictTree(tree, X[i]);
      }
    }

    return { trees, learningRate: this.config.learningRate, baseScore };
  }

  /**
   * Train a single decision tree on the given residuals.
   * Recursive binary split up to maxDepth.
   */
  private trainTree(X: number[][], residuals: number[]): TreeNode {
    return this.buildTree(X, residuals, 0);
  }

  private buildTree(X: number[][], residuals: number[], depth: number): TreeNode {
    const n = X.length;
    const featureCount = X[0]?.length ?? 0;

    // Leaf conditions: max depth reached or too few samples
    if (depth >= this.config.maxDepth || n < 4) {
      const value = residuals.reduce((s, v) => s + v, 0) / Math.max(1, n);
      return { featureIndex: 0, threshold: 0, value };
    }

    // Find best split
    let bestFeature = 0;
    let bestThreshold = 0;
    let bestGain = 0;
    const currentVariance = this.variance(residuals);

    // Sample a subset of features for speed (sqrt of total)
    const featureSubset = this.sampleFeatures(featureCount, Math.max(1, Math.floor(Math.sqrt(featureCount))));

    for (const fi of featureSubset) {
      // Get unique thresholds (sample if too many values)
      const values = X.map(row => row[fi]);
      const thresholds = this.sampleThresholds(values, 20);

      for (const threshold of thresholds) {
        const leftIdx: number[] = [];
        const rightIdx: number[] = [];

        for (let i = 0; i < n; i++) {
          if (X[i][fi] <= threshold) {
            leftIdx.push(i);
          } else {
            rightIdx.push(i);
          }
        }

        if (leftIdx.length < 2 || rightIdx.length < 2) continue;

        const leftRes = leftIdx.map(i => residuals[i]);
        const rightRes = rightIdx.map(i => residuals[i]);

        const gain = currentVariance
          - (leftRes.length / n) * this.variance(leftRes)
          - (rightRes.length / n) * this.variance(rightRes);

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = fi;
          bestThreshold = threshold;
        }
      }
    }

    // If no good split found, make a leaf
    if (bestGain <= 0) {
      const value = residuals.reduce((s, v) => s + v, 0) / Math.max(1, n);
      return { featureIndex: 0, threshold: 0, value };
    }

    // Split data
    const leftX: number[][] = [];
    const leftR: number[] = [];
    const rightX: number[][] = [];
    const rightR: number[] = [];

    for (let i = 0; i < n; i++) {
      if (X[i][bestFeature] <= bestThreshold) {
        leftX.push(X[i]);
        leftR.push(residuals[i]);
      } else {
        rightX.push(X[i]);
        rightR.push(residuals[i]);
      }
    }

    return {
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftR, depth + 1),
      right: this.buildTree(rightX, rightR, depth + 1),
    };
  }

  /** Predict using a single tree. */
  private predictTree(node: TreeNode, row: number[]): number {
    if (node.value !== undefined) return node.value;

    if (row[node.featureIndex] <= node.threshold) {
      return node.left ? this.predictTree(node.left, row) : 0;
    }
    return node.right ? this.predictTree(node.right, row) : 0;
  }

  // ─── Evaluation ─────────────────────────────────────

  /**
   * Evaluate a GBM model on a test set using RMSE.
   */
  private evaluate(model: GradientBoostedModel, X: number[][], y: number[]): number {
    if (X.length === 0 || y.length === 0) return 0;

    let sumSquaredError = 0;
    for (let i = 0; i < X.length; i++) {
      const predicted = this.gbmPredict(model, X[i]);
      const error = predicted - y[i];
      sumSquaredError += error * error;
    }

    return Math.sqrt(sumSquaredError / X.length);
  }

  /** Predict using the full gradient-boosted ensemble. */
  private gbmPredict(model: GradientBoostedModel, row: number[]): number {
    let prediction = model.baseScore;
    for (const tree of model.trees) {
      prediction += model.learningRate * this.predictTree(tree, row);
    }
    return prediction;
  }

  // ─── Feature Importance ─────────────────────────────

  /**
   * Compute feature importance by counting how often each feature is used
   * as a split node, weighted by the variance reduction.
   */
  private computeFeatureImportance(model: GradientBoostedModel): Record<string, number> {
    const featureCount = this.featureExtractor.getFeatureCount();
    const names = this.featureExtractor.getFeatureNames();
    const importance = new Array<number>(featureCount).fill(0);

    for (const tree of model.trees) {
      this.accumulateTreeImportance(tree, importance);
    }

    // Normalize to sum to 1
    const total = importance.reduce((s, v) => s + v, 0);
    const result: Record<string, number> = {};

    for (let i = 0; i < featureCount; i++) {
      result[names[i]] = total > 0 ? importance[i] / total : 0;
    }

    return result;
  }

  private accumulateTreeImportance(node: TreeNode, importance: number[]): void {
    if (node.value !== undefined) return;

    importance[node.featureIndex] = (importance[node.featureIndex] ?? 0) + 1;

    if (node.left) this.accumulateTreeImportance(node.left, importance);
    if (node.right) this.accumulateTreeImportance(node.right, importance);
  }

  // ─── Serialization ──────────────────────────────────

  /**
   * Convert the internal GradientBoostedModel into the storage format
   * (weights matrix + intercepts array) used by the Predictor.
   */
  private serializeModel(model: GradientBoostedModel): { weights: number[][]; intercepts: number[] } {
    const featureCount = this.featureExtractor.getFeatureCount();

    // Each tree contributes a column to the weights matrix.
    // In the simplified model, we extract a single weight per feature per tree
    // by averaging the leaf values reachable through each feature.
    const weights: number[][] = Array.from({ length: featureCount }, () =>
      new Array<number>(model.trees.length).fill(0),
    );

    for (let t = 0; t < model.trees.length; t++) {
      const treeWeights = this.extractTreeWeights(model.trees[t], featureCount);
      for (let f = 0; f < featureCount; f++) {
        weights[f][t] = treeWeights[f];
      }
    }

    // Average weights across trees to get a single column per feature
    const averagedWeights: number[][] = Array.from({ length: featureCount }, () => [0]);
    for (let f = 0; f < featureCount; f++) {
      const sum = weights[f].reduce((s, v) => s + v, 0);
      averagedWeights[f][0] = sum / Math.max(1, model.trees.length);
    }

    return {
      weights: averagedWeights,
      intercepts: [model.baseScore],
    };
  }

  /** Recursively extract per-feature weight contributions from a tree. */
  private extractTreeWeights(node: TreeNode, featureCount: number): number[] {
    const w = new Array<number>(featureCount).fill(0);

    if (node.value !== undefined) {
      return w;
    }

    // The split feature gets credit proportional to its usage
    w[node.featureIndex] = 1;

    if (node.left) {
      const lw = this.extractTreeWeights(node.left, featureCount);
      for (let i = 0; i < featureCount; i++) w[i] += lw[i] * 0.5;
    }
    if (node.right) {
      const rw = this.extractTreeWeights(node.right, featureCount);
      for (let i = 0; i < featureCount; i++) w[i] += rw[i] * 0.5;
    }

    return w;
  }

  // ─── Statistical Helpers ────────────────────────────

  private variance(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    let sumSq = 0;
    for (const v of values) {
      const diff = v - mean;
      sumSq += diff * diff;
    }
    return sumSq / n;
  }

  private sampleFeatures(total: number, count: number): number[] {
    if (count >= total) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const indices = new Set<number>();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * total));
    }
    return Array.from(indices);
  }

  /** Extract up to maxCount representative thresholds from a feature column. */
  private sampleThresholds(values: number[], maxCount: number): number[] {
    const sorted = [...new Set(values)].sort((a, b) => a - b);
    if (sorted.length <= maxCount) return sorted;

    const step = Math.max(1, Math.floor(sorted.length / maxCount));
    const thresholds: number[] = [];
    for (let i = 0; i < sorted.length - 1; i += step) {
      thresholds.push((sorted[i] + sorted[i + 1]) / 2);
    }
    return thresholds;
  }
}
