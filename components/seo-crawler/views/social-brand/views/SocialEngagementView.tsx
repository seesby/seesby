import React, { useMemo } from 'react';
import { Heatmap } from '../../_shared/Heatmap';
import { BarChart } from '../../_shared/BarChart';
import { LineChart } from '../../_shared/LineChart';
import { useEngagement } from '../selectors/useEngagement.tsx';
import { fmtPct } from '../../_shared/formatters';
import { STATUS } from '../../_shared/tokens';
import { STATUS_HEX } from '../../_shared/shared-columns';

const CARD = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 min-h-0';
const H = ({ children }: { children: React.ReactNode }) =>
  <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">{children}</div>;

export default function SocialEngagementView() {
  const d = useEngagement() as any;

  const heatmapData = useMemo(() => {
    const hours = ['6-9', '9-12', '12-3', '3-6', '6-9', '9-12'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data: Record<string, Record<string, number>> = {};
    hours.forEach(h => {
      data[h] = {};
      days.forEach(d => { data[h][d] = 0; });
    });
    (d.bestTimes as any[])?.forEach((t: any) => {
      if (data[t.hour] && data[t.hour][t.day] !== undefined) {
        data[t.hour][t.day] = t.engagement ?? 0;
      }
    });
    return { hours, days, data };
  }, [d]);

  const contentTypes = useMemo(() => {
    return (d.byContentType as any[] ?? []).map((c: any) => ({
      name: c.name ?? c.type ?? 'unknown',
      value: c.engRate ?? c.value ?? 0,
    }));
  }, [d]);

  const hashtags = useMemo(() => {
    return (d.hashtags as any[] ?? [])
      .sort((a: any, b: any) => (b.engRate ?? 0) - (a.engRate ?? 0))
      .slice(0, 5);
  }, [d]);

  const replyStats = useMemo(() => {
    return {
      replyRate: d.replyRate ?? 0,
      avgResponseTime: d.avgResponseTime ?? '—',
      dmMedian: d.dmMedian ?? '—',
      dmP90: d.dmP90 ?? '—',
      commentMedian: d.commentMedian ?? '—',
      negativeSla: d.negativeSlaMet ?? 0,
    };
  }, [d]);

  const demographics = useMemo(() => {
    return {
      roles: (d.audienceRoles as any[]) ?? [],
      industries: (d.audienceIndustries as any[]) ?? [],
      regions: (d.audienceRegions as any[]) ?? [],
    };
  }, [d]);

  const engRateTrend = useMemo(() => {
    return (d.engRateTrend as any[]) ?? [];
  }, [d]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-3 space-y-3">
          {/* Best-time heatmap */}
          <div className={`${CARD}`}>
            <H>Best-time heatmap (audience-local)</H>
            <Heatmap
              rows={heatmapData.hours}
              cols={heatmapData.days}
              getValue={(r, c) => heatmapData.data[r]?.[c] ?? 0}
              fullWidth
              cellSize={24}
              accentColor="#F59E0B"
            />
          </div>

          <div className="grid grid-cols-12 gap-3">
            {/* Content-type lift */}
            <div className={`${CARD} col-span-12 md:col-span-4`}>
              <H>Content-type lift</H>
              {contentTypes.length > 0 ? (
                <BarChart data={contentTypes} x="name" y="value" color="#F59E0B" height={180} />
              ) : (
                <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No data.</div>
              )}
            </div>

            {/* Eng-rate trend */}
            <div className={`${CARD} col-span-12 md:col-span-4`}>
              <H>Eng-rate trend 12w</H>
              {engRateTrend.length > 1 ? (
                <LineChart data={engRateTrend} x="date" series={[{ key: 'engRate', color: '#F59E0B' }]} height={180} />
              ) : (
                <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">Need more data.</div>
              )}
            </div>

            {/* Reply rate + response time */}
            <div className={`${CARD} col-span-12 md:col-span-4`}>
              <H>Reply rate + response time</H>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--brand-text-mid)]">Reply rate</span>
                  <span style={{ color: replyStats.replyRate >= 0.8 ? STATUS.good : replyStats.replyRate >= 0.6 ? STATUS_HEX.warn : STATUS.bad }}>
                    {fmtPct(replyStats.replyRate)} {replyStats.replyRate < 0.8 && '⚠'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--brand-text-mid)]">Avg time</span>
                  <span className="text-[var(--brand-text-strong)]">{replyStats.avgResponseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--brand-text-mid)]">DM median</span>
                  <span className="text-[var(--brand-text-strong)]">{replyStats.dmMedian}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--brand-text-mid)]">DM p90</span>
                  <span className="text-[var(--brand-text-strong)]">{replyStats.dmP90}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--brand-text-mid)]">Comments median</span>
                  <span className="text-[var(--brand-text-strong)]">{replyStats.commentMedian}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--brand-text-mid)]">Negative reply SLA 4h</span>
                  <span style={{ color: replyStats.negativeSla >= 0.8 ? STATUS.good : STATUS_HEX.warn }}>
                    {fmtPct(replyStats.negativeSla)} {replyStats.negativeSla < 0.8 && '⚠'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3">
            {/* Hashtag performance */}
            <div className={`${CARD} col-span-12 md:col-span-4`}>
              <H>Hashtag performance</H>
              {hashtags.length > 0 ? (
                <div className="space-y-1.5">
                  {hashtags.map((h: any) => (
                    <div key={h.tag} className="flex items-center gap-2 text-[11px]">
                      <span className="text-[var(--brand-text-mid)] w-24 truncate">#{h.tag}</span>
                      <div className="flex-1 h-2 rounded bg-[var(--brand-surface-3)] overflow-hidden">
                        <div className="h-full rounded bg-[#F59E0B]" style={{ width: `${Math.min(100, (h.engRate ?? 0) * 10)}%` }} />
                      </div>
                      <span className="font-mono text-[var(--brand-text-strong)] w-10 text-right">{fmtPct(h.engRate ?? 0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No hashtag data.</div>
              )}
            </div>

            {/* Audience demographics */}
            <div className={`${CARD} col-span-12 md:col-span-8`}>
              <H>Audience demographics (aggregate)</H>
              <div className="grid grid-cols-3 gap-4 text-[11px]">
                <div>
                  <div className="text-[10px] text-[var(--brand-text-faint)] mb-1">Role</div>
                  {demographics.roles.map((r: any) => (
                    <div key={r.label} className="flex justify-between py-0.5">
                      <span className="text-[var(--brand-text-mid)]">{r.label}</span>
                      <span className="text-[var(--brand-text-strong)]">{fmtPct(r.value)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] text-[var(--brand-text-faint)] mb-1">Industry</div>
                  {demographics.industries.map((r: any) => (
                    <div key={r.label} className="flex justify-between py-0.5">
                      <span className="text-[var(--brand-text-mid)]">{r.label}</span>
                      <span className="text-[var(--brand-text-strong)]">{fmtPct(r.value)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] text-[var(--brand-text-faint)] mb-1">Region</div>
                  {demographics.regions.map((r: any) => (
                    <div key={r.label} className="flex justify-between py-0.5">
                      <span className="text-[var(--brand-text-mid)]">{r.label}</span>
                      <span className="text-[var(--brand-text-strong)]">{fmtPct(r.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
