import React from 'react';
import {
  DataRow, MetricPill, Card, StatusBadge, SectionHeader,
  formatNumber, formatPercent,
} from '../../shared';

export default function ReplaysTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const ux = page?.ux || {};
  const tests = page?.tests || page?.experiments || [];
  const replayData = page?.sessionReplays || page?.replays || [];

  const activeTests = tests.filter((t: any) => t.status === 'active');
  const wonTests = tests.filter((t: any) => t.status === 'won');
  const lostTests = tests.filter((t: any) => t.status === 'lost');
  const inconclusiveTests = tests.filter((t: any) => t.status === 'inconclusive');
  const totalTests = activeTests.length + wonTests.length + lostTests.length + inconclusiveTests.length;
  const winRate = totalTests > 0 ? wonTests.length / totalTests : 0;
  const readyToShip = activeTests.filter((t: any) => (t.confidence || 0) >= 0.95).length;
  const staleTests = activeTests.filter((t: any) => (t.daysRunning || 0) > 14 && (t.confidence || 0) < 0.8);

  const allLifts = tests.filter((t: any) => t.uplift).map((t: any) => t.uplift);
  const avgLift = allLifts.length ? allLifts.reduce((a: number, b: number) => a + b, 0) / allLifts.length : 0;

  const byType = {
    ab: tests.filter((t: any) => t.type === 'ab').length,
    mvt: tests.filter((t: any) => t.type === 'mvt').length,
    personalize: tests.filter((t: any) => t.type === 'personalize').length,
  };

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Active" value={String(activeTests.length)} good={activeTests.length > 0} />
        <MetricPill label="Won" value={String(wonTests.length)} good={wonTests.length > 0} />
        <MetricPill label="Lost" value={String(lostTests.length)} good={lostTests.length === 0} />
        <MetricPill label="Win Rate" value={formatPercent(winRate)} good={winRate >= 0.3} />
        <MetricPill label="Avg Lift" value={formatPercent(avgLift)} good={avgLift > 0} />
      </div>

      {/* Ready to Ship */}
      {readyToShip > 0 && (
        <div className="bg-green-500/10 border border-green-500/25 rounded-lg px-4 py-3">
          <div className="text-[12px] text-green-400 font-medium">
            {readyToShip} test{readyToShip > 1 ? 's' : ''} ready to ship (95%+ confidence)
          </div>
        </div>
      )}

      {/* Stale Tests Warning */}
      {staleTests.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/25 rounded-lg px-4 py-3">
          <div className="text-[12px] text-orange-400 font-medium">
            {staleTests.length} test{staleTests.length > 1 ? 's' : ''} running 14+ days with low confidence
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Test Status */}
        <Card title="Test Status">
          <div className="space-y-3">
            {[
              { label: 'Active', count: activeTests.length, color: 'bg-blue-500', textColor: 'text-blue-400' },
              { label: 'Won', count: wonTests.length, color: 'bg-green-500', textColor: 'text-green-400' },
              { label: 'Lost', count: lostTests.length, color: 'bg-red-500', textColor: 'text-red-400' },
              { label: 'Inconclusive', count: inconclusiveTests.length, color: 'bg-[#64748b]', textColor: 'text-[#888]' },
            ].map((item) => {
              const pct = totalTests > 0 ? (item.count / totalTests) * 100 : 0;
              return (
                <div key={item.label} className="bg-[#0a0a0a] border border-[#222] rounded px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#ccc]">{item.label}</span>
                    <span className={`text-[11px] ${item.textColor}`}>{item.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded h-2">
                    <div className={`rounded h-2 transition-all ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Test Types */}
        <Card title="Test Types">
          <DataRow label="A/B Tests" value={formatNumber(byType.ab)} />
          <DataRow label="Multivariate" value={formatNumber(byType.mvt)} />
          <DataRow label="Personalization" value={formatNumber(byType.personalize)} />
          <div className="mt-3 pt-3 border-t border-[#141414]">
            <DataRow label="Avg Lift" value={formatPercent(avgLift)} status={avgLift > 0 ? 'pass' : 'warn'} />
            <DataRow label="Ready to Ship" value={formatNumber(readyToShip)} status={readyToShip > 0 ? 'pass' : 'info'} />
            <DataRow label="Needs Data" value={formatNumber(activeTests.filter((t: any) => (t.confidence || 0) < 0.8).length)} />
          </div>
        </Card>
      </div>

      {/* Active Tests */}
      {activeTests.length > 0 && (
        <Card title={`Active Tests (${activeTests.length})`}>
          <div className="space-y-2">
            {activeTests.sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 8).map((t: any, i: number) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[#ccc] block truncate">{t.name || t.id || `Test ${i + 1}`}</span>
                  <span className="text-[10px] text-[#555] block">{t.daysRunning || 0}d running{t.targetUrl ? ` \u00B7 ${t.targetUrl}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-mono ${
                    (t.confidence || 0) >= 0.95 ? 'text-green-400' :
                    (t.confidence || 0) >= 0.8 ? 'text-orange-400' : 'text-[#888]'
                  }`}>
                    {formatPercent((t.confidence || 0) * 100)}
                  </span>
                  {t.uplift !== undefined && (
                    <StatusBadge status={t.uplift > 0 ? 'pass' : 'warn'} label={`${t.uplift > 0 ? '+' : ''}${formatPercent(t.uplift * 100)}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Winners */}
      {wonTests.length > 0 && (
        <Card title="Winners">
          <div className="space-y-2">
            {wonTests.sort((a: any, b: any) => (b.uplift || 0) - (a.uplift || 0)).slice(0, 6).map((t: any, i: number) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 flex items-center justify-between">
                <span className="text-[12px] text-[#ccc] truncate">{t.name || t.id || `Test ${i + 1}`}</span>
                <StatusBadge status="pass" label={`+${formatPercent((t.uplift || 0) * 100)}`} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Session Replays */}
      {replayData.length > 0 && (
        <Card title="Session Replays">
          <div className="space-y-2">
            {replayData.slice(0, 6).map((r: any, i: number) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[#ccc] block truncate">{r.url || r.page || `Session ${i + 1}`}</span>
                  <span className="text-[10px] text-[#555] block">{r.duration ? `${Math.round(r.duration)}s` : ''}{r.events ? ` \u00B7 ${r.events} events` : ''}</span>
                </div>
                <StatusBadge status={r.hadFriction ? 'fail' : 'pass'} label={r.hadFriction ? 'Friction' : 'Clean'} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {totalTests === 0 && replayData.length === 0 && (
        <Card title="Tests & Replays">
          <div className="text-[12px] text-[#666] py-4 text-center">
            No A/B tests or session replays recorded yet. Tests will appear when experiments are running.
          </div>
        </Card>
      )}
    </div>
  );
}
