// services/WqaSiteMetrics.ts
import { filterVisibleMetrics, ALL_METRICS } from '@seesby/metrics';
import { resolveMetricFromLadder } from '@seesby/compute';
// @ts-ignore
import { siteProducers } from '@/services/producers/site';
import type { Industry } from '@seesby/types';

export interface WqaSiteMetrics {
	sitemapCoverage: number;
	brokenRate: number;
	duplicateRate: number;
	orphanRate: number;
	thinContentRate: number;
	schemaCoverage: number;
	wwwInconsistency: boolean;
	healthScore: number;
	healthGrade: string;
	/** opaque bag for any site-level metric the catalog produces, keyed by metric.key */
	extras: Record<string, unknown>;
}

function num(v: any): number {
    return typeof v === 'number' ? v : 0;
}

export async function computeWqaSiteMetrics(_pages: unknown[], industry: Industry, ctx: any): Promise<WqaSiteMetrics> {
    const visibilityCtx = {
        mode: ctx.mode,
        industry: industry,
        cms: ctx.cms,
        language: ctx.language,
        connectedIntegrations: Object.entries(ctx.connections || {}).filter(([_, v]) => v).map(([k]) => k),
        capabilities: ctx.capabilities || []
    };

	const defs = filterVisibleMetrics(ALL_METRICS, visibilityCtx, 'site');
	const extras: Record<string, unknown> = {};
	let sitemapCoverage = 0, brokenRate = 0, duplicateRate = 0, orphanRate = 0, thinContentRate = 0, schemaCoverage = 0;
	let wwwInconsistency = false, healthScore = 0;
	let healthGrade = 'F';

	for (const d of defs) {
        // In a real implementation, we would fetch samples from persistence/cache
        // For this adapter, we assume ctx contains the necessary sample pool or resolver context
		const sample = resolveMetricFromLadder(d, ctx.samples || []);
		if (!sample) continue;
		extras[d.key] = sample.value;
		switch (d.key) {
			case 's.crawl.sitemapCoverage':       sitemapCoverage = num(sample.value); break;
			case 's.crawl.brokenRate':            brokenRate = num(sample.value); break;
			case 's.crawl.duplicateRate':         duplicateRate = num(sample.value); break;
			case 's.crawl.orphanRate':            orphanRate = num(sample.value); break;
			case 's.crawl.thinContentRate':       thinContentRate = num(sample.value); break;
			case 's.schema.coverage':             schemaCoverage = num(sample.value); break;
			case 's.crawl.wwwInconsistency':      wwwInconsistency = !!sample.value; break;
			case 's.health.score':                healthScore = num(sample.value); break;
			case 's.health.grade':                healthGrade = String(sample.value ?? 'F'); break;
		}
	}
	return { sitemapCoverage, brokenRate, duplicateRate, orphanRate, thinContentRate, schemaCoverage, wwwInconsistency, healthScore, healthGrade, extras };
}
