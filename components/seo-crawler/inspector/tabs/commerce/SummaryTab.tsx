import React from 'react';
import {
  DataRow, StatusBadge, Card, MetricPill, TruncatedUrl,
  formatNumber, formatPercent, getActions,
} from '../../shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const commerceIssues = actions.filter((a: any) =>
    /product|price|stock|feed|schema|commerce|inventory|variant/i.test(a.label || a.title || '')
  ).slice(0, 5);

  const productDetected = page?.productDetected ?? page?.hasProduct ?? false;
  const stockHealth = page?.stockHealth ?? page?.commerceStockHealth ?? 0;
  const schemaCoverage = page?.commerceSchemaCoverage ?? page?.productSchemaCoverage ?? 0;
  const feedStatus = page?.feedStatus ?? page?.gmcFeedStatus ?? 'unknown';
  const conversionRate = page?.conversionRate ?? page?.commerceConversionRate ?? 0;

  const price = page?.price ?? page?.productPrice;
  const onSale = page?.onSale ?? page?.isOnSale ?? false;
  const currency = page?.currency ?? 'USD';

  const inStock = page?.inStock ?? page?.commerceInStock ?? true;
  const stockQty = page?.stockQty ?? page?.stockQuantity ?? 0;
  const lowStockThreshold = page?.lowStockThreshold ?? 10;
  const isLowStock = stockQty > 0 && stockQty <= lowStockThreshold;

  const hasProduct = page?.hasProductSchema ?? false;
  const hasOffer = page?.hasOfferSchema ?? false;
  const hasReview = page?.hasReviewSchema ?? false;
  const hasAggRating = page?.hasAggregateRatingSchema ?? false;
  const hasFaq = page?.hasFaqSchema ?? false;

  const searchClicks = page?.gscClicks ?? page?.searchClicks ?? 0;
  const searchPos = page?.gscPosition ?? page?.searchPosition ?? 0;

  const healthScore = page?.commerceScore ?? page?.healthScore ?? 0;
  const healthTone = healthScore >= 80 ? 'good' : healthScore >= 50 ? 'mid' : 'bad';

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)]] to-[var(--brand-surface-0)]] border border-[var(--brand-surface-3)]]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{page?.title || page?.url || 'Commerce Page'}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)]] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        {healthScore > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={healthTone === 'good' ? '#22c55e' : healthTone === 'mid' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${(healthScore / 100) * 94.25} 94.25`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--brand-text-strong)]">{healthScore}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Products" value={productDetected ? '1' : '0'} good={productDetected} />
        <MetricPill label="Stock" value={inStock ? 'In stock' : 'Out'} good={inStock} sub={isLowStock ? `Qty ${stockQty}` : undefined} />
        <MetricPill label="Schema" value={formatPercent(schemaCoverage)} good={Number(schemaCoverage) >= 0.8} />
        <MetricPill label="Feed" value={feedStatus} good={feedStatus === 'approved'} />
        <MetricPill label="CVR" value={formatPercent(conversionRate)} good={Number(conversionRate) >= 0.03} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Product (Identity-style card) */}
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)]] mb-2.5">Product</div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-0.5">Name</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{page?.title || page?.productName || '\u2014'}</div>
          </div>
          <div className="space-y-0">
            <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
            <DataRow label="SKU" value={page?.sku || '\u2014'} mono />
            <DataRow label="Category" value={page?.category || '\u2014'} />
            <DataRow label="Brand" value={page?.brand || '\u2014'} />
          </div>
        </div>

        {/* Pricing */}
        <Card title="Pricing">
          <DataRow label="Price" value={price ? `$${Number(price).toFixed(2)}` : '\u2014'} />
          <DataRow label="On sale" value={onSale ? 'Yes' : 'No'} status={onSale ? 'warn' : 'pass'} />
          <DataRow label="Currency" value={currency} />
          <DataRow label="Price hist" value={page?.priceHistory ?? 'flat 90d'} />
        </Card>

        {/* Inventory */}
        <Card title="Inventory">
          <DataRow label="In stock" value={inStock ? 'Yes' : 'No'} status={inStock ? 'pass' : 'fail'} />
          <DataRow label="Stock qty" value={formatNumber(stockQty)} status={isLowStock ? 'warn' : stockQty === 0 ? 'fail' : 'pass'} />
          <DataRow label="Low threshold" value={formatNumber(lowStockThreshold)} />
          <DataRow label="Status" value={isLowStock ? 'Low stock' : inStock ? 'OK' : 'Out of stock'} status={isLowStock ? 'warn' : inStock ? 'pass' : 'fail'} />
        </Card>

        {/* Schema */}
        <Card title="Schema">
          <DataRow label="Product" value={hasProduct ? '\u2713 valid' : '\u2717'} status={hasProduct ? 'pass' : 'fail'} />
          <DataRow label="Offer" value={hasOffer ? '\u2713' : '\u2717'} status={hasOffer ? 'pass' : 'fail'} />
          <DataRow label="Review" value={hasReview ? '\u2713' : '\u2717'} status={hasReview ? 'pass' : 'warn'} />
          <DataRow label="Agg. rating" value={hasAggRating ? '\u2713' : '\u2717'} status={hasAggRating ? 'pass' : 'warn'} />
          <DataRow label="FAQ" value={hasFaq ? '\u2713' : '\u2717'} status={hasFaq ? 'pass' : 'info'} />
        </Card>
      </div>

      {/* Bottom row: Feed + Search + Flags */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card title="Feed">
          <DataRow label="Merchant" value={feedStatus === 'approved' ? 'ok' : feedStatus} status={feedStatus === 'approved' ? 'pass' : 'warn'} />
          <DataRow label="Status" value={feedStatus} status={feedStatus === 'approved' ? 'pass' : 'warn'} />
        </Card>

        <Card title="Search">
          <DataRow label="Clicks" value={formatNumber(searchClicks)} />
          <DataRow label="Pos" value={searchPos ? Number(searchPos).toFixed(1) : '\u2014'} />
        </Card>

        <Card title={`Flags (${commerceIssues.length})`}>
          {commerceIssues.length > 0 ? (
            commerceIssues.map((issue: any, i: number) => (
              <div key={`${issue.id}-${i}`} className="flex items-start gap-2 py-[3px]">
                <span className={`block w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${
                  issue.type === 'error' ? 'bg-[#ef4444]' : issue.type === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#6b7280]'
                }`} />
                <span className="text-[11px] text-[var(--brand-text-mid)]]">{issue.label || issue.title}</span>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]]">None critical</div>
          )}
        </Card>
      </div>
    </div>
  );
}
