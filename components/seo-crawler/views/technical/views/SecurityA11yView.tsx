import React from 'react';
import { BarChart } from '../../_shared/BarChart';
import { Donut } from '../../_shared/Donut';
import { Sparkline } from '../../../right-sidebar/_shared/Sparkline';
import { useSecurityA11y } from '../selectors/useSecurityA11y';
import type { SecurityCheckItem } from '../selectors/useSecurityA11y';
import { fmtPct } from '../../_shared/formatters';
import clsx from 'clsx';
import { STATUS_HEX } from '../../_shared/shared-columns';

const CARD = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3';

export default function SecurityA11yView() {
  const d = useSecurityA11y();

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-12 gap-3">
      {/* Security posture checklist */}
      <div className={`${CARD} col-span-5`}>
        <H>Security posture</H>
        <div className="space-y-1.5">
          {d.securityChecklist.map(item => (
            <SecurityCheckRow key={item.id} item={item} total={d.total} />
          ))}
        </div>
      </div>

      {/* Cert health + WCAG levels */}
      <div className={`${CARD} col-span-7`}>
        <H>Accessibility by WCAG level</H>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <WcagBadge label="A" level={d.wcagLevels.a} />
          <WcagBadge label="AA" level={d.wcagLevels.aa} />
          <WcagBadge label="AAA" level={d.wcagLevels.aaa} />
        </div>

        <H>Violations by impact</H>
        <BarChart
          data={d.a11yByImpact}
          x="impact" y="count"
          color={[STATUS_HEX.bad, STATUS_HEX.warn, STATUS_HEX.info, 'text-[var(--brand-text-faint)]']}
          height={180}
        />
      </div>

      {/* Security headers coverage */}
      <div className={`${CARD} col-span-5`}>
        <H>Security headers coverage</H>
        <BarChart
          data={Object.entries(d.headerCounts).map(([k, v]) => ({
            header: k.toUpperCase(), pct: Math.round((v / d.total) * 100),
          }))}
          x="header" y="pct" color="#3b82f6" height={180}
        />
        <div className="text-[10px] text-[var(--brand-text-faint)] mt-1">% of pages with header set</div>
      </div>

      {/* Violation timeline sparklines */}
      <div className={`${CARD} col-span-12`}>
        <H>Violation trends across pages</H>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-[var(--brand-text-mid)] mb-1">A11y violations per page (sorted)</div>
            <Sparkline values={d.violationTrend} height={36} width={400} tone="warn" showArea />
          </div>
          <div>
            <div className="text-[10px] text-[var(--brand-text-mid)] mb-1">Security issues per page (sorted)</div>
            <Sparkline values={d.securityTrend} height={36} width={400} tone="bad" showArea />
          </div>
        </div>
      </div>

      {/* Cert health donut */}
      <div className={`${CARD} col-span-7`}>
        <H>Certificate health</H>
        <Donut
          data={[
            { name: 'Valid (30d+)', value: d.valid, color: STATUS_HEX.good },
            { name: 'Expiring (<30d)', value: d.expiring, color: STATUS_HEX.bad },
          ]}
          label="hosts"
        />
      </div>

      {/* Failing pages by issue */}
      {d.failingPagesByIssue.length > 0 && (
        <div className={`${CARD} col-span-12`}>
          <H>Failing pages by issue ({d.failingPagesByIssue.length} rules)</H>
          <div className="overflow-auto max-h-48">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[var(--brand-text-faint)] border-b border-[var(--brand-surface-3)]">
                  <th className="pb-1.5 font-medium">Rule</th>
                  <th className="pb-1.5 font-medium">Impact</th>
                  <th className="pb-1.5 font-medium text-right">Pages</th>
                  <th className="pb-1.5 font-medium">Sample URLs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--brand-surface-2)]">
                {d.failingPagesByIssue.map(issue => (
                  <tr key={issue.rule} className="hover:bg-[var(--brand-surface-1)]">
                    <td className="py-1.5 pr-3 text-[var(--brand-text-mid)] max-w-[200px] truncate">{issue.rule}</td>
                    <td className="py-1.5 pr-3">
                      <ImpactBadge impact={issue.impact} />
                    </td>
                    <td className="py-1.5 pr-3 text-right font-mono text-[var(--brand-text-strong)]">{issue.count}</td>
                    <td className="py-1.5 text-[var(--brand-text-mid)] max-w-[300px] truncate">
                      {issue.pages.map(p => p.url).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top failing rules */}
      {d.topRules.length > 0 && (
        <div className={`${CARD} col-span-12`}>
          <H>Top failing rules</H>
          <ul className="divide-y divide-[var(--brand-surface-2)] text-[11px]">
            {d.topRules.map(([rule, count]) => (
              <li key={rule} className="flex justify-between py-1.5">
                <span className="text-[var(--brand-text-mid)] truncate max-w-[400px]">{rule}</span>
                <span className="font-mono text-[var(--brand-text-strong)] shrink-0">{count as number}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SecurityCheckRow({ item, total }: { item: SecurityCheckItem; total: number }) {
  const passRate = total > 0 ? Math.round((item.pass / total) * 100) : 0;
  const barColor = passRate >= 90 ? STATUS_HEX.good : passRate >= 70 ? STATUS_HEX.warn : STATUS_HEX.bad;

  return (
    <div className="flex items-center gap-2">
      <div className={clsx(
        'w-4 h-4 rounded-sm flex items-center justify-center text-[9px] shrink-0',
        passRate >= 90 ? 'bg-emerald-500/15 text-emerald-400' :
        passRate >= 70 ? 'bg-amber-500/15 text-amber-400' :
        'bg-red-500/15 text-red-400',
      )}>
        {passRate >= 90 ? '\u2713' : passRate >= 70 ? '!' : '\u2717'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[11px] text-[var(--brand-text-mid)] truncate">{item.label}</span>
          <span className="text-[10px] font-mono text-[var(--brand-text-mid)] shrink-0 ml-2">{item.pass}/{total}</span>
        </div>
        <div className="h-1 rounded bg-[var(--brand-surface-1)] overflow-hidden">
          <div className="h-full rounded" style={{ width: `${passRate}%`, backgroundColor: barColor, opacity: 0.8 }} />
        </div>
      </div>
    </div>
  );
}

function WcagBadge({ label, level }: { label: string; level: { total: number; pass: number; fail: number; passRate: number } }) {
  const color = level.passRate >= 80 ? 'text-emerald-400' : level.passRate >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-1">Level {label}</div>
      <div className={clsx('text-[24px] font-mono font-bold', color)}>{level.passRate}%</div>
      <div className="text-[10px] text-[var(--brand-text-mid)]">{level.pass}/{level.total} pass</div>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: string }) {
  const color = impact === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/30'
    : impact === 'serious' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : impact === 'moderate' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    : 'bg-[var(--brand-surface-3)] text-[var(--brand-text-mid)] border-[var(--brand-border-2)]';
  return (
    <span className={clsx('text-[9px] px-1 py-0.5 rounded border uppercase', color)}>
      {impact}
    </span>
  );
}

const H = ({ children }: { children: React.ReactNode }) =>
  <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">{children}</div>;
