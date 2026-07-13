import React, { useMemo } from 'react';
import { LineChart } from '../../_shared/LineChart';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { fmtCompact, fmtPct } from '../../_shared/formatters';
import { useHasComparison } from '../../_hooks/useHasComparison';
import { STATUS } from '../../_shared/tokens';

const CARD = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 min-h-0';
const H = ({ children }: { children: React.ReactNode }) =>
  <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">{children}</div>;

export default function SocialOverviewView() {
  const { social = {} } = useSeoCrawler() as any;
  const hasComparison = useHasComparison();

  const profiles = social.profiles ?? [];
  const mentions = social.mentions ?? [];
  const meta = social.meta ?? [];
  const competitors = social.competitors ?? [];
  const influencers = social.influencers ?? [];

  const kpis = useMemo(() => {
    const totalFollowers = profiles.reduce((s: number, p: any) => s + (p.followers ?? 0), 0);
    const prevFollowers = profiles.reduce((s: number, p: any) => s + (p.prevFollowers ?? p.followers ?? 0), 0);
    const followerDelta = hasComparison && prevFollowers > 0 ? (totalFollowers - prevFollowers) / prevFollowers : undefined;

    const now = Date.now();
    const mentions30d = mentions.filter((m: any) => {
      const d = new Date(m.postedAt);
      return (now - d.getTime()) < 30 * 86400000;
    }).length;

    const positiveMentions = mentions.filter((m: any) => m.sentiment === 'positive').length;
    const sentimentRate = mentions.length > 0 ? positiveMentions / mentions.length : 0;

    const engRate = profiles.length > 0
      ? profiles.reduce((s: number, p: any) => s + (p.engagementRate ?? 0), 0) / profiles.length
      : 0;

    const sov = social.sov ?? 0;
    const socialTraffic = social.traffic?.sessions ?? 0;

    return { totalFollowers, followerDelta, mentions30d, sentimentRate, engRate, sov, socialTraffic };
  }, [profiles, mentions, hasComparison, social]);

  const sentimentData = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    mentions.forEach((m: any) => {
      const s = m.sentiment?.toLowerCase();
      if (s === 'positive') counts.positive++;
      else if (s === 'negative') counts.negative++;
      else counts.neutral++;
    });
    const total = mentions.length || 1;
    return {
      positive: Math.round(counts.positive / total * 100),
      neutral: Math.round(counts.neutral / total * 100),
      negative: Math.round(counts.negative / total * 100),
    };
  }, [mentions]);

  const sentimentTrend = social.sentimentTrend ?? [];

  const platformScorecard = useMemo(() => {
    return profiles.map((p: any) => ({
      network: p.network,
      followers: p.followers,
      posts30d: Math.round((p.postsPerWeek ?? 0) * 4),
      engRate: p.engagementRate ?? 0,
      bestPost: p.topPost?.text?.slice(0, 20) ?? '—',
      alerts: p.alerts ?? ((p.growthRate ?? 0) < 0 ? 1 : 0),
    }));
  }, [profiles]);

  const ogIssues = useMemo(() => {
    const missingOgImage = meta.filter((r: any) => !r.ogImage).length;
    const wrongOgType = meta.filter((r: any) => r.ogType && r.ogType !== 'website' && r.ogType !== 'article').length;
    const missingTwitterCard = meta.filter((r: any) => !r.twitterCard).length;
    const wrongRatio = meta.filter((r: any) => r.issues?.some((i: string) => i.includes('ratio'))).length;
    return { missingOgImage, wrongOgType, missingTwitterCard, wrongRatio };
  }, [meta]);

  const hasData = profiles.length > 0 || mentions.length > 0 || meta.length > 0;

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--brand-text-faint)]">
        No social data available.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-3 space-y-3">
          {/* 6 KPI tiles */}
          <div className={`${CARD}`}>
            <div className="grid grid-cols-6 gap-4">
              <KpiTile label="FOLLOWERS TOT" value={fmtCompact(kpis.totalFollowers)} delta={kpis.followerDelta} />
              <KpiTile label="MENTIONS 30d" value={String(kpis.mentions30d)} />
              <KpiTile label="SENTIMENT" value={`+${kpis.sentimentRate.toFixed(2)}`} />
              <KpiTile label="ENGAGE RATE" value={fmtPct(kpis.engRate)} />
              <KpiTile label="SOV" value={fmtPct(kpis.sov)} />
              <KpiTile label="SOCIAL TRAFFIC" value={`${fmtCompact(kpis.socialTraffic)}/mo`} />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3">
            {/* Mentions stream (sentiment) */}
            <div className={`${CARD} col-span-12 md:col-span-6`}>
              <H>Mentions stream (sentiment)</H>
              {mentions.length > 0 ? (
                <>
                  <div className="space-y-1.5 mb-3">
                    <SentimentBar label="+" pct={sentimentData.positive} color={STATUS.good} />
                    <SentimentBar label="~" pct={sentimentData.neutral} color="text-[var(--brand-text-faint)]" />
                    <SentimentBar label="-" pct={sentimentData.negative} color={STATUS.bad} warning={sentimentData.negative > 15} />
                  </div>
                  {sentimentTrend.length > 0 && (
                    <>
                      <div className="text-[10px] text-[var(--brand-text-faint)] mb-1">trend 12w</div>
                      <div className="h-[60px] relative">
                        <LineChart data={sentimentTrend} x="date" series={[{ key: 'positive', color: STATUS.good }]} height={60} />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No mentions data.</div>
              )}
            </div>

            {/* SoV vs competitors */}
            <div className={`${CARD} col-span-12 md:col-span-6`}>
              <H>SoV vs competitors (stream)</H>
              {competitors.length > 0 ? (
                <div className="space-y-1.5">
                  {competitors.map((c: any) => (
                    <div key={c.name} className="flex items-center gap-2 text-[11px]">
                      <span className="w-10 text-[var(--brand-text-mid)]">{c.name}</span>
                      <div className="flex-1 h-4 rounded bg-[var(--brand-surface-3)] overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${(c.share ?? 0) / 50 * 100}%`, background: c.color ?? '#F59E0B' }} />
                      </div>
                      <span className="w-10 text-right font-mono text-[var(--brand-text-strong)]">{c.share ?? 0}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No competitor data.</div>
              )}
            </div>
          </div>

          {/* Per-platform scorecard */}
          <div className={`${CARD}`}>
            <H>Per-platform scorecard</H>
            {platformScorecard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="text-[10px] uppercase text-[var(--brand-text-faint)] border-b border-[var(--brand-surface-3)]">
                    <tr>
                      <th className="text-left py-1.5 font-normal">Platform</th>
                      <th className="text-right font-normal">Followers</th>
                      <th className="text-right font-normal">Post 30d</th>
                      <th className="text-right font-normal">Eng rate</th>
                      <th className="text-left font-normal pl-2">Best post</th>
                      <th className="text-right font-normal">Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformScorecard.map(p => (
                      <tr key={p.network} className="border-b border-[var(--brand-surface-2)]">
                        <td className="py-1.5 text-[var(--brand-text-mid)]">{p.network}</td>
                        <td className="py-1.5 text-right font-mono text-[var(--brand-text-strong)]">{fmtCompact(p.followers)}</td>
                        <td className="py-1.5 text-right font-mono text-[var(--brand-text-strong)]">{p.posts30d}</td>
                        <td className="py-1.5 text-right font-mono" style={{
                          color: p.engRate > 0.08 ? STATUS.good : p.engRate > 0.03 ? 'text-[var(--brand-text-mid)]' : 'text-[var(--brand-text-faint)]'
                        }}>{fmtPct(p.engRate)}</td>
                        <td className="py-1.5 text-[var(--brand-text-mid)] pl-2 truncate max-w-[150px]">{p.bestPost}</td>
                        <td className="py-1.5 text-right">
                          {p.alerts > 0 ? (
                            <span className="text-[#f59e0b]">{p.alerts} ⚠</span>
                          ) : (
                            <span className="text-[var(--brand-text-faint)]">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No platform data.</div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3">
            {/* OG / Twitter card audit */}
            <div className={`${CARD} col-span-12 md:col-span-6`}>
              <H>OG / Twitter card audit</H>
              {meta.length > 0 ? (
                <>
                  <div className="space-y-1.5 text-[11px]">
                    <AuditRow label="Pages missing og:image" count={ogIssues.missingOgImage} warning={ogIssues.missingOgImage > 10} />
                    <AuditRow label="og:type wrong" count={ogIssues.wrongOgType} />
                    <AuditRow label="twitter:card missing" count={ogIssues.missingTwitterCard} />
                    <AuditRow label="Image wrong ratio (1.91:1)" count={ogIssues.wrongRatio} warning={ogIssues.wrongRatio > 15} />
                  </div>
                  <div className="mt-2 pt-2 border-t border-[var(--brand-surface-3)]">
                    <span className="text-[11px] text-[#F59E0B] cursor-pointer hover:underline">[Open audit →]</span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No meta data.</div>
              )}
            </div>

            {/* Influencer mentions */}
            <div className={`${CARD} col-span-12 md:col-span-6`}>
              <H>Influencer mentions</H>
              {influencers.length > 0 ? (
                <>
                  <div className="space-y-1.5">
                    {influencers.slice(0, 3).map((inf: any) => (
                      <div key={inf.handle} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--brand-text-mid)]">{inf.handle}</span>
                          <span className="text-[var(--brand-text-faint)]">{inf.network}</span>
                        </div>
                        <span className="font-mono text-[var(--brand-text-strong)]">{fmtCompact(inf.followers)} fol</span>
                      </div>
                    ))}
                  </div>
                  {influencers.length > 3 && (
                    <div className="mt-2 pt-2 border-t border-[var(--brand-surface-3)]">
                      <span className="text-[11px] text-[#F59E0B] cursor-pointer hover:underline">[See all {influencers.length}]</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No influencer data.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value, delta, hint }: { label: string; value: string; delta?: number; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-[var(--brand-text-faint)]">{label}</div>
      <div className="text-[18px] font-mono text-[var(--brand-text-strong)] leading-none mt-1">{value}</div>
      {delta !== undefined && (
        <div className="text-[10px] mt-1" style={{ color: delta > 0 ? STATUS.good : delta < 0 ? STATUS.bad : 'text-[var(--brand-text-mid)]' }}>
          {delta > 0 ? '▲' : delta < 0 ? '▼' : ''} {fmtPct(Math.abs(delta))}
        </div>
      )}
      {hint && <div className="text-[10px] text-[var(--brand-text-faint)] mt-0.5">{hint}</div>}
    </div>
  );
}

function SentimentBar({ label, pct, color, warning }: { label: string; pct: number; color: string; warning?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-4 text-[var(--brand-text-mid)]">{label}</span>
      <div className="flex-1 h-4 rounded bg-[var(--brand-surface-3)] overflow-hidden">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-10 text-right font-mono text-[var(--brand-text-strong)]">{pct}%</span>
      {warning && <span className="text-[#f59e0b]">⚠</span>}
    </div>
  );
}

function AuditRow({ label, count, warning }: { label: string; count: number; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--brand-text-mid)]">{label}</span>
      <span style={{ color: warning ? '#f59e0b' : 'text-[var(--brand-text-mid)]' }}>
        {count} {warning && '⚠'}
      </span>
    </div>
  );
}
