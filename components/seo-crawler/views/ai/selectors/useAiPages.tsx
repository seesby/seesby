'use client'

import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import {
  urlColumn,
  scoreBarColumn,
  botBadgeColumn,
  aiCitationsColumn,
  entityColumn,
} from '../../_shared/shared-columns';
import { filterByVisibleColumns } from '../../_shared/filterByVisibleColumns';

export type AiPageRow = {
  id: string;
  url: string;
  aiReady: number;
  gptbot: string;
  perplexity: string;
  claude: string;
  gemini: string;
  citations: number;
  entity: string;
};

export function useAiPages() {
  const { pages = [], visibleColumns = [] } = useSeoCrawler() as any;

  const rows: AiPageRow[] = useMemo(() => pages.map((p: any) => ({
    id: p.url,
    url: p.url,
    aiReady: Math.round((p.ai?.passageScore ?? 0) * 100),
    gptbot: p.aiBotAccess?.GPTBot ?? 'unknown',
    perplexity: p.aiBotAccess?.PerplexityBot ?? 'unknown',
    claude: p.aiBotAccess?.ClaudeBot ?? 'unknown',
    gemini: p.aiBotAccess?.Gemini ?? 'unknown',
    citations: (p.ai?.citations?.length ?? 0) + (p.citationCount ?? 0),
    entity: p.entities?.[0]?.name ?? '—',
  })), [pages]);

  const allColumns: ColumnDef<AiPageRow>[] = useMemo(() => [
    urlColumn<AiPageRow>(),
    scoreBarColumn<AiPageRow>('aiReady', {
      header: 'AI Score',
      size: 100,
      accessorFn: (r) => r.aiReady,
    }),
    botBadgeColumn<AiPageRow>('gptbot', 'GPTBot', { size: 80 }),
    botBadgeColumn<AiPageRow>('perplexity', 'Perplexity', { size: 80 }),
    botBadgeColumn<AiPageRow>('claude', 'Claude', { size: 80 }),
    botBadgeColumn<AiPageRow>('gemini', 'Gemini', { size: 80 }),
    aiCitationsColumn<AiPageRow>({ size: 80 }),
    entityColumn<AiPageRow>({ size: 140 }),
  ], []);

  const columns = useMemo(() => filterByVisibleColumns(allColumns, visibleColumns), [allColumns, visibleColumns]);

  return { rows, columns };
}
