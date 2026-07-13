import React, { useState, useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { useAiPrompts, type PromptRow } from '../selectors/useAiPrompts';
import { fmtNum, fmtPct, fmtDate } from '../../_shared/formatters';
import { STATUS, MODE_ACCENT } from '../../_shared/tokens';

const ACCENT = MODE_ACCENT.ai;
const BORDER = 'border border-[#1a1a1a] bg-[#0a0a0a] rounded';

type PromptSet = 'brand' | 'informational' | 'commercial' | 'comparison' | 'transactional';

const PROMPT_SETS: { id: PromptSet; label: string }[] = [
  { id: 'brand', label: 'Brand' },
  { id: 'informational', label: 'Informational' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'transactional', label: 'Transactional' },
];

const MODELS = ['GPT-5', 'Sonnet', 'Perplexity', 'Gemini'];

export default function AiPromptsView() {
  const rows = useAiPrompts();
  const { fingerprint } = useSeoCrawler() as any;
  const host = fingerprint?.host ?? '';

  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const [promptSet, setPromptSet] = useState<PromptSet>('commercial');
  const [enabledModels, setEnabledModels] = useState<Set<string>>(new Set(MODELS));

  const selected = rows.find(r => r.id === selectedId) ?? rows[0];

  // Compute citation share
  const citationShare = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach(r => {
      r.citations.forEach(c => {
        try {
          const h = new URL(c.url).hostname.replace(/^www\./, '');
          counts.set(h, (counts.get(h) ?? 0) + 1);
        } catch {}
      });
    });
    return Array.from(counts.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [rows]);

  const totalCitations = citationShare.reduce((s, c) => s + c.count, 0);

  // Compute cited pages
  const citedPages = useMemo(() => {
    const pageCounts = new Map<string, number>();
    rows.forEach(r => {
      r.citations.forEach(c => {
        try {
          const path = new URL(c.url).pathname;
          pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
        } catch {}
      });
    });
    return Array.from(pageCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [rows]);

  const maxPageCitations = citedPages[0]?.count ?? 1;

  const toggleModel = (model: string) => {
    setEnabledModels(prev => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[#161616]">
        <select
          value={promptSet}
          onChange={e => setPromptSet(e.target.value as PromptSet)}
          className="h-7 px-2 text-[11px] bg-[#111] border border-[#222] rounded text-[#ccc] cursor-pointer"
        >
          {PROMPT_SETS.map(ps => (
            <option key={ps.id} value={ps.id}>{ps.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          {MODELS.map(m => (
            <button
              key={m}
              onClick={() => toggleModel(m)}
              className={`h-6 px-2 text-[10px] rounded border transition-colors ${
                enabledModels.has(m)
                  ? 'border-[#333] bg-[#1a1a2e] text-[#a78bfa]'
                  : 'border-[#1a1a1a] bg-transparent text-[#555]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button className="h-7 px-3 text-[11px] rounded bg-[#d946ef]/20 text-[#d946ef] hover:bg-[#d946ef]/30 transition-colors">
          Run all
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Prompt list */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#161616]">
          <div className="px-3 py-2 border-b border-[#161616]">
            <div className="text-[10px] uppercase tracking-wider text-[#666]">
              {rows.length} prompts tracked
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            {rows.length === 0 ? (
              <div className="p-4 text-[12px] text-[#666]">No prompts tracked.</div>
            ) : (
              rows.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`px-3 py-2.5 cursor-pointer border-b border-[#0f0f0f] transition-colors ${
                    selectedId === r.id ? 'bg-[#0e0e0e]' : 'hover:bg-[#0c0c0c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-white truncate">"{r.prompt}"</div>
                      <div className="text-[10px] text-[#666] mt-0.5">
                        {r.intent} · {r.citations.length} citations · last {fmtDate(r.lastChecked)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {r.ourPosition !== null ? (
                        <span className="text-[11px] font-medium" style={{ color: r.ourPosition <= 3 ? STATUS.good : r.ourPosition <= 5 ? STATUS.warn : STATUS.bad }}>
                          #{r.ourPosition}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#666]">missed</span>
                      )}
                    </div>
                  </div>

                  {/* Model indicators */}
                  <div className="flex gap-1.5 mt-1.5">
                    {MODELS.map(m => {
                      const cited = r.citations.some(c => c.engine?.toLowerCase().includes(m.toLowerCase()));
                      return (
                        <span
                          key={m}
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            cited ? 'bg-[#1a1a2e] text-[#a78bfa]' : 'bg-[#111] text-[#555]'
                          }`}
                        >
                          {m}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-[380px] flex flex-col min-h-0 overflow-auto custom-scrollbar p-3 gap-3">
          {selected ? (
            <>
              {/* Prompt detail */}
              <div className={BORDER + ' p-3'}>
                <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Prompt</div>
                <div className="text-[14px] text-white font-medium">"{selected.prompt}"</div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#888]">
                  <span>Intent: {selected.intent}</span>
                  <span>·</span>
                  <span>Last checked: {fmtDate(selected.lastChecked)}</span>
                </div>

                {/* Position per model */}
                <div className="mt-3 space-y-1.5">
                  {MODELS.map(m => {
                    const cite = selected.citations.find(c => c.engine?.toLowerCase().includes(m.toLowerCase()));
                    return (
                      <div key={m} className="flex items-center justify-between text-[11px]">
                        <span className="text-[#888]">{m}</span>
                        {cite ? (
                          <span className="text-[#22c55e]">
                            pos {cite.rank} of {selected.citations.filter(c => c.engine === cite.engine).length}
                          </span>
                        ) : (
                          <span className="text-[#666]">not cited</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Competitors */}
              {selected.competitors.length > 0 && (
                <div className={BORDER + ' p-3'}>
                  <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Competitors cited</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.competitors.map(c => (
                      <span key={c} className="px-2 py-0.5 text-[10px] rounded bg-[#1a1a1a] text-[#888]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Citation share */}
              <div className={BORDER + ' p-3'}>
                <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Citation share</div>
                <div className="space-y-1.5">
                  {citationShare.map(c => (
                    <div key={c.host} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#ccc] w-24 truncate">{c.host}</span>
                      <div className="flex-1 h-2 bg-[#111] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(c.count / totalCitations) * 100}%`,
                            backgroundColor: c.host === host ? ACCENT : '#555',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[#888] w-8 text-right">
                        {fmtPct(c.count / totalCitations, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cited pages */}
              <div className={BORDER + ' p-3'}>
                <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Cited pages (from us)</div>
                <div className="space-y-1.5">
                  {citedPages.map(p => (
                    <div key={p.path} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#c4b5fd] truncate flex-1">{p.path}</span>
                      <div className="w-20 h-2 bg-[#111] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#a78bfa]"
                          style={{ width: `${(p.count / maxPageCitations) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#888] w-6 text-right">{fmtNum(p.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-[12px] text-[#666]">
              Select a prompt to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
