import React, { useState } from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric,
} from '../../shared';
import CollapseGroup from '../full-audit/CollapseGroup';

export default function SchemaTab({ page }: { page: any }) {
  const schemas = Array.isArray(page?.schemaTypes) ? page.schemaTypes
    : Array.isArray(page?.schema) ? page.schema
    : Array.isArray(page?.structuredData) ? page.structuredData
    : [];

  const jsonLd = Array.isArray(page?.jsonLd) ? page.jsonLd
    : Array.isArray(page?.jsonLdScripts) ? page.jsonLdScripts
    : [];

  const microdata = Array.isArray(page?.microdata) ? page.microdata : [];
  const rdfa = Array.isArray(page?.rdfa) ? page.rdfa : [];

  const schemaErrors = Array.isArray(page?.schemaErrors) ? page.schemaErrors : [];
  const schemaWarnings = Array.isArray(page?.schemaWarnings) ? page.schemaWarnings : [];
  const missingRequired = Array.isArray(page?.missingRequiredSchemas) ? page.missingRequiredSchemas : [];

  // Build types present list with status
  const schemaTypes = schemas.map((s: any) => {
    const type = typeof s === 'string' ? s : s?.type || s?.['@type'] || '—';
    const hasErrors = schemaErrors.some((e: any) => (e?.type || e?.schemaType) === type);
    const hasWarnings = schemaWarnings.some((w: any) => (w?.type || w?.schemaType) === type);
    return { type, hasErrors, hasWarnings };
  });

  // Build validation list from errors/warnings
  const validationItems = [
    ...schemaErrors.map((e: any) => ({
      type: e?.type || e?.schemaType || 'Unknown',
      message: e?.message || e?.error || '—',
      severity: 'error' as const,
    })),
    ...schemaWarnings.map((w: any) => ({
      type: w?.type || w?.schemaType || 'Unknown',
      message: w?.message || w?.warning || '—',
      severity: 'warning' as const,
    })),
  ];

  // Group validation by schema type
  const validationByType: Record<string, Array<{ type: string; message: string; severity: 'error' | 'warning' }>> = {};
  for (const item of validationItems) {
    if (!validationByType[item.type]) validationByType[item.type] = [];
    validationByType[item.type].push(item);
  }

  // Rich result eligibility
  const richResults = Array.isArray(page?.richResults) ? page.richResults
    : Array.isArray(page?.richResultEligibility) ? page.richResultEligibility
    : [];

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Types" value={formatNumber(schemaTypes.length)} good={schemaTypes.length > 0} />
        <MetricPill label="JSON-LD" value={formatNumber(jsonLd.length)} good={jsonLd.length > 0} />
        <MetricPill label="Errors" value={formatNumber(schemaErrors.length)} good={schemaErrors.length === 0} />
        <MetricPill label="Missing" value={formatNumber(missingRequired.length)} good={missingRequired.length === 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Types present */}
        <Card title="Types present">
          <div className="space-y-1">
            {schemaTypes.length > 0 ? schemaTypes.map((s, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-md text-[11px] ${
                s.hasErrors ? 'bg-red-500/5 border border-red-500/20' : 'bg-[#22c55e]/5 border border-[#22c55e]/20'
              }`}>
                <span className={`font-medium ${s.hasErrors ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>{s.type}</span>
                <span className={`text-[10px] ${s.hasErrors ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>
                  {s.hasErrors ? '✗ errors' : '✓'}
                </span>
              </div>
            )) : (
              <div className="text-[11px] text-[var(--brand-text-faint)] italic py-2 text-center">No schema types found</div>
            )}
          </div>
        </Card>

        {/* Validation */}
        <Card title="Validation (Google SDTT)">
          <div className="space-y-1">
            {Object.keys(validationByType).length > 0 ? (
              Object.entries(validationByType).map(([type, items], i) => {
                const errorCount = items.filter(x => x.severity === 'error').length;
                const warnCount = items.filter(x => x.severity === 'warning').length;
                return (
                  <div key={i} className="border-b border-[var(--brand-surface-2)] last:border-b-0 pb-2 last:pb-0">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[11px] text-[var(--brand-text-strong)] font-medium">{type}</span>
                      <span className="text-[10px] text-[var(--brand-text-mid)]">
                        {errorCount > 0 && <span className="text-[#F59E0B]">{errorCount} error{errorCount > 1 ? 's' : ''}</span>}
                        {errorCount > 0 && warnCount > 0 && ' · '}
                        {warnCount > 0 && <span className="text-[#f59e0b]">{warnCount} warning{warnCount > 1 ? 's' : ''}</span>}
                        {errorCount === 0 && warnCount === 0 && <span className="text-[#22c55e]">ok</span>}
                      </span>
                    </div>
                    {items.map((item, j) => (
                      <div key={j} className="text-[10px] text-[var(--brand-text-faint)] pl-3 py-0.5">
                        {item.severity === 'error' ? (
                          <span className="text-[#F59E0B]">✗</span>
                        ) : (
                          <span className="text-[#f59e0b]">⚠</span>
                        )} {item.message}
                      </div>
                    ))}
                  </div>
                );
              })
            ) : missingRequired.length > 0 ? (
              missingRequired.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md text-[11px] bg-red-500/5 border border-red-500/20">
                  <span className="text-[#F59E0B]">{typeof s === 'string' ? s : s?.type || s?.name}</span>
                  <StatusBadge status="fail" label="Missing" />
                </div>
              ))
            ) : (
              <div className="text-[11px] text-[#22c55e] py-2 text-center">All schemas valid</div>
            )}
          </div>
        </Card>
      </div>

      {/* JSON-LD raw */}
      <CollapseGroup title="JSON-LD raw" defaultOpen={jsonLd.length > 0}>
        {jsonLd.length > 0 ? (
          <div className="space-y-2">
            {jsonLd.map((block: any, i: number) => {
              const content = typeof block === 'string' ? block : JSON.stringify(block?.content || block, null, 2);
              const blockType = typeof block === 'object' ? (block?.['@type'] || block?.type || '—') : '—';
              return (
                <div key={i} className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-[var(--brand-surface-3)] flex items-center gap-2">
                    <span className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Block {i + 1}</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono">{blockType}</span>
                  </div>
                  <pre className="p-2.5 text-[10px] font-mono text-[var(--brand-text-mid)] whitespace-pre-wrap break-all leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar">
                    {content}
                  </pre>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)] italic py-2 text-center">No JSON-LD found</div>
        )}
      </CollapseGroup>

      {/* Microdata & RDFa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Microdata found">
          {microdata.length > 0 ? (
            <div className="space-y-1">
              {microdata.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md text-[11px] bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
                  <span className="text-[var(--brand-text-mid)]">{m?.type || m?.itemtype || '—'}</span>
                  <StatusBadge status="pass" label="Found" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)] italic py-2 text-center">(none)</div>
          )}
        </Card>

        <Card title="RDFa found">
          {rdfa.length > 0 ? (
            <div className="space-y-1">
              {rdfa.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md text-[11px] bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
                  <span className="text-[var(--brand-text-mid)]">{r?.type || r?.typeof || '—'}</span>
                  <StatusBadge status="pass" label="Found" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)] italic py-2 text-center">(none)</div>
          )}
        </Card>
      </div>

      {/* Rich result eligibility */}
      {richResults.length > 0 && (
        <Card title="Rich result eligibility">
          <div className="flex flex-wrap gap-1.5">
            {richResults.map((r: any, i: number) => {
              const name = typeof r === 'string' ? r : r?.type || r?.name || '—';
              const eligible = typeof r === 'object' ? (r?.eligible !== false) : true;
              const hasFixes = typeof r === 'object' && !!r?.hasFixes;
              return (
                <span key={i} className={`px-2 py-1 rounded text-[11px] border ${
                  eligible
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-[var(--brand-surface-0)] text-[var(--brand-text-faint)] border-[var(--brand-surface-3)]'
                }`}>
                  {name}{hasFixes ? ' (with fixes)' : ''}
                </span>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
