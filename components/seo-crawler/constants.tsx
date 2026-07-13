import React from 'react';
import {
    Globe,
    Eye,
    Server,
    FileText,
    Code,
    Zap,
    LinkIcon,
    ImageIcon,
    Smartphone,
    Shield,
    Languages,
    ListOrdered,
    GitFork,
    Search,
    Sparkles
} from 'lucide-react';
import { ISSUE_TO_CHECK_MAP } from '../../services/UnifiedIssueTaxonomy';
import { ALL_METRICS } from '@seesby/metrics';
import type { MetricDef } from '@seesby/types';

// formatBytes removed — canonical version lives in views/_shared/formatters.ts as fmtBytes


// ─── Registry-generated columns (canonical metric keys) ───────────────
const NAMESPACE_GROUP: Record<string, string> = {
    'p.indexing': 'Indexing',
    'p.tech': 'Technical',
    'p.content': 'Content',
    'p.links': 'Links',
    'p.search': 'Search',
    'p.ga': 'Analytics',
    'p.ai': 'AI',
    'p.social': 'Social',
    'p.paid': 'Paid',
    'p.commerce': 'Commerce',
    'p.local': 'Local',
    'p.ux': 'UX',
    'fp': 'Fingerprint',
    's.score': 'Scores',
    's.social': 'Site Social',
    's.paid': 'Site Paid',
    's.email': 'Email',
    's.ux': 'Site UX',
    's.crawl': 'Crawl',
    's.news': 'News',
    's.local': 'Site Local',
    's.saas': 'SaaS',
    'e.competitor': 'Competitors',
    'e.local': 'Local Entity',
    'q': 'Keywords',
    'l': 'Link Details',
};

function getGroupLabel(namespace: string): string {
    for (const [prefix, label] of Object.entries(NAMESPACE_GROUP)) {
        if (namespace.startsWith(prefix)) return label;
    }
    const last = namespace.split('.').pop() ?? namespace;
    return last.charAt(0).toUpperCase() + last.slice(1);
}

function shortLabel(m: MetricDef): string {
    const parts = m.key.split('.');
    return parts[parts.length - 1]
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
}

const seenKeys = new Set<string>();
export const REGISTRY_COLUMNS = ALL_METRICS
    .filter(m => m.roles?.includes('G'))
    .filter(m => {
        if (seenKeys.has(m.key)) return false;
        seenKeys.add(m.key);
        return true;
    })
    .map(m => ({
        key: m.key,
        label: shortLabel(m),
        width: m.width ?? '120px',
        group: getGroupLabel(m.namespace),
        format: m.format,
        namespace: m.namespace,
        level: m.level,
    }));

// ─── All columns (registry only — legacy flat-key columns removed) ────
export const ALL_COLUMNS = [...REGISTRY_COLUMNS];

export const resolveIssueCheckId = (issueId: string, explicitCheckId?: string) => {
    return explicitCheckId || ISSUE_TO_CHECK_MAP[issueId] || issueId;
};
