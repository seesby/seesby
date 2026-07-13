// packages/fingerprint/src/cascades.ts
import type { ProbeContext, DetectorStep, DetectorOutcome } from './detectors/types';
import type { SourceStamp } from '@seesby/types';

export interface FpValue<T> {
	value: T;
	confidence: number;
	source: SourceStamp;
}

export async function runCascade<T>(
	ctx: ProbeContext,
	steps: ReadonlyArray<DetectorStep<T>>,
	options: { defaultValue: T; defaultProvider: string }
): Promise<FpValue<T>> {
	for (const step of steps) {
		try {
			const res = await step(ctx);
			if (res) {
				return {
					value: res.value,
					confidence: res.confidence,
					source: {
						tier: res.tier,
						provider: res.provider,
						observedAt: new Date().toISOString(),
						tags: res.tags ?? [],
						sampleSize: res.sampleSize,
						confidence: res.confidence,
					},
				};
			}
		} catch (err) {
			console.error(`Detector step failed`, err);
		}
	}

	return {
		value: options.defaultValue,
		confidence: 0,
		source: {
			tier: 'T8',
			provider: options.defaultProvider,
			observedAt: new Date().toISOString(),
			tags: ['default'],
		},
	};
}
