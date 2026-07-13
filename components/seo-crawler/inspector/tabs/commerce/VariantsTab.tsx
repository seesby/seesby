import React from 'react';
import { DataRow, StatusBadge, Card, MetricPill, formatNumber } from '../../shared';

export default function VariantsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const products = page?.products || page?.commerceProducts || [];
  const product = products[0] || page;
  const variants = product?.variants || page?.variants || page?.commerceVariants || [];
  const variantCount = variants.length || product?.variantCount || page?.productVariantCount || 0;

  if (variantCount === 0 && variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-[13px] text-[var(--brand-text-faint)] max-w-[280px]">
          No variants found. Variant data appears when products have size, color, or other options.
        </div>
      </div>
    );
  }

  const inStock = variants.filter((v: any) => v.stockStatus === 'in_stock' || v.availability === 'in_stock').length;
  const outOfStock = variants.filter((v: any) => v.stockStatus === 'out_of_stock' || v.availability === 'out_of_stock').length;

  // Group by option type
  const optionGroups: Record<string, Set<string>> = {};
  variants.forEach((v: any) => {
    const options = v.options || v.optionValues || {};
    Object.entries(options).forEach(([key, val]) => {
      if (!optionGroups[key]) optionGroups[key] = new Set();
      optionGroups[key].add(String(val));
    });
  });

  const canonicalToParent = product?.canonicalToParent ?? page?.canonicalToParent ?? true;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Variants" value={formatNumber(variantCount)} />
        <MetricPill label="In stock" value={formatNumber(inStock)} good={outOfStock === 0} />
        <MetricPill label="Out" value={formatNumber(outOfStock)} good={outOfStock === 0} />
        <MetricPill label="Options" value={formatNumber(Object.keys(optionGroups).length)} />
        <MetricPill label="Canonical" value={canonicalToParent ? 'Parent' : 'Self'} good={canonicalToParent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px] gap-3">
        {/* Variant table */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Variants ({variantCount})</div>
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Size</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Stock</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Price</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">GTIN</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {variants.slice(0, 30).map((v: any, i: number) => {
                  const options = v.options || v.optionValues || {};
                  const label = Object.values(options).join(' / ') || v.title || `#${i + 1}`;
                  const stock = v.stockStatus || v.availability || 'unknown';
                  const price = v.price ?? 0;
                  const stockQty = v.stockQty ?? v.quantity ?? 0;
                  const onSale = v.onSale ?? v.isOnSale ?? false;

                  return (
                    <tr key={i} className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{label}</td>
                      <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{stockQty}</td>
                      <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{price ? `$${Number(price).toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-1.5 text-[var(--brand-text-faint)] font-mono">{v.gtin || '—'}</td>
                      <td className="px-3 py-1.5">
                        <StatusBadge
                          status={stock === 'in_stock' ? 'pass' : stock === 'out_of_stock' ? 'fail' : onSale ? 'warn' : 'warn'}
                          label={onSale ? 'on sale' : stock === 'in_stock' ? 'in' : stock === 'out_of_stock' ? 'out ⚠' : stock}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Options sidebar */}
        <div className="space-y-3">
          <Card title="Options">
            {Object.entries(optionGroups).map(([key, values]) => (
              <div key={key} className="py-1">
                <div className="text-[11px] text-[var(--brand-text-mid)]">{key} <span className="text-[var(--brand-text-faint)]">{values.size} val{values.size !== 1 ? 's' : ''}</span></div>
              </div>
            ))}
          </Card>

          <Card title="Canonical">
            <DataRow label="To parent" value={canonicalToParent ? 'Yes ✓' : 'No'} status={canonicalToParent ? 'pass' : 'warn'} />
          </Card>
        </div>
      </div>
    </div>
  );
}
