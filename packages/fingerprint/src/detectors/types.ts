// packages/fingerprint/src/detectors/types.ts
import type { SourceTag, SourceTier } from '@seesby/types';

export interface DetectorOutcome<T> {
	value: T;
	confidence: number;            // 0..1
	tier: SourceTier;
	provider: string;              // e.g. 'fingerprint.cms.shopify.api'
	sampleSize?: number;
	tags?: ReadonlyArray<SourceTag>;
}

export interface ProbeContext {
	projectId: string;
	hostname: string;
	htmlSamples: ReadonlyArray<{ url: string; html: string; headers: Record<string, string> }>;
	headers: Record<string, string>;
	now: Date;
	connections: { gsc?: boolean; ga4?: boolean; gbp?: boolean; bing?: boolean; backlinks?: boolean };
}

export type DetectorStep<T> = (ctx: ProbeContext) => Promise<DetectorOutcome<T> | null>;
