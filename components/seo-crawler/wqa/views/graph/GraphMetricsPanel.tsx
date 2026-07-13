import React from 'react';
import type { GraphMetrics } from '../selectors/useWqaStructure';
import { Card } from '../../../inspector/shared';

type Props = {
  metrics: GraphMetrics;
  nodeCount: number;
  linkCount: number;
};

function MetricRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[#888]">{label}</span>
      <span className={`font-mono ${warn ? 'text-[#f59e0b]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

export function GraphMetricsPanel({ metrics, nodeCount, linkCount }: Props) {
  return (
    <div className="absolute top-3 right-3 z-10 w-52 flex flex-col gap-2">
      <Card title="Graph metrics">
        <div className="space-y-1.5">
          <MetricRow label="Density" value={metrics.density.toFixed(2)} />
          <MetricRow label="Modularity" value={metrics.modularity.toFixed(2)} />
          <MetricRow label="Components" value={String(metrics.connectedComponents)} />
          <MetricRow
            label="Orphan nodes"
            value={String(metrics.orphanNodes)}
            warn={metrics.orphanNodes > 0}
          />
        </div>
      </Card>

      <Card title="Summary">
        <div className="space-y-1.5">
          <MetricRow label="Nodes" value={nodeCount.toLocaleString()} />
          <MetricRow label="Edges" value={linkCount.toLocaleString()} />
        </div>
      </Card>
    </div>
  );
}
