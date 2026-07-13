import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatPercent, formatDuration,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function RepliesTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const responseRate = page?.responseRate ?? page?.socialResponseRate ?? 0;
  const avgResponseTime = page?.avgResponseTime ?? page?.socialAvgResponseTime ?? 0;
  const totalReplies = page?.totalReplies ?? page?.socialTotalReplies ?? 0;
  const unansweredCount = page?.unansweredQuestions ?? page?.socialUnansweredQuestions ?? 0;
  const sentimentBreakdown = page?.replySentiment || page?.socialReplySentiment || {};
  const topQuestions = page?.topQuestions ?? page?.socialTopQuestions ?? [];
  const responseTrend = page?.responseRateTrend ?? [];
  const recentReplies = page?.recentReplies ?? page?.socialRecentReplies ?? [];

  const positiveRate = sentimentBreakdown.positive ?? 0;
  const neutralRate = sentimentBreakdown.neutral ?? 0;
  const negativeRate = sentimentBreakdown.negative ?? 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Response Rate" value={formatPercent(responseRate)} good={Number(responseRate) >= 0.8} />
        <MetricPill label="Avg Response" value={avgResponseTime ? formatDuration(avgResponseTime) : '—'} good={avgResponseTime > 0 && avgResponseTime < 3600000} />
        <MetricPill label="Total Replies" value={formatNumber(totalReplies)} good={totalReplies > 0} />
        <MetricPill label="Unanswered" value={formatNumber(unansweredCount)} good={unansweredCount === 0} />
        <MetricPill label="Sentiment" value={formatPercent(positiveRate)} good={Number(positiveRate) >= 0.6} />
      </div>

      {/* Response trend */}
      {hasTrend && (
        <Card title="Response Rate Trend">
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
            <Sparkline values={responseTrend} tone="good" />
          </div>
        </Card>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Response Overview */}
        <Card title="Response Overview">
          <DataRow label="Response Rate" value={formatPercent(responseRate)} status={Number(responseRate) >= 0.8 ? 'pass' : Number(responseRate) >= 0.5 ? 'warn' : 'fail'} />
          <DataRow label="Avg Response Time" value={formatDuration(avgResponseTime)} status={avgResponseTime > 0 && avgResponseTime < 3600000 ? 'pass' : 'warn'} />
          <DataRow label="Total Replies" value={formatNumber(totalReplies)} />
          <DataRow label="Unanswered" value={formatNumber(unansweredCount)} status={unansweredCount === 0 ? 'pass' : unansweredCount <= 5 ? 'warn' : 'fail'} />
          <DataRow label="Reply Velocity" value={`${formatNumber(page?.replyVelocity ?? 0)}/day`} />
        </Card>

        {/* Reply Sentiment */}
        <Card title="Reply Sentiment">
          <DataRow label="Positive" value={formatPercent(positiveRate)} status="pass" />
          <DataRow label="Neutral" value={formatPercent(neutralRate)} status="info" />
          <DataRow label="Negative" value={formatPercent(negativeRate)} status={Number(negativeRate) > 0.2 ? 'fail' : 'pass'} />
          <div className="mt-3 pt-2 border-t border-[#141414]">
            <div className="w-full bg-[#1a1a1a] rounded h-2 flex overflow-hidden">
              {positiveRate > 0 && <div className="bg-green-500 h-2" style={{ width: `${Number(positiveRate) * 100}%` }} />}
              {neutralRate > 0 && <div className="bg-[#6b7280] h-2" style={{ width: `${Number(neutralRate) * 100}%` }} />}
              {negativeRate > 0 && <div className="bg-red-500 h-2" style={{ width: `${Number(negativeRate) * 100}%` }} />}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-[#555]">
              <span>Positive</span>
              <span>Neutral</span>
              <span>Negative</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Unanswered Questions */}
      {topQuestions.length > 0 && (
        <Card title={`Unanswered Questions (${topQuestions.length})`}>
          {topQuestions.slice(0, 8).map((q: any, i: number) => (
            <div key={i} className="py-2 border-b border-[#141414] last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#ccc] truncate max-w-[350px]">
                  {typeof q === 'string' ? q : q.text || q.question || q.content}
                </span>
                <StatusBadge status="fail" label="Unanswered" />
              </div>
              {typeof q === 'object' && (
                <div className="flex items-center gap-3 text-[10px] text-[#888]">
                  {q.platform && <span>{q.platform}</span>}
                  {q.date && <span>{q.date}</span>}
                  {q.likes !== undefined && <span>{q.likes} likes</span>}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Recent Replies */}
      {recentReplies.length > 0 && (
        <Card title="Recent Replies">
          {recentReplies.slice(0, 8).map((reply: any, i: number) => (
            <div key={i} className="py-2 border-b border-[#141414] last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#ccc] truncate max-w-[350px]">
                  {typeof reply === 'string' ? reply : reply.text || reply.content || reply.reply}
                </span>
                {typeof reply === 'object' && reply.sentiment && (
                  <StatusBadge
                    status={reply.sentiment === 'positive' ? 'pass' : reply.sentiment === 'negative' ? 'fail' : 'info'}
                    label={reply.sentiment}
                  />
                )}
              </div>
              {typeof reply === 'object' && (
                <div className="flex items-center gap-3 text-[10px] text-[#888]">
                  {reply.platform && <span>{reply.platform}</span>}
                  {reply.date && <span>{reply.date}</span>}
                  {reply.responseTime && <span>{formatDuration(reply.responseTime)}</span>}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
