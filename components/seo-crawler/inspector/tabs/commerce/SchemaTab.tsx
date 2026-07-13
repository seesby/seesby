import React from 'react';
import { DataRow, StatusBadge, Card, MetricPill, formatNumber, formatPercent } from '../../shared';

export default function SchemaTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const hasProduct = page?.hasProductSchema ?? false;
  const hasOffer = page?.hasOfferSchema ?? false;
  const hasReview = page?.hasReviewSchema ?? false;
  const hasAggRating = page?.hasAggregateRatingSchema ?? false;
  const hasBreadcrumb = page?.hasBreadcrumbSchema ?? false;
  const hasFaq = page?.hasFaqSchema ?? false;

  const schemaErrors = page?.schemaErrors ?? 0;
  const completeness = page?.commerceSchemaCompleteness ?? 0;

  const name = page?.schemaName ?? page?.title ?? '—';
  const hasImage = page?.hasSchemaImage ?? false;
  const hasDesc = page?.hasSchemaDescription ?? false;
  const hasBrand = page?.hasSchemaBrand ?? false;
  const hasGtin = page?.hasSchemaGtin ?? false;
  const hasMpn = page?.hasSchemaMpn ?? false;
  const hasOffers = page?.hasSchemaOffers ?? false;
  const hasAvailability = page?.hasSchemaAvailability ?? false;
  const hasPrice = page?.hasSchemaPrice ?? false;
  const hasPriceCurrency = page?.hasSchemaPriceCurrency ?? false;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Completeness" value={formatPercent(completeness)} good={Number(completeness) >= 0.8} />
        <MetricPill label="Errors" value={formatNumber(schemaErrors)} good={schemaErrors === 0} />
        <MetricPill label="Product" value={hasProduct ? '✓' : '✗'} good={hasProduct} />
        <MetricPill label="Offer" value={hasOffer ? '✓' : '✗'} good={hasOffer} />
        <MetricPill label="Review" value={hasReview ? '✓' : '✗'} good={hasReview} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_140px] gap-3">
        {/* Product schema fields */}
        <Card title="Product schema">
          <DataRow label="name" value={name} status={name !== '—' ? 'pass' : 'fail'} />
          <DataRow label="image" value={hasImage ? '✓' : '✗'} status={hasImage ? 'pass' : 'fail'} />
          <DataRow label="description" value={hasDesc ? '✓' : '✗'} status={hasDesc ? 'pass' : 'fail'} />
          <DataRow label="brand" value={hasBrand ? '✓' : '✗'} status={hasBrand ? 'pass' : 'fail'} />
          <DataRow label="gtin" value={hasGtin ? '✓' : '✗'} status={hasGtin ? 'pass' : 'fail'} />
          <DataRow label="mpn" value={hasMpn ? '✓' : '✗'} status={hasMpn ? 'pass' : 'fail'} />
          <DataRow label="offers" value={hasOffers ? '✓' : '✗'} status={hasOffers ? 'pass' : 'fail'} />
          <DataRow label="availability" value={hasAvailability ? '✓' : '✗'} status={hasAvailability ? 'pass' : 'fail'} />
          <DataRow label="price" value={hasPrice ? '✓' : '✗'} status={hasPrice ? 'pass' : 'fail'} />
          <DataRow label="priceCurrency" value={hasPriceCurrency ? '✓' : '✗'} status={hasPriceCurrency ? 'pass' : 'fail'} />
          <DataRow label="aggregateRating" value={hasAggRating ? '✓' : '✗'} status={hasAggRating ? 'pass' : 'warn'} />
          <DataRow label="review" value={hasReview ? `✓ ${page?.reviewCount ?? 0}` : '✗'} status={hasReview ? 'pass' : 'warn'} />
        </Card>

        {/* Issues */}
        <Card title="Issues">
          <DataRow label="Errors" value={formatNumber(schemaErrors)} status={schemaErrors > 0 ? 'fail' : 'pass'} />
        </Card>

        {/* Rich eligibility */}
        <Card title="Rich eligibility">
          <DataRow label="Product" value={hasProduct ? '✓' : '✗'} status={hasProduct ? 'pass' : 'fail'} />
          <DataRow label="Merchant" value={hasProduct && hasOffer ? '✓' : '✗'} status={hasProduct && hasOffer ? 'pass' : 'fail'} />
          <DataRow label="Review" value={hasReview || hasAggRating ? '✓' : '✗'} status={hasReview || hasAggRating ? 'pass' : 'warn'} />
        </Card>
      </div>
    </div>
  );
}
