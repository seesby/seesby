import React from 'react';
import { DataTable } from '../../_shared/DataTable';
import { BarChart } from '../../_shared/BarChart';
import { useDensity } from '../../_hooks/useDensity';
import { useTemplates } from '../selectors/useTemplates.tsx';
import { useExportRegistration } from '../../_hooks/useExportRegistration';

const CARD = 'rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 min-h-0';

export default function CommerceTemplatesView() {
  const { rows, columns, perfData, diff } = useTemplates();
  const [density] = useDensity();

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey ?? c.id, label: (c as any).header ?? c.id }))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="p-3">
          <DataTable key={density} rows={rows} columns={columns} getRowId={r => r.id} density={density} emptyText="No templates detected." />
        </div>

        {perfData.length > 0 && (
          <div className={`${CARD} mx-3 mb-3`}>
            <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Template performance comparison</div>
            <BarChart data={perfData as any} x="name" y="pages" color="#10b981" height={160} />
          </div>
        )}

        {diff && (
          <div className={`${CARD} mx-3 mb-3`}>
            <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
              Template diff ({diff.a} vs {diff.b})
            </div>
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <div className="text-[#888] mb-1">{diff.a} has</div>
                <ul className="space-y-0.5">
                  {diff.aOnly.map((item: string) => (
                    <li key={item} className="text-[#22c55e]">\u2713 {item}</li>
                  ))}
                  {diff.aOnly.length === 0 && <li className="text-[#555]">\u2014</li>}
                </ul>
              </div>
              <div>
                <div className="text-[#888] mb-1">{diff.b} has</div>
                <ul className="space-y-0.5">
                  {diff.bOnly.map((item: string) => (
                    <li key={item} className="text-[#22c55e]">\u2713 {item}</li>
                  ))}
                  {diff.bOnly.length === 0 && <li className="text-[#555]">\u2014</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
