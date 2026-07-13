import React from 'react';
import { DataRow, Card, MetricPill, TruncatedUrl, formatNumber } from '../../shared';

export default function ProductTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const products = page?.products || page?.commerceProducts || [];
  const product = products[0] || page;

  const title = product?.name || product?.title || page?.title || '\u2014';
  const desc = product?.description || page?.metaDesc || '';
  const gtin = product?.gtin || page?.gtin || '\u2014';
  const mpn = product?.mpn || page?.mpn || '\u2014';
  const brand = product?.brand || page?.brand || '\u2014';

  const color = product?.color || page?.color || '\u2014';
  const size = product?.size || page?.size || '\u2014';
  const material = product?.material || page?.material || '\u2014';
  const gender = product?.gender || page?.gender || '\u2014';
  const condition = product?.condition || page?.condition || 'new';
  const ageGroup = product?.ageGroup || page?.ageGroup || 'adult';
  const sustainability = product?.sustainability || page?.sustainability;

  const categoryPath = product?.categoryPath || page?.categoryPath || page?.category || '\u2014';

  const imageCount = product?.imageCount || page?.imageCount || 0;
  const altSet = product?.altImageCount ?? page?.altImageCount ?? 0;
  const imageRatio = product?.imageRatio || page?.imageRatio || 'square';
  const videoCount = product?.videoCount || page?.videoCount || 0;

  const reviewCount = product?.reviewCount || page?.reviewCount || 0;
  const avgRating = product?.avgRating || page?.avgRating || 0;
  const verifiedReviews = product?.verifiedReviews || page?.verifiedReviews || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Images" value={formatNumber(imageCount)} good={imageCount >= 3} />
        <MetricPill label="Alt set" value={`${altSet}/${imageCount}`} good={altSet === imageCount && imageCount > 0} />
        <MetricPill label="Videos" value={formatNumber(videoCount)} good={videoCount > 0} />
        <MetricPill label="Rating" value={avgRating ? `${Number(avgRating).toFixed(1)}\u2605` : '\u2014'} good={Number(avgRating) >= 4} />
        <MetricPill label="Reviews" value={formatNumber(reviewCount)} good={reviewCount > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Identity (Full Audit style) */}
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)]] mb-2.5">Identity</div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-0.5">Title</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{title}</div>
          </div>
          {desc && (
            <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
              <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-0.5">Description</div>
              <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words line-clamp-2">{desc}</div>
            </div>
          )}
          <div className="space-y-0">
            <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
            <DataRow label="GTIN" value={gtin} mono />
            <DataRow label="MPN" value={mpn} mono />
            <DataRow label="Brand" value={brand} />
          </div>
        </div>

        {/* Attributes */}
        <Card title="Attributes">
          <DataRow label="Brand" value={brand} />
          <DataRow label="Color" value={color} />
          <DataRow label="Size" value={size > 0 ? `${size} variants` : size} />
          <DataRow label="Material" value={material} />
          <DataRow label="Gender" value={gender} />
          <DataRow label="Condition" value={condition} />
          <DataRow label="Age group" value={ageGroup} />
          {sustainability && <DataRow label="Sustainability" value={sustainability} status="pass" />}
        </Card>

        {/* Media */}
        <Card title="Media">
          <DataRow label="Images" value={formatNumber(imageCount)} />
          <DataRow label="Alt set" value={`${altSet}/${imageCount}`} status={altSet === imageCount && imageCount > 0 ? 'pass' : 'warn'} />
          <DataRow label="Ratio" value={imageRatio} />
          <DataRow label="Videos" value={formatNumber(videoCount)} status={videoCount > 0 ? 'pass' : 'info'} />
        </Card>

        {/* Reviews */}
        <Card title="Reviews">
          <DataRow label="Count" value={formatNumber(reviewCount)} status={reviewCount > 0 ? 'pass' : 'warn'} />
          <DataRow label="Rating" value={avgRating ? `${Number(avgRating).toFixed(1)} / 5` : '\u2014'} status={Number(avgRating) >= 4 ? 'pass' : Number(avgRating) >= 3 ? 'warn' : 'fail'} />
          <DataRow label="Verified" value={reviewCount > 0 ? `${verifiedReviews}/${reviewCount}` : '\u2014'} />
        </Card>
      </div>

      {/* Category tree */}
      <Card title="Category tree">
        <div className="text-[12px] text-[var(--brand-text-mid)]]">{categoryPath}</div>
      </Card>
    </div>
  );
}
