import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatPercent,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function ReviewsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const avgRating = page?.reviewAverage ?? page?.e_local_reviews_avg_google;
  const totalReviews = page?.totalReviews ?? page?.e_local_reviews_count_google;
  const responseRate = page?.reviewResponseRate ?? page?.e_local_reviews_responseRate;
  const avgResponseTime = page?.avgResponseTime ?? page?.e_local_reviews_responseTime;
  const reviewVelocity = page?.reviewVelocity ?? page?.e_local_reviews_velocity;
  const recentReviews = page?.recentReviews || page?.localRecentReviews || [];
  const topics = page?.reviewTopics || page?.localReviewTopics || [];
  const ratingDistribution = page?.ratingDistribution || page?.localRatingDistribution || null;
  const lowReviews = page?.recentLowReviews || page?.localLowReviews || [];
  const sentimentPositive = page?.sentimentPositive ?? page?.e_local_reviews_sentimentPositive;
  const sentimentNeutral = page?.sentimentNeutral ?? page?.e_local_reviews_sentimentNeutral;
  const sentimentNegative = page?.sentimentNegative ?? page?.e_local_reviews_sentimentNegative;

  // Source breakdown
  const googleShare = page?.googleReviewShare;
  const yelpShare = page?.yelpReviewShare;
  const trustpilotShare = page?.trustpilotReviewShare;
  const facebookShare = page?.facebookReviewShare;

  // Build distribution
  const distribution = ratingDistribution || null;

  // Rating trend direction
  const ratingDelta = page?.ratingDelta ?? (avgRating != null && page?.prevReviewAverage ? Number(avgRating) - Number(page.prevReviewAverage) : null);

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Avg Rating" value={avgRating ? `${Number(avgRating).toFixed(1)}` : '\u2014'} good={Number(avgRating) >= 4} sub={ratingDelta != null ? `${ratingDelta >= 0 ? '+' : ''}${ratingDelta.toFixed(1)}` : undefined} />
        <MetricPill label="Total" value={formatNumber(totalReviews)} good={Number(totalReviews) > 50} />
        <MetricPill label="Response" value={formatPercent(responseRate)} good={Number(responseRate) >= 0.8} />
        <MetricPill label="Velocity" value={`${formatNumber(reviewVelocity)}/mo`} good={Number(reviewVelocity) > 5} />
        <MetricPill label="Avg Time" value={avgResponseTime ? `${avgResponseTime}d` : '\u2014'} good={Number(avgResponseTime) <= 3} />
      </div>

      {/* Top row: Summary, Distribution, Recent */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Summary */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Summary</div>
          <DataRow label="Total" value={formatNumber(totalReviews)} />
          <DataRow label="Rating" value={avgRating ? `${Number(avgRating).toFixed(1)} / 5` : '\u2014'} status={Number(avgRating) >= 4 ? 'pass' : Number(avgRating) >= 3 ? 'warn' : 'fail'} />
          <DataRow label="Response rate" value={formatPercent(responseRate)} status={Number(responseRate) >= 0.8 ? 'pass' : 'warn'} />
          <DataRow label="Avg response" value={avgResponseTime ? `${avgResponseTime} days` : '\u2014'} status={Number(avgResponseTime) <= 3 ? 'pass' : 'warn'} />
          <DataRow label="Velocity" value={`${formatNumber(reviewVelocity)} reviews/mo`} />
        </div>

        {/* Distribution */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Distribution</div>
          {distribution ? (
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map(star => {
                const count = distribution[star] || distribution[`${star}_star`] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[11px]">
                    <span className="text-[var(--brand-text-faint)] w-6">{star}\u2605</span>
                    <div className="flex-1 h-2 bg-[var(--brand-surface-3)] rounded overflow-hidden">
                      <div className="h-full bg-yellow-400/60 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[var(--brand-text-mid)] w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">No distribution data</div>
          )}
        </div>

        {/* Recent */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Recent</div>
          <div className="space-y-1.5">
            {recentReviews.length > 0 ? recentReviews.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                <span className="text-[var(--brand-text-faint)] shrink-0">{r.daysAgo || r.date || ''}d</span>
                <span className="text-yellow-400 shrink-0">{'\u2605'.repeat(Math.min(r.rating || 0, 5))}</span>
                <span className="text-[var(--brand-text-mid)] line-clamp-1 flex-1">{r.text || r.excerpt || ''}</span>
                <StatusBadge
                  status={r.responded ? 'pass' : 'warn'}
                  label={r.responded ? 'replied' : 'missed\u26A0'}
                />
              </div>
            )) : (
              <div className="text-[11px] text-[var(--brand-text-faint)]">No recent reviews</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Sentiment, Topics, Sources */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Sentiment */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Sentiment</div>
          <DataRow label="Positive" value={formatPercent(sentimentPositive)} status="pass" />
          <DataRow label="Neutral" value={formatPercent(sentimentNeutral)} status="info" />
          <DataRow label="Negative" value={formatPercent(sentimentNegative)} status={Number(sentimentNegative) > 0.2 ? 'fail' : 'pass'} />
        </div>

        {/* Topics */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Topics</div>
          <div className="space-y-0.5">
            {topics.length > 0 ? topics.slice(0, 8).map((t: any, i: number) => {
              const topic = typeof t === 'string' ? t : t.topic || t.label;
              const count = typeof t === 'object' ? t.count : undefined;
              const sent = typeof t === 'object' ? t.sentiment : undefined;
              const isNeg = sent === 'negative' || topic?.startsWith('-');
              return (
                <div key={i} className="flex items-center justify-between py-[2px] text-[11px]">
                  <span className={isNeg ? 'text-red-400' : 'text-green-400'}>
                    {isNeg ? '\u2013' : '+'} {topic?.replace(/^[\+\-]\s*/, '')}
                  </span>
                  {count != null && <span className="text-[var(--brand-text-faint)]">{count}</span>}
                </div>
              );
            }) : (
              <div className="text-[11px] text-[var(--brand-text-faint)]">No topics extracted</div>
            )}
          </div>
        </div>

        {/* Sources */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Sources</div>
          <DataRow label="Google" value={googleShare != null ? `${Math.round(Number(googleShare) * 100)}%` : '\u2014'} />
          {yelpShare != null && <DataRow label="Yelp" value={`${Math.round(Number(yelpShare) * 100)}%`} />}
          {trustpilotShare != null && <DataRow label="Trustpilot" value={`${Math.round(Number(trustpilotShare) * 100)}%`} />}
          {facebookShare != null && <DataRow label="Facebook" value={`${Math.round(Number(facebookShare) * 100)}%`} />}
        </div>
      </div>

      {/* Low reviews */}
      {lowReviews.length > 0 && (
        <Card title={`Low Reviews Needing Attention (${lowReviews.length})`}>
          <div className="space-y-2">
            {lowReviews.slice(0, 5).map((review: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status="fail" label={`${review.rating || '?'} stars`} />
                  <span className="text-[10px] text-[var(--brand-text-faint)]">{review.date || ''}</span>
                </div>
                <div className="text-[11px] text-[var(--brand-text-mid)] line-clamp-2">{review.text || review.content || review.comment || ''}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trend */}
      {hasTrend && (
        <Card title="Rating Trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3">
            <Sparkline values={page?.reviewTrend || []} tone="good" />
          </div>
        </Card>
      )}
    </div>
  );
}
