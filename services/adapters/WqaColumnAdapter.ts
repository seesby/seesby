// services/adapters/WqaColumnAdapter.ts
import type { Industry, LanguageCode, CmsKey, Mode } from '@seesby/types';
import { filterVisibleMetrics, ALL_METRICS } from '@seesby/metrics';

export interface WqaColumnContext {
	mode: Mode;
	industry: Industry;
	industryLowConfidence: boolean;
	language: LanguageCode;
	cms: CmsKey;
	connections: { gsc: boolean; ga4: boolean; backlinks: boolean; gbp: boolean; bing: boolean };
	capabilities: string[];
}

export function getWqaColumns(ctx: WqaColumnContext): Array<{ key: string; label: string; width?: string }> {
    const connections = ctx.connections || (ctx as any).availability || {};
    const visibilityCtx = {
        mode: ctx.mode,
        industry: ctx.industry,
        cms: ctx.cms,
        language: ctx.language,
        connectedIntegrations: Object.entries(connections).filter(([_, v]) => v).map(([k]) => k),
        capabilities: ctx.capabilities || []
    };

	return filterVisibleMetrics(ALL_METRICS, visibilityCtx, 'grid').map((d) => ({
		key: d.key,
		label: d.i18nLabelKey,
		width: d.width,
	}));
}

export function getWqaDefaultVisibleColumns(ctx: WqaColumnContext): string[] {
    const connections = ctx.connections || (ctx as any).availability || {};
    const visibilityCtx = {
        mode: ctx.mode,
        industry: ctx.industry,
        cms: ctx.cms,
        language: ctx.language,
        connectedIntegrations: Object.entries(connections).filter(([_, v]) => v).map(([k]) => k),
        capabilities: ctx.capabilities || []
    };

	return filterVisibleMetrics(ALL_METRICS, visibilityCtx, 'grid')
        .filter((d) => d.defaultVisible)
        .map((d) => d.key);
}
