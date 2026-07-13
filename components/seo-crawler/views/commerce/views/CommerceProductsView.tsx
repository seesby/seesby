import React from 'react';
import { DataTable } from '../../_shared/DataTable';
import { Funnel } from '../../_shared/Funnel';
import { DistributionStrip } from '../../_shared/DistributionStrip';
import { useDensity } from '../../_hooks/useDensity';
import { useProducts } from '../selectors/useProducts.tsx';
import { useCommerceFunnel } from '../selectors/useCommerceFunnel.tsx';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { useExportRegistration } from '../../_hooks/useExportRegistration';

const CARD = 'rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 min-h-0';

export default function CommerceProductsView() {
  const { rows, columns, feedSegments } = useProducts();
  const { steps, counts } = useCommerceFunnel();
  const [density] = useDensity();
  const { setSelectedPageUrl, setInspectorOpen, setRsTab } = useSeoCrawler();

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey ?? c.id, label: (c as any).header ?? c.id }))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="p-3">
          <DataTable key={density} rows={rows} columns={columns} getRowId={r => r.id} density={density}
            onOpenInspector={(id) => { setSelectedPageUrl?.(id); setRsTab?.('commerce', 'schema'); setInspectorOpen?.(true); }}
            emptyText="Connect Shopify, Woo, or feed to import products." />
        </div>

        {feedSegments.length > 0 && (
          <div className={`${CARD} mx-3 mb-3`}>
            <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Feed health</div>
            <DistributionStrip title="Status" segments={feedSegments} />
          </div>
        )}

        {steps.length > 0 && counts.some((c: number) => c > 0) && (
          <div className={`${CARD} mx-3 mb-3`}>
            <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Checkout funnel</div>
            <Funnel
              steps={steps.map((s, i) => ({ label: s, value: counts[i] ?? 0 }))}
              accent="#10b981"
            />
          </div>
        )}
      </div>
    </div>
  );
}
