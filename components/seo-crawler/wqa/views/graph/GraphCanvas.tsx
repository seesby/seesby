import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { NodeTooltip, type TooltipNode } from '../../../views/_shared/NodeTooltip';
import type { GraphNode, GraphLink } from '../../../views/_shared/ForceGraph';
import type { StructureColorBy } from '../selectors/useWqaStructure';
import type { GraphLayout, SizeBy } from './GraphControls';

type Props = {
  nodes: ReadonlyArray<GraphNode>;
  links: ReadonlyArray<GraphLink>;
  onNodeClick: (nodeId: string) => void;
  layout: GraphLayout;
  sizeBy: SizeBy;
  colorBy: StructureColorBy;
  inLinkCounts: Map<string, number>;
};

function computeRadialPositions(nodes: ReadonlyArray<GraphNode>, dims: { w: number; h: number }) {
  const cx = dims.w / 2;
  const cy = dims.h / 2;
  const maxR = Math.min(dims.w, dims.h) * 0.42;

  const depthBuckets = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const d = (node as any).depth ?? 0;
    if (!depthBuckets.has(d)) depthBuckets.set(d, []);
    depthBuckets.get(d)!.push(node);
  }

  const maxDepth = Math.max(1, ...depthBuckets.keys());
  const rStep = maxR / maxDepth;

  return nodes.map(node => {
    const d = (node as any).depth ?? 0;
    const r = d === 0 ? 0 : d * rStep;
    const bucket = depthBuckets.get(d) ?? [];
    const idx = bucket.indexOf(node);
    const angle = (2 * Math.PI * idx) / bucket.length - Math.PI / 2;
    return {
      ...node,
      fx: cx + r * Math.cos(angle),
      fy: cy + r * Math.sin(angle),
    };
  });
}

function computeGridPositions(nodes: ReadonlyArray<GraphNode>, dims: { w: number; h: number }) {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  const cellW = dims.w / (cols + 1);
  const cellH = dims.h / (rows + 1);

  return nodes.map((node, i) => ({
    ...node,
    fx: ((i % cols) + 1) * cellW,
    fy: (Math.floor(i / cols) + 1) * cellH,
  }));
}

export function GraphCanvas({ nodes, links, onNodeClick, layout, sizeBy, colorBy, inLinkCounts }: Props) {
  const fgRef = useRef<ForceGraphMethods<any, any>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 480 });
  const [tooltip, setTooltip] = useState<{ node: TooltipNode; x: number; y: number } | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Compute positioned nodes based on layout
  const graphData = useMemo(() => {
    let positionedNodes: any[];
    if (layout === 'radial') {
      positionedNodes = computeRadialPositions(nodes, dims);
    } else if (layout === 'grid') {
      positionedNodes = computeGridPositions(nodes, dims);
    } else {
      positionedNodes = nodes.map(n => ({ ...n }));
    }
    return {
      nodes: positionedNodes,
      links: links.map(l => ({ ...l })),
    };
  }, [nodes, links, layout, dims]);

  // Node sizing based on sizeBy
  const nodeVal = useCallback((n: any) => {
    if (sizeBy === 'inLinks') {
      return Math.max(3, Math.sqrt((n.inLinks ?? 0) * 3));
    }
    if (sizeBy === 'outLinks') {
      return Math.max(3, Math.sqrt((n.outLinks ?? 0) * 3));
    }
    return Math.max(3, Math.sqrt(n.size ?? 4));
  }, [sizeBy]);

  const handleNodeHover = useCallback((node: any, _prev: any) => {
    if (node) {
      const { x, y } = mousePos.current;
      setTooltip({ node, x, y });
    } else {
      setTooltip(null);
    }
  }, []);

  const zoomIn = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.zoom(fg.zoom() * 1.5, 400);
  }, []);

  const zoomOut = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.zoom(fg.zoom() / 1.5, 400);
  }, []);

  const fitToScreen = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.zoomToFit(400, 60);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ minHeight: 0 }}>
      <ForceGraph2D
        ref={fgRef as any}
        graphData={graphData}
        width={dims.w}
        height={dims.h}
        backgroundColor="bg-[var(--brand-surface-0)]"
        nodeRelSize={5}
        nodeVal={nodeVal}
        nodeColor={(n: any) => n.color ?? '#a78bfa'}
        nodeLabel={() => ''}
        linkColor={() => 'bg-[var(--brand-surface-4)]'}
        linkWidth={(l: any) => Math.max(0.8, Math.log2((l.weight ?? 1) + 1))}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={layout === 'force' ? 200 : 0}
        d3AlphaDecay={layout === 'force' ? 0.02 : 0}
        onEngineStop={() => { fgRef.current?.zoomToFit(400, 60); }}
        onNodeClick={(n: any, e: MouseEvent) => {
          e.stopPropagation();
          onNodeClick(n.id);
        }}
        onNodeHover={handleNodeHover}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-20 right-3 z-20 flex flex-col gap-1 bg-[var(--brand-surface-0)]cc] backdrop-blur rounded border border-[var(--brand-surface-3)]">
        <button onClick={zoomIn} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={zoomOut} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-full h-px bg-[var(--brand-surface-3)]" />
        <button onClick={fitToScreen} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] transition-colors" title="Fit to screen">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {tooltip && <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
