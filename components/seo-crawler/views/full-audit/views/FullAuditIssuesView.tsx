import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useFullAuditIssues } from '../selectors/useFullAuditIssues';
import { SURFACE, TEXT, TEXT_EXT, STATUS, R } from '../../_shared/tokens';

const TYPE_OPTIONS = ['all', 'error', 'warning', 'notice'] as const;
const CATEGORY_OPTIONS = ['all', 'content', 'technical', 'schema', 'links', 'a11y', 'security'] as const;

export default function FullAuditIssuesView() {
  const { rows } = useFullAuditIssues();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'count' | 'category'>('count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const counts = useMemo(() => ({
    error: rows.filter(r => r.type === 'error').length,
    warning: rows.filter(r => r.type === 'warning').length,
    notice: rows.filter(r => r.type === 'notice').length,
  }), [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (typeFilter !== 'all') result = result.filter(r => r.type === typeFilter);
    if (categoryFilter !== 'all') result = result.filter(r => r.category.toLowerCase() === categoryFilter);
    result = [...result].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      if (sortKey === 'count') return mul * (a.count - b.count);
      return mul * a.category.localeCompare(b.category);
    });
    return result;
  }, [rows, typeFilter, categoryFilter, sortKey, sortDir]);

  const selectClass = `h-7 px-2 rounded text-[11px] focus:outline-none appearance-none cursor-pointer`;

  function sevDots(type: string): string {
    if (type === 'error') return '\u25CF\u25CF\u25CF\u25CF';
    if (type === 'warning') return '\u25CF\u25CF\u25CF';
    return '\u25CF';
  }

  function sevColor(type: string): string {
    if (type === 'error') return STATUS.bad;
    if (type === 'warning') return STATUS.warn;
    return TEXT.muted;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Filters */}
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: SURFACE.br0 }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className={selectClass}
          style={{ background: SURFACE.bg1, borderColor: SURFACE.br1, border: `1px solid ${SURFACE.br1}`, color: TEXT_EXT.strong }}
        >
          {TYPE_OPTIONS.map(t => {
            const label = t === 'all' ? 'All severity' : t.charAt(0).toUpperCase() + t.slice(1);
            const count = t === 'all' ? rows.length : counts[t as keyof typeof counts];
            return <option key={t} value={t}>{label} ({count})</option>;
          })}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className={selectClass}
          style={{ background: SURFACE.bg1, borderColor: SURFACE.br1, border: `1px solid ${SURFACE.br1}`, color: TEXT_EXT.strong }}
        >
          {CATEGORY_OPTIONS.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_80px_80px_120px] gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider border-b" style={{ color: TEXT.tertiary, borderColor: SURFACE.br0 }}>
        <span>Issue</span>
        <span>Severity</span>
        <button onClick={() => { setSortKey('count'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }} className="text-left hover:opacity-80">
          Count {sortKey === 'count' ? (sortDir === 'desc' ? '\u25BC' : '\u25B2') : ''}
        </button>
        <button onClick={() => { setSortKey('category'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }} className="text-left hover:opacity-80">
          Category {sortKey === 'category' ? (sortDir === 'desc' ? '\u25BC' : '\u25B2') : ''}
        </button>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-[11px]" style={{ color: TEXT.tertiary }}>No issues detected.</div>
        )}
        {filtered.map(row => (
          <div key={row.id}>
            <div
              className="grid grid-cols-[1fr_80px_80px_120px] gap-2 px-3 py-2 text-[11px] cursor-pointer border-b"
              style={{ background: 'transparent', borderColor: SURFACE.br0 }}
              onMouseEnter={e => (e.currentTarget.style.background = SURFACE.bg1)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
            >
              <span className="flex items-center gap-1.5 truncate">
                <ChevronRight
                  className="w-3 h-3 transition-transform"
                  style={{ color: TEXT.tertiary, transform: expandedId === row.id ? 'rotate(90deg)' : 'none' }}
                />
                {row.label}
              </span>
              <span style={{ color: sevColor(row.type) }}>{sevDots(row.type)}</span>
              <span className="font-mono tabular-nums">{row.count}</span>
              <span style={{ color: TEXT_EXT.mid }}>{row.category}</span>
            </div>
            {expandedId === row.id && (
              <div className="px-3 py-2 border-b" style={{ background: SURFACE.bg0, borderColor: SURFACE.br0 }}>
                <div className="text-[10px] mb-1" style={{ color: TEXT.tertiary }}>Affected pages:</div>
                <div className="flex flex-wrap gap-1">
                  {row.pages.slice(0, 20).map(p => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: STATUS.info, background: SURFACE.bg2 }}>{p}</span>
                  ))}
                  {row.pages.length > 20 && (
                    <span className="text-[10px]" style={{ color: TEXT.tertiary }}>+{row.pages.length - 20} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
