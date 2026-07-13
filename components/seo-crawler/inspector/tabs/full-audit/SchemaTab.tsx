import React, { useState } from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, getMetric,
} from '../../shared';

const SCHEMA_TYPES = [
  { key: 'Article', field: 'hasArticleSchema' },
  { key: 'BreadcrumbList', field: 'hasBreadcrumbSchema' },
  { key: 'WebPage', field: 'hasWebPageSchema' },
  { key: 'Author', field: 'hasAuthorSchema' },
  { key: 'FAQPage', field: 'hasFaqSchema' },
  { key: 'HowTo', field: 'hasHowToSchema' },
  { key: 'Review', field: 'hasReviewSchema' },
] as const;

const RICH_RESULTS = [
  { key: 'Article', field: 'richResultArticle' },
  { key: 'Breadcrumb', field: 'richResultBreadcrumb' },
  { key: 'FAQ', field: 'richResultFaq' },
  { key: 'HowTo', field: 'richResultHowTo' },
  { key: 'Review', field: 'richResultReview' },
  { key: 'Sitelinks', field: 'richResultSitelinks' },
] as const;

export default function SchemaTab({ page }: { page: any; hasTrend?: boolean }) {
  const [expandedJson, setExpandedJson] = useState<Record<number, boolean>>({});
  const schemaTypes: string[] = Array.isArray(page?.schemaTypes) ? page.schemaTypes : [];
  const jsonLdBlocks: string[] = Array.isArray(page?.jsonLdBlocks) ? page.jsonLdBlocks
    : page?.jsonLd ? [typeof page.jsonLd === 'string' ? page.jsonLd : JSON.stringify(page.jsonLd, null, 2)] : [];
  const totalSchemaFields = SCHEMA_TYPES.length;
  const presentCount = SCHEMA_TYPES.filter(s => !!getMetric(page, s.field) || !!page?.[s.field]).length;
  const coverageScore = totalSchemaFields > 0 ? Math.round((presentCount / totalSchemaFields) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Types" value={formatNumber(schemaTypes.length)} good={schemaTypes.length > 0} />
        <MetricPill label="JSON-LD" value={formatNumber(jsonLdBlocks.length)} good={jsonLdBlocks.length > 0} />
        <MetricPill label="Coverage" value={`${coverageScore}%`} good={coverageScore >= 70} />
        <MetricPill label="Microdata" value={getMetric(page, 'hasMicrodata') || page?.hasMicrodata ? 'Yes' : 'No'} />
      </div>

      {/* Schema type validation */}
      <Card title="Schema types">
        <div className="grid grid-cols-2 gap-2">
          {SCHEMA_TYPES.map(s => {
            const present = !!getMetric(page, s.field) || !!page?.[s.field];
            return (
              <div key={s.key} className={`flex items-center justify-between px-3 py-2 rounded-md text-[11px] ${
                present ? 'bg-[#22c55e]/5 border border-[#22c55e]/20' : 'bg-[#0a0a0a] border border-[#1a1a1a]'
              }`}>
                <span className="text-[#ccc]">{s.key}</span>
                <span className={`text-[10px] font-medium ${present ? 'text-[#22c55e]' : 'text-[#F59E0B]'}`}>
                  {present ? '\u2713 Present' : '\u2717 Missing'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* JSON-LD */}
      {jsonLdBlocks.length > 0 && (
        <Card title={`JSON-LD blocks (${jsonLdBlocks.length})`}>
          <div className="space-y-2">
            {jsonLdBlocks.map((block, i) => {
              const expanded = expandedJson[i] || false;
              let formatted = block;
              try { formatted = JSON.stringify(JSON.parse(block), null, 2); } catch {}
              const lines = formatted.split('\n');
              const preview = expanded ? lines : lines.slice(0, 8);
              return (
                <div key={i} className="bg-[#060606] border border-[#1a1a1a] rounded-lg overflow-hidden">
                  <pre className="p-2.5 text-[10px] font-mono text-[#888] whitespace-pre-wrap break-all leading-relaxed">
                    {preview.map((line: string, j: number) => (
                      <div key={j} className="flex">
                        <span className="text-[#222] w-[24px] shrink-0 text-right mr-2 select-none">{j + 1}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </pre>
                  {lines.length > 8 && (
                    <button
                      onClick={() => setExpandedJson(prev => ({ ...prev, [i]: !prev[i] }))}
                      className="w-full text-[10px] text-[#F59E0B] hover:text-[#F59E0B]/80 py-1.5 border-t border-[#1a1a1a] transition-colors"
                    >
                      {expanded ? 'Collapse' : `Show all ${lines.length} lines`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Rich results */}
      <Card title="Rich result eligibility">
        <div className="grid grid-cols-2 gap-2">
          {RICH_RESULTS.map(r => {
            const eligible = !!getMetric(page, r.field) || !!page?.[r.field];
            return (
              <div key={r.key} className={`flex items-center justify-between px-3 py-2 rounded-md text-[11px] ${
                eligible ? 'bg-[#3b82f6]/5 border border-[#3b82f6]/20' : 'bg-[#0a0a0a] border border-[#1a1a1a]'
              }`}>
                <span className="text-[#ccc]">{r.key}</span>
                <span className={`text-[10px] font-medium ${eligible ? 'text-[#3b82f6]' : 'text-[#555]'}`}>
                  {eligible ? 'Eligible' : 'Not eligible'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
