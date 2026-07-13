import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import {
  urlColumn,
  TITLE_COLUMN,
  WORD_COUNT_COLUMN,
  READABILITY_COLUMN,
  FRESHNESS_COLUMN,
  TOPIC_CLUSTER_COLUMN,
  EEAT_COLUMN,
  SCHEMA_TYPES_COLUMN,
  CLICKS_COLUMN,
  IMPRESSIONS_COLUMN,
  intentColumn,
  positionColumn,
  topKeywordColumn,
} from '../../_shared/shared-columns';
import { filterByVisibleColumns } from '../../_shared/filterByVisibleColumns';

export type ContentRow = {
  id: string;
  url: string;
  title: string;
  topic: string;
  cluster: string;
  intent: string;
  words: number;
  readability: number;
  uniqueness: number;
  keywords: number;
  freshnessDays: number;
  qualityScore: number;
  lastUpdated: string;
  // GSC / search performance
  clicks: number;
  clicksDelta: number;
  impressions: number;
  impressionsDelta: number;
  position: number;
  topKeyword: string;
  backlinks: number;
  actions?: any[];
  [key: string]: any;
};

export function useContentPages() {
  const { pages = [], visibleColumns = [], foundationActionsMap } = useSeoCrawler() as any;
  const rows: ContentRow[] = useMemo(() =>
    pages.map((p: any) => {
      const clicks = Number(p.gscClicks ?? 0);
      const prevClicks = Number(p.prevGscClicks ?? 0);
      const impressions = Number(p.gscImpressions ?? 0);
      const prevImpressions = Number(p.prevGscImpressions ?? 0);
      return {
        ...p,
        id: p.url,
        url: p.url,
        title: p.title ?? '',
        topic: p.topic ?? '',
        cluster: p.topicCluster ?? p.cluster ?? '',
        intent: p.searchIntent ?? p.intent ?? 'unknown',
        words: p.content?.wordCount ?? p.wordCount ?? 0,
        readability: p.content?.readability ?? p.readability ?? 0,
        uniqueness: p.content?.uniqueness ?? p.uniqueness ?? 1,
        keywords: p.content?.keywords?.length ?? 0,
        freshnessDays: p.freshnessDays ?? 999,
        qualityScore: p.qualityScore ?? p.contentQualityScore ?? 50,
        lastUpdated: p.lastModified ?? '',
        clicks,
        clicksDelta: clicks - prevClicks,
        impressions,
        impressionsDelta: impressions - prevImpressions,
        position: Number(p.gscPosition ?? 0),
        topKeyword: p.mainKeyword ?? '',
        backlinks: Number(p.backlinks ?? 0),
        actions: foundationActionsMap?.get?.(p.url) ?? p.actions ?? [],
      };
    }), [pages, foundationActionsMap]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    urlColumn<ContentRow>(),
    TITLE_COLUMN,
    WORD_COUNT_COLUMN,
    READABILITY_COLUMN,
    FRESHNESS_COLUMN,
    TOPIC_CLUSTER_COLUMN,
    EEAT_COLUMN,
    SCHEMA_TYPES_COLUMN,
    CLICKS_COLUMN,
    IMPRESSIONS_COLUMN,
    intentColumn<ContentRow>({ accessorFn: (row: ContentRow) => row.intent }),
    positionColumn<ContentRow>({ accessorFn: (row: ContentRow) => row.position }),
    topKeywordColumn<ContentRow>({ accessorFn: (row: ContentRow) => row.topKeyword }),
  ], []);

  const filtered = useMemo(
    () => filterByVisibleColumns(columns, visibleColumns),
    [columns, visibleColumns],
  );

  return { rows, columns: filtered };
}
