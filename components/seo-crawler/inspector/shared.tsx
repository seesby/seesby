import React from 'react';
import { ListTodo } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { getPageIssues } from '../IssueTaxonomy';
export { getPageIssues };
import { SEO_ISSUES_TAXONOMY } from '../IssueTaxonomy';

export const EMPTY_VALUE = '—';

export const normalizeValue = (value: any) => {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    return value;
};

export const formatPercent = (value: any, multiplier = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return EMPTY_VALUE;
    return `${(Number(value) * multiplier).toFixed(2)}%`;
};

export const formatNumber = (value: any, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return EMPTY_VALUE;
    return Number(value).toLocaleString(undefined, options);
};

export const formatSignedNumber = (value: any, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return EMPTY_VALUE;
    const num = Number(value);
    const formatted = Math.abs(num).toLocaleString(undefined, options);
    return num >= 0 ? `+${formatted}` : `-${formatted}`;
};

export const formatDuration = (ms: any) => {
    if (ms === null || ms === undefined || Number.isNaN(Number(ms))) return EMPTY_VALUE;
    return `${Math.round(Number(ms))}ms`;
};

export const formatDate = (date: any) => {
    if (!date) return EMPTY_VALUE;
    const str = String(date).trim();
    if (str.length > 50) return EMPTY_VALUE;
    try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return EMPTY_VALUE;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return EMPTY_VALUE;
    }
};

// D1 fix: Re-export from formatters.ts (canonical location).
// Wraps the canonical version with null/NaN handling for inspector context.
import { fmtBytes as _fmtBytesFn } from '../views/_shared/formatters';
export const formatBytes = (bytes: any): string => {
    if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return EMPTY_VALUE;
    return _fmtBytesFn(Number(bytes));
};

export const getSafeHostname = (url: string | undefined | null) => {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

export const DataRow = ({ label, value, status, mono = false }: {
    label: string;
    value: React.ReactNode;
    status?: 'pass' | 'warn' | 'fail' | 'info';
    mono?: boolean;
    key?: any;
}) => {
    const tone = status === 'pass'
        ? 'text-green-400'
        : status === 'warn'
            ? 'text-orange-400'
            : status === 'fail'
                ? 'text-red-400'
                : status === 'info'
                    ? 'text-blue-400'
                    : 'text-[var(--brand-text-strong)]';

    return (
        <div className="grid grid-cols-[120px_1fr] gap-x-3 text-[12px] py-1 min-w-0 overflow-hidden">
            <span className="text-[var(--brand-text-faint)]] truncate min-w-0">{label}</span>
            <span className={`${mono ? 'font-mono' : ''} ${tone} break-all min-w-0`}>{normalizeValue(value)}</span>
        </div>
    );
};

export const SectionHeader = ({ title, color, icon }: { title: string; color?: string; icon?: React.ReactNode }) => (
    <h4 className={`text-[11px] font-black uppercase tracking-widest border-b border-[var(--brand-border-2)]] pb-1 mb-3 flex items-center gap-2 ${color || 'text-[var(--brand-border-2)]]'}`}>
        {icon}
        {title}
    </h4>
);

export const StatusBadge = ({ status, label, onClick }: {
    status: 'pass' | 'warn' | 'fail' | 'info';
    label: string;
    onClick?: () => void;
    key?: any;
}) => {
    const styles = {
        pass: 'bg-green-500/15 text-green-400 border-green-500/25',
        warn: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
        fail: 'bg-red-500/15 text-red-400 border-red-500/25',
        info: 'bg-blue-500/15 text-blue-400 border-blue-500/25'
    };

    return (
        <span
            onClick={onClick}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]} ${onClick ? 'cursor-pointer hover:bg-opacity-30' : ''}`}
        >
            {label}
        </span>
    );
};

export const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)]] mb-2.5">{title}</div>
        <div className="space-y-0">{children}</div>
    </div>
);

export const MetricPill = ({ label, value, good, sub }: { label: string; value: string; good?: boolean; sub?: string }) => (
    <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-2 text-center">
        <div className={`text-[12px] font-bold ${good === true ? 'text-[#22c55e]' : good === false ? 'text-[#F59E0B]' : 'text-[var(--brand-text-strong)]'}`}>{value}</div>
        <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest">{label}</div>
        {sub && <div className="text-[8px] text-[var(--brand-text-faint)]] mt-0.5">{sub}</div>}
    </div>
);

export const MetricCard = ({ label, value, sub, color }: {
    label: string;
    value: React.ReactNode;
    sub?: string;
    color?: string;
}) => (
    <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
        <div className="text-[10px] text-[var(--brand-text-faint)]] uppercase tracking-widest">{label}</div>
        <div className={`text-[20px] font-black mt-1 ${color || 'text-[var(--brand-text-strong)]'}`}>{normalizeValue(value)}</div>
        {sub && <div className="text-[10px] text-[var(--brand-text-mid)]] mt-1">{sub}</div>}
    </div>
);

export const TruncatedUrl = ({ url }: { url: string }) => (
    <span title={url} className="text-blue-400 truncate text-[11px] font-mono block w-full">
        {url}
    </span>
);

export const getMetric = (page: any, key: string) => {
    if (page?.foundationMetrics && page.foundationMetrics[key] !== undefined) {
        return page.foundationMetrics[key];
    }
    return page?.[key];
};

export const getActions = (page: any) => {
    if (Array.isArray(page?.foundationActions)) {
        return page.foundationActions.map((a: any) => ({
            id: a.code,
            label: a.title,
            type: (a.severity === 'HIGH' || a.severity === 'CRITICAL') ? 'error' : 
                  (a.severity === 'MEDIUM' ? 'warning' : 'notice'),
            ...a
        }));
    }
    return getPageIssues(page) || [];
};

export const IssuesList = ({ issues, page }: {
    issues: { id: string; label: string; type: 'error' | 'warning' | 'notice' }[];
    page: any;
}) => {
    const { setCollabOverlayTarget, setRsTab, setShowAuditSidebar, mode } = useSeoCrawler();
    const effectiveIssues = issues.length > 0 ? issues : getActions(page);
    if (effectiveIssues.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[var(--brand-border-2)]]">
            <span className="text-[10px] text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold mr-1">Issues:</span>
            {effectiveIssues.map((issue, index) => (
                <div key={`${issue.id}-${index}`} className="flex items-center gap-0.5 group">
                    <StatusBadge
                        status={issue.type === 'error' ? 'fail' : issue.type === 'warning' ? 'warn' : 'info'}
                        label={issue.label}
                    />
                    <button
                        onClick={() => {
                            setCollabOverlayTarget({
                                type: 'page',
                                id: page.url,
                                title: `${issue.label} — ${page.url}`
                            });
                            // Set to actions tab if it exists
                            const tabId = mode === 'wqa' ? 'wqa_actions' : mode === 'fullAudit' ? 'full_actions' : 'full_actions';
                            setRsTab(mode, tabId);
                            setShowAuditSidebar(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--brand-border-2)]] hover:text-[var(--brand-text-strong)] transition-opacity"
                        title="Create task for this issue"
                    >
                        <ListTodo size={10} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export function FlagRow({ label, fail }: { label: string; fail: boolean }) {
  return (
    <div className="flex items-center justify-between py-[3px] text-[11px]">
      <span className="text-[var(--brand-text-faint)]]">{label}</span>
      <span className={`text-[10px] font-medium ${fail ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>
        {fail ? 'Yes' : 'No'}
      </span>
    </div>
  );
}
