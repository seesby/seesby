import React from 'react';
import { DataRow, Card, MetricPill, StatusBadge, formatNumber, formatPercent } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function DeliveryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const status = page?.campaignStatus || page?.status || 'active';
  const budget = page?.dailyBudget || page?.budget || 0;
  const monthlyBudget = page?.monthlyBudget || budget * 30;
  const bidStrategy = page?.bidStrategy || page?.bidStrategyType || '—';
  const pacing = page?.budgetPacing || page?.pacing || 0;
  const spend = page?.spend30d || page?.spend || 0;
  const spendPrev = page?.spendPrev || 0;
  const spendDelta = spendPrev > 0 ? ((spend - spendPrev) / spendPrev) * 100 : 0;

  const statusColor = status === 'active' || status === 'ENABLED' ? 'pass'
    : status === 'paused' ? 'warn'
    : status === 'learning' || status === 'LEARNING' ? 'info'
    : 'fail';

  const scheduling = page?.adSchedule || page?.schedule || 'All days';
  const startDate = page?.campaignStartDate || page?.startDate || '—';
  const endDate = page?.campaignEndDate || page?.endDate || '—';

  const targetCpa = page?.targetCpa || page?.targetCPA || 0;
  const targetRoas = page?.targetRoas || page?.targetROAS || 0;
  const maxCpc = page?.maxCpc || page?.maxCPC || 0;

  return (
    <div className="space-y-4">
      {/* Status + budget overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricPill label="Status" value={status} good={status === 'active' || status === 'ENABLED'} />
        <MetricPill label="Daily budget" value={budget ? `$${formatNumber(budget, { maximumFractionDigits: 0 })}` : '—'} />
        <MetricPill label="Pacing" value={pacing ? `${Math.round(pacing * 100)}%` : '—'} good={pacing >= 0.9} />
        <MetricPill label="Spend 30d" value={spend ? `$${formatNumber(spend, { maximumFractionDigits: 0 })}` : '—'} />
      </div>

      {/* Campaign status */}
      <Card title="Status">
        <div className="space-y-0">
          <DataRow label="Status" value={
            <StatusBadge status={statusColor} label={status} />
          } />
          <DataRow label="Campaign type" value={page?.campaignType || page?.type || '—'} />
          <DataRow label="Network" value={page?.network || page?.adNetwork || 'Google Ads'} />
          <DataRow label="Start" value={startDate} />
          <DataRow label="End" value={endDate} />
          <DataRow label="Schedule" value={scheduling} />
        </div>
      </Card>

      {/* Budget */}
      <Card title="Budget">
        <div className="space-y-0">
          <DataRow label="Daily" value={budget ? `$${formatNumber(budget, { maximumFractionDigits: 0 })}` : '—'} />
          <DataRow label="Monthly est" value={monthlyBudget ? `$${formatNumber(monthlyBudget, { maximumFractionDigits: 0 })}` : '—'} />
          <DataRow label="Spend 30d" value={spend ? `$${formatNumber(spend, { maximumFractionDigits: 0 })}` : '—'} />
          {spendDelta !== 0 && (
            <DataRow label="vs prev" value={`${spendDelta > 0 ? '+' : ''}${spendDelta.toFixed(1)}%`}
              status={spendDelta > 20 ? 'warn' : spendDelta < -20 ? 'info' : 'pass'} />
          )}
          <DataRow label="Pacing" value={pacing ? `${Math.round(pacing * 100)}%` : '—'}
            status={pacing >= 0.9 ? 'pass' : pacing >= 0.7 ? 'warn' : 'fail'} />
        </div>
        {hasTrend && (
          <div className="mt-3 bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-2)]] rounded p-3">
            <Sparkline values={page?.spendTrend || []} tone="info" />
          </div>
        )}
      </Card>

      {/* Bid strategy */}
      <Card title="Bid strategy">
        <div className="space-y-0">
          <DataRow label="Strategy" value={bidStrategy} />
          {targetCpa > 0 && <DataRow label="Target CPA" value={`$${formatNumber(targetCpa, { maximumFractionDigits: 0 })}`} />}
          {targetRoas > 0 && <DataRow label="Target ROAS" value={`${formatNumber(targetRoas, { maximumFractionDigits: 1 })}x`} />}
          {maxCpc > 0 && <DataRow label="Max CPC" value={`$${formatNumber(maxCpc, { maximumFractionDigits: 2 })}`} />}
          <DataRow label="Enhanced CPC" value={page?.enhancedCpc ? 'Yes' : 'No'} />
        </div>
      </Card>

      {/* Targeting */}
      <Card title="Targeting">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-1">Geo</div>
            <DataRow label="Primary" value={page?.geo || page?.targetGeo || page?.country || '—'} />
            <DataRow label="Secondary" value={page?.secondaryGeo || '—'} />
            <DataRow label="Excluded" value={page?.excludedGeo || '—'} />
          </div>
          <div>
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-1">Device</div>
            <DataRow label="Mobile" value={formatPercent(page?.mobileBidAdjustment || 0, 100)} />
            <DataRow label="Desktop" value={formatPercent(page?.desktopBidAdjustment || 0, 100)} />
            <DataRow label="Tablet" value={formatPercent(page?.tabletBidAdjustment || 0, 100)} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-1">Audience</div>
            <DataRow label="Remarketing" value={page?.remarketingList || '—'} />
            <DataRow label="Similar" value={page?.similarAudience || '—'} />
          </div>
          <div>
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-1">Ad schedule</div>
            <DataRow label="Hours" value={page?.adSchedule || 'All hours'} />
            <DataRow label="Days" value={page?.adScheduleDays || 'All days'} />
          </div>
        </div>
      </Card>
    </div>
  );
}
