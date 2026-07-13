import React from 'react';
import { getActions, Card, StatusBadge } from '../../shared';

export default function IssuesTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const commerceIssues = actions.filter((a: any) =>
    /product|price|stock|feed|schema|commerce|inventory|variant|review|rating/i.test(a.label || a.title || '')
  );

  const critical = commerceIssues.filter((a: any) => a.severity === 'CRITICAL' || (a.type === 'error' && a.severity !== 'HIGH'));
  const high = commerceIssues.filter((a: any) => a.severity === 'HIGH' || (a.type === 'error' && a.severity === 'HIGH'));
  const medLow = commerceIssues.filter((a: any) => a.severity === 'MEDIUM' || a.severity === 'LOW' || a.type === 'warning' || a.type === 'notice');
  const suppressed = commerceIssues.filter((a: any) => a.suppressed || a.trivial);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Critical */}
        <Card title="Critical">
          {critical.length > 0 ? critical.map((issue: any, i: number) => (
            <div key={`${issue.id}-${i}`} className="flex items-start gap-2 py-[3px]">
              <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-0.5 shrink-0" />
              <span className="text-[11px] text-[#ccc]">{issue.label || issue.title}</span>
            </div>
          )) : (
            <div className="text-[11px] text-[#555]">(none)</div>
          )}
        </Card>

        {/* High */}
        <Card title="High">
          {high.length > 0 ? high.map((issue: any, i: number) => (
            <div key={`${issue.id}-${i}`} className="flex items-start gap-2 py-[3px]">
              <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-[#ccc]">{issue.label || issue.title}</span>
                {issue.description && <div className="text-[10px] text-[#444] mt-0.5 line-clamp-2">{issue.description}</div>}
              </div>
            </div>
          )) : (
            <div className="text-[11px] text-[#555]">(none)</div>
          )}
        </Card>

        {/* Med/Low */}
        <Card title="Med/Low">
          {medLow.length > 0 ? medLow.map((issue: any, i: number) => (
            <div key={`${issue.id}-${i}`} className="flex items-start gap-2 py-[3px]">
              <span className={`block w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${
                issue.type === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#6b7280]'
              }`} />
              <span className="text-[11px] text-[#ccc]">{issue.label || issue.title}</span>
            </div>
          )) : (
            <div className="text-[11px] text-[#555]">(none)</div>
          )}
        </Card>
      </div>

      {/* Suppressed */}
      {suppressed.length > 0 && (
        <Card title={`Suppressed (trivial) (${suppressed.length})`}>
          {suppressed.map((issue: any, i: number) => (
            <div key={`${issue.id}-${i}`} className="flex items-start gap-2 py-[3px]">
              <span className="block w-1.5 h-1.5 rounded-full bg-[#333] mt-0.5 shrink-0" />
              <span className="text-[11px] text-[#555]">{issue.label || issue.title}</span>
            </div>
          ))}
        </Card>
      )}

      {commerceIssues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-[13px] text-[#666] max-w-[280px]">
            No commerce issues detected. All checks are passing.
          </div>
        </div>
      )}
    </div>
  );
}
