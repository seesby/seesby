import React, { useMemo } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { DistributionStrip } from '../../_shared/DistributionStrip';
import { useDensity } from '../../_hooks/useDensity';
import { useCampaigns } from '../selectors/useCampaigns.tsx';
import { STATUS_HEX } from '../../_shared/shared-columns';

export default function PaidCampaignsView() {
  const { rows, columns } = useCampaigns();
  const [density] = useDensity();

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const active = rows.filter((r: any) => r.status === 'enabled' || r.status === 'active').length;
    const paused = rows.filter((r: any) => r.status === 'paused').length;
    const learning = rows.filter((r: any) => r.status === 'learning').length;
    const removed = rows.filter((r: any) => r.status === 'removed').length;
    const networks: Record<string, number> = {};
    rows.forEach((r: any) => { networks[r.network] = (networks[r.network] ?? 0) + 1; });
    return { active, paused, learning, removed, count: rows.length, networks };
  }, [rows]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {summary && (
        <div className="px-3 py-2 flex flex-col gap-1.5 border-b border-[#1a1a1a]">
          <DistributionStrip title="Status" segments={[
            { label: 'Active', count: summary.active, color: STATUS_HEX.good },
            { label: 'Learning', count: summary.learning, color: STATUS_HEX.info },
            { label: 'Paused', count: summary.paused, color: STATUS_HEX.warn },
            { label: 'Removed', count: summary.removed, color: STATUS_HEX.bad },
          ]} />
          {Object.keys(summary.networks).length > 1 && (
            <DistributionStrip title="Network" segments={Object.entries(summary.networks).map(([name, count]) => ({
              label: name, count, color: name === 'google' ? '#4285f4' : name === 'meta' ? '#1877f2' : name === 'bing' ? '#00809d' : '#F59E0B',
            }))} />
          )}
        </div>
      )}
      <DataTable key={density} rows={rows} columns={columns} getRowId={r => r.id} density={density} emptyText="Connect Google Ads, Bing, or Meta Ads." />
    </div>
  );
}
