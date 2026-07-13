import React, { useMemo, useState } from 'react';
import { useReviews, type Review } from '../selectors/useReviews';
import { fmtDate } from '../../_shared/formatters';
import { LineChart } from '../../_shared/LineChart';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { CHART_PALETTE } from '../../_shared/tokens';
import clsx from 'clsx';

const CARD = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3 min-h-0';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2';

type SourceId = 'all' | 'google' | 'yelp' | 'trustpilot';
type SentimentId = 'all' | 'positive' | 'neutral' | 'negative';

const SOURCES: { id: SourceId; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'google',     label: 'Google' },
  { id: 'yelp',       label: 'Yelp' },
  { id: 'trustpilot', label: 'Trustpilot' },
];

const SENTIMENTS: { id: SentimentId; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'positive', label: 'Positive' },
  { id: 'neutral',  label: 'Neutral' },
  { id: 'negative', label: 'Negative' },
];

const POSITIVE_KEYWORDS = ['great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'friendly', 'clean', 'helpful', 'recommend', 'perfect', 'fast', 'professional', 'quality'];
const NEGATIVE_KEYWORDS = ['bad', 'terrible', 'worst', 'slow', 'rude', 'dirty', 'broken', 'expensive', 'wait', 'poor', 'disappointed', 'horrible', 'awful', 'unprofessional', 'problem'];

function extractTopics(reviews: Review[]) {
  const posCounts: Record<string, number> = {};
  const negCounts: Record<string, number> = {};
  reviews.forEach(r => {
    const words = r.text.toLowerCase().split(/\W+/);
    POSITIVE_KEYWORDS.forEach(kw => { if (words.includes(kw)) posCounts[kw] = (posCounts[kw] || 0) + 1; });
    NEGATIVE_KEYWORDS.forEach(kw => { if (words.includes(kw)) negCounts[kw] = (negCounts[kw] || 0) + 1; });
  });
  const positive = Object.entries(posCounts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const negative = Object.entries(negCounts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  return { positive, negative };
}

function ratingOverTime(reviews: Review[]) {
  const buckets: Record<string, { google: number[]; yelp: number[]; trustpilot: number[] }> = {};
  reviews.forEach(r => {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { google: [], yelp: [], trustpilot: [] };
    if (r.source === 'gbp' || r.source === 'google') buckets[key].google.push(r.rating);
    else if (r.source === 'yelp') buckets[key].yelp.push(r.rating);
    else if (r.source === 'trustpilot') buckets[key].trustpilot.push(r.rating);
  });
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, v]) => ({
      month,
      google: v.google.length > 0 ? +(v.google.reduce((a, b) => a + b, 0) / v.google.length).toFixed(2) : null as any,
      yelp: v.yelp.length > 0 ? +(v.yelp.reduce((a, b) => a + b, 0) / v.yelp.length).toFixed(2) : null as any,
      trustpilot: v.trustpilot.length > 0 ? +(v.trustpilot.reduce((a, b) => a + b, 0) / v.trustpilot.length).toFixed(2) : null as any,
    }));
}

export default function LocalReviewsView() {
  const reviews = useReviews();
  const { locations = [], replyToReview } = useSeoCrawler() as any;
  const [selectedId, setSelectedId] = useState<string | null>(reviews[0]?.id ?? null);
  const selected = reviews.find((r: any) => r.id === selectedId);
  const [sourceFilter, setSourceFilter] = useState<SourceId>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentId>('all');
  const [draft, setDraft] = useState('');

  const filtered = useMemo(() => {
    let result = reviews;
    if (sourceFilter !== 'all') {
      result = result.filter((r: any) => r.source === sourceFilter || (sourceFilter === 'google' && r.source === 'gbp'));
    }
    if (sentimentFilter !== 'all') {
      result = result.filter((r: any) => r.sentiment === sentimentFilter);
    }
    return result;
  }, [reviews, sourceFilter, sentimentFilter]);

  const topics = useMemo(() => extractTopics(reviews), [reviews]);
  const overTime = useMemo(() => ratingOverTime(reviews), [reviews]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Filter chips */}
      <div className="shrink-0 border-b border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] px-3 py-1.5 flex items-center gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          {SOURCES.map(s => (
            <button
              key={s.id}
              onClick={() => setSourceFilter(s.id)}
              className={clsx(
                'h-[22px] px-2 rounded border transition-colors',
                sourceFilter === s.id
                  ? 'bg-[#f97316]/15 text-[#f97316] border-[#f97316]/30'
                  : 'bg-[var(--brand-surface-1)]] text-[var(--brand-text-mid)]] border-[var(--brand-surface-3)]] hover:text-[var(--brand-text-mid)]] hover:border-[var(--brand-surface-4)]]',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="text-[var(--brand-surface-4)]]">|</span>
        <div className="flex items-center gap-1">
          {SENTIMENTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSentimentFilter(s.id)}
              className={clsx(
                'h-[22px] px-2 rounded border transition-colors',
                sentimentFilter === s.id
                  ? 'bg-[#f97316]/15 text-[#f97316] border-[#f97316]/30'
                  : 'bg-[var(--brand-surface-1)]] text-[var(--brand-text-mid)]] border-[var(--brand-surface-3)]] hover:text-[var(--brand-text-mid)]] hover:border-[var(--brand-surface-4)]]',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[var(--brand-text-faint)]]">
          {filtered.length === reviews.length ? reviews.length : `${filtered.length} of ${reviews.length}`}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0 overflow-hidden">
        {/* Left: Review stream */}
        <ul className="col-span-5 rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] divide-y divide-[var(--brand-surface-3)]] overflow-auto custom-scrollbar">
          {filtered.map((r: any) => (
            <li key={r.id} onClick={() => { setSelectedId(r.id); setDraft(r.reply ?? ''); }}
                className={clsx('px-3 py-2 cursor-pointer hover:bg-[#101010] transition-colors', selectedId === r.id && 'bg-[var(--brand-surface-1)]]')}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--brand-text-mid)]] shrink-0">{fmtDate(r.createdAt)}</span>
                <span className="text-[11px] shrink-0">
                  {'\u2605'.repeat(Math.round(r.rating))}
                </span>
                <span className="text-[10px] text-[var(--brand-text-strong)] truncate">{r.author}</span>
                <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]] shrink-0">{r.source}</span>
              </div>
              <div className="text-[11px] text-[var(--brand-text-mid)]] mt-1 line-clamp-2">{r.text}</div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                <span className="text-[var(--brand-text-faint)]]">{r.locationId}</span>
                <span className={clsx('ml-auto', r.reply ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                  {r.reply ? 'replied' : 'not responded'}
                </span>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <div className="p-4 text-[12px] text-[var(--brand-text-faint)]]">No reviews match filters.</div>
          )}
        </ul>

        {/* Right: Charts + topics */}
        <div className="col-span-7 flex flex-col gap-3 min-h-0 overflow-auto custom-scrollbar">
          {/* Rating over time */}
          <div className={CARD}>
            <div className={LABEL}>Rating over time</div>
            {overTime.length > 1 ? (
              <LineChart
                data={overTime}
                x="month"
                series={[
                  { key: 'google', label: 'Google', color: CHART_PALETTE[0] },
                  { key: 'yelp', label: 'Yelp', color: CHART_PALETTE[1] },
                  { key: 'trustpilot', label: 'Trustpilot', color: CHART_PALETTE[2] },
                ]}
                height={160}
              />
            ) : (
              <div className="text-[12px] text-[var(--brand-text-faint)]] h-[160px] grid place-items-center">Need 2+ months of data.</div>
            )}
          </div>

          {/* Topic extraction */}
          <div className={CARD}>
            <div className={LABEL}>Topic extraction</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-[#22c55e] uppercase tracking-wider mb-1.5">Positive</div>
                {topics.positive.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {topics.positive.map(t => (
                      <div key={t.topic} className="flex items-center gap-2 text-[11px]">
                        <span className="text-[var(--brand-text-mid)]] flex-1 truncate">{t.topic}</span>
                        <div className="w-16 h-1.5 rounded bg-[var(--brand-surface-3)]] overflow-hidden">
                          <div className="h-full rounded bg-[#22c55e]" style={{ width: `${(t.count / topics.positive[0].count) * 100}%` }} />
                        </div>
                        <span className="text-[var(--brand-text-mid)]] tabular-nums w-5 text-right">{t.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-[var(--brand-text-faint)]]">No positive topics.</div>
                )}
              </div>
              <div>
                <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-1.5">Negative</div>
                {topics.negative.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {topics.negative.map(t => (
                      <div key={t.topic} className="flex items-center gap-2 text-[11px]">
                        <span className="text-[var(--brand-text-mid)]] flex-1 truncate">{t.topic}</span>
                        <div className="w-16 h-1.5 rounded bg-[var(--brand-surface-3)]] overflow-hidden">
                          <div className="h-full rounded bg-[#ef4444]" style={{ width: `${(t.count / topics.negative[0].count) * 100}%` }} />
                        </div>
                        <span className="text-[var(--brand-text-mid)]] tabular-nums w-5 text-right">{t.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-[var(--brand-text-faint)]]">No negative topics.</div>
                )}
              </div>
            </div>
          </div>

          {/* Review detail */}
          {selected && (
            <div className={CARD}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[var(--brand-text-strong)]">{selected.author}</span>
                <span className="text-[11px] text-[var(--brand-text-mid)]]">{selected.rating}\u2605</span>
                <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]]">{selected.source}</span>
                <span className="text-[10px] text-[var(--brand-text-faint)]] ml-auto">{fmtDate(selected.createdAt)}</span>
              </div>
              <p className="text-[12px] text-[var(--brand-text-mid)]] whitespace-pre-wrap mb-3">{selected.text}</p>
              <div className="text-[10px] uppercase text-[var(--brand-text-faint)]] mb-1">Reply</div>
              <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
                        className="w-full bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded p-2 text-[11px] text-[var(--brand-text-strong)] outline-none focus:border-[#f97316] custom-scrollbar" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => replyToReview?.(selected.id, draft)}
                        className="h-6 px-3 text-[10px] bg-[#f97316] text-[var(--brand-text-strong)] rounded hover:bg-[#ea580c] transition-colors">
                  {selected.reply ? 'Update' : 'Send'}
                </button>
                <button onClick={() => setDraft('')}
                        className="h-6 px-3 text-[10px] text-[var(--brand-text-mid)]] border border-[var(--brand-border-2)]] rounded hover:text-[var(--brand-text-strong)] transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
