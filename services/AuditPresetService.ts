import { isCloudSyncEnabled, turso } from './turso';
import type { Industry, Mode } from '@seesby/types';

export interface CustomAuditPreset {
    id: string;
    name: string;
    modes: Mode[];
    industry: Industry | 'all';
    enabledMetricKeys: string[];
    disabledMetricKeys: string[];
    columnPreset: string[];
    createdAt: number;
    // Deprecated compatibility fields while the current UI still reads them.
    enabledCheckOverrides?: string[];
    disabledCheckOverrides?: string[];
}

const STORAGE_KEY = 'seesby:audit-presets';

const canUseLocalStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export function getLocalPresets(): CustomAuditPreset[] {
    if (!canUseLocalStorage()) return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(normalizePreset) : [];
    } catch {
        return [];
    }
}

export function saveLocalPreset(preset: CustomAuditPreset): CustomAuditPreset[] {
    const presets = getLocalPresets();
    const normalized = normalizePreset(preset);
    const index = presets.findIndex((item) => item.id === preset.id);

    if (index >= 0) {
        presets[index] = normalized;
    } else {
        presets.push(normalized);
    }

    if (canUseLocalStorage()) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    }

    return presets;
}

export function deleteLocalPreset(id: string): CustomAuditPreset[] {
    const next = getLocalPresets().filter((preset) => preset.id !== id);
    if (canUseLocalStorage()) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
}

export async function syncPresetsToCloud(projectId: string, presets: CustomAuditPreset[]): Promise<void> {
    if (!isCloudSyncEnabled || !projectId) return;

    await turso().execute({
        sql: `INSERT OR REPLACE INTO crawl_audit_presets (project_id, presets_json, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)`,
        args: [projectId, JSON.stringify(presets)]
    });
}

export async function fetchPresetsFromCloud(projectId: string): Promise<CustomAuditPreset[]> {
    if (!isCloudSyncEnabled || !projectId) return [];

    try {
        const result = await turso().execute({
            sql: 'SELECT presets_json FROM crawl_audit_presets WHERE project_id = ?',
            args: [projectId]
        });

        if (!result.rows.length) return [];
        const raw = String(result.rows[0].presets_json || '[]');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(normalizePreset) : [];
    } catch {
        return [];
    }
}

function normalizePreset(input: any): CustomAuditPreset {
    const enabledMetricKeys = Array.isArray(input?.enabledMetricKeys)
        ? input.enabledMetricKeys
        : Array.isArray(input?.enabledCheckOverrides)
            ? input.enabledCheckOverrides
            : [];
    const disabledMetricKeys = Array.isArray(input?.disabledMetricKeys)
        ? input.disabledMetricKeys
        : Array.isArray(input?.disabledCheckOverrides)
            ? input.disabledCheckOverrides
            : [];

    return {
        id: String(input?.id ?? ''),
        name: String(input?.name ?? ''),
        modes: normalizeModes(input?.modes),
        industry: normalizeIndustry(input?.industry),
        enabledMetricKeys,
        disabledMetricKeys,
        columnPreset: Array.isArray(input?.columnPreset) ? input.columnPreset : [],
        createdAt: Number(input?.createdAt ?? Date.now()),
        enabledCheckOverrides: enabledMetricKeys,
        disabledCheckOverrides: disabledMetricKeys,
    };
}

import { LEGACY_MODE_MAP, MODE_SET } from '@seesby/modes/legacy';
export { LEGACY_MODE_MAP, MODE_SET };

/** Inline of former LEGACY_INDUSTRY_MAP — only two entries differ from canonical keys. */
const SNAKE_TO_CAMEL: Record<string, string> = {
    real_estate: 'realEstate',
    job_board: 'jobBoard',
};
const VALID_INDUSTRIES = new Set<string>([
    'ecommerce','saas','blog','news','finance','education','healthcare',
    'local','realEstate','jobBoard','restaurant','portfolio','media',
    'government','nonprofit','general',
]);

function normalizeModes(value: unknown): Mode[] {
    if (!Array.isArray(value)) return ['fullAudit'];
    const out = value
        .map((entry) => LEGACY_MODE_MAP[String(entry)] ?? String(entry))
        .filter(isMode);
    return out.length > 0 ? out : ['fullAudit'];
}

function normalizeIndustry(value: unknown): Industry | 'all' {
    const key = String(value ?? 'all');
    if (key === 'all') return 'all';
    const resolved = SNAKE_TO_CAMEL[key] ?? key;
    return isIndustry(resolved) ? resolved : 'general';
}

function isMode(value: string): value is Mode {
    return value in MODE_SET;
}

function isIndustry(value: string): value is Industry {
    return VALID_INDUSTRIES.has(value);
}
