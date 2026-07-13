import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge, TruncatedUrl,
  formatNumber,
} from '../../shared';

export default function DuplicationTab({ page }: { page: any }) {
  const exactDuplicate = page?.exactDuplicate || false;
  const nearDuplicates = Array.isArray(page?.nearDuplicates) ? page.nearDuplicates : [];
  const nearDuplicateMatch = page?.nearDuplicateMatch || '';
  const similarityScore = Number(page?.semanticSimilarityScore || 0);
  const cannibalized = page?.isCannibalized || false;
  const cannibalizationCount = Number(page?.cannibalizationCount || 0);
  const cannibalizationSiblings = Array.isArray(page?.cannibalizationSiblings) ? page.cannibalizationSiblings : [];
  const duplicateContentPct = Number(page?.duplicateContentPercent || page?.duplicatePercentage || 0);
  const contentHash = page?.hash || '';

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Exact dupe" value={exactDuplicate ? 'Yes' : 'No'} good={!exactDuplicate} />
        <MetricPill label="Near dupes" value={formatNumber(nearDuplicates.length)} good={nearDuplicates.length === 0} />
        <MetricPill label="Cannibalized" value={cannibalized ? 'Yes' : 'No'} good={!cannibalized} />
        <MetricPill label="Dup %" value={duplicateContentPct > 0 ? `${duplicateContentPct.toFixed(1)}%` : '—'} good={duplicateContentPct === 0} />
        <MetricPill label="Similarity" value={similarityScore > 0 ? `${similarityScore.toFixed(0)}%` : '—'} good={similarityScore < 70} />
      </div>

      <div className="flex flex-wrap gap-2">
        {exactDuplicate && <StatusBadge status="fail" label="Exact duplicate detected" />}
        {nearDuplicates.length > 0 && <StatusBadge status="warn" label={`${nearDuplicates.length} near-duplicates`} />}
        {cannibalized && <StatusBadge status="fail" label="Keyword cannibalization" />}
        {duplicateContentPct > 20 && <StatusBadge status="warn" label={`${duplicateContentPct.toFixed(1)}% duplicate content`} />}
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Near-dupes */}
        <Card title={`Near-dupes (${nearDuplicates.length})`}>
          {nearDuplicates.length === 0 && !nearDuplicateMatch ? (
            <div className="text-[11px] text-[var(--brand-border-2)] py-2">No near-duplicates found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--brand-surface-3)]">
                    <th className="text-left text-[10px] text-[var(--brand-text-faint)] uppercase tracking-wider font-medium pb-1.5">URL</th>
                    <th className="text-right text-[10px] text-[var(--brand-text-faint)] uppercase tracking-wider font-medium pb-1.5">Sim</th>
                    <th className="text-center text-[10px] text-[var(--brand-text-faint)] uppercase tracking-wider font-medium pb-1.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nearDuplicateMatch && (
                    <tr className="border-b border-[var(--brand-surface-2)]">
                      <td className="py-1.5 text-[var(--brand-text-mid)] font-mono truncate max-w-[200px]">{nearDuplicateMatch}</td>
                      <td className="py-1.5 text-[#f59e0b] text-right font-mono">{similarityScore > 0 ? `${similarityScore.toFixed(0)}%` : '—'}</td>
                      <td className="py-1.5 text-center"><StatusBadge status="warn" label="Review" /></td>
                    </tr>
                  )}
                  {nearDuplicates.map((dupe: any, i: number) => {
                    const url = typeof dupe === 'string' ? dupe : dupe?.url || '';
                    const sim = typeof dupe === 'object' ? (dupe?.similarity || dupe?.score || 0) : 0;
                    return (
                      <tr key={i} className="border-b border-[var(--brand-surface-2)] last:border-b-0">
                        <td className="py-1.5 text-[var(--brand-text-mid)] font-mono truncate max-w-[200px]">{url}</td>
                        <td className="py-1.5 text-[#f59e0b] text-right font-mono">{sim > 0 ? `${sim.toFixed(0)}%` : '—'}</td>
                        <td className="py-1.5 text-center"><StatusBadge status="warn" label="Review" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Cannibalization */}
        <Card title="Cannibalization">
          {cannibalizationSiblings.length === 0 ? (
            <div className="text-[11px] text-[var(--brand-border-2)] py-2">No cannibalization detected.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--brand-surface-3)]">
                    <th className="text-left text-[10px] text-[var(--brand-text-faint)] uppercase tracking-wider font-medium pb-1.5">Query</th>
                    <th className="text-left text-[10px] text-[var(--brand-text-faint)] uppercase tracking-wider font-medium pb-1.5">Page A</th>
                    <th className="text-left text-[10px] text-[var(--brand-text-faint)] uppercase tracking-wider font-medium pb-1.5">Page B</th>
                  </tr>
                </thead>
                <tbody>
                  {cannibalizationSiblings.map((sib: any, i: number) => {
                    const query = typeof sib === 'object' ? (sib?.query || sib?.keyword || '—') : '—';
                    const pageA = typeof sib === 'object' ? (sib?.pageA || sib?.url1 || '—') : '—';
                    const pageB = typeof sib === 'object' ? (sib?.pageB || sib?.url2 || sib?.url || '—') : '—';
                    return (
                      <tr key={i} className="border-b border-[var(--brand-surface-2)] last:border-b-0">
                        <td className="py-1.5 text-[var(--brand-text-mid)]">{query}</td>
                        <td className="py-1.5 text-[var(--brand-text-faint)] font-mono truncate max-w-[150px]">{pageA}</td>
                        <td className="py-1.5 text-[var(--brand-text-faint)] font-mono truncate max-w-[150px]">{pageB}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-2 space-y-0">
            <DataRow label="Cannibalized" value={cannibalized ? 'Yes' : 'No'} status={cannibalized ? 'fail' : 'pass'} />
            <DataRow label="Sibling count" value={formatNumber(cannibalizationCount)} />
          </div>
        </Card>
      </div>

      {/* Canonical */}
      <Card title="Canonical">
        <DataRow label="Canonical URL" value={page?.canonical || '—'} status={page?.canonical ? 'pass' : 'warn'} />
        <DataRow label="Self-referencing" value={page?.canonical === page?.url ? 'Yes' : 'No'} status={page?.canonical === page?.url ? 'pass' : 'info'} />
        <DataRow label="Content hash" value={contentHash ? `${contentHash.slice(0, 12)}...` : '—'} />
      </Card>
    </div>
  );
}
