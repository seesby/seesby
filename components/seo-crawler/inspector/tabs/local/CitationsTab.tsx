import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatPercent,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function CitationsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const citationCount = page?.citationCount ?? page?.e_local_citations_count;
  const citationQuality = page?.citationQuality ?? page?.e_local_citations_quality;
  const citationSources = page?.citationSources || page?.localCitationSources || [];
  const missingCitations = (page?.missingCitations ?? page?.e_local_citations_missing) || [];
  const duplicates = (page?.duplicates ?? page?.e_local_duplicates) || [];
  const nicheCitations = page?.nicheCitations || page?.localNicheCitations || [];
  const competitorCitations = page?.competitorCitations || [];
  const citationTrend = page?.citationCountTrend || [];

  // Breakdown
  const listedCount = citationSources.filter((s: any) => s.listed ?? s.found ?? true).length;

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Total" value={formatNumber(citationCount)} good={Number(citationCount) > 30} />
        <MetricPill label="Quality" value={formatPercent(citationQuality)} good={Number(citationQuality) >= 80} />
        <MetricPill label="Listed" value={`${listedCount}/${citationSources.length}`} good={listedCount === citationSources.length} />
        <MetricPill label="Missing" value={formatNumber(missingCitations.length)} good={missingCitations.length === 0} />
        <MetricPill label="Duplicates" value={formatNumber(duplicates.length)} good={duplicates.length === 0} />
      </div>

      {/* Top row: Top directories, Missing */}
      <div className="grid grid-cols-2 lg:grid-cols-[1fr_200px] gap-2.5">
        {/* Top directories table */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Top directories</div>
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Source</th>
                  <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Listed</th>
                  <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Accurate</th>
                  <th className="px-3 py-1.5 text-right text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {citationSources.length > 0 ? citationSources.map((src: any, i: number) => {
                  const name = src.directory || src.source || src.name;
                  const listed = src.listed ?? src.found ?? true;
                  const accurate = src.accurate ?? src.napMatch ?? true;
                  const priority = src.priority || 'med';
                  return (
                    <tr key={i} className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-3 py-1.5 text-[var(--brand-text-mid)] font-medium">{name}</td>
                      <td className="px-3 py-1.5 text-center">
                        <StatusBadge status={listed ? 'pass' : 'fail'} label={listed ? '\u2713' : '\u2717'} />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <StatusBadge status={accurate ? 'pass' : 'warn'} label={accurate ? '\u2713' : '\u26A0'} />
                      </td>
                      <td className="px-3 py-1.5 text-right text-[var(--brand-text-mid)]">{priority}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-[11px] text-[var(--brand-text-faint)]">No citation data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Missing</div>
          <div className="space-y-1">
            {missingCitations.length > 0 ? missingCitations.map((cit: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                <span className="text-[var(--brand-text-mid)]">{typeof cit === 'string' ? cit : cit.directory || cit.name || cit.source}</span>
                <StatusBadge status="fail" label="\u2717" />
              </div>
            )) : (
              <div className="text-[11px] text-[var(--brand-text-faint)]">None missing</div>
            )}
          </div>
        </div>
      </div>

      {/* Niche citations */}
      {nicheCitations.length > 0 && (
        <Card title="Niche (by category)">
          <div className="space-y-1">
            {nicheCitations.map((cit: any, i: number) => {
              const name = typeof cit === 'string' ? cit : cit.directory || cit.name;
              const listed = typeof cit === 'object' ? (cit.listed ?? cit.found ?? false) : false;
              return (
                <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                  <span className="text-[var(--brand-text-mid)]">{name}</span>
                  <StatusBadge status={listed ? 'pass' : 'fail'} label={listed ? '\u2713' : '\u2717 \u26A0'} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Competitor comparison */}
      {competitorCitations.length > 0 && (
        <Card title="Competitor Citations">
          <div className="space-y-1">
            {competitorCitations.map((comp: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                <span className="text-[var(--brand-text-mid)]">{comp.name || comp.domain || `Competitor ${i + 1}`}</span>
                <span className="text-[var(--brand-text-strong)] font-medium">{formatNumber(comp.citations ?? comp.count)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Duplicates */}
      {duplicates.length > 0 && (
        <Card title={`Duplicate Listings (${duplicates.length})`}>
          <div className="space-y-1">
            {duplicates.map((dup: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                <span className="text-[var(--brand-text-mid)]">{dup.directory || dup.source || dup.name || '\u2014'}</span>
                <StatusBadge status="warn" label="Duplicate" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trend */}
      {hasTrend && citationTrend.length > 0 && (
        <Card title="Citation Trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3">
            <Sparkline values={citationTrend} tone="info" />
          </div>
        </Card>
      )}
    </div>
  );
}
