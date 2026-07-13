import React from 'react';
import type { ClusterInfo } from '../selectors/useWqaStructure';
import { Card } from '../../../inspector/shared';
import { Distribution } from '../../../right-sidebar/_shared/bars';
import { scoreToTone } from '../../../right-sidebar/_shared/scoring';

type Props = {
  clusters: ClusterInfo[];
};

export function ClusterQualityBar({ clusters }: Props) {
  if (clusters.length === 0) return null;

  const rows = [...clusters]
    .sort((a, b) => b.avgQuality - a.avgQuality)
    .map(c => ({
      label: c.name,
      value: c.avgQuality,
      tone: scoreToTone(c.avgQuality),
    }));

  return (
    <div className="absolute bottom-3 left-3 right-3 z-10">
      <Card title="Cluster quality distribution">
        <Distribution rows={rows} />
      </Card>
    </div>
  );
}
