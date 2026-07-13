import React, { useMemo, useState } from 'react';
import { BarChart } from '../../_shared/BarChart';
import { useMentions } from '../selectors/useMentions.tsx';
import { fmtCompact, fmtDate } from '../../_shared/formatters';
import { STATUS } from '../../_shared/tokens';

const CARD = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3 min-h-0';

export default function SocialMentionsView() {
  const list = useMentions();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [sentFilter, setSentFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    return list.filter((m: any) => {
      if (sentFilter && m.sentiment !== sentFilter) return false;
      if (tierFilter) {
        const followers = m.authorFollowers ?? m.reach ?? 0;
        if (tierFilter === 'high' && followers < 50000) return false;
        if (tierFilter === 'mid' && (followers < 10000 || followers >= 50000)) return false;
        if (tierFilter === 'low' && followers >= 10000) return false;
      }
      return true;
    });
  }, [list, sentFilter, tierFilter]);

  const topics = useMemo(() => {
    const byTopic: Record<string, any[]> = {};
    filteredList.forEach((m: any) => {
      const topic = m.topic ?? 'Uncategorized';
      if (!byTopic[topic]) byTopic[topic] = [];
      byTopic[topic].push(m);
    });
    return Object.entries(byTopic)
      .map(([name, mentions]) => {
        const avgSentiment = mentions.reduce((s: number, m: any) => s + (m.sentiment === 'positive' ? 1 : m.sentiment === 'negative' ? -1 : 0), 0) / mentions.length;
        const totalReach = mentions.reduce((s: number, m: any) => s + (m.reach ?? 0), 0);
        const topMentions = mentions
          .sort((a: any, b: any) => (b.authorFollowers ?? b.reach ?? 0) - (a.authorFollowers ?? a.reach ?? 0))
          .slice(0, 3);
        const isCrisis = name.toLowerCase().includes('crisis') || mentions.some((m: any) => m.escalated || (m.velocity ?? 0) > 2);
        const isComplaint = name.toLowerCase().includes('complaint') || name.toLowerCase().includes('support');
        const slaBreachRisk = isComplaint && mentions.some((m: any) => m.slaBreach);
        const pairedTerms = mentions.flatMap((m: any) => m.pairedTerms ?? []).reduce((acc: Record<string, number>, t: string) => { acc[t] = (acc[t] ?? 0) + 1; return acc; }, {});
        const topPaired = (Object.entries(pairedTerms) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 2);
        const featureRequests = mentions.filter((m: any) => m.type === 'feature_request');
        const topFeature = featureRequests.length > 0
          ? featureRequests.reduce((acc: Record<string, number>, m: any) => { const f = m.feature ?? 'unknown'; acc[f] = (acc[f] ?? 0) + 1; return acc; }, {})
          : null;
        const topFeatureEntry = topFeature ? (Object.entries(topFeature) as [string, number][]).sort((a, b) => b[1] - a[1])[0] : null;

        // Crisis details
        const crisisMention = isCrisis ? mentions.find((m: any) => m.escalated || (m.velocity ?? 0) > 2) : null;

        return {
          name,
          count: mentions.length,
          avgSentiment,
          totalReach,
          topMentions,
          isCrisis,
          isComplaint,
          slaBreachRisk,
          topPaired,
          topFeatureEntry,
          crisisMention,
        };
      })
      .sort((a, b) => {
        if (a.isCrisis && !b.isCrisis) return -1;
        if (!a.isCrisis && b.isCrisis) return 1;
        return b.count - a.count;
      });
  }, [filteredList]);

  const timelineData = useMemo(() => {
    const now = new Date('2026-05-21');
    const weeks: { date: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 7);
      const count = filteredList.filter((m: any) => {
        const d = new Date(m.postedAt);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({ date: `W${4 - i}`, count });
    }
    return weeks;
  }, [filteredList]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-3 border-b border-[var(--brand-surface-3)]]">
        <span className="text-[10px] uppercase text-[var(--brand-text-faint)]]">group by:</span>
        <span className="px-2 py-1 text-[10px] rounded bg-[var(--brand-surface-3)]] text-[var(--brand-text-strong)]">topic ▾</span>
        <span className="text-[var(--brand-surface-4)]]">|</span>
        {sentFilter && (
          <button onClick={() => setSentFilter(null)} className="px-2 py-1 text-[10px] rounded bg-[#F59E0B]/10 text-[#F59E0B] flex items-center gap-1">
            sent: {sentFilter[0]} ×
          </button>
        )}
        {tierFilter && (
          <button onClick={() => setTierFilter(null)} className="px-2 py-1 text-[10px] rounded bg-[#F59E0B]/10 text-[#F59E0B] flex items-center gap-1">
            tier:{tierFilter} ×
          </button>
        )}
        {!sentFilter && !tierFilter && <span className="text-[10px] text-[var(--brand-text-faint)]]">no filters</span>}
        <div className="flex-1" />
        <span className="text-[10px] text-[var(--brand-text-faint)]]">{topics.length} topics · {filteredList.length} mentions</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-3 space-y-3">
          {/* Topic clusters */}
          {topics.map(topic => (
            <TopicCard
              key={topic.name}
              topic={topic}
              expanded={expandedTopic === topic.name}
              onToggle={() => setExpandedTopic(expandedTopic === topic.name ? null : topic.name)}
            />
          ))}

          {!topics.length && <div className="text-[12px] text-[var(--brand-text-faint)]] p-4 text-center">No mentions yet.</div>}

          {/* Timeline / volume */}
          <div className={`${CARD}`}>
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2">Timeline / volume</div>
            {timelineData.some(w => w.count > 0) ? (
              <div className="flex items-end gap-1 h-[60px]">
                {timelineData.map((w, i) => {
                  const max = Math.max(...timelineData.map(x => x.count), 1);
                  const h = (w.count / max) * 48;
                  const isSpike = w.count > max * 0.7 && i > 0;
                  return (
                    <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${Math.max(4, h)}px`,
                          background: isSpike ? '#f59e0b' : '#F59E0B',
                        }}
                        title={`${w.date}: ${w.count} mentions`}
                      />
                      <span className="text-[9px] text-[var(--brand-text-faint)]]">{w.date}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-[12px] text-[var(--brand-text-faint)]] text-center">No timeline data.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Topic Card ──────────────────────────────────────────────────────────── */

function TopicCard({ topic, expanded, onToggle }: { topic: any; expanded: boolean; onToggle: () => void }) {
  const sentColor = topic.avgSentiment > 0.2 ? STATUS.good : topic.avgSentiment < -0.2 ? STATUS.bad : 'text-[var(--brand-text-mid)]';
  const sentLabel = topic.avgSentiment > 0 ? `+${topic.avgSentiment.toFixed(1)}` : topic.avgSentiment.toFixed(1);

  return (
    <div className={`${CARD} ${topic.isCrisis ? 'border-[#ef4444]/30' : ''}`}>
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--brand-text-strong)] font-medium">{topic.name}</span>
            {topic.isCrisis && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444]">crisis ⚠</span>}
            {topic.isComplaint && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b]">complaints</span>}
            {topic.slaBreachRisk && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b]">SLA breach risk</span>}
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-[var(--brand-text-mid)]]">{topic.count} mentions</span>
            <span style={{ color: sentColor }}>sent {sentLabel}</span>
            {topic.totalReach > 0 && <span className="text-[var(--brand-text-faint)]]">reach {fmtCompact(topic.totalReach)}</span>}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[var(--brand-surface-3)]] space-y-2">
          {/* Top mentions */}
          {topic.topMentions.map((m: any) => (
            <MentionRow key={m.id} mention={m} />
          ))}
          {topic.count > 3 && (
            <div className="text-[10px] text-[var(--brand-text-faint)]]">+ {topic.count - 3} more</div>
          )}

          {/* Paired terms */}
          {topic.topPaired.length > 0 && (
            <div className="pt-2 border-t border-[var(--brand-surface-2)]]">
              <div className="text-[10px] text-[var(--brand-text-faint)]] mb-1">often paired:</div>
              <div className="flex flex-wrap gap-2">
                {topic.topPaired.map(([term, count]: [string, number]) => (
                  <span key={term} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]]">
                    "{term}" {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Feature requests */}
          {topic.topFeatureEntry && (
            <div className="pt-2 border-t border-[var(--brand-surface-2)]]">
              <div className="text-[10px] text-[var(--brand-text-faint)]]">top request: <span className="text-[var(--brand-text-mid)]]">"{topic.topFeatureEntry[0]}"</span> ({topic.topFeatureEntry[1]}×)</div>
            </div>
          )}

          {/* Crisis actions */}
          {topic.isCrisis && topic.crisisMention && (
            <div className="pt-2 border-t border-[var(--brand-surface-2)]] space-y-1">
              <div className="text-[10px] text-[#ef4444]">
                {topic.crisisMention.author} {topic.crisisMention.network} · sentiment −{Math.abs(topic.crisisMention.sentiment === 'negative' ? 0.8 : 0.4).toFixed(1)} · reach {fmtCompact(topic.crisisMention.reach)} in 4h · velocity {(topic.crisisMention.velocity ?? 3).toFixed(1)}× baseline
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 text-[10px] rounded bg-[#F59E0B]/10 text-[#F59E0B]">Draft response [review]</button>
                <button className="px-2 py-1 text-[10px] rounded bg-[#ef4444]/10 text-[#ef4444]">Escalate to PR [open]</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mention Row ─────────────────────────────────────────────────────────── */

function MentionRow({ mention: m }: { mention: any }) {
  const sentColor = m.sentiment === 'positive' ? STATUS.good : m.sentiment === 'negative' ? STATUS.bad : 'text-[var(--brand-text-faint)]';
  const followers = m.authorFollowers ?? m.reach ?? 0;

  return (
    <div className="flex items-start gap-2">
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: sentColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">{m.author ?? 'anonymous'}</span>
          <span className="text-[10px] text-[var(--brand-text-mid)]]">{m.network}</span>
          <span className="text-[10px] text-[var(--brand-text-faint)]]">{fmtCompact(followers)} {followers > 1000 ? 'fol' : ''}</span>
        </div>
        <p className="text-[11px] text-[var(--brand-text-mid)]] mt-0.5 line-clamp-1">"{(m.text ?? '').trim()}"</p>
      </div>
    </div>
  );
}
