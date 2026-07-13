import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { NodeTooltip, type TooltipNode } from './NodeTooltip';

export type GraphNode = TooltipNode & {
  size?: number;
  color?: string;
  group?: string;
};
export type GraphLink = { source: string; target: string; weight?: number };

export function ForceGraph({
  nodes, links, onNodeClick,
}: {
  nodes: ReadonlyArray<GraphNode>;
  links: ReadonlyArray<GraphLink>;
  onNodeClick?: (nodeId: string) => void;
}) {
  const fgRef = useRef<ForceGraphMethods<any, any>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 480 });
  const [tooltip, setTooltip] = useState<{ node: TooltipNode; x: number; y: number } | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDims({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => ({
    nodes: nodes.map(n => ({ ...n })),
    links: links.map(l => ({ ...l })),
  }), [nodes, links]);

  // Track mouse globally so tooltip follows cursor
  useEffect(() => {
    const handler = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // onNodeHover: second arg is previousNode, NOT an event
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
        graphData={data}
        width={dims.w}
        height={dims.h}
        backgroundColor="bg-[var(--brand-surface-0)]"
        nodeRelSize={5}
        nodeVal={(n: any) => Math.max(3, Math.sqrt(n.size ?? 4))}
        nodeLabel={() => ''}
        nodeColor={(n: any) => n.color ?? '#a78bfa'}
        linkColor={() => 'bg-[var(--brand-surface-4)]'}
        linkWidth={(l: any) => Math.max(0.8, Math.log2((l.weight ?? 1) + 1))}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={200}
        onEngineStop={() => {
          const fg = fgRef.current;
          if (!fg) return;
          // For single nodes, don't zoom too close
          if (data.nodes.length <= 1) {
            fg.centerAt(0, 0, 400);
            fg.zoom(0.8, 400);
          } else {
            fg.zoomToFit(400, 60);
          }
        }}
        onNodeClick={(n: any, e: MouseEvent) => {
          e.stopPropagation();
          onNodeClick?.(n.id);
        }}
        onNodeHover={handleNodeHover}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-12 right-3 z-20 flex flex-col gap-1 bg-[var(--brand-surface-0)]cc] backdrop-blur rounded border border-[var(--brand-surface-3)]]">
        <button onClick={zoomIn} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={zoomOut} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-full h-px bg-[var(--brand-surface-3)]]" />
        <button onClick={fitToScreen} className="w-7 h-7 flex items-center justify-center text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] transition-colors" title="Fit to screen">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {tooltip && <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
