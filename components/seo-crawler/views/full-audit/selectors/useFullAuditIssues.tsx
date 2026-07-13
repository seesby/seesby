'use client'

import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { getPageIssues } from '../../../IssueTaxonomy';

export type IssueRow = {
  id: string;
  label: string;
  type: 'error' | 'warning' | 'notice';
  category: string;
  count: number;
  pages: string[];
};

function categoryFromId(id: string): string {
  if (id.startsWith('C')) return 'Content';
  if (id.startsWith('T')) return 'Technical';
  if (id.startsWith('L')) return 'Links';
  if (id.startsWith('S')) return 'Structured Data';
  if (id.startsWith('A')) return 'AI';
  if (id.startsWith('P')) return 'Performance';
  if (id.startsWith('U')) return 'UX';
  if (id.startsWith('SO')) return 'Social';
  if (id.startsWith('E')) return 'Commerce';
  return 'Other';
}

export function useFullAuditIssues() {
  const { pages = [] } = useSeoCrawler() as any;

  const rows = useMemo<IssueRow[]>(() => {
    const byId = new Map<string, IssueRow>();
    for (const p of pages) {
      const list = getPageIssues(p) ?? [];
      for (const issue of list) {
        const existing = byId.get(issue.id);
        if (existing) {
          existing.count += 1;
          if (!existing.pages.includes(p.url)) existing.pages.push(p.url);
        } else {
          byId.set(issue.id, {
            id: issue.id,
            label: issue.label,
            type: issue.type as any,
            category: categoryFromId(issue.id),
            count: 1,
            pages: [p.url],
          });
        }
      }
    }
    const result = Array.from(byId.values());
    result.sort((a, b) => {
      const order = { error: 0, warning: 1, notice: 2 };
      return (order[a.type] ?? 3) - (order[b.type] ?? 3) || b.count - a.count;
    });
    return result;
  }, [pages]);

  return { rows };
}
