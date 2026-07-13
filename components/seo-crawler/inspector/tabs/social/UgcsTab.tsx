import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge, TruncatedUrl,
  formatNumber, formatPercent,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function UgcsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const ugcCount = page?.ugcCount ?? page?.userGeneratedContentCount ?? 0;
  const reviewCount = page?.reviewCount ?? page?.socialReviewCount ?? 0;
  const avgRating = page?.avgRating ?? page?.socialAvgRating ?? 0;
  const testimonialCount = page?.testimonialCount ?? page?.socialTestimonialCount ?? 0;
  const ugcSentiment = page?.ugcSentiment ?? page?.socialUgcSentiment ?? 0;
  const topUgc = page?.topUgc ?? page?.socialTopUgc ?? [];
  const reviews = page?.recentReviews ?? page?.socialReviews ?? [];
  const hashtags = page?.ugcHashtags ?? page?.socialUgcHashtags ?? [];
  const curatorMentions = page?.curatorMentions ?? page?.socialCuratorMentions ?? [];

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="UGC Count" value={formatNumber(ugcCount)} good={ugcCount > 0} />
        <MetricPill label="Reviews" value={formatNumber(reviewCount)} good={reviewCount > 0} />
        <MetricPill label="Avg Rating" value={avgRating ? `${Number(avgRating).toFixed(1)}★` : '—'} good={Number(avgRating) >= 4} />
        <MetricPill label="Testimonials" value={formatNumber(testimonialCount)} good={testimonialCount > 0} />
        <MetricPill label="Sentiment" value={formatPercent(ugcSentiment)} good={Number(ugcSentiment) >= 0.6} />
      </div>

      {/* UGC trend */}
      {hasTrend && (
        <Card title="UGC Trend">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
            <Sparkline values={page?.ugcTrend || []} tone="info" />
          </div>
        </Card>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* UGC Overview */}
        <Card title="UGC Overview">
          <DataRow label="Total UGC" value={formatNumber(ugcCount)} />
          <DataRow label="Reviews" value={formatNumber(reviewCount)} />
          <DataRow label="Avg Rating" value={avgRating ? `${Number(avgRating).toFixed(1)} / 5` : '—'} status={Number(avgRating) >= 4 ? 'pass' : Number(avgRating) >= 3 ? 'warn' : 'fail'} />
          <DataRow label="Testimonials" value={formatNumber(testimonialCount)} />
          <DataRow label="Sentiment" value={formatPercent(ugcSentiment)} status={Number(ugcSentiment) >= 0.6 ? 'pass' : 'warn'} />
          <DataRow label="Curators" value={formatNumber(curatorMentions.length)} />
        </Card>

        {/* UGC Hashtags */}
        <Card title="UGC Hashtags">
          {hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.slice(0, 12).map((tag: any, i: number) => {
                const name = typeof tag === 'string' ? tag : tag.hashtag || tag.name;
                const count = typeof tag === 'object' ? (tag.count || tag.posts || 0) : 0;
                return (
                  <div key={i} className="flex items-center gap-1 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded px-2 py-1">
                    <span className="text-[11px] text-blue-400">#{name}</span>
                    {count > 0 && <span className="text-[9px] text-[var(--brand-text-faint)]]">{formatNumber(count)}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]]">No UGC hashtags found</div>
          )}
        </Card>
      </div>

      {/* Top UGC Content */}
      {topUgc.length > 0 && (
        <Card title="Top UGC Content">
          {topUgc.slice(0, 6).map((item: any, i: number) => (
            <div key={i} className="py-2 border-b border-[var(--brand-surface-2)]] last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[var(--brand-text-mid)]] truncate max-w-[350px]">
                  {typeof item === 'string' ? item : item.text || item.content || item.caption}
                </span>
                {typeof item === 'object' && item.platform && (
                  <StatusBadge status="info" label={item.platform} />
                )}
              </div>
              {typeof item === 'object' && (
                <div className="flex items-center gap-3 text-[10px] text-[var(--brand-text-mid)]]">
                  {item.author && <span>by {item.author}</span>}
                  {item.likes !== undefined && <span>{formatNumber(item.likes)} likes</span>}
                  {item.shares !== undefined && <span>{formatNumber(item.shares)} shares</span>}
                  {item.date && <span>{item.date}</span>}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <Card title="Recent Reviews">
          {reviews.slice(0, 6).map((review: any, i: number) => (
            <div key={i} className="py-2 border-b border-[var(--brand-surface-2)]] last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#f59e0b]">
                    {'★'.repeat(Math.min(Math.round(review.rating || review.stars || 0), 5))}
                    {'☆'.repeat(5 - Math.min(Math.round(review.rating || review.stars || 0), 5))}
                  </span>
                  <span className="text-[11px] text-[var(--brand-text-mid)]] truncate max-w-[250px]">
                    {review.title || review.headline || ''}
                  </span>
                </div>
                {review.source && <StatusBadge status="info" label={review.source} />}
              </div>
              {review.text && (
                <div className="text-[10px] text-[var(--brand-text-mid)]] line-clamp-2 mt-1">{review.text}</div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-[var(--brand-text-faint)]] mt-1">
                {review.author && <span>{review.author}</span>}
                {review.date && <span>{review.date}</span>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Curator Mentions */}
      {curatorMentions.length > 0 && (
        <Card title="Curator Mentions">
          {curatorMentions.slice(0, 5).map((mention: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-[3px]">
              <span className="text-[11px] text-[var(--brand-text-mid)]] truncate max-w-[250px]">
                {typeof mention === 'string' ? mention : mention.name || mention.handle || mention.url}
              </span>
              {typeof mention === 'object' && mention.followers && (
                <StatusBadge status="info" label={`${formatNumber(mention.followers)} followers`} />
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
