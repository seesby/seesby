import type {
  Capability,
  IntegrationId,
  MetricDef,
  MetricLevel,
  MetricRole,
  Mode,
  ProjectFingerprint,
} from '@seesby/types';
import { evaluateGate } from './gates';
import { LEGACY_ALIASES } from './legacyAliases';

export interface ColumnContext {
  mode: Mode;
  fp: ProjectFingerprint;
  connectedIntegrations: IntegrationId[];
  capabilities: Capability[];
}

export class MetricRegistryImpl {
  private byKey = new Map<string, MetricDef>();
  private byNamespace = new Map<string, MetricDef[]>();
  private byRole = new Map<MetricRole, MetricDef[]>();
  private byLevel = new Map<MetricLevel, MetricDef[]>();
  private all: MetricDef[] = [];

  constructor(defs: ReadonlyArray<MetricDef>) {
    this.load(defs);
  }

  private load(defs: ReadonlyArray<MetricDef>) {
    const seen = new Set<string>();
    for (const d of defs) {
      if (seen.has(d.key)) throw new Error(`Duplicate metric key: ${d.key}`);
      seen.add(d.key);
      this.byKey.set(d.key, d);
      push(this.byNamespace, d.namespace, d);
      for (const r of d.roles) push(this.byRole, r, d);
      push(this.byLevel, d.level, d);
      this.all.push(d);
    }
  }

  get(key: string): MetricDef | undefined {
    return this.byKey.get(key) ?? this.byKey.get(LEGACY_ALIASES.get(key) ?? '');
  }

  require(key: string): MetricDef {
    const d = this.get(key);
    if (!d) throw new Error(`Unknown metric: ${key}`);
    return d;
  }

  has(key: string): boolean {
    return this.byKey.has(key) || LEGACY_ALIASES.has(key);
  }

  list(): readonly MetricDef[] { return this.all; }
  size(): number { return this.all.length; }
  getNamespaces(): string[] { return [...this.byNamespace.keys()].sort(); }
  getByNamespace(ns: string): MetricDef[] { return this.byNamespace.get(ns) ?? []; }
  getByRole(role: MetricRole): MetricDef[] { return this.byRole.get(role) ?? []; }
  getByLevel(level: MetricLevel): MetricDef[] { return this.byLevel.get(level) ?? []; }

  columnsFor(ctx: ColumnContext): MetricDef[] {
    return this.all
      .filter((d) => !d.deprecated)
      .filter((d) => evaluateGate(d, ctx))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  stats(): { total: number; byNamespace: Record<string, number>; byLevel: Record<string, number> } {
    const byNamespace: Record<string, number> = {};
    for (const [ns, ds] of this.byNamespace) byNamespace[ns] = ds.length;
    const byLevel: Record<string, number> = {};
    for (const [lv, ds] of this.byLevel) byLevel[lv] = ds.length;
    return { total: this.all.length, byNamespace, byLevel };
  }
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}

let instance: MetricRegistryImpl | null = null;

export const MetricRegistry = {
  init(defs: ReadonlyArray<MetricDef>) { instance = new MetricRegistryImpl(defs); },
  get(key: string) { return ensure().get(key); },
  require(key: string) { return ensure().require(key); },
  has(key: string) { return ensure().has(key); },
  list() { return ensure().list(); },
  size() { return ensure().size(); },
  getNamespaces() { return ensure().getNamespaces(); },
  getByNamespace(ns: string) { return ensure().getByNamespace(ns); },
  getByRole(role: MetricRole) { return ensure().getByRole(role); },
  getByLevel(level: MetricLevel) { return ensure().getByLevel(level); },
  columnsFor(ctx: ColumnContext) { return ensure().columnsFor(ctx); },
  stats() { return ensure().stats(); },
};

function ensure(): MetricRegistryImpl {
  if (!instance) throw new Error('MetricRegistry not initialized. Call MetricRegistry.init(catalog) at boot.');
  return instance;
}
