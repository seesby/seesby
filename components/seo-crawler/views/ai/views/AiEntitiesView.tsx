import React, { useMemo, useState } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { useAiEntities } from '../selectors/useAiEntities';
import { ForceGraph } from '../../_shared/ForceGraph';
import { fmtNum } from '../../_shared/formatters';
import { STATUS } from '../../_shared/tokens';

const BORDER = 'border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] rounded';

type EntityRow = {
  id: string;
  name: string;
  type: string;
  pageCount: number;
  schemaBacked: boolean;
  sameAsPresent: boolean;
  wikipedia: boolean;
};

export default function AiEntitiesView() {
  const { pages = [] } = useSeoCrawler() as any;
  const { nodes, links } = useAiEntities();
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  // Build entity table from pages
  const entityRows: EntityRow[] = useMemo(() => {
    const map = new Map<string, EntityRow>();
    for (const p of pages) {
      for (const e of p.entities ?? []) {
        const key = `${e.type}:${e.id}`;
        const cur = map.get(key) ?? {
          id: key,
          name: e.name,
          type: e.type,
          pageCount: 0,
          schemaBacked: false,
          sameAsPresent: false,
          wikipedia: false,
        };
        cur.pageCount += 1;
        if (e.schemaBacked) cur.schemaBacked = true;
        if (e.sameAs) cur.sameAsPresent = true;
        if (e.wikipedia) cur.wikipedia = true;
        map.set(key, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.pageCount - a.pageCount);
  }, [pages]);

  const missingAnchors = useMemo(() => {
    const anchors: string[] = [];
    const hasOrg = entityRows.some(e => e.type === 'organization' && e.schemaBacked);
    const hasFaq = entityRows.some(e => e.type === 'faq' && e.schemaBacked);
    const hasAuthor = entityRows.some(e => e.type === 'person' && e.schemaBacked);

    if (!hasOrg) anchors.push('No Organization.sameAs → add to homepage schema');
    if (!hasFaq) anchors.push('No FAQPage schema → add Q&A content');
    if (!hasAuthor) anchors.push('No Author schema → create author bio pages');
    return anchors;
  }, [entityRows]);

  const typeColors: Record<string, string> = {
    organization: '#a78bfa',
    person: '#22c55e',
    product: '#3b82f6',
    place: '#f59e0b',
    event: '#ef4444',
    faq: '#06b6d4',
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Entity graph */}
      <div className={`m-3 mb-0 ${BORDER} overflow-hidden`}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)] flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]">Entity graph</div>
          <div className="flex items-center gap-2">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-[var(--brand-text-faint)] capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-[280px] relative">
          <ForceGraph
            nodes={nodes as any}
            links={links as any}
          />
          {nodes.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-[12px] text-[var(--brand-text-faint)]">
              No entities found in pages
            </div>
          )}
        </div>
      </div>

      {/* Entity table + Missing anchors */}
      <div className="flex-1 flex min-h-0 overflow-hidden m-3 gap-3">
        {/* Table */}
        <div className={`flex-1 flex flex-col min-w-0 ${BORDER} overflow-hidden`}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]">
              Entities site-wide ({entityRows.length})
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center h-8 px-3 text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] border-b border-[var(--brand-surface-3)] sticky top-0 bg-[var(--brand-surface-0)]">
              <div className="w-[160px]">Entity</div>
              <div className="w-[80px]">Pages</div>
              <div className="w-[120px]">Schema</div>
              <div className="w-[100px]">SameAs</div>
              <div className="flex-1">Wikipedia</div>
            </div>
            {/* Rows */}
            {entityRows.map(e => (
              <div
                key={e.id}
                onClick={() => setSelectedEntity(e.id === selectedEntity ? null : e.id)}
                className={`flex items-center h-8 px-3 text-[11px] border-b border-[var(--brand-surface-1)] cursor-pointer transition-colors ${
                  selectedEntity === e.id ? 'bg-[var(--brand-surface-1)]' : 'hover:bg-[var(--brand-surface-1)]'
                }`}
              >
                <div className="w-[160px] flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: typeColors[e.type] ?? 'text-[var(--brand-text-faint)]' }}
                  />
                  <span className="truncate text-[var(--brand-text-strong)]">{e.name}</span>
                </div>
                <div className="w-[80px] text-[var(--brand-text-mid)]">{fmtNum(e.pageCount)}</div>
                <div className="w-[120px]">
                  {e.schemaBacked ? (
                    <span className="text-[10px] text-[#22c55e]">✓ {e.type}</span>
                  ) : (
                    <span className="text-[10px] text-[var(--brand-text-faint)]">—</span>
                  )}
                </div>
                <div className="w-[100px]">
                  {e.sameAsPresent ? (
                    <span className="text-[10px] text-[#22c55e]">✓</span>
                  ) : (
                    <span className="text-[10px] text-[var(--brand-text-faint)]">—</span>
                  )}
                </div>
                <div className="flex-1">
                  {e.wikipedia ? (
                    <span className="text-[10px] text-[#22c55e]">✓</span>
                  ) : (
                    <span className="text-[10px] text-[var(--brand-text-faint)]">—</span>
                  )}
                </div>
              </div>
            ))}
            {entityRows.length === 0 && (
              <div className="p-4 text-[12px] text-[var(--brand-text-faint)] text-center">No entities found</div>
            )}
          </div>
        </div>

        {/* Missing anchors */}
        <div className={`w-[280px] flex flex-col ${BORDER} overflow-hidden`}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]">Missing anchors for LLM extraction</div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-3">
            {missingAnchors.length === 0 ? (
              <div className="text-[11px] text-[#22c55e]">All key anchors present</div>
            ) : (
              <div className="space-y-2">
                {missingAnchors.map((anchor, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 shrink-0" />
                    <span className="text-[11px] text-[var(--brand-text-mid)]">{anchor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
