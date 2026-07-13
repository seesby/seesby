import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

interface AlertRule {
  id: string;
  metric: string;
  operator: 'increases_by' | 'decreases_by' | 'exceeds' | 'drops_below';
  value: number;
  enabled: boolean;
}

const METRIC_OPTIONS = [
  { value: 'referringDomains', label: 'Referring Domains' },
  { value: 'totalIndexablePages', label: 'Indexable Pages' },
  { value: 'estimatedOrganicTraffic', label: 'Organic Traffic' },
  { value: 'blogPostsPerMonth', label: 'Blog Posts/Month' },
  { value: 'techHealthScore', label: 'Tech Health Score' },
];

const OPERATOR_OPTIONS = [
  { value: 'increases_by', label: 'increases by more than' },
  { value: 'decreases_by', label: 'decreases by more than' },
  { value: 'exceeds', label: 'exceeds' },
  { value: 'drops_below', label: 'drops below' },
];

const STORAGE_KEY = 'seesby:comp-alert-rules';

export default function AlertRulesSection() {
  const [rules, setRules] = useState<AlertRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AlertRule[]) : [];
    } catch {
      return [];
    }
  });
  const [adding, setAdding] = useState(false);
  const [newMetric, setNewMetric] = useState('referringDomains');
  const [newOperator, setNewOperator] = useState<AlertRule['operator']>('increases_by');
  const [newValue, setNewValue] = useState('50');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const addRule = () => {
    const rule: AlertRule = {
      id: Date.now().toString(36),
      metric: newMetric,
      operator: newOperator,
      value: Number(newValue) || 0,
      enabled: true,
    };
    setRules([...rules, rule]);
    setAdding(false);
    setNewValue('50');
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <div className="rounded-xl border border-[var(--brand-border-2)]] bg-[var(--brand-surface-1)]] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={12} className="text-[#F59E0B]" />
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--brand-text-faint)]]">Alert Rules</span>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1 text-[10px] font-bold text-[#F59E0B] hover:text-[var(--brand-text-strong)]">
          <Plus size={10} />
          Add Rule
        </button>
      </div>

      {adding && (
        <div className="mb-3 space-y-2 rounded-lg border border-[var(--brand-surface-4)]] bg-[var(--brand-surface-2)]] p-3">
          <div className="text-[10px] text-[var(--brand-text-mid)]]">Alert me when any competitor's...</div>
          <select
            value={newMetric}
            onChange={(e) => setNewMetric(e.target.value)}
            className="w-full rounded border border-[var(--brand-surface-4)]] bg-[var(--brand-surface-0)]] px-2 py-1.5 text-[11px] text-[var(--brand-text-strong)]"
          >
            {METRIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={newOperator}
            onChange={(e) => setNewOperator(e.target.value as AlertRule['operator'])}
            className="w-full rounded border border-[var(--brand-surface-4)]] bg-[var(--brand-surface-0)]] px-2 py-1.5 text-[11px] text-[var(--brand-text-strong)]"
          >
            {OPERATOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full rounded border border-[var(--brand-surface-4)]] bg-[var(--brand-surface-0)]] px-2 py-1.5 text-[11px] text-[var(--brand-text-strong)]"
            placeholder="Value"
          />
          <div className="flex gap-2">
            <button onClick={addRule} className="rounded bg-[#F59E0B]/10 px-3 py-1.5 text-[10px] font-bold text-[#F59E0B] hover:bg-[#F59E0B]/20">
              Save Rule
            </button>
            <button onClick={() => setAdding(false)} className="text-[10px] text-[var(--brand-text-faint)]] hover:text-[var(--brand-text-mid)]]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 && !adding && (
        <div className="py-4 text-center text-[11px] text-[var(--brand-border-2)]]">No alert rules set. Add rules to get notified about competitor movements.</div>
      )}

      {rules.map((rule) => {
        const metricLabel = METRIC_OPTIONS.find((o) => o.value === rule.metric)?.label || rule.metric;
        const operatorLabel = OPERATOR_OPTIONS.find((o) => o.value === rule.operator)?.label || rule.operator;
        return (
          <div key={rule.id} className={`mb-1.5 flex items-center gap-2 rounded-lg px-3 py-2 ${rule.enabled ? 'bg-[var(--brand-surface-2)]]' : 'bg-[var(--brand-surface-0)]] opacity-50'}`}>
            <button onClick={() => toggleRule(rule.id)} className={`h-3 w-3 rounded-full border ${rule.enabled ? 'border-green-500 bg-green-500' : 'border-[var(--brand-text-faint)]]'}`} />
            <span className="flex-1 text-[10px] text-[var(--brand-text-mid)]]">
              {metricLabel} {operatorLabel} <span className="font-bold text-[var(--brand-text-strong)]">{rule.value.toLocaleString()}</span>
            </span>
            <button onClick={() => removeRule(rule.id)} className="text-[var(--brand-surface-4)]] hover:text-red-400">
              <Trash2 size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
