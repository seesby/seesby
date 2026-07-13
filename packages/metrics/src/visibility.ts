// packages/metrics/src/visibility.ts
import type { MetricDef, Mode, Industry, CmsKey, LanguageCode, MetricSurface, MetricRole } from '@seesby/types';

export interface VisibilityContext {
	mode: Mode;
	industry: Industry;
	cms: CmsKey;
	language: LanguageCode;
	connectedIntegrations: string[];
	capabilities: string[];
}

export function isMetricVisible(def: MetricDef, ctx: VisibilityContext, surface?: MetricSurface): boolean {
	if (def.deprecated) return false;

	const { gate } = def;
	if (gate) {
		if (gate.modes && !gate.modes.includes(ctx.mode)) return false;
		if (gate.industries && !gate.industries.includes(ctx.industry)) return false;
		if (gate.excludeIndustries && gate.excludeIndustries.includes(ctx.industry)) return false;
		if (gate.cms && !gate.cms.includes(ctx.cms)) return false;
		if (gate.languages && !gate.languages.includes(ctx.language)) return false;
		if (gate.requireConnected) {
			for (const integration of gate.requireConnected) {
				if (!ctx.connectedIntegrations.includes(integration)) return false;
			}
		}
		if (gate.requireCapability) {
			for (const cap of gate.requireCapability) {
				if (!ctx.capabilities.includes(cap)) return false;
			}
		}
	}

	if (surface && def.surfaces && !def.surfaces.includes(surface)) return false;

	return true;
}

export function filterVisibleMetrics(defs: MetricDef[], ctx: VisibilityContext, surface?: MetricSurface): MetricDef[] {
	return defs.filter((d) => isMetricVisible(d, ctx, surface));
}
