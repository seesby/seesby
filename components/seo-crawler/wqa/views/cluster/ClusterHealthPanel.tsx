import React from 'react';
import type { ClusterInfo, LinkMetrics } from '../selectors/useWqaStructure';
import { Card, StatusBadge } from '../../../inspector/shared';
import { MiniBar } from '../../../right-sidebar/_shared/bars';

type Props = {
  clusters: ClusterInfo[];
  linkMetrics: LinkMetrics;
};

function WeakHubBadge({ cluster }: { cluster: ClusterInfo }) {
  return (
    <StatusBadge
      status="warn"
      label={`${cluster.name} weak hub (Q ${cluster.avgQuality})`}
    />
  );
}

export function ClusterHealthPanel({ clusters, linkMetrics }: Props) {
  const totalHubs = clusters.length;
  const orphanCount = clusters.reduce((a, c) => a + c.orphanCount, 0);
  const weakClusters = clusters.filter(c => c.isWeakHub);

  return (
    <div className="absolute top-3 right-3 z-10 w-52 flex flex-col gap-2">
      {/* Cluster health */}
      <Card title="Cluster health">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--brand-text-mid)]]">Hubs</span>
            <span className="text-[var(--brand-text-strong)] font-mono">{totalHubs}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--brand-text-mid)]]">Orphans</span>
            <span className={`font-mono ${orphanCount > 0 ? 'text-[#f59e0b]' : 'text-[var(--brand-text-strong)]'}`}>{orphanCount}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--brand-text-mid)]]">Weak hubs</span>
            <span className={`font-mono ${weakClusters.length > 0 ? 'text-[#f59e0b]' : 'text-[var(--brand-text-strong)]'}`}>{weakClusters.length}</span>
          </div>
        </div>

        {weakClusters.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {weakClusters.map(c => (
              <WeakHubBadge key={c.name} cluster={c} />
            ))}
          </div>
        )}
      </Card>

      {/* Internal links */}
      <Card title="Internal links">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--brand-text-mid)]]">Avg per page</span>
            <span className="text-[var(--brand-text-strong)] font-mono">{linkMetrics.avgLinksPerPage}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--brand-text-mid)]]">Hub {'\u2192'} Spoke</span>
              <span className="text-[var(--brand-text-strong)] font-mono">{linkMetrics.hubToSpokePct}%</span>
            </div>
            <MiniBar value={linkMetrics.hubToSpokePct} max={100} tone="good" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--brand-text-mid)]]">Spoke {'\u2192'} Hub</span>
              {linkMetrics.spokeToHubPct < 50 ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[#f59e0b]">{linkMetrics.spokeToHubPct}%</span>
                  <StatusBadge status="warn" label="low" />
                </div>
              ) : (
                <span className="text-[var(--brand-text-strong)] font-mono">{linkMetrics.spokeToHubPct}%</span>
              )}
            </div>
            <MiniBar
              value={linkMetrics.spokeToHubPct}
              max={100}
              tone={linkMetrics.spokeToHubPct < 50 ? 'warn' : 'good'}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
