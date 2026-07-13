import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SuggestedRewriteBlock({
  label, current, suggestion, limit,
}: { label: string; current?: string | null; suggestion?: string | null; limit?: number }) {
  const curLen = current?.length || 0;
  const sugLen = suggestion?.length || 0;
  const tone = (n: number) => (!limit ? 'text-[var(--brand-text-mid)]' : n === 0 ? '#ef4444' : n > limit ? '#f59e0b' : '#22c55e');
  return (
    <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-[var(--brand-text-faint)] font-bold">{label}</div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span style={{ color: tone(curLen) }}>{curLen}{limit ? `/${limit}` : ''}</span>
          {suggestion && <span className="text-[var(--brand-text-faint)]">→</span>}
          {suggestion && <span style={{ color: tone(sugLen) }}>{sugLen}{limit ? `/${limit}` : ''}</span>}
        </div>
      </div>
      <div className="text-[12px] text-[var(--brand-text-mid)] break-words">{current || <span className="italic text-[var(--brand-text-faint)]">Missing</span>}</div>
      {suggestion && (
        <div className="mt-2 pt-2 border-t border-[var(--brand-surface-3)]">
          <div className="flex items-center gap-1.5 text-[10px] text-[#a78bfa] mb-1">
            <Sparkles size={10} /> Suggested
          </div>
          <div className="text-[12px] text-[var(--brand-text-mid)] break-words">{suggestion}</div>
        </div>
      )}
    </div>
  );
}
