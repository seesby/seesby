// packages/types/src/sources.ts

export type SourceTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8';

export type SourceTag = 'source' | 'live' | 'browser' | 'scrape' | 'stale' | 'ai' | 'est' | 'low-n' | 'default';

export interface SourceStamp {
	tier: SourceTier;
	provider: string;
	observedAt: string;
	tags: ReadonlyArray<SourceTag>;
	sampleSize?: number;
	confidence?: number;
}

export const TIER_TAG_DEFAULT: Record<SourceTier, ReadonlyArray<SourceTag>> = {
	T0: ['source', 'live'],
	T1: ['source'],
	T2: ['browser'],
	T3: ['scrape'],
	T4: ['scrape', 'stale'],
	T5: ['scrape'],
	T6: ['ai'],
	T7: ['est'],
	T8: ['default'],
};

export function stamp(
	tier: SourceTier,
	provider: string,
	extra: Partial<Omit<SourceStamp, 'tier' | 'provider' | 'observedAt'>> = {},
): SourceStamp {
	return {
		tier,
		provider,
		observedAt: new Date().toISOString(),
		tags: extra.tags ?? TIER_TAG_DEFAULT[tier],
		sampleSize: extra.sampleSize,
		confidence: extra.confidence,
	};
}

export const SOURCE_TIER_LABEL: Record<SourceTier, string> = {
	T0: 'Source / Core',
	T1: 'Live / Browser',
	T2: 'Verified / API',
	T3: 'Direct / Internal',
	T4: 'Scraped / Secondary',
	T5: 'Crawled / External',
	T6: 'AI / Derived',
	T7: 'Historical / Archive',
	T8: 'Default / Fallback',
};
