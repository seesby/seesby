import React from 'react';
import { DataRow, Card, MetricPill, StatusBadge, TruncatedUrl, formatNumber, formatDuration, formatPercent } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function LpsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const landingPages = page?.paidLandingPages || page?.adLandingPages || [];
  const wastedSessions = page?.wastedPaidSessions || 0;
  const recoverEst = page?.recoverableRevenue || 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricPill label="Total LPs" value={String(landingPages.length)} />
        <MetricPill label="Wasted sessions" value={formatNumber(wastedSessions)} good={wastedSessions === 0} />
        <MetricPill label="Recover est" value={recoverEst ? `$${formatNumber(recoverEst, { maximumFractionDigits: 0 })}/mo` : '—'} />
        <MetricPill label="Issues" value={String(landingPages.filter((lp: any) => (lp.issues || []).length > 0).length)} good={landingPages.every((lp: any) => !(lp.issues || []).length)} />
      </div>

      {/* LP table */}
      {landingPages.length > 0 ? (
        <Card title={`Landing pages (${landingPages.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[var(--brand-border-2)]">
                  <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">LP URL</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Camps</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Sessions</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Bounce</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">CvR</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">QS-LP</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Intent</th>
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">CWV</th>
                  <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Issues</th>
                  <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {landingPages.slice(0, 30).map((lp: any, i: number) => {
                  const url = typeof lp === 'string' ? lp : lp.url || '';
                  const bounce = Number(lp.bounceRate || lp.bounce || 0);
                  const cvr = Number(lp.conversionRate || lp.cvr || 0);
                  const qsLp = lp.qsLp || lp.qsLandingPage || '—';
                  const intent = lp.intentMatch || '—';
                  const lcp = Number(lp.lcp || lp.loadTime || 0);
                  const inp = Number(lp.inp || 0);
                  const issues = lp.issues || [];
                  const actions = lp.actions || [];
                  const hasIssues = issues.length > 0;
                  return (
                    <tr key={i} className="border-b border-[var(--brand-surface-3)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-2 py-1.5 max-w-[200px]">
                        <TruncatedUrl url={url} />
                      </td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{lp.campaignCount || '—'}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">{formatNumber(lp.sessions || lp.paidSessions)}</td>
                      <td className="px-2 py-1.5 text-right">
                        <span className={bounce > 0.6 ? 'text-[#ef4444]' : bounce > 0.4 ? 'text-[#f59e0b]' : 'text-[var(--brand-text-mid)]'}>
                          {formatPercent(bounce)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className={cvr >= 0.05 ? 'text-green-400' : cvr >= 0.02 ? 'text-[var(--brand-text-mid)]' : 'text-[#f59e0b]'}>
                          {formatPercent(cvr, 100)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <StatusBadge
                          status={qsLp === 'above' || qsLp === 'abv' ? 'pass' : qsLp === 'average' || qsLp === 'avg' ? 'warn' : qsLp === 'below' || qsLp === 'bel' ? 'fail' : 'info'}
                          label={qsLp}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <StatusBadge
                          status={intent === 'high' || intent === 'strong' ? 'pass' : intent === 'medium' || intent === 'avg' ? 'warn' : 'info'}
                          label={intent}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]">
                        {lcp > 0 && <span className={lcp <= 2500 ? 'text-green-400' : lcp <= 4000 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>LCP {formatDuration(lcp)}</span>}
                        {inp > 0 && <span className="ml-1">INP {inp}</span>}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {hasIssues ? (
                          <StatusBadge status="warn" label={`${issues.length}`} />
                        ) : (
                          <span className="text-[var(--brand-text-faint)]">—</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {actions.length > 0 ? (
                          <span className="text-[9px] text-[var(--brand-text-mid)]">{actions[0]}</span>
                        ) : (
                          <span className="text-[var(--brand-text-faint)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 text-[12px] text-[var(--brand-text-faint)]">
          No landing page data available.
        </div>
      )}

      {/* LP-to-ad match preview */}
      {landingPages.length > 0 && landingPages.some((lp: any) => lp.matchScore !== undefined) && (
        <Card title="LP-to-ad message match">
          <div className="space-y-0">
            {landingPages.filter((lp: any) => lp.matchScore !== undefined).slice(0, 5).map((lp: any, i: number) => (
              <div key={i} className="py-2.5 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-[var(--brand-text-faint)] uppercase tracking-wider">Ad</div>
                    <div className="text-[10px] text-[var(--brand-text-mid)] truncate">{lp.adHeadline || '—'}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-[var(--brand-text-faint)] uppercase tracking-wider">LP</div>
                    <div className="text-[10px] text-[var(--brand-text-mid)] truncate">{lp.lpH1 || lp.url || '—'}</div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge
                      status={lp.matchScore >= 0.8 ? 'pass' : lp.matchScore >= 0.5 ? 'warn' : 'fail'}
                      label={`${Math.round(lp.matchScore * 100)}% match`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {hasTrend && landingPages.length > 0 && (
        <Card title="LP performance trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-2)] rounded p-3">
            <Sparkline values={page?.landingPageTrend || []} tone="info" />
          </div>
        </Card>
      )}
    </div>
  );
}
