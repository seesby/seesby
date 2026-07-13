import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric,
} from '../../shared';

export default function SchemaTab({ page }: { page: any }) {
  const schemaTypes: string[] = Array.isArray(page?.schemaTypes) ? page.schemaTypes : [];
  const hasBreadcrumb = page?.hasBreadcrumbSchema || schemaTypes.includes('BreadcrumbList');
  const hasFaq = page?.hasFaqSchema || schemaTypes.includes('FAQPage');
  const hasArticle = page?.hasArticleSchema || schemaTypes.includes('Article') || schemaTypes.includes('NewsArticle');
  const hasOrg = page?.hasOrgSchema || schemaTypes.includes('Organization');
  const hasProduct = schemaTypes.includes('Product');
  const hasHowTo = schemaTypes.includes('HowTo');
  const hasVideo = schemaTypes.includes('VideoObject');
  const hasLocalBusiness = schemaTypes.includes('LocalBusiness');
  const hasEvent = schemaTypes.includes('Event');
  const missingRequired: string[] = Array.isArray(page?.schemaMissingRequired) ? page.schemaMissingRequired : [];
  const jsonLd = page?.jsonLd || page?.schemaMarkup || '';

  const schemaCount = schemaTypes.length;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Types" value={formatNumber(schemaCount)} good={schemaCount > 0} />
        <MetricPill label="Article" value={hasArticle ? '✓' : '✗'} good={hasArticle} />
        <MetricPill label="Breadcrumb" value={hasBreadcrumb ? '✓' : '✗'} good={hasBreadcrumb} />
        <MetricPill label="Org" value={hasOrg ? '✓' : '✗'} good={hasOrg} />
        <MetricPill label="Missing" value={formatNumber(missingRequired.length)} good={missingRequired.length === 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        {schemaCount === 0 && <StatusBadge status="fail" label="No structured data found" />}
        {missingRequired.length > 0 && <StatusBadge status="fail" label={`${missingRequired.length} missing required fields`} />}
        {!hasOrg && <StatusBadge status="warn" label="Missing Organization schema" />}
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Present */}
        <Card title="Present">
          {schemaCount === 0 ? (
            <div className="text-[11px] text-[#444] py-2">No structured data (JSON-LD) detected.</div>
          ) : (
            <div className="space-y-1">
              {schemaTypes.map((type: string, i: number) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-[#111] last:border-b-0">
                  <span className="text-[11px] text-[#ccc]">{type}</span>
                  <StatusBadge status="pass" label="Present" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* JSON-LD */}
        <Card title="JSON-LD">
          {jsonLd ? (
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-2 max-h-[200px] overflow-auto">
              <pre className="text-[10px] text-[#888] font-mono whitespace-pre-wrap break-words">
                {typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-[11px] text-[#444] py-2">No JSON-LD source available.</div>
          )}
        </Card>
      </div>

      {/* Missing schemas */}
      {missingRequired.length > 0 && (
        <Card title="Missing required fields">
          <div className="flex flex-wrap gap-1.5">
            {missingRequired.map((field: string, i: number) => (
              <StatusBadge key={i} status="fail" label={field} />
            ))}
          </div>
        </Card>
      )}

      {/* Industry schemas */}
      <Card title="Industry schemas">
        <div className="space-y-1">
          {[
            { name: 'Product', present: hasProduct },
            { name: 'HowTo', present: hasHowTo },
            { name: 'VideoObject', present: hasVideo },
            { name: 'LocalBusiness', present: hasLocalBusiness },
            { name: 'Event', present: hasEvent },
            { name: 'FAQPage', present: hasFaq },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-[#111] last:border-b-0">
              <span className="text-[11px] text-[#ccc]">{s.name}</span>
              <StatusBadge status={s.present ? 'pass' : 'info'} label={s.present ? 'Present' : 'N/A'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
