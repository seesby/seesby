import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { ClusterInfo } from '../selectors/useWqaStructure';
import type { GraphNode, GraphLink } from '../../../views/_shared/ForceGraph';

type Props = {
  clusters: ClusterInfo[];
  spokeNodes: ReadonlyArray<GraphNode>;
  links: ReadonlyArray<GraphLink>;
  onNodeClick: (nodeId: string) => void;
  onHubClick: (clusterName: string) => void;
};

type HubMeta = {
  id: string;
  label: string;
  clusterName: string;
  avgQuality: number;
  size: number;
  color: string;
  isHub: true;
};

export function ClusterGraph({ clusters, spokeNodes, links, onNodeClick, onHubClick }: Props) {
  const fgRef = useRef<ForceGraphMethods<any, any>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 480 });
  const [tooltip, setTooltip] = useState<{ node: HubMeta | GraphNode; x: number; y: number } | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // Responsive sizing
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

  // Track mouse for tooltip
  useEffect(() => {
    const handler = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Build hub nodes and hub-spoke links
  const { graphNodes, graphLinks } = useMemo(() => {
    // Build hub-spoke links filtered to visible spoke nodes only
    const spokeIds = new Set(spokeNodes.map(n => n.id));
    const visibleClusterPages = clusters.map(c => ({
      ...c,
      pages: c.pages.filter(p => spokeIds.has(p)),
    }));

    // Only create hub nodes for clusters with visible pages
    const hubs: HubMeta[] = visibleClusterPages
      .filter(c => c.pages.length > 0)
      .map(c => ({
        id: `hub-${c.name}`,
        label: c.name,
        clusterName: c.name,
        avgQuality: c.avgQuality,
        size: Math.max(12, c.pages.length * 0.8),
        color: c.color,
        isHub: true,
      }));

    const spoke: GraphNode[] = spokeNodes.map(n => ({
      ...n,
      size: Math.max(3, (n as any).quality ?? 2),
    }));

    // Hub-spoke links (only to visible spoke nodes)
    const hubSpokeLinks: GraphLink[] = visibleClusterPages.flatMap(c =>
      c.pages.map(pageUrl => ({ source: `hub-${c.name}`, target: pageUrl, weight: 1 }))
    );

    // Real cross-cluster links (only between visible spoke nodes)
    const realLinks = links.filter(l =>
      spokeIds.has(l.source) && spokeIds.has(l.target)
    );

    return {
      graphNodes: [...hubs, ...spoke] as any[],
      graphLinks: [...hubSpokeLinks, ...realLinks] as any[],
    };
  }, [clusters, spokeNodes, links]);

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

  // Custom canvas rendering for hub nodes
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (node.isHub) {
      const size = Math.max(8, node.size ?? 12) / globalScale;
      // Outer circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color ?? '#666';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();

      // Cluster name label
      const label = node.label ?? '';
      if (label) {
        const fontSize = Math.max(10, 12) / globalScale;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, node.x, node.y + size + 4 / globalScale);
      }
    } else {
      // Spoke node: small filled circle
      const size = Math.max(2, Math.sqrt(node.size ?? 4)) / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color ?? '#a78bfa';
      ctx.fill();
    }
  }, []);

  // Larger hit area for hub nodes
  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (node.isHub) {
      const size = Math.max(8, node.size ?? 12) / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8 / globalScale, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      const size = Math.max(2, Math.sqrt(node.size ?? 4)) / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, []);

  const handleCanvasClick = useCallback((node: any, event: MouseEvent) => {
    event.stopPropagation();
    if (node.isHub) {
      onHubClick(node.clusterName);
    } else {
      onNodeClick(node.id);
    }
  }, [onNodeClick, onHubClick]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ minHeight: 0 }}>
      <ForceGraph2D
        ref={fgRef as any}
        graphData={{ nodes: graphNodes, links: graphLinks }}
        width={dims.w}
        height={dims.h}
        backgroundColor="#070707"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeLabel={() => ''}
        linkColor={() => '#333'}
        linkWidth={(l: any) => Math.max(0.5, Math.log2((l.weight ?? 1) + 1))}
        linkDirectionalArrowLength={2}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={300}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        onEngineStop={() => { fgRef.current?.zoomToFit(400, 60); }}
        onNodeClick={handleCanvasClick}
        onNodeHover={handleNodeHover}
      />

      {/* Zoom controls - positioned above ClusterQualityBar */}
      <div className="absolute bottom-24 right-3 z-20 flex flex-col gap-1 bg-[#0a0a0acc] backdrop-blur rounded border border-[#1a1a1a]">
        <button onClick={zoomIn} className="w-7 h-7 flex items-center justify-center text-[#888] hover:text-white transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={zoomOut} className="w-7 h-7 flex items-center justify-center text-[#888] hover:text-white transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-full h-px bg-[#1a1a1a]" />
        <button onClick={fitToScreen} className="w-7 h-7 flex items-center justify-center text-[#888] hover:text-white transition-colors" title="Fit to screen">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-[#0a0a0aee] backdrop-blur border border-[#1a1a1a] rounded px-3 py-2 text-[11px] shadow-lg max-w-56"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          {'isHub' in tooltip.node && tooltip.node.isHub ? (
            <>
              <div className="font-semibold text-white mb-1">{tooltip.node.clusterName}</div>
              <div className="text-[#888]">
                Quality avg <span className="text-white font-mono">{tooltip.node.avgQuality}</span>
              </div>
              {tooltip.node.avgQuality < 60 && (
                <div className="text-[#f59e0b] mt-0.5">Weak hub</div>
              )}
            </>
          ) : (
            <>
              <div className="font-mono text-[10px] text-white truncate">{(tooltip.node as any).id}</div>
              <div className="text-[#888] mt-0.5">
                Q <span className="text-white">{(tooltip.node as any).quality ?? '--'}</span>
                {'  '}D <span className="text-white">{(tooltip.node as any).depth ?? '--'}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
