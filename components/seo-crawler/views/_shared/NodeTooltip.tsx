import React from 'react';

export type TooltipNode = {
  id: string;
  label?: string;
  statusCode?: number;
  depth?: number;
  wordCount?: number;
  lcp?: number;
  contentScore?: number;
  renderBytes?: number;
  hydrationMs?: number;
};

export function NodeTooltip({
  node,
  x,
  y,
}: {
  node: TooltipNode;
  x: number;
  y: number;
}) {
  const path = node.id.replace(/^https?:\/\/[^/]+/, '') || '/';
  return (
    <div
      className="fixed z-50 pointer-events-none bg-[var(--brand-surface-2)]] border border-[var(--brand-border-3)]] rounded px-3 py-2 text-[11px] shadow-lg max-w-xs"
      style={{ left: x + 12, top: y - 8 }}
    >
      <div className="text-[var(--brand-text-strong)]] font-medium truncate mb-1">{node.label || path}</div>
      <div className="text-[var(--brand-text-faint)]] truncate text-[10px] mb-1.5">{path}</div>
      <div className="flex flex-col gap-0.5 text-[10px]">
        {node.statusCode != null && (
          <Row label="Status" value={String(node.statusCode)} color={node.statusCode >= 400 ? '#ef4444' : node.statusCode >= 300 ? '#f59e0b' : '#22c55e'} />
        )}
        {node.depth != null && (
          <Row label="Depth" value={String(node.depth)} />
        )}
        {node.contentScore != null && (
          <Row label="Score" value={String(Math.round(node.contentScore))} color={node.contentScore < 60 ? '#f59e0b' : '#22c55e'} />
        )}
        {node.lcp != null && node.lcp > 0 && (
          <Row label="LCP" value={`${(node.lcp / 1000).toFixed(1)}s`} color={node.lcp > 4000 ? '#ef4444' : node.lcp > 2500 ? '#f59e0b' : '#22c55e'} />
        )}
        {node.wordCount != null && node.wordCount > 0 && (
          <Row label="Words" value={node.wordCount.toLocaleString()} />
        )}
        {node.renderBytes != null && node.renderBytes > 0 && (
          <Row label="Size" value={formatBytes(node.renderBytes)} />
        )}
        {node.hydrationMs != null && node.hydrationMs > 0 && (
          <Row label="Hydrate" value={`${node.hydrationMs}ms`} color={node.hydrationMs > 3000 ? '#ef4444' : node.hydrationMs > 1000 ? '#f59e0b' : undefined} />
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--brand-text-faint)]]">{label}</span>
      <span style={{ color: color ?? 'text-[var(--brand-text-mid)]' }}>{value}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
