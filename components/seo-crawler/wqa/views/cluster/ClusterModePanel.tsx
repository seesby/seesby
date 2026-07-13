import React, { useMemo } from 'react';
import type { ClusterInfo, LinkMetrics } from '../selectors/useWqaStructure';
import type { GraphNode, GraphLink } from '../../../views/_shared/ForceGraph';
import { ClusterGraph } from './ClusterGraph';
import { ClusterHealthPanel } from './ClusterHealthPanel';
import { ClusterQualityBar } from './ClusterQualityBar';

type Props = {
  clusters: ClusterInfo[];
  nodes: ReadonlyArray<GraphNode>;
  links: ReadonlyArray<GraphLink>;
  linkMetrics: LinkMetrics;
  onNodeClick: (nodeId: string) => void;
};

export function ClusterModePanel({ clusters, nodes, links, linkMetrics, onNodeClick }: Props) {
  // Filter clusters to only those with visible pages
  const nodeIds = useMemo(() => new Set(nodes.map(n => n.id)), [nodes]);
  const visibleClusters = useMemo(
    () => clusters.filter(c => c.pages.some(p => nodeIds.has(p))),
    [clusters, nodeIds]
  );

  const handleHubClick = (_clusterName: string) => {
    // Hub click: could show cluster summary in inspector in the future
  };

  return (
    <>
      <ClusterGraph
        clusters={visibleClusters}
        spokeNodes={nodes}
        links={links}
        onNodeClick={onNodeClick}
        onHubClick={handleHubClick}
      />

      <ClusterHealthPanel clusters={visibleClusters} linkMetrics={linkMetrics} />
      <ClusterQualityBar clusters={visibleClusters} />
    </>
  );
}
