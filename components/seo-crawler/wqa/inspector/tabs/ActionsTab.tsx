import React from 'react';
import { SectionHeader, StatusBadge, getActions } from '../../../inspector/shared';
import ActionCard from '../parts/ActionCard';
import { X } from 'lucide-react';

export default function ActionsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const issues = getActions(page);
  const primary = issues[0];
  const alsoSuggested = issues.slice(1, 4);
  const notSuggested = issues.slice(4);

  return (
    <div className="space-y-4">
      {/* Primary action */}
      {primary && (
        <div className="rounded border border-[#F59E0B]/40 bg-[#F59E0B]/5 p-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="block w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-[12px] font-bold text-white uppercase tracking-wider">{primary.label}</span>
                <StatusBadge status="fail" label={`Priority ${primary.priority <= 3 ? 'HIGH' : primary.priority <= 6 ? 'MED' : 'LOW'}`} />
              </div>
              {primary.description && (
                <div className="text-[10px] text-[#aaa] ml-4">{primary.description}</div>
              )}
            </div>
          </div>
          {primary.trigger && (
            <div className="ml-4 mb-2">
              <div className="text-[9px] text-[#444] uppercase tracking-widest mb-0.5">Trigger</div>
              <div className="text-[10px] text-[#888]">{primary.trigger}</div>
            </div>
          )}
          {primary.targetKeyword && (
            <div className="ml-4 mb-2">
              <div className="text-[9px] text-[#444] uppercase tracking-widest mb-0.5">Target</div>
              <div className="text-[10px] text-[#ccc]">Keyword: "{primary.targetKeyword}"</div>
            </div>
          )}
          {primary.brief && (
            <div className="ml-4 mb-2">
              <div className="text-[9px] text-[#444] uppercase tracking-widest mb-0.5">Brief</div>
              <div className="text-[10px] text-[#888] whitespace-pre-line">{primary.brief}</div>
            </div>
          )}
          {primary.forecast && (
            <div className="ml-4 mb-2">
              <div className="text-[9px] text-[#444] uppercase tracking-widest mb-0.5">Forecast</div>
              <div className="text-[10px] text-[#888]">{primary.forecast}</div>
            </div>
          )}
          <div className="ml-4 flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#F59E0B]/20">
            <button className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest bg-[#1a1a1a] border border-[#262626] rounded text-white hover:bg-[#222] transition-colors">
              Approve
            </button>
            <button className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest bg-[#0a0a0a] border border-[#262626] rounded text-[#888] hover:text-white hover:border-[#444] transition-colors">
              Edit Brief
            </button>
            <button className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest bg-[#0a0a0a] border border-[#262626] rounded text-[#888] hover:text-white hover:border-[#444] transition-colors">
              Assign
            </button>
            <button className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest bg-[#0a0a0a] border border-[#262626] rounded text-[#888] hover:text-white hover:border-[#444] transition-colors">
              Send to Jira
            </button>
            <button className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest bg-[#0a0a0a] border border-[#262626] rounded text-[#888] hover:text-white hover:border-[#444] transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Also suggested */}
      {alsoSuggested.length > 0 && (
        <div>
          <SectionHeader title="Also suggested" />
          <div className="space-y-2 mt-2">
            {alsoSuggested.map((a, i) => (
              <ActionCard
                key={`sug-${i}`}
                title={a.label}
                reason={a.description || a.reason}
                category={a.category || (a.id.startsWith('C') ? 'content' : a.id.startsWith('T') ? 'technical' : 'industry')}
                priority={a.priority || (a.severity === 'HIGH' ? 3 : a.severity === 'MEDIUM' ? 6 : 9)}
                estimatedImpact={a.estimatedImpact || (a.impactHint === 'high' ? 100 : a.impactHint === 'medium' ? 50 : 10)}
                effort={a.effort || (a.effortMinutes < 60 ? 'low' : a.effortMinutes < 240 ? 'medium' : 'high')}
                factors={a.factors}
                confidence={a.confidence}
              />
            ))}
          </div>
        </div>
      )}

      {/* Not suggested */}
      {notSuggested.length > 0 && (
        <div>
          <SectionHeader title="Not suggested (explicitly)" />
          <div className="space-y-1 mt-2">
            {notSuggested.map((a, i) => (
              <div key={`ns-${i}`} className="flex items-center gap-2 py-1.5 px-2 rounded bg-[#080808] border border-[#141414]">
                <X size={10} className="text-[#444] shrink-0" />
                <span className="text-[10px] text-[#666]">{a.label}</span>
                {a.reason && <span className="text-[9px] text-[#333]">\u2014 {a.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {issues.length === 0 && (
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 text-center">
          <div className="text-[12px] text-[#666]">No actions assigned. Page is healthy.</div>
        </div>
      )}
    </div>
  );
}
