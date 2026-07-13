import React, { useState, useMemo } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import {
  Card, formatNumber, getActions,
} from '../../shared';
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Category = 'Tech' | 'Content' | 'Links' | 'Schema' | 'Performance';

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];
const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280',
};
const CATEGORY_OPTIONS: Category[] = ['Tech', 'Content', 'Links', 'Schema', 'Performance'];

function mapSeverity(a: any): Severity {
  const sev = String(a.severity || '').toUpperCase();
  if (sev === 'CRITICAL') return 'critical';
  if (sev === 'HIGH') return 'high';
  if (sev === 'MEDIUM') return 'medium';
  if (a.type === 'error') return 'high';
  if (a.type === 'warning') return 'medium';
  return 'low';
}

function mapCategory(a: any): Category {
  const id = String(a.id || a.code || '');
  if (id.startsWith('T')) return 'Tech';
  if (id.startsWith('C')) return 'Content';
  if (id.startsWith('L')) return 'Links';
  if (id.startsWith('S')) return 'Schema';
  if (id.startsWith('P')) return 'Performance';
  const cat = String(a.category || '').toLowerCase();
  if (cat.includes('technical') || cat.includes('tech')) return 'Tech';
  if (cat.includes('content')) return 'Content';
  if (cat.includes('link')) return 'Links';
  if (cat.includes('schema') || cat.includes('structured')) return 'Schema';
  if (cat.includes('perform')) return 'Performance';
  return 'Tech';
}

export default function IssuesTab({ page }: { page: any; hasTrend?: boolean }) {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const { setCollabOverlayTarget, setRsTab, setShowAuditSidebar, mode } = useSeoCrawler();

  const rawActions = getActions(page);

  const enriched = useMemo(() => rawActions.map((a: any) => ({
    ...a,
    severity: mapSeverity(a),
    category: mapCategory(a),
  })), [rawActions]);

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    enriched.forEach(a => { c[a.severity]++; });
    return c;
  }, [enriched]);

  const categoryCounts = useMemo(() => {
    const c: Record<Category, number> = { Tech: 0, Content: 0, Links: 0, Schema: 0, Performance: 0 };
    enriched.forEach(a => { c[a.category]++; });
    return c;
  }, [enriched]);

  const filtered = useMemo(() => enriched.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    return true;
  }), [enriched, severityFilter, categoryFilter]);

  const createTask = (issue: any) => {
    setCollabOverlayTarget({
      type: 'page',
      id: page.url,
      title: `${issue.label} \u2014 ${page.url}`,
    });
    const tabId = mode === 'wqa' ? 'wqa_actions' : 'full_actions';
    setRsTab(mode, tabId);
    setShowAuditSidebar(true);
  };

  return (
    <div className="space-y-4">
      {/* Category breakdown */}
      <Card title="By category">
        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(prev => prev === cat ? 'all' : cat)}
              className={`p-2 rounded-md text-center transition-all ${
                categoryFilter === cat
                  ? 'bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)]'
                  : 'bg-[var(--brand-surface-0)] border border-[var(--brand-surface-2)] hover:border-[var(--brand-border-2)]'
              }`}
            >
              <div className="text-[13px] font-bold text-[var(--brand-text-strong)]">{categoryCounts[cat]}</div>
              <div className="text-[8px] text-[var(--brand-border-2)] uppercase tracking-widest mt-0.5">{cat}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Issues */}
      {enriched.length === 0 ? (
        <Card title="Issues">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-3">
              <span className="text-[#22c55e] text-lg">{'\u2713'}</span>
            </div>
            <div className="text-[12px] text-[var(--brand-text-strong)] font-medium">No issues found</div>
            <div className="text-[10px] text-[var(--brand-text-faint)] mt-1">This page looks clean</div>
          </div>
        </Card>
      ) : (
        <Card title={`Issues (${filtered.length})`}>
          {/* Severity filter chips */}
          <div className="flex items-center gap-1.5 mb-3">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                severityFilter === 'all' ? 'bg-[var(--brand-surface-4)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-border-2)] hover:text-[var(--brand-text-mid)]'
              }`}
            >All</button>
            {SEVERITY_ORDER.map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(prev => prev === sev ? 'all' : sev)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  severityFilter === sev ? 'bg-[var(--brand-surface-4)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-border-2)] hover:text-[var(--brand-text-mid)]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLOR[sev] }} />
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>

          {/* Issue list */}
          <div className="space-y-0">
            {filtered.length > 0 ? filtered.map((issue: any, i: number) => (
              <div
                key={`${issue.id}-${i}`}
                className="group flex items-start gap-3 py-2.5 border-b border-[var(--brand-surface-2)] last:border-b-0 hover:bg-[var(--brand-surface-0)] -mx-3 px-3 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  <span className="block w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR[issue.severity] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--brand-text-mid)] font-medium">{issue.label}</div>
                  {(issue.description || issue.reason) && (
                    <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5 line-clamp-2">{issue.description || issue.reason}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-medium" style={{ color: SEVERITY_COLOR[issue.severity] }}>
                    {issue.severity}
                  </span>
                  <span className="text-[9px] text-[var(--brand-surface-4)]">{issue.category}</span>
                  <button
                    onClick={() => createTask(issue)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--brand-border-2)] hover:text-[var(--brand-text-mid)] hover:bg-[var(--brand-surface-3)] rounded transition-all"
                    title="Create task"
                  >
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-[11px] text-[var(--brand-border-2)] py-4 text-center">
                No issues match filters
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
function MetricPill({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-2 text-center">
      <div className={`text-[12px] font-bold ${bad ? 'text-[#F59E0B]' : 'text-[var(--brand-text-strong)]'}`}>{value}</div>
      <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest">{label}</div>
    </div>
  );
}
