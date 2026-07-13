// TreeView.tsx — hierarchical tree with expand/collapse and rich metadata
import React, { useMemo, useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { NodeTooltip, type TooltipNode } from './NodeTooltip';

type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
  color?: string;
  size?: number;
  childCount?: number;
  quality?: number;
  clicks?: number;
  delta?: number;
  statusCode?: number;
  isLeaf?: boolean;
} & Partial<TooltipNode>;

function buildTree(nodes: { id: string; label?: string; color?: string; size?: number; quality?: number; clicks?: number; delta?: number; statusCode?: number; isLeaf?: boolean }[]): TreeNode {
  const root: TreeNode = { id: '/', label: '/', children: [] };
  const map = new Map<string, TreeNode>();
  map.set('/', root);

  for (const node of nodes) {
    const parts = node.id.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
    let current = root;
    let path = '';
    for (const part of parts) {
      path += '/' + part;
      if (!map.has(path)) {
        const child: TreeNode = { id: path, label: part, children: [] };
        current.children = current.children ?? [];
        current.children.push(child);
        map.set(path, child);
      }
      current = map.get(path)!;
    }
    const leaf = map.get(node.id.replace(/^https?:\/\/[^/]+/, ''));
    if (leaf) {
      leaf.color = node.color;
      leaf.size = node.size;
      leaf.quality = node.quality;
      leaf.clicks = node.clicks;
      leaf.delta = node.delta;
      leaf.statusCode = node.statusCode;
      leaf.isLeaf = node.isLeaf;
    }
  }

  function countChildren(node: TreeNode): number {
    const kids = node.children ?? [];
    node.childCount = kids.length;
    let total = kids.length;
    for (const kid of kids) total += countChildren(kid);
    return total;
  }
  countChildren(root);

  function computeAvgQuality(node: TreeNode): number | undefined {
    if (node.isLeaf && node.quality != null) return node.quality;
    const kids = node.children ?? [];
    if (kids.length === 0) return undefined;
    let sum = 0, count = 0;
    for (const kid of kids) {
      const q = computeAvgQuality(kid);
      if (q != null) { sum += q; count++; }
    }
    if (count === 0) return undefined;
    node.quality = Math.round(sum / count);
    return node.quality;
  }
  computeAvgQuality(root);

  return root;
}

function countDescendants(node: TreeNode): number {
  let count = 0;
  for (const child of node.children ?? []) {
    count += 1;
    count += countDescendants(child);
  }
  return count;
}

function qualityColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function ScoreBar({ quality }: { quality: number }) {
  const filled = Math.round(quality / 10);
  const color = qualityColor(quality);
  return (
    <span className="inline-flex items-center gap-px shrink-0">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-3 rounded-sm"
          style={{
            background: i < filled ? color : '#1e1e1e',
          }}
        />
      ))}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const isUp = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] shrink-0 ${isUp ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
      {isUp ? '\u25B2' : '\u25BC'}{Math.abs(delta)}
    </span>
  );
}

function StatusCodeBadge({ code }: { code: number }) {
  if (code >= 200 && code < 400) return null;
  const isRed = code >= 400;
  return (
    <span
      className={`inline-flex items-center text-[9px] font-mono px-1.5 py-px rounded shrink-0 ${
        isRed
          ? 'bg-[#ef444420] text-[#ef4444]'
          : 'bg-[#f59e0b20] text-[#f59e0b]'
      }`}
    >
      {code}
    </span>
  );
}

export function TreeView({
  nodes, tree: treeProp, onNodeClick,
}: {
  nodes: ReadonlyArray<TooltipNode>;
  tree?: TreeNode;
  onNodeClick?: (id: string) => void;
}) {
  const tree = useMemo(() => treeProp ?? buildTree(nodes as any), [treeProp, nodes]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const auto = new Set<string>();
    function check(n: TreeNode) {
      if (countDescendants(n) > 50) auto.add(n.id);
      for (const c of n.children ?? []) check(c);
    }
    for (const c of tree.children ?? []) check(c);
    return auto;
  });
  const [tooltip, setTooltip] = useState<{ node: TooltipNode; x: number; y: number } | null>(null);

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rows = useMemo(() => {
    const result: { node: TreeNode; depth: number }[] = [];
    function walk(node: TreeNode, depth: number) {
      result.push({ node, depth });
      if (!collapsed.has(node.id)) {
        for (const child of node.children ?? []) {
          walk(child, depth + 1);
        }
      }
    }
    walk(tree, 0);
    return result;
  }, [tree, collapsed]);

  const handleMouseEnter = useCallback((node: TooltipNode, e: React.MouseEvent) => {
    setTooltip({ node, x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div className="absolute inset-0 overflow-auto custom-scrollbar pt-14">
      <div className="p-3">
        {rows.map((r) => {
          const hasChildren = (r.node.children?.length ?? 0) > 0;
          const isCollapsed = collapsed.has(r.node.id);
          const isLeaf = r.node.isLeaf && !hasChildren;
          const q = r.node.quality;

          return (
            <div
              key={r.node.id}
              className="flex items-center h-7 hover:bg-[#0c0c0c] cursor-pointer rounded px-1 group"
              style={{ paddingLeft: `${r.depth * 18 + 4}px` }}
              onClick={() => onNodeClick?.(r.node.id)}
              onMouseEnter={e => handleMouseEnter(r.node as TooltipNode, e)}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Expand/collapse toggle */}
              {hasChildren ? (
                <button
                  onClick={e => { e.stopPropagation(); toggle(r.node.id); }}
                  className="w-4 h-4 flex items-center justify-center text-[#555] hover:text-[#999] shrink-0"
                >
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                  }
                </button>
              ) : (
                <span className="w-4 shrink-0" />
              )}

              {/* Color dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0 mx-1"
                style={{ background: r.node.color ?? '#666' }}
              />

              {/* Label + child count grouped together */}
              <span className="min-w-0 text-[11px] text-[#ccc] truncate">{r.node.label}</span>
              {hasChildren && (
                <span className="text-[9px] text-[#555] shrink-0 ml-1">({r.node.childCount ?? 0})</span>
              )}

              {/* Spacer pushes metadata right */}
              <span className="flex-1" />

              {/* Right-aligned metadata */}
              <span className="flex items-center gap-2.5 shrink-0">
                {/* Quality bar */}
                {q != null && <ScoreBar quality={q} />}

                {/* Clicks */}
                {isLeaf && r.node.clicks != null && r.node.clicks > 0 && (
                  <span className="text-[10px] font-mono text-[#666]">
                    {r.node.clicks.toLocaleString()}<span className="text-[#444] ml-0.5">clk</span>
                  </span>
                )}

                {/* Leaf indicator */}
                {isLeaf && (r.node.clicks == null || r.node.clicks === 0) && (
                  <span className="text-[10px] text-[#444]">leaf</span>
                )}

                {/* Delta */}
                {isLeaf && r.node.delta != null && <DeltaBadge delta={r.node.delta} />}

                {/* Warning */}
                {q != null && q < 60 && (
                  <span className="text-[10px] text-[#f59e0b]" title="Low quality">{'\u26A0'}</span>
                )}

                {/* Status code */}
                {isLeaf && r.node.statusCode != null && r.node.statusCode !== 200 && (
                  <StatusCodeBadge code={r.node.statusCode} />
                )}
              </span>
            </div>
          );
        })}
      </div>
      {tooltip && <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
