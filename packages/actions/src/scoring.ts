import type { ActionDescriptor } from '@seesby/types';
import type { SourceTier } from '@seesby/types';

const TIER_CONFIDENCE: Record<SourceTier, number> = {
  T0: 1.0,
  T1: 0.9,
  T2: 0.8,
  T3: 0.7,
  T4: 0.6,
  T5: 0.5,
  T6: 0.4,
  T7: 0.3,
  T8: 0.2,
};

const BAND_MULTIPLIER: Record<string, number> = {
  BLOCKING: 5.0,
  REVENUE_LOSS: 3.0,
  HIGH_LEVERAGE: 2.0,
  STRATEGIC: 1.5,
  HYGIENE: 1.0,
};

export interface ActionScoreInput {
  action: ActionDescriptor;
  expectedDelta: number;
  sourceTier: SourceTier;
  businessValue: number;
  effortHours: number;
  bandMultiplier?: number;
}

export function computeActionScore(input: ActionScoreInput): number {
  const confidence = TIER_CONFIDENCE[input.sourceTier] ?? 0.5;
  const band = input.bandMultiplier ?? BAND_MULTIPLIER[input.action.bandHint] ?? 1.0;
  const effort = Math.max(0.5, input.effortHours);
  return (input.expectedDelta * confidence * input.businessValue * band) / effort;
}

export function rankActions(inputs: ActionScoreInput[]): ActionScoreInput[] {
  return [...inputs].sort((a, b) => computeActionScore(b) - computeActionScore(a));
}
