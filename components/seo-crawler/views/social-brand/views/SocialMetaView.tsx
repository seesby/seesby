import React, { useMemo, useState } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useSocialMeta } from '../selectors/useSocialMeta.tsx';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { fmtUrl } from '../../_shared/formatters';
import { STATUS } from '../../_shared/tokens';
import type { ColumnDef } from '@tanstack/react-table';

type PreviewPlatform = 'linkedin' | 'x' | 'facebook' | 'slack' | 'discord' | 'pinterest';

export default function SocialMetaView() {
  const { rows } = useSocialMeta();
  const [density] = useDensity();
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [issueFilter, setIssueFilter] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    if (!issueFilter) return rows;
    return rows.filter((r: any) => {
      if (issueFilter === 'missing') return !r.ogTitle || !r.ogDesc || !r.ogImage;
      if (issueFilter === 'ratio') return r.issues?.some((i: string) => i.includes('ratio'));
      if (issueFilter === 'weight') return r.issues?.some((i: string) => i.includes('MB') || i.includes('weight'));
      if (issueFilter === 'type') return r.issues?.some((i: string) => i.includes('type'));
      if (issueFilter === 'preview') return (r.previewOk ?? 0) < 6;
      return true;
    });
  }, [rows, issueFilter]);

  const columns: ColumnDef<typeof filteredRows[number]>[] = useMemo(() => [
    {
      accessorKey: 'url',
      header: 'URL',
      size: 180,
      cell: c => {
        const url = c.getValue() as string;
        const isSelected = selectedUrl === url;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedUrl(isSelected ? null : url); }}
            className={`text-[11px] text-left ${isSelected ? 'text-[#a78bfa] font-medium' : 'text-[#bdb6ff] hover:text-[#c4b5fd]'}`}
          >
            {fmtUrl(url)}
          </button>
        );
      },
    },
    {
      accessorKey: 'ogTitle',
      header: 'og:title',
      size: 120,
      cell: c => {
        const val = c.getValue();
        if (!val) return <span className="text-[#ef4444]">⚠ missing</span>;
        const truncated = String(val).length > 60;
        return <span className={truncated ? 'text-[#f59e0b]' : 'text-[#22c55e]'}>✓{truncated ? ` trunc` : ''}</span>;
      },
    },
    {
      accessorKey: 'ogDesc',
      header: 'og:desc',
      size: 100,
      cell: c => {
        const val = c.getValue();
        if (!val) return <span className="text-[#ef4444]">⚠ missing</span>;
        const truncated = String(val).length > 160;
        return <span className={truncated ? 'text-[#f59e0b]' : 'text-[#22c55e]'}>✓{truncated ? ` trunc` : ''}</span>;
      },
    },
    {
      accessorKey: 'ogImage',
      header: 'og:image',
      size: 100,
      cell: c => {
        const val = c.getValue();
        if (!val) return <span className="text-[#ef4444]">⚠ missing</span>;
        const row = c.row.original as any;
        const hasIssue = row.issues?.some((i: string) => i.includes('ratio') || i.includes('MB') || i.includes('blurred') || i.includes('off-brand'));
        return <span className={hasIssue ? 'text-[#f59e0b]' : 'text-[#22c55e]'}>⚠ {hasIssue ? (row.issues.find((i: string) => i.includes('ratio') || i.includes('MB') || i.includes('blurred') || i.includes('off-brand'))?.slice(0, 8) ?? 'issue') : 'ok'}</span>;
      },
    },
    {
      accessorKey: 'ogType',
      header: 'og:type',
      size: 80,
      cell: c => {
        const val = c.getValue();
        return <span className={val ? 'text-[var(--brand-text-mid)]' : 'text-[#ef4444]'}>{val ? String(val) : '⚠ —'}</span>;
      },
    },
    {
      accessorKey: 'twitterCard',
      header: 'tw:card',
      size: 80,
      cell: c => {
        const val = c.getValue();
        return <span className={val ? 'text-[var(--brand-text-mid)]' : 'text-[#ef4444]'}>{val ? String(val).replace('summary_large_image', 'large ✓') : '⚠ —'}</span>;
      },
    },
    {
      accessorKey: 'imageDimensions',
      header: 'img dims',
      size: 80,
      cell: c => {
        const val = c.getValue();
        return <span className={val ? 'text-[var(--brand-text-mid)]' : 'text-[var(--brand-text-faint)]'}>{val ? String(val) : '—'}</span>;
      },
    },
    {
      accessorKey: 'imageWeight',
      header: 'img wt',
      size: 70,
      cell: c => {
        const v = c.getValue() as number;
        if (!v) return <span className="text-[var(--brand-text-faint)]">—</span>;
        const mb = v / 1048576;
        const kb = v / 1024;
        const label = mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.round(kb)}k`;
        const heavy = v > 1048576;
        return <span className={heavy ? 'text-[#ef4444]' : 'text-[var(--brand-text-mid)]'}>{label}{heavy && ' ⚠'}</span>;
      },
    },
    {
      accessorKey: 'previewOk',
      header: 'Previews',
      size: 80,
      cell: c => {
        const v = c.getValue() as number;
        const ok = v === 6;
        return (
          <span className={ok ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>
            {v}/6 {ok ? '✓' : '⚠'}
          </span>
        );
      },
    },
    {
      accessorKey: 'issues',
      header: 'Issues',
      size: 150,
      cell: c => {
        const v = c.getValue() as string[];
        if (!v?.length) return <span className="text-[#22c55e]">—</span>;
        return (
          <span className="text-[#ef4444] text-[10px]">
            {v.length > 1 ? `${v.length} issues ⚠⚠` : v[0]}
          </span>
        );
      },
    },
  ], [selectedUrl]);

  useExportRegistration(
    () => filteredRows,
    () => columns.map(c => ({ key: (c as any).accessorKey as string, label: String((c as any).header) }))
  );

  const selectedRow = useMemo(() => {
    if (!selectedUrl) return null;
    return filteredRows.find((r: any) => r.url === selectedUrl) ?? null;
  }, [selectedUrl, filteredRows]);

  const issueFilters = useMemo(() => {
    const hasMissing = rows.some((r: any) => !r.ogTitle || !r.ogDesc || !r.ogImage);
    const hasRatio = rows.some((r: any) => r.issues?.some((i: string) => i.includes('ratio')));
    const hasWeight = rows.some((r: any) => r.issues?.some((i: string) => i.includes('MB') || i.includes('weight')));
    const hasPreview = rows.some((r: any) => (r.previewOk ?? 0) < 6);
    const items: { key: string; label: string }[] = [];
    if (hasMissing) items.push({ key: 'missing', label: 'missing' });
    if (hasRatio) items.push({ key: 'ratio', label: 'ratio' });
    if (hasWeight) items.push({ key: 'weight', label: 'weight' });
    if (hasPreview) items.push({ key: 'preview', label: 'preview' });
    return items;
  }, [rows]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-3 border-b border-[var(--brand-surface-3)]">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--brand-text-faint)] mr-1">issue:</span>
          {issueFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setIssueFilter(issueFilter === f.key ? null : f.key)}
              className={`px-2 py-1 text-[10px] rounded ${issueFilter === f.key ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'text-[var(--brand-text-mid)] hover:text-[var(--brand-text-mid)] hover:bg-[var(--brand-surface-3)]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {issueFilter && (
          <button onClick={() => setIssueFilter(null)} className="px-1.5 py-0.5 text-[10px] rounded bg-[#F59E0B]/10 text-[#F59E0B]">×</button>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-[var(--brand-text-faint)]">{filteredRows.length} pages</span>
      </div>

      {/* Table - takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DataTable
          key={density}
          rows={filteredRows}
          columns={columns}
          getRowId={r => r.id}
          density={density}
          emptyText="No pages crawled yet."
        />
      </div>

      {/* Fixed bottom panels - always visible when row selected */}
      {selectedRow && (
        <div className="shrink-0 border-t border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] max-h-[280px] overflow-auto custom-scrollbar">
          <PreviewPanel row={selectedRow} />
          {(selectedRow as any).issues?.length > 0 && (
            <FixPanel row={selectedRow} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Preview Panel ───────────────────────────────────────────────────────── */

function PreviewPanel({ row }: { row: any }) {
  const platforms: { key: PreviewPlatform; name: string }[] = [
    { key: 'linkedin', name: 'LinkedIn' },
    { key: 'x', name: 'X/Twitter' },
    { key: 'facebook', name: 'Facebook' },
    { key: 'slack', name: 'Slack' },
    { key: 'discord', name: 'Discord' },
    { key: 'pinterest', name: 'Pinterest' },
  ];

  const getPreview = (platform: PreviewPlatform) => {
    switch (platform) {
      case 'linkedin':
        return row.ogTitle && row.ogImage
          ? { ok: true, note: '' }
          : { ok: false, note: 'no card — default fallback' };
      case 'x':
        return row.twitterCard && row.ogImage
          ? { ok: true, note: '' }
          : row.ogTitle
            ? { ok: false, note: 'text only, no image' }
            : { ok: false, note: 'text only, no image' };
      case 'facebook':
        return row.ogTitle && row.ogImage
          ? { ok: true, note: '' }
          : { ok: false, note: 'no card — url only' };
      case 'slack':
        return row.ogTitle && row.ogImage
          ? { ok: true, note: '' }
          : { ok: false, note: 'link only, no preview' };
      case 'discord':
        return row.ogTitle && row.ogImage
          ? { ok: true, note: '' }
          : { ok: false, note: 'link only, no preview' };
      case 'pinterest':
        return { ok: false, note: 'no rich pin — claim required' };
    }
  };

  return (
    <div className="shrink-0 border-t border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]">
      <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
        <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]">
          Live preview — {fmtUrl(row.url)} across 6 platforms
        </div>
      </div>
      <div className="p-3 grid grid-cols-6 gap-2">
        {platforms.map(p => {
          const preview = getPreview(p.key);
          return (
            <div key={p.key} className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-2)] p-2 text-center">
              <div className="text-[10px] text-[var(--brand-text-mid)] mb-1.5">{p.name}</div>
              {preview.ok ? (
                <div className="space-y-1">
                  <div className="text-[9px] text-[var(--brand-text-mid)] line-clamp-2">{row.ogTitle ?? row.url}</div>
                  <div className="h-12 bg-[var(--brand-surface-3)] rounded flex items-center justify-center text-[8px] text-[var(--brand-text-faint)]">image</div>
                  <div className="text-[8px] text-[var(--brand-text-faint)] line-clamp-1">{row.ogDesc ?? ''}</div>
                </div>
              ) : (
                <div className="py-3 text-[9px] text-[var(--brand-text-faint)]">{preview.note}</div>
              )}
              <div className="mt-1.5 text-[9px]">{preview.ok ? '✓' : '⚠'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Fix Panel ───────────────────────────────────────────────────────────── */

function FixPanel({ row }: { row: any }) {
  const suggestions = useMemo(() => {
    const items: { label: string; value: string; type: 'title' | 'desc' | 'image' | 'type' | 'card' }[] = [];
    if (!row.ogTitle) {
      items.push({ label: 'og:title', value: generateTitle(row.url), type: 'title' });
    }
    if (!row.ogDesc || String(row.ogDesc).length > 160) {
      items.push({ label: 'og:desc', value: generateDesc(row.url), type: 'desc' });
    }
    if (!row.ogImage) {
      items.push({ label: 'og:image', value: `/assets/og${row.url === '/' ? '/index' : row.url.replace(/\//g, '-')}-1200x630.jpg`, type: 'image' });
    }
    if (!row.ogType) {
      items.push({ label: 'og:type', value: 'website', type: 'type' });
    }
    if (!row.twitterCard) {
      items.push({ label: 'twitter:card', value: 'summary_large_image', type: 'card' });
    }
    return items;
  }, [row]);

  if (suggestions.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]">
      <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
        <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]">Fix panel (auto-generate)</div>
      </div>
      <div className="p-3 space-y-1.5">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]">
            <span className="text-[#F59E0B] mt-0.5">○</span>
            <div>
              <span className="text-[var(--brand-text-mid)]">Suggested {s.label}: </span>
              <span className="text-[var(--brand-text-mid)] font-mono text-[10px]">"{s.value}"</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2">
          <button className="px-2 py-1 text-[10px] rounded bg-[#F59E0B]/10 text-[#F59E0B]">[Apply via CMS]</button>
          <button className="px-2 py-1 text-[10px] rounded bg-[var(--brand-surface-3)] text-[var(--brand-text-mid)]">[Export patch]</button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function generateTitle(url: string): string {
  const slug = url.split('/').filter(Boolean).pop() ?? 'home';
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}

function generateDesc(url: string): string {
  const slug = url.split('/').filter(Boolean).pop() ?? 'home';
  return slug.replace(/-/g, ' ');
}
