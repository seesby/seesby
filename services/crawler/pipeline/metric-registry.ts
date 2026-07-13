// services/crawler/pipeline/metric-registry.ts
//
// Central registry for all MetricDef objects. Provides lookup by key,
// filtering by level / role / namespace / mode, and fingerprint-aware
// visibility queries.

import type { MetricDef, MetricLevel, MetricGate, IntegrationId, Capability } from '../../packages/types/src/metric-def';
import type { MetricRole } from '../../packages/types/src/roles';
import type { Mode } from '../../packages/types/src/modes';
import type { SourceTier } from '../../packages/types/src/sources';
import { evaluateGate, mergeGateWithPreset, type GateContext } from './adaptive-visibility';

// ── Fingerprint duck-typed interface (avoids circular deps) ─────────

interface FpValueLike<T> {
	value: T;
	confidence: number;
}

interface FingerprintLike {
	industry?: FpValueLike<string>;
	cms?: FpValueLike<string>;
	languagePrimary?: FpValueLike<string>;
	stack?: Record<string, { value: string | string[]; confidence: number }>;
	size?: { urls?: FpValueLike<number> };
}

// ── MetricRegistry class ────────────────────────────────────────────

export class MetricRegistry {
	private defs = new Map<string, MetricDef>();
	private byLevel = new Map<MetricLevel, MetricDef[]>();
	private byRole = new Map<MetricRole, MetricDef[]>();
	private byNamespace = new Map<string, MetricDef[]>();
	private dirty = true;

	/** Register a single MetricDef. Overwrites if key already exists. */
	register(def: MetricDef): void {
		this.defs.set(def.key, def);
		this.dirty = true;
	}

	/** Register an array of MetricDefs. */
	registerAll(defs: MetricDef[]): void {
		for (const def of defs) this.defs.set(def.key, def);
		this.dirty = true;
	}

	/** Look up a metric by its dotted key (e.g. 'p.content.wordCount'). */
	get(key: string): MetricDef | undefined {
		return this.defs.get(key);
	}

	/** Return all registered metrics. */
	getAll(): MetricDef[] {
		return Array.from(this.defs.values());
	}

	/** Total number of registered metrics. */
	get size(): number {
		return this.defs.size;
	}

	/** Clear all metrics and rebuild indices. */
	clear(): void {
		this.defs.clear();
		this.byLevel.clear();
		this.byRole.clear();
		this.byNamespace.clear();
		this.dirty = true;
	}

	// ── Indexed lookups ───────────────────────────────────────────────

	getByLevel(level: MetricLevel): MetricDef[] {
		this.ensureIndices();
		return this.byLevel.get(level) ?? [];
	}

	getByRole(role: MetricRole): MetricDef[] {
		this.ensureIndices();
		return this.byRole.get(role) ?? [];
	}

	getByNamespace(namespace: string): MetricDef[] {
		this.ensureIndices();
		return this.byNamespace.get(namespace) ?? [];
	}

	/** Return metrics whose namespace starts with the given prefix. */
	getByNamespacePrefix(prefix: string): MetricDef[] {
		this.ensureIndices();
		const result: MetricDef[] = [];
		for (const [ns, defs] of this.byNamespace) {
			if (ns === prefix || ns.startsWith(prefix + '.')) {
				result.push(...defs);
			}
		}
		return result;
	}

	// ── Mode / fingerprint visibility ─────────────────────────────────

	/** Metrics visible for a given mode (ignoring fingerprint). */
	getVisibleForMode(mode: Mode): MetricDef[] {
		return this.getAll().filter(def => {
			if (!def.gate?.modes || def.gate.modes.length === 0) return true;
			return def.gate.modes.includes(mode);
		});
	}

	/** Metrics visible for a given mode + fingerprint (full gate evaluation). */
	getVisibleForFingerprint(
		fingerprint: FingerprintLike,
		mode: Mode,
		integrations: ReadonlySet<IntegrationId> = new Set(),
		capabilities: ReadonlySet<Capability> = new Set(),
	): MetricDef[] {
		const ctx: GateContext = { mode, fingerprint, integrations, capabilities };
		return this.getAll().filter(def => {
			const gate = mergeGateWithPreset(def.gate, def.namespace);
			return evaluateGate(gate, ctx);
		});
	}

	/** Grid-visible (role 'G') metrics for a mode + fingerprint. */
	getVisibleColumns(
		mode: Mode,
		fingerprint: FingerprintLike,
		integrations: ReadonlySet<IntegrationId> = new Set(),
		capabilities: ReadonlySet<Capability> = new Set(),
	): MetricDef[] {
		const ctx: GateContext = { mode, fingerprint, integrations, capabilities };
		return this.getAll().filter(def => {
			if (!def.roles.includes('G')) return false;
			const gate = mergeGateWithPreset(def.gate, def.namespace);
			return evaluateGate(gate, ctx);
		});
	}

	/**
	 * Return the ordered source ladder for a metric key.
	 * This is the `sources` array from MetricDef — the ordered list of
	 * tiers the metric can be sourced from (T0 → T8, first fresh wins).
	 */
	getSourceLadder(key: string): ReadonlyArray<SourceTier> | undefined {
		const def = this.defs.get(key);
		return def?.sources;
	}

	/**
	 * Return a snapshot of all source ladders keyed by metric key.
	 * Useful for building a lookup map at boot time.
	 */
	getAllSourceLadders(): Map<string, ReadonlyArray<SourceTier>> {
		const map = new Map<string, ReadonlyArray<SourceTier>>();
		for (const [key, def] of this.defs) {
			if (def.sources && def.sources.length > 0) {
				map.set(key, def.sources);
			}
		}
		return map;
	}

	// ── Index management ──────────────────────────────────────────────

	private ensureIndices(): void {
		if (!this.dirty) return;
		this.byLevel.clear();
		this.byRole.clear();
		this.byNamespace.clear();

		for (const def of this.defs.values()) {
			// By level
			if (!this.byLevel.has(def.level)) this.byLevel.set(def.level, []);
			this.byLevel.get(def.level)!.push(def);

			// By role (metric can have multiple roles)
			for (const role of def.roles) {
				if (!this.byRole.has(role)) this.byRole.set(role, []);
				this.byRole.get(role)!.push(def);
			}

			// By namespace
			if (!this.byNamespace.has(def.namespace)) this.byNamespace.set(def.namespace, []);
			this.byNamespace.get(def.namespace)!.push(def);
		}
		this.dirty = false;
	}
}

// ── Singleton ───────────────────────────────────────────────────────

/**
 * The default metric registry instance. Import this to register
 * metrics at module load time or query the global metric catalog.
 */
export const defaultMetricRegistry = new MetricRegistry();
