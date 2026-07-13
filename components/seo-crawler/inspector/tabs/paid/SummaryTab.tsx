import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge, TruncatedUrl,
  formatNumber, formatPercent, formatDuration, getActions,
} from '../../shared';
import { DeltaChip, Sparkline } from '../../../right-sidebar/_shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const paidIssues = actions.filter((a: any) =>
    /campaign|cpc|quality|ad|landing|keyword|paid|ppc|creative|auction/i.test(a.label || a.title || '')
  ).slice(0, 5);

  // Identity
  const campaignName = page?.campaignName || page?.paidCampaignName || page?.name || '—';
  const network = page?.network || page?.adNetwork || 'Google Ads';
  const funnelStage = page?.funnelStage || page?.paidFunnelStage || '—';
  const geo = page?.geo || page?.targetGeo || page?.country || '—';
  const device = page?.device || page?.deviceTargeting || 'all devices';

  // Delivery
  const status = page?.campaignStatus || page?.status || 'active';
  const budget = page?.dailyBudget || page?.budget || 0;
  const bidStrategy = page?.bidStrategy || page?.bidStrategyType || '—';
  const pacing = page?.budgetPacing || page?.pacing || 0;

  // Performance
  const spend = page?.spend30d || page?.spend || page?.totalSpend || 0;
  const impressions = page?.impressions30d || page?.impressions || page?.totalImpressions || 0;
  const ctr = page?.ctr30d || page?.ctr || (impressions > 0 ? (Number(page?.clicks || 0) / impressions) * 100 : 0);
  const cpc = page?.cpc || page?.avgCpc || 0;
  const conversions = page?.conversions30d || page?.conversions || page?.totalConversions || 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = page?.roas || (spend > 0 ? (Number(page?.revenue || 0) / spend) : 0);

  // Quality Score
  const qs = page?.qualityScore ?? page?.paidQualityScore ?? 0;
  const qsDelta = page?.qualityScoreDelta ?? page?.qsDelta ?? 0;
  const expCtr = page?.expectedCtr ?? page?.paidExpectedCtr;
  const adRelevance = page?.adRelevance ?? page?.paidAdRelevance;
  const lpExp = page?.landingPageExperience ?? page?.paidLandingPageExperience;

  const qsTone = qs >= 80 ? 'good' : qs >= 50 ? 'mid' : 'bad';
  const qsLabel = (v: number) => v >= 7 ? 'above avg' : v >= 5 ? 'average' : 'below avg';
  const qsStatus = (v: number) => v >= 7 ? 'pass' : v >= 5 ? 'warn' : 'fail';

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)] to-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{campaignName}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)] font-mono truncate mt-0.5">{network} · {geo} · {device}</div>
        </div>
        {qs > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={qsTone === 'good' ? '#22c55e' : qsTone === 'mid' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${(qs / 10) * 94.25} 94.25`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--brand-text-strong)]">{qs}</span>
            </div>
            {qsDelta !== 0 && <DeltaChip value={qsDelta} />}
          </div>
        )}
      </div>

      {/* Quick metrics - 5 columns */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Spend 30d" value={spend ? `$${formatNumber(spend, { maximumFractionDigits: 0 })}` : '—'} />
        <MetricPill label="Conversions" value={formatNumber(conversions)} />
        <MetricPill label="CPA" value={cpa ? `$${formatNumber(cpa, { maximumFractionDigits: 0 })}` : '—'} />
        <MetricPill label="ROAS" value={roas ? `${formatNumber(roas, { maximumFractionDigits: 1 })}x` : '—'} good={roas >= 3} />
        <MetricPill label="Impr share" value={page?.impressionShare ? formatPercent(page.impressionShare) : '—'}
          good={Number(page?.impressionShare) >= 0.5} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Identity */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Identity</div>
          <div className="space-y-0">
            <DataRow label="Campaign" value={campaignName} />
            <DataRow label="Network" value={network} />
            <DataRow label="Funnel" value={funnelStage} />
            <DataRow label="Geo" value={geo} />
            <DataRow label="Device" value={device} />
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Delivery</div>
          <div className="space-y-0">
            <DataRow label="Status" value={
              <StatusBadge
                status={status === 'active' || status === 'ENABLED' ? 'pass' : status === 'paused' ? 'warn' : 'fail'}
                label={status}
              />
            } />
            <DataRow label="Budget" value={budget ? `$${formatNumber(budget, { maximumFractionDigits: 0 })}/d` : '—'} />
            <DataRow label="Bid strategy" value={bidStrategy} />
            <DataRow label="Pacing" value={pacing ? `${Math.round(pacing * 100)}%` : '—'}
              status={pacing >= 0.9 ? 'pass' : pacing >= 0.7 ? 'warn' : 'fail'} />
          </div>
        </div>

        {/* Performance */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Performance 30d</div>
          <div className="space-y-0">
            <DataRow label="Spend" value={spend ? `$${formatNumber(spend, { maximumFractionDigits: 0 })}` : '—'} />
            <DataRow label="Impressions" value={formatNumber(impressions)} />
            <DataRow label="CTR" value={formatPercent(ctr, 100)} />
            <DataRow label="CPC" value={cpc ? `$${formatNumber(cpc, { maximumFractionDigits: 2 })}` : '—'} />
            <DataRow label="Conversions" value={formatNumber(conversions)} />
            <DataRow label="CPA" value={cpa ? `$${formatNumber(cpa, { maximumFractionDigits: 0 })}` : '—'} />
            <DataRow label="ROAS" value={roas ? `${formatNumber(roas, { maximumFractionDigits: 1 })}x` : '—'} />
          </div>
        </div>

        {/* Quality Score */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Quality Score</div>
          <div className="space-y-0">
            <DataRow label="Score" value={qs ? String(qs) : '—'} status={qs >= 7 ? 'pass' : qs >= 5 ? 'warn' : 'fail'} />
            <DataRow label="Expected CTR" value={expCtr ? qsLabel(Number(expCtr)) : '—'} status={expCtr ? qsStatus(Number(expCtr)) : undefined} />
            <DataRow label="Ad relevance" value={adRelevance ? qsLabel(Number(adRelevance)) : '—'} status={adRelevance ? qsStatus(Number(adRelevance)) : undefined} />
            <DataRow label="LP experience" value={lpExp ? qsLabel(Number(lpExp)) : '—'} status={lpExp ? qsStatus(Number(lpExp)) : undefined} />
          </div>
        </div>
      </div>

      {/* Trend */}
      {hasTrend && (
        <Card title="Spend trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-2)] rounded p-3">
            <Sparkline values={page?.spendTrend || page?.spendSeries || []} tone="info" />
          </div>
        </Card>
      )}

      {/* Issues */}
      {paidIssues.length > 0 && (
        <Card title={`Issues (${paidIssues.length})`}>
          <div className="space-y-0">
            {paidIssues.map((issue: any, i: number) => (
              <div key={`${issue.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <div className="mt-0.5">
                  {issue.type === 'error' || issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  ) : issue.type === 'warning' || issue.severity === 'MEDIUM' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--brand-text-mid)] font-medium">{issue.label || issue.title}</div>
                  {(issue.description || issue.reason) && (
                    <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5 line-clamp-1">{issue.description || issue.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
