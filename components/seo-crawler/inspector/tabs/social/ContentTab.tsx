import React from 'react';
import {
  DataRow, Card, SectionHeader, StatusBadge,
  formatNumber, formatPercent,
} from '../../shared';

export default function ContentTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const postTypes = page?.socialPostTypes || page?.contentTypeBreakdown || [];
  const topHashtags = page?.topHashtags || page?.socialHashtags || [];
  const contentThemes = page?.contentThemes || page?.socialContentThemes || [];
  const topPosts = page?.topSocialPosts || page?.socialTopPosts || [];
  const contentQuality = page?.contentQualityScore ?? page?.socialContentQuality ?? 0;
  const avgPostLength = page?.avgPostLength ?? page?.socialAvgPostLength ?? 0;
  const postingFrequency = page?.postingFrequency ?? page?.socialPostingFrequency ?? 0;
  const mediaMix = page?.mediaMix || page?.socialMediaMix || {};

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-2 text-center">
          <div className={`text-[12px] font-bold ${contentQuality >= 70 ? 'text-[#22c55e]' : contentQuality >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{formatNumber(contentQuality)}</div>
          <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest">Quality</div>
        </div>
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-2 text-center">
          <div className="text-[12px] font-bold text-[var(--brand-text-strong)]">{formatNumber(topPosts.length)}</div>
          <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest">Posts</div>
        </div>
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-2 text-center">
          <div className="text-[12px] font-bold text-[var(--brand-text-strong)]">{formatNumber(topHashtags.length)}</div>
          <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest">Hashtags</div>
        </div>
        <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded-lg p-2 text-center">
          <div className="text-[12px] font-bold text-[var(--brand-text-strong)]">{formatNumber(postingFrequency)}</div>
          <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest">Posts/Wk</div>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Post Types */}
        <Card title="Post Types">
          {postTypes.length > 0 ? postTypes.map((pt: any, i: number) => {
            const type = pt.type || pt.contentType || pt.label || `Type ${i + 1}`;
            const count = pt.count || pt.posts || 0;
            const engagement = pt.engagementRate || pt.engagement || 0;
            const pctOfTotal = postTypes.reduce((s: number, t: any) => s + (t.count || t.posts || 0), 0) || 1;
            return (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[var(--brand-text-mid)]]">{type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--brand-text-mid)]]">{formatNumber(count)}</span>
                    <span className="text-[10px] text-[var(--brand-text-faint)]]">{formatPercent(engagement)}</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--brand-surface-3)]] rounded h-1.5">
                  <div
                    className="bg-[#F59E0B] rounded h-1.5 transition-all"
                    style={{ width: `${Math.min((count / pctOfTotal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          }) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]]">No post type data</div>
          )}
        </Card>

        {/* Media Mix */}
        <Card title="Media Mix">
          {Object.keys(mediaMix).length > 0 ? Object.entries(mediaMix).map(([type, data]: [string, any], i: number) => {
            const count = typeof data === 'number' ? data : data?.count || 0;
            return (
              <div key={i} className="flex items-center justify-between py-[3px]">
                <span className="text-[11px] text-[var(--brand-text-mid)]]">{type}</span>
                <StatusBadge status="info" label={formatNumber(count)} />
              </div>
            );
          }) : (
            <div className="space-y-2">
              {['Image', 'Video', 'Carousel', 'Text', 'Link'].map((type) => (
                <div key={type} className="flex items-center justify-between py-[3px]">
                  <span className="text-[11px] text-[var(--brand-text-mid)]]">{type}</span>
                  <span className="text-[10px] text-[var(--brand-text-faint)]]">—</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-[var(--brand-surface-2)]]">
            <DataRow label="Avg Length" value={`${formatNumber(avgPostLength)} chars`} />
          </div>
        </Card>
      </div>

      {/* Content Themes */}
      <Card title="Content Themes">
        {contentThemes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {contentThemes.map((theme: any, i: number) => {
              const label = typeof theme === 'string' ? theme : theme.theme || theme.label || theme.name;
              const score = typeof theme === 'object' ? (theme.score || theme.relevance || 0) : 0;
              return (
                <div key={i} className="flex items-center gap-1.5 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded px-2 py-1">
                  <span className="text-[11px] text-[var(--brand-text-mid)]]">{label}</span>
                  {score > 0 && <span className="text-[9px] text-[var(--brand-text-faint)]]">{formatNumber(score)}</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]]">No theme data available</div>
        )}
      </Card>

      {/* Top Hashtags */}
      <Card title="Top Hashtags">
        {topHashtags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topHashtags.slice(0, 15).map((tag: any, i: number) => {
              const name = typeof tag === 'string' ? tag : tag.hashtag || tag.name || tag.label;
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
          <div className="text-[11px] text-[var(--brand-text-faint)]]">No hashtag data available</div>
        )}
      </Card>

      {/* Top Performing Posts */}
      <Card title="Top Posts">
        {topPosts.length > 0 ? topPosts.slice(0, 5).map((post: any, i: number) => (
          <div key={i} className="py-2 border-b border-[var(--brand-surface-2)]] last:border-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[var(--brand-text-mid)]] truncate max-w-[300px]">{post.text || post.content || post.title || `Post ${i + 1}`}</span>
              {post.platform && <StatusBadge status="info" label={post.platform} />}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--brand-text-mid)]]">
              {post.likes !== undefined && <span>{formatNumber(post.likes)} likes</span>}
              {post.shares !== undefined && <span>{formatNumber(post.shares)} shares</span>}
              {post.comments !== undefined && <span>{formatNumber(post.comments)} comments</span>}
              {post.date && <span>{post.date}</span>}
            </div>
          </div>
        )) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]]">No post data available</div>
        )}
      </Card>
    </div>
  );
}
