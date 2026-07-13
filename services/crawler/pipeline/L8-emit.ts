/**
 * L8 – Emit
 * Formats pipeline output for grid, inspector, sidebar, exports.
 */
import type { MetricDef, Mode } from '@seesby/types';
import { defaultMetricRegistry } from './metric-registry';
import { evaluateGate } from './fingerprint-gating';
import { getVisibleColumns } from './mode-definitions';
import type { ScoreResult } from './L6-score';
import type { ActionResult } from './L7-action';
import type { ProjectFingerprint } from '@seesby/types';

export interface EmitResult {
  gridColumns: GridColumn[];
  gridRows: GridRow[];
  inspectorData: InspectorData;
  sidebarData: SidebarData;
  exportData: ExportData;
}

export interface GridColumn {
  key: string;
  label: string;
  width: string;
  namespace: string;
  format: string;
}

export interface GridRow {
  url: string;
  values: Record<string, unknown>;
  actions: string[];
  score: number;
}

export interface InspectorData {
  pageUrl: string;
  sections: InspectorSection[];
}

export interface InspectorSection {
  id: string;
  label: string;
  metrics: Array<{ key: string; label: string; value: unknown; source?: string; freshness?: string }>;
}

export interface SidebarData {
  tabs: SidebarTab[];
}

export interface SidebarTab {
  id: string;
  label: string;
  metrics: Array<{ key: string; label: string; value: unknown }>;
}

export interface ExportData {
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export interface EmitContext {
  mode: Mode;
  fingerprint: ProjectFingerprint;
  pages: Map<string, Record<string, unknown>>;
  siteData: Record<string, unknown>;
  scoreResult: ScoreResult;
  actionResult: ActionResult;
}

export function runL8Emit(ctx: EmitContext): EmitResult {
  const { mode, fingerprint, pages, siteData, scoreResult, actionResult } = ctx;

  // Grid
  const gridColumns = getVisibleColumns(mode, fingerprint).map(m => ({
    key: m.key,
    label: m.i18nLabelKey,
    width: m.width ?? '100px',
    namespace: m.namespace,
    format: m.format ?? 'text',
  }));

  const gridRows: GridRow[] = [];
  for (const [url, pageData] of pages) {
    const values: Record<string, unknown> = {};
    for (const col of gridColumns) {
      values[col.key] = pageData[col.key];
    }
    const pageActions = actionResult.topByPage.get(url) ?? [];
    gridRows.push({
      url,
      values,
      actions: pageActions.map(a => a.action.code),
      score: typeof pageData['p.score.health'] === 'number' ? (pageData['p.score.health'] as number) : 50,
    });
  }

  // Inspector
  const inspectorData: InspectorData = {
    pageUrl: '',
    sections: buildInspectorSections(mode, scoreResult.visibleMetrics, pages),
  };

  // Sidebar
  const sidebarData: SidebarData = {
    tabs: buildSidebarTabs(mode, scoreResult, actionResult, siteData),
  };

  // Export
  const exportData: ExportData = {
    columns: gridColumns.map(c => c.key),
    rows: gridRows.map(r => ({ url: r.url, ...r.values })),
  };

  return { gridColumns, gridRows, inspectorData, sidebarData, exportData };
}

function buildInspectorSections(
  mode: string,
  metrics: MetricDef[],
  pages: Map<string, Record<string, unknown>>,
): InspectorSection[] {
  const groups = new Map<string, MetricDef[]>();
  for (const m of metrics) {
    const ns = m.namespace.split('.').slice(0, 2).join('.');
    (groups.get(ns) ??= []).push(m);
  }

  return Array.from(groups.entries()).map(([ns, ms]) => ({
    id: ns,
    label: ns.split('.').pop() ?? ns,
    metrics: ms.map(m => ({
      key: m.key,
      label: m.i18nLabelKey,
      value: undefined,
    })),
  }));
}

function buildSidebarTabs(
  mode: string,
  scoreResult: ScoreResult,
  actionResult: ActionResult,
  siteData: Record<string, unknown>,
): SidebarTab[] {
  const tabs: SidebarTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      metrics: Object.entries(scoreResult.namespaceScores).map(([ns, val]) => ({
        key: ns, label: ns, value: val,
      })),
    },
    {
      id: 'actions',
      label: 'Actions',
      metrics: actionResult.actions.slice(0, 10).map(a => ({
        key: a.action.code, label: a.action.title, value: a.score,
      })),
    },
  ];
  return tabs;
}
