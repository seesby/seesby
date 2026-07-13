import React from 'react';
import {
  DataRow, Card, MetricPill, TruncatedUrl,
  formatNumber, formatDate, getMetric, getActions,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function FlagRow({ label, fail }: { label: string; fail: boolean }) {
  return (
    <div className="flex items-center justify-between py-[3px] text-[11px]">
      <span className="text-[var(--brand-text-faint)]">{label}</span>
      <span className={`text-[10px] font-medium ${fail ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>
        {fail ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

function seriesOf(p: any, k: string): number[] {
  const s = p?.[`${k}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const contentIssues = actions
    .filter((a: any) => /content|duplicate|readability|word|title|meta|h1|grammar|spelling|freshness|thin/i.test(a.label || a.title || ''))
    .slice(0, 5);

  const wordCount = Number(page?.wordCount || 0);
  const readability = page?.readability || '—';
  const contentType = page?.contentType || page?.pageCategory || '—';
  const categoryConfidence = page?.pageCategoryConfidence ? `${Math.round(page.pageCategoryConfidence * 100)}%` : '—';
  const searchIntent = page?.searchIntent || '—';
  const qualityScore = Number(getMetric(page, 'contentQualityScore') || page?.contentQualityScore || 0);
  const healthScore = qualityScore || 0;
  const healthTone = healthScore >= 80 ? 'good' : healthScore >= 50 ? 'mid' : 'bad';
  const gaugeColor = healthTone === 'good' ? '#22c55e' : healthTone === 'mid' ? '#f59e0b' : '#ef4444';
  const gaugeDash = (healthScore / 100) * 94.25;

  const contentAge = Number(page?.contentAge || 0);
  const lastUpdated = page?.lastModified || '';
  const byline = getMetric(page, 'author') || getMetric(page, 'wpAuthorName') || page?.author;
  const authorBio = getMetric(page, 'authorBio') || page?.authorBio;

  const publishedDate = (() => {
    const candidates = [page?.wpPublishDate, page?.datePublished, page?.publishedDate];
    for (const c of candidates) {
      if (c && String(c).length <= 50 && !isNaN(new Date(String(c)).getTime())) return String(c);
    }
    const vd = page?.visibleDate;
    if (vd && String(vd).length <= 50 && !isNaN(new Date(String(vd)).getTime())) return String(vd);
    return '';
  })();

  const freshnessLabel = contentAge <= 90 ? 'Fresh' : contentAge <= 180 ? 'Recent' : contentAge <= 540 ? 'Aging' : 'Stale';
  const freshnessTone = contentAge <= 90 ? 'pass' : contentAge <= 180 ? 'info' : contentAge <= 540 ? 'warn' : 'fail';

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)] to-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{page?.title || 'Untitled'}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        {healthScore > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke={gaugeColor} strokeWidth="3" strokeDasharray={`${gaugeDash} 94.25`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-[var(--brand-text-strong)]">{healthScore}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Words" value={formatNumber(wordCount)} good={wordCount >= 300} />
        <MetricPill label="Readability" value={readability} good={page?.fleschScore >= 60} />
        <MetricPill label="Quality" value={qualityScore > 0 ? String(qualityScore) : '—'} good={qualityScore >= 70} />
        <MetricPill label="Type" value={contentType} good={!!contentType && contentType !== '—'} />
        <MetricPill label="Intent" value={searchIntent} good={searchIntent !== '—'} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Identity */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Identity</div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">Title</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{page?.title || '—'}</div>
          </div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">H1</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{page?.h1_1 || '—'}</div>
          </div>
          <div className="space-y-0">
            <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
            <DataRow label="Category" value={`${contentType} ${categoryConfidence !== '—' ? `(${categoryConfidence})` : ''}`} />
            <DataRow label="Language" value={page?.language || page?.lang || '—'} />
          </div>
        </div>

        {/* Copy */}
        <Card title="Copy">
          <DataRow label="Words" value={formatNumber(wordCount)} status={wordCount < 300 ? 'warn' : 'pass'} mono />
          <DataRow label="Headings" value={`H1:${page?.h1Count || 1} H2:${page?.h2Count || 0} H3:${page?.h3Count || 0}`} />
          <DataRow label="Meta desc" value={page?.metaDesc ? `${page.metaDesc.length} chars` : '—'}
            status={page?.metaDesc ? (page.metaDesc.length >= 120 && page.metaDesc.length <= 155 ? 'pass' : 'warn') : 'fail'} />
          <DataRow label="Images" value={`${page?.imgCount || 0}${page?.imgMissingAlt ? ` (${page.imgMissingAlt} alt missing)` : ''}`} />
        </Card>

        {/* Freshness */}
        <Card title="Freshness">
          <DataRow label="Published" value={formatDate(publishedDate)} />
          <DataRow label="Last updated" value={formatDate(lastUpdated)} />
          <DataRow label="Content age" value={contentAge > 0 ? `${formatNumber(contentAge)}d` : '—'} status={freshnessTone} />
          <DataRow label="Status" value={freshnessLabel} status={freshnessTone} />
          <DataRow label="Decay risk" value={page?.contentDecayRisk || '—'} status={page?.contentDecayRisk === 'high' ? 'fail' : page?.contentDecayRisk ? 'warn' : 'pass'} />
        </Card>

        {/* E-E-A-T */}
        <Card title="E-E-A-T">
          <DataRow label="Byline" value={byline || '—'} status={byline ? 'pass' : 'warn'} />
          <DataRow label="Author bio" value={authorBio ? 'Present' : 'Missing'} status={authorBio ? 'pass' : 'warn'} />
          <DataRow label="Author page" value={page?.authorPage ? 'Yes' : 'No'} />
          <DataRow label="Updated visually" value={page?.updatedVisually ? 'Yes' : 'No'} />
          <DataRow label="Citations" value={formatNumber(page?.citationsCount)} />
        </Card>
      </div>

      {hasTrend && (
        <Card title="Quality trend">
          <Sparkline values={seriesOf(page, 'contentQualityScore')} tone="info" />
        </Card>
      )}

      {/* Issues */}
      {contentIssues.length > 0 && (
        <Card title={`Issues (${contentIssues.length})`}>
          <div className="space-y-0">
            {contentIssues.map((a: any, i: number) => (
              <div key={`${a.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <div className="mt-0.5">
                  {a.type === 'error' || a.severity === 'CRITICAL' || a.severity === 'HIGH' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  ) : a.type === 'warning' || a.severity === 'MEDIUM' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--brand-text-mid)] font-medium">{a.label}</div>
                  {(a.description || a.reason) && (
                    <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5 line-clamp-1">{a.description || a.reason}</div>
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
