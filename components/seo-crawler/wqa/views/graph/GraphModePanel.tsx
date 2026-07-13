import React from 'react';
import type { GraphNode, GraphLink } from '../../../views/_shared/ForceGraph';
import type { StructureColorBy, GraphMetrics } from '../selectors/useWqaStructure';
import type { GraphLayout, SizeBy } from './GraphControls';
import { GraphCanvas } from './GraphCanvas';
import { GraphControls } from './GraphControls';
import { GraphMetricsPanel } from './GraphMetricsPanel';
import { GraphLegend } from './GraphLegend';

type Props = {
  nodes: ReadonlyArray<GraphNode>;
  links: ReadonlyArray<GraphLink>;
  onNodeClick: (nodeId: string) => void;
  layout: GraphLayout;
  onLayoutChange: (layout: GraphLayout) => void;
  sizeBy: SizeBy;
  onSizeByChange: (sizeBy: SizeBy) => void;
  colorBy: StructureColorBy;
  inLinkCounts: Map<string, number>;
  graphMetrics: GraphMetrics;
};

export function GraphModePanel({
  nodes, links, onNodeClick,
  layout, onLayoutChange,
  sizeBy, onSizeByChange,
  colorBy, inLinkCounts, graphMetrics,
}: Props) {
  return (
    <>
      <GraphCanvas
        nodes={nodes}
        links={links}
        onNodeClick={onNodeClick}
        layout={layout}
        sizeBy={sizeBy}
        colorBy={colorBy}
        inLinkCounts={inLinkCounts}
      />
      <GraphControls
        layout={layout}
        onLayoutChange={onLayoutChange}
        sizeBy={sizeBy}
        onSizeByChange={onSizeByChange}
      />
      <GraphMetricsPanel
        metrics={graphMetrics}
        nodeCount={nodes.length}
        linkCount={links.length}
      />
      <GraphLegend colorBy={colorBy} />
    </>
  );
}
