import type { MetricDef } from '@seesby/types';
import type { ColumnContext } from './registry';

export function evaluateGate(def: MetricDef, ctx: ColumnContext): boolean {
  const g = def.gate;
  if (!g) return true;

  if (g.modes && !g.modes.includes(ctx.mode)) return false;

  const industry = ctx.fp.industry.value;
  if (g.industries && !g.industries.includes(industry)) return false;
  if (g.excludeIndustries && g.excludeIndustries.includes(industry)) return false;

  if (g.cms && ctx.fp.cms?.value && !g.cms.includes(ctx.fp.cms.value)) return false;

  const lang = ctx.fp.languagePrimary?.value;
  if (g.languages && lang && !g.languages.includes(lang)) return false;

  if (g.minUrls && (ctx.fp.size?.urls?.value ?? 0) < g.minUrls) return false;

  if (g.requireConnected) {
    for (const id of g.requireConnected) {
      if (!ctx.connectedIntegrations.includes(id)) return false;
    }
  }

  if (g.requireCapability) {
    for (const cap of g.requireCapability) {
      if (!ctx.capabilities.includes(cap)) return false;
    }
  }

  if (g.stack) {
    const flat = flattenStack(ctx.fp.stack);
    for (const need of g.stack) {
      if (!flat.includes(need)) return false;
    }
  }

  return true;
}

function flattenStack(stack: Record<string, { value: string | string[] }> | undefined): string[] {
  const out: string[] = [];
  for (const k of Object.keys(stack ?? {})) {
    const v = stack?.[k]?.value;
    if (typeof v === 'string') out.push(`${k}:${v}`);
    else if (Array.isArray(v)) for (const item of v) out.push(`${k}:${item}`);
  }
  return out;
}
