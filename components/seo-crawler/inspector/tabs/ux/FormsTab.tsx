import React from 'react';
import {
  DataRow, MetricPill, Card, StatusBadge, SectionHeader,
  formatNumber, formatPercent, formatDuration,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function FormsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const ux = page?.ux || {};
  const submitRate = page?.formSubmitRate ?? ux.formSubmitRate;
  const totalForms = page?.totalForms ?? ux.totalForms ?? 0;
  const fieldCount = page?.formFieldCount ?? ux.formFieldCount ?? 0;
  const completionTime = page?.formCompletionTime ?? ux.formCompletionTime;
  const totalStarts = page?.formStarts ?? ux.formStarts ?? 0;
  const totalCompletes = page?.formCompletes ?? ux.formCompletes ?? 0;
  const fieldAbandon = Math.max(0, totalStarts - totalCompletes);
  const worstFields = page?.worstFormFields || ux.worstFormFields || [];
  const validationErrors = page?.formValidationErrors || ux.formValidationErrors || [];
  const formsByPage = page?.formsByPage || ux.formsByPage || [];

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Submit Rate" value={formatPercent(submitRate)} good={Number(submitRate) >= 0.7} />
        <MetricPill label="Forms" value={formatNumber(totalForms)} />
        <MetricPill label="Fields" value={formatNumber(fieldCount)} />
        <MetricPill label="Starts" value={formatNumber(totalStarts)} />
        <MetricPill label="Completes" value={formatNumber(totalCompletes)} />
      </div>

      {/* Trend */}
      {hasTrend && (
        <Card title="Submit Rate Trend">
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
            <Sparkline values={page?.formSubmitRateTrend || []} tone="good" />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Form Overview */}
        <Card title="Form Overview">
          <DataRow label="Submit Rate" value={formatPercent(submitRate)} status={Number(submitRate) >= 0.7 ? 'pass' : Number(submitRate) >= 0.4 ? 'warn' : 'fail'} />
          <DataRow label="Total Forms" value={formatNumber(totalForms)} />
          <DataRow label="Field Count" value={formatNumber(fieldCount)} />
          <DataRow label="Completion Time" value={formatDuration(completionTime)} />
          <DataRow label="Form Starts" value={formatNumber(totalStarts)} />
          <DataRow label="Form Completes" value={formatNumber(totalCompletes)} />
          <DataRow label="Field Abandon" value={formatNumber(fieldAbandon)} status={fieldAbandon > 0 ? 'warn' : 'pass'} />
        </Card>

        {/* Worst Fields */}
        <Card title="Worst Fields">
          {worstFields.length > 0 ? (
            <div className="space-y-2">
              {worstFields.slice(0, 8).map((field: any, i: number) => (
                <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] text-[#ccc] block truncate">{field.name || field.label || field}</span>
                    {field.formName && <span className="text-[10px] text-[#555] block truncate">{field.formName}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {field.errorRate !== undefined && (
                      <StatusBadge status={Number(field.errorRate) > 0.1 ? 'fail' : 'warn'} label={`${(field.errorRate * 100).toFixed(0)}% err`} />
                    )}
                    {field.abandonRate !== undefined && (
                      <StatusBadge status={Number(field.abandonRate) > 0.3 ? 'fail' : 'warn'} label={`${(field.abandonRate * 100).toFixed(0)}% drop`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[#666]">No field-level data available.</div>
          )}
        </Card>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card title="Validation Errors">
          <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Field</th>
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Errors</th>
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Type</th>
                </tr>
              </thead>
              <tbody>
                {validationErrors.slice(0, 15).map((err: any, i: number) => (
                  <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                    <td className="px-3 py-2 text-[#ccc]">{err.field || err.name || '\u2014'}</td>
                    <td className="px-3 py-2 text-red-400">{err.count || err.errors || '\u2014'}</td>
                    <td className="px-3 py-2 text-[#888]">{err.type || err.rule || '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Forms by Page */}
      {formsByPage.length > 0 && (
        <Card title="Forms by Page">
          <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Page</th>
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Starts</th>
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Completes</th>
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Rate</th>
                </tr>
              </thead>
              <tbody>
                {formsByPage.slice(0, 10).map((fp: any, i: number) => (
                  <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                    <td className="px-3 py-2 text-[#ccc] truncate max-w-[200px]" title={fp.url || fp.title}>{fp.title || fp.url || '\u2014'}</td>
                    <td className="px-3 py-2 text-[#888]">{formatNumber(fp.starts)}</td>
                    <td className="px-3 py-2 text-[#888]">{formatNumber(fp.completes)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        status={Number(fp.submitRate) >= 0.7 ? 'pass' : Number(fp.submitRate) >= 0.4 ? 'warn' : 'fail'}
                        label={formatPercent(fp.submitRate)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
