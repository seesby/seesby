import React from 'react';
import { Card, StatusBadge } from '../../shared';

const MODEL_KEYS = ['gpt', 'sonnet', 'perplexity', 'gemini'];

function ModelCheck({ val }: { val: boolean | undefined }) {
  if (val === true) return <StatusBadge status="pass" label="Yes" />;
  if (val === false) return <StatusBadge status="fail" label="No" />;
  return <span className="text-[var(--brand-text-faint)] text-[11px]">&mdash;</span>;
}

function IntentBadge({ intent }: { intent: string }) {
  const colors: Record<string, string> = {
    info: 'bg-[#1e3a5f] text-[#93c5fd]',
    commercial: 'bg-[#14532d] text-[#86efac]',
    brand: 'bg-[#3b0764] text-[#d8b4fe]',
    transactional: 'bg-[#7c2d12] text-[#fdba74]',
    navigational: 'bg-[#164e63] text-[#67e8f9]',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${colors[intent] || 'bg-[var(--brand-surface-3)] text-[var(--brand-text-mid)]'}`}>
      {intent.slice(0, 3)}
    </span>
  );
}

export default function PromptsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const prompts = page?.citationQueries || page?.aiCitationQueries || [];
  const targetPrompts = page?.targetPrompts || page?.aiTargetPrompts || [];

  return (
    <div className="space-y-4">
      {/* Prompts triggering this page */}
      <Card title="Prompts triggering this page">
        {prompts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Prompt</th>
                  <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Set</th>
                  {MODEL_KEYS.map(m => (
                    <th key={m} className="px-2 py-1.5 text-center text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">{m.slice(0, 1).toUpperCase()}</th>
                  ))}
                  <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Pos avg</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((prompt: any, i: number) => {
                  const q = typeof prompt === 'string' ? { query: prompt } : prompt;
                  return (
                    <tr key={i} className="border-b border-[var(--brand-surface-2)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-2 py-1.5 text-[var(--brand-text-mid)] max-w-[200px] truncate" title={q.query || q.keyword}>
                        {q.query || q.keyword}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <IntentBadge intent={q.intent || q.set || q.type || 'info'} />
                      </td>
                      {MODEL_KEYS.map(m => (
                        <td key={m} className="px-2 py-1.5 text-center">
                          <ModelCheck val={q[m] ?? q[`${m}Cited`] ?? q.models?.[m]} />
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-strong)]">
                        {q.positionAvg != null ? Number(q.positionAvg).toFixed(1) : q.avgPosition != null ? Number(q.avgPosition).toFixed(1) : '\u2014'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)] py-3">No prompt data available</div>
        )}
      </Card>

      {/* Target prompts */}
      {targetPrompts.length > 0 && (
        <Card title="Target prompts">
          <div className="text-[11px] text-[var(--brand-text-mid)] mb-2">Prompts this page should win but doesn't:</div>
          <div className="space-y-1">
            {targetPrompts.map((target: any, i: number) => {
              const q = typeof target === 'string' ? { query: target } : target;
              return (
                <div key={i} className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-[var(--brand-text-mid)]">&ldquo;{q.query || q.keyword}&rdquo;</span>
                  <span className="text-[#f59e0b]">{q.reason || 'not cited'}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
