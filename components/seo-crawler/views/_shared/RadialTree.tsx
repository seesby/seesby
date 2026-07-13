// RadialTree.tsx — radial tree visualization with zoom/pan
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { NodeTooltip, type TooltipNode } from './NodeTooltip';

type TreeNode = {
  id: string;
  label?: string;
  children?: TreeNode[];
  color?: string;
  size?: number;
} & Partial<TooltipNode>;

function buildTree(nodes: { id: string; label?: string; color?: string; size?: number }[]): TreeNode {
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
    const leaf = map.get(node.id.replace(/^https?:\/\/[^/]+/, '')) ?? map.get('/' + parts[parts.length - 1]);
    if (leaf) {
      leaf.color = node.color;
      leaf.size = node.size;
    }
  }
  return root;
}

export function RadialTree({
  nodes, onNodeClick,
}: {
  nodes: ReadonlyArray<TooltipNode>;
  onNodeClick?: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tree = useMemo(() => buildTree(nodes as any), [nodes]);
  const [tooltip, setTooltip] = useState<{ node: TooltipNode; x: number; y: number } | null>(null);

  // Zoom/pan state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 880, h: 600 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const layout = useMemo(() => {
    const cx = 440;
    const cy = 300;
    const maxR = 260;
    const positions: { x: number; y: number; node: TreeNode; depth: number }[] = [];
    const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

    // Count total depth
    function maxDepth(node: TreeNode, d: number): number {
      let m = d;
      for (const c of node.children ?? []) m = Math.max(m, maxDepth(c, d + 1));
      return m;
    }
    const depth = maxDepth(tree, 0) || 1;
    const rStep = maxR / depth;

    function layoutNode(node: TreeNode, d: number, angleStart: number, angleEnd: number) {
      const r = d * rStep;
      const angle = (angleStart + angleEnd) / 2;
      const x = cx + r * Math.cos(angle - Math.PI / 2);
      const y = cy + r * Math.sin(angle - Math.PI / 2);
      positions.push({ x, y, node, depth: d });

      const children = node.children ?? [];
      if (children.length > 0) {
        const slice = (angleEnd - angleStart) / children.length;
        children.forEach((child, i) => {
          const childR = (d + 1) * rStep;
          const childAngle = angleStart + slice * (i + 0.5);
          edges.push({
            x1: x, y1: y,
            x2: cx + childR * Math.cos(childAngle - Math.PI / 2),
            y2: cy + childR * Math.sin(childAngle - Math.PI / 2),
          });
          layoutNode(child, d + 1, angleStart + slice * i, angleStart + slice * (i + 1));
        });
      }
    }

    layoutNode(tree, 0, 0, 2 * Math.PI);
    return { positions, edges, cx, cy };
  }, [tree]);

  const zoomBy = useCallback((factor: number) => {
    setViewBox(vb => {
      const newW = Math.max(200, Math.min(3000, vb.w / factor));
      const newH = Math.max(150, Math.min(2250, vb.h / factor));
      const dx = (vb.w - newW) / 2;
      const dy = (vb.h - newH) / 2;
      return { x: vb.x + dx, y: vb.y + dy, w: newW, h: newH };
    });
  }, []);

  const fitToScreen = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: 880, h: 600 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    setViewBox(vb => ({
      ...vb,
      x: dragStart.current.vx - dx * scaleX,
      y: dragStart.current.vy - dy * scaleY,
    }));
  }, [dragging, viewBox.w, viewBox.h]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewBox(vb => {
      const newW = Math.max(200, Math.min(3000, vb.w / factor));
      const newH = Math.max(150, Math.min(2250, vb.h / factor));
      // Zoom toward cursor
      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;
        return {
          x: vb.x + (vb.w - newW) * mx,
          y: vb.y + (vb.h - newH) * my,
          w: newW,
          h: newH,
        };
      }
      const dx = (vb.w - newW) / 2;
      const dy = (vb.h - newH) / 2;
      return { x: vb.x + dx, y: vb.y + dy, w: newW, h: newH };
    });
  }, []);

  // Determine which labels to show based on zoom level
  const labelThreshold = viewBox.w < 400 ? 1 : viewBox.w < 700 ? 2 : 3;

  return (
    <div className="absolute inset-0 w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setTooltip(null); }}
        onWheel={handleWheel}
      >
        {/* Edges */}
        {layout.edges.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="bg-[var(--brand-surface-3)]" strokeWidth="1" />
        ))}
        {/* Nodes */}
        {layout.positions.map((p, i) => (
          <g
            key={i}
            className="cursor-pointer"
            onClick={() => onNodeClick?.(p.node.id)}
            onMouseEnter={e => setTooltip({ node: p.node as TooltipNode, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setTooltip(null)}
          >
            <circle
              cx={p.x} cy={p.y}
              r={p.node.size ? Math.max(3, Math.sqrt(p.node.size)) : p.depth === 0 ? 6 : 4}
              fill={p.node.color ?? (p.depth === 0 ? '#a78bfa' : 'text-[var(--brand-text-faint)]')}
              stroke="bg-[var(--brand-surface-0)]"
              strokeWidth="1"
            />
            {p.depth <= labelThreshold && (
              <text
                x={p.x} y={p.y - 8}
                textAnchor="middle"
                className="fill-[var(--brand-text-mid)]]"
                style={{ fontSize: `${Math.max(8, 10 - p.depth)}px` }}
              >
                {p.node.label ?? p.node.id.split('/').pop()}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-12 right-3 z-20 flex flex-col gap-1 bg-[var(--brand-surface-0)]cc] backdrop-blur rounded border border-[var(--brand-surface-3)]]">
        <button onClick={() => zoomBy(1.5)} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => zoomBy(0.67)} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-full h-px bg-[var(--brand-surface-3)]]" />
        <button onClick={fitToScreen} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] transition-colors" title="Reset view">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {tooltip && <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
