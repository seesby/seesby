import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, formatPercent, formatSignedNumber,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  if (!hasTrend) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-[13px] text-[#666] max-w-[280px]">
          Trend data available after 2+ crawls. Run another crawl to see historical trends.
        </div>
      </div>
    );
  }

  // GBP events
  const gbpEvents = page?.gbpEvents || page?.localGbpEvents || [];

  // NAP source changes
  const napChanges = page?.napSourceChanges || page?.localNapChanges || [];

  // Current vs previous values
  const reviewCurrent = page?.totalReviews ?? page?.e_local_reviews_count_google;
  const reviewPrev = page?.prevTotalReviews;
  const ratingCurrent = page?.reviewAverage ?? page?.e_local_reviews_avg_google;
  const ratingPrev = page?.prevReviewAverage;
  const napCurrent = page?.napConsistencyScore ?? page?.e_local_nap_score;
  const napPrev = page?.prevNapConsistencyScore;
  const packCurrent = page?.packAveragePosition ?? page?.localPackAvgPosition;
  const packPrev = page?.prevPackAveragePosition;
  const gbpCurrent = page?.gbpCompleteness ?? page?.e_local_gbp_completeness;
  const gbpPrev = page?.prevGbpCompleteness;
  const citationCurrent = page?.citationCount ?? page?.e_local_citations_count;
  const citationPrev = page?.prevCitationCount;

  return (
    <div className="space-y-3">
      {/* Top row: Rating, Volume, GBP events */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Rating over time */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">Rating over time</div>
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 mb-2">
            <Sparkline values={page?.reviewTrend || []} tone="good" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <DataRow label="Current" value={ratingCurrent ? `${Number(ratingCurrent).toFixed(1)}` : '\u2014'} />
            <DataRow label="Previous" value={ratingPrev ? `${Number(ratingPrev).toFixed(1)}` : '\u2014'} />
          </div>
        </div>

        {/* Review volume */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">Review volume</div>
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 mb-2">
            <Sparkline values={page?.reviewVolumeTrend || []} tone="info" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <DataRow label="Current" value={formatNumber(reviewCurrent)} />
            <DataRow label="Previous" value={formatNumber(reviewPrev)} />
          </div>
        </div>

        {/* GBP events */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">GBP events</div>
          <div className="space-y-1.5">
            {gbpEvents.length > 0 ? gbpEvents.slice(0, 5).map((evt: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="text-[#666] shrink-0">{evt.date || evt.when || ''}</span>
                <span className="text-[#ccc]">{evt.event || evt.action || evt.description}</span>
                {evt.warning && <span className="text-orange-400">\u26A0</span>}
              </div>
            )) : (
              <div className="text-[11px] text-[#555]">No GBP events</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Pack position, NAP changes */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Pack position over time */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">Pack position (90d)</div>
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 mb-2">
            <Sparkline values={page?.packPositionTrend || []} tone="info" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <DataRow label="Current" value={packCurrent ? Number(packCurrent).toFixed(1) : '\u2014'} />
            <DataRow label="Previous" value={packPrev ? Number(packPrev).toFixed(1) : '\u2014'} />
          </div>
        </div>

        {/* NAP source changes */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">NAP source changes</div>
          <div className="space-y-1.5">
            {napChanges.length > 0 ? napChanges.slice(0, 5).map((ch: any, i: number) => (
              <div key={i} className="text-[11px] text-[#ccc]">
                <span className="text-[#666]">{ch.source || ch.directory}: </span>
                {ch.change || ch.description || 'format change'}
                {ch.count > 1 && <span className="text-[#666]"> {ch.count}x</span>}
              </div>
            )) : (
              <div className="text-[11px] text-[#555]">No NAP changes</div>
            )}
          </div>
        </div>
      </div>

      {/* Summary deltas */}
      <Card title="Changes Between Crawls">
        <div className="bg-[#060606] border border-[#1a1a1a] rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-3 py-1.5 text-left text-[9px] text-[#444] uppercase tracking-widest font-bold">Metric</th>
                <th className="px-3 py-1.5 text-right text-[9px] text-[#444] uppercase tracking-widest font-bold">Current</th>
                <th className="px-3 py-1.5 text-right text-[9px] text-[#444] uppercase tracking-widest font-bold">Previous</th>
                <th className="px-3 py-1.5 text-right text-[9px] text-[#444] uppercase tracking-widest font-bold">Change</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Reviews', current: reviewCurrent, prev: reviewPrev, fmt: formatNumber },
                { label: 'Rating', current: ratingCurrent, prev: ratingPrev, fmt: (v: any) => v ? Number(v).toFixed(1) : '\u2014' },
                { label: 'NAP Score', current: napCurrent, prev: napPrev, fmt: formatNumber },
                { label: 'Pack Avg', current: packCurrent, prev: packPrev, fmt: (v: any) => v ? Number(v).toFixed(1) : '\u2014', invert: true },
                { label: 'GBP', current: gbpCurrent, prev: gbpPrev, fmt: formatPercent },
                { label: 'Citations', current: citationCurrent, prev: citationPrev, fmt: formatNumber },
              ].map((row, i) => {
                const delta = row.current != null && row.prev != null ? Number(row.current) - Number(row.prev) : null;
                const isGood = delta != null ? (row.invert ? delta <= 0 : delta >= 0) : null;
                return (
                  <tr key={i} className="border-b border-[#111] bg-[#0a0a0a] hover:bg-[#141414]">
                    <td className="px-3 py-1.5 text-[#888]">{row.label}</td>
                    <td className="px-3 py-1.5 text-right text-white font-medium">{row.fmt(row.current)}</td>
                    <td className="px-3 py-1.5 text-right text-[#666]">{row.fmt(row.prev)}</td>
                    <td className="px-3 py-1.5 text-right">
                      {delta != null ? (
                        <span className={isGood ? 'text-green-400' : 'text-red-400'}>
                          {delta >= 0 ? '+' : ''}{typeof row.current === 'number' && row.current < 10 ? delta.toFixed(2) : formatSignedNumber(delta)}
                        </span>
                      ) : (
                        <span className="text-[#555]">\u2014</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
