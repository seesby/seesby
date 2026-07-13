import React from 'react';
import { History, FileText, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import {
  Card, DataRow, SectionHeader, formatNumber, formatDate, getMetric,
} from '../../../inspector/shared';
import { Sparkline, DeltaChip } from '@/components/seo-crawler/right-sidebar/_shared';

function trend28d(page: any, key: string): number[] {
  const s = page?.[`${key}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

function DeltaIcon({ current, prev }: { current: number; prev?: number }) {
  if (prev === undefined) return <Minus size={9} className="text-[var(--brand-border-2)]" />;
  const delta = current - prev;
  if (delta > 0) return <ArrowUpRight size={10} className="text-[#22c55e]" />;
  if (delta < 0) return <ArrowDownRight size={10} className="text-[#ef4444]" />;
  return <Minus size={9} className="text-[var(--brand-surface-4)]" />;
}

function SparklineCard({ label, values }: { label: string; values: number[] }) {
  return (
    <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-2.5">
      <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest mb-1.5">{label}</div>
      <Sparkline values={values} width={200} height={32} />
    </div>
  );
}

function DeltaCard({ label, delta, invert }: { label: string; delta: number; invert?: boolean }) {
  const isGood = invert ? delta < 0 : delta > 0;
  return (
    <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-2.5">
      <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest">{label}</div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`text-[14px] font-bold ${delta === 0 ? 'text-[var(--brand-surface-4)]' : isGood ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          {delta === 0 ? '\u2014' : `${delta > 0 ? '+' : ''}${formatNumber(delta)}`}
        </span>
        <DeltaChip value={delta} />
      </div>
    </div>
  );
}

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const sessions = Array.isArray(page?.crawlSessions) ? page.crawlSessions : [];
  const events = Array.isArray(page?.pageEvents) ? page.pageEvents : [];
  const actionLog = Array.isArray(page?.actionLog) ? page.actionLog : [];

  // Merge crawls and events into a timeline
  const timeline = [
    ...sessions.map((s: any) => ({ type: 'crawl' as const, ...s })),
    ...events.map((e: any) => ({ type: 'event' as const, ...e })),
  ].sort((a: any, b: any) => {
    const da = new Date(a.date || a.timestamp || 0).getTime();
    const db = new Date(b.date || b.timestamp || 0).getTime();
    return db - da;
  });

  if (!hasTrend && sessions.length <= 1 && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-center">
        <History size={24} className="text-[var(--brand-border-2)] mb-3" />
        <div className="text-[12px] text-[var(--brand-text-faint)] font-medium">No trend data yet</div>
        <div className="text-[10px] text-[var(--brand-surface-4)] mt-1">Run another crawl to see trends</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend sparklines */}
      {hasTrend && (
        <>
          <SectionHeader title="Page trends (28d)" />
          <div className="grid grid-cols-3 gap-2">
            <SparklineCard label="Clicks" values={trend28d(page, 'gscClicks')} />
            <SparklineCard label="Impressions" values={trend28d(page, 'gscImpressions')} />
            <SparklineCard label="Position" values={trend28d(page, 'gscPosition')} />
          </div>
        </>
      )}

      {/* Deltas */}
      {hasTrend && (
        <>
          <SectionHeader title="Changes" />
          <div className="grid grid-cols-4 gap-2">
            <DeltaCard label="Clicks" delta={Number(getMetric(page, 'gscClicksDelta') || page?.gscClicksDelta || 0)} />
            <DeltaCard label="Impressions" delta={Number(getMetric(page, 'gscImpressionsDelta') || page?.gscImpressionsDelta || 0)} />
            <DeltaCard label="Position" delta={Number(getMetric(page, 'gscPositionDelta') || page?.gscPositionDelta || 0)} invert />
            <DeltaCard label="Health" delta={Number(getMetric(page, 'healthDelta') || page?.healthDelta || 0)} />
          </div>
        </>
      )}

      {/* Sessions */}
      {sessions.length > 0 && (
        <Card title={`Sessions (${sessions.length})`}>
          <div className="space-y-1.5">
            {sessions.map((s: any, i: number) => {
              const healthColor = (s.healthScore || 0) >= 80 ? '#22c55e' : (s.healthScore || 0) >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-[var(--brand-surface-0)] border border-[var(--brand-surface-2)] hover:border-[var(--brand-border-2)] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-[var(--brand-surface-2)]">
                      <History size={11} className="text-[var(--brand-text-faint)]" />
                    </div>
                    <div>
                      <div className="text-[11px] text-[var(--brand-text-strong)] font-medium">{formatDate(s.date)}</div>
                      <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider">{s.status || 'OK'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    {s.healthScore !== undefined && (
                      <div className="text-right min-w-[50px]">
                        <div className="text-[9px] text-[var(--brand-border-2)] uppercase">Health</div>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-[11px] font-mono font-bold text-[var(--brand-text-strong)]">{s.healthScore}</span>
                          <DeltaIcon current={s.healthScore} prev={sessions[i + 1]?.healthScore} />
                        </div>
                        <div className="h-1 bg-[var(--brand-surface-3)] rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.healthScore)}%`, background: healthColor }} />
                        </div>
                      </div>
                    )}
                    {s.clicks !== undefined && (
                      <div className="text-right">
                        <div className="text-[9px] text-[var(--brand-border-2)] uppercase">Clicks</div>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-[11px] font-mono font-bold text-[var(--brand-text-strong)]">{formatNumber(s.clicks)}</span>
                          <DeltaIcon current={s.clicks} prev={sessions[i + 1]?.clicks} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Action log */}
      {actionLog.length > 0 && (
        <Card title="Action Log">
          <div className="space-y-0">
            {actionLog.map((log: any, i: number) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <div className="shrink-0 mt-0.5">
                  <FileText size={10} className="text-[var(--brand-text-faint)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[var(--brand-text-mid)]">{log.action || log.label}</div>
                  <div className="text-[9px] text-[var(--brand-border-2)] mt-0.5">
                    {log.user && <span>{log.user} </span>}
                    {formatDate(log.date || log.timestamp)}
                    {log.outcome && <span className="text-[var(--brand-text-faint)]"> &middot; {log.outcome}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comparison */}
      {sessions.length >= 2 && hasTrend && (
        <Card title="Comparison">
          <DataRow label="First discovered" value={formatDate(page?.firstSeenDate)} />
          <DataRow label="Last change" value={formatDate(page?.lastModified)} />
          <DataRow
            label="Intent shift"
            value={page?.intentShift ? 'Detected' : 'None'}
            status={page?.intentShift ? 'warn' : 'pass'}
          />
          <DataRow
            label="Authority delta"
            value={`${page?.authorityDelta || 0}%`}
            status={(page?.authorityDelta || 0) < 0 ? 'fail' : 'pass'}
          />
          <DataRow label="Content age" value={page?.contentAge ? `${formatNumber(page.contentAge)}d` : '\u2014'} />
          <DataRow label="Schema count" value={(() => {
            const c = [page?.hasArticleSchema, page?.hasBreadcrumbSchema, page?.hasAuthorSchema, page?.hasFaqSchema, page?.hasWebPageSchema, page?.hasHowToSchema, page?.hasReviewSchema].filter(Boolean).length;
            return `${c}/7`;
          })()} />
          <DataRow label="Word count" value={formatNumber(getMetric(page, 'wordCount') || page?.wordCount)} />
        </Card>
      )}
    </div>
  );
}
