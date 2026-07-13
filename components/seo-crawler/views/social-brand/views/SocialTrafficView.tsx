import React, { useMemo } from 'react';
import { Funnel } from '../../_shared/Funnel';
import { useSocialTraffic } from '../selectors/useSocialTraffic.tsx';
import { useHasComparison } from '../../_hooks/useHasComparison';
import { fmtCompact, fmtPct, fmtUrl } from '../../_shared/formatters';
import { STATUS } from '../../_shared/tokens';

const CARD = 'rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 min-h-0';
const H = ({ children }: { children: React.ReactNode }) =>
  <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">{children}</div>;

export default function SocialTrafficView() {
  const d = useSocialTraffic();
  const hasComparison = useHasComparison();

  const funnelSteps = useMemo(() => {
    return (d.funnel as any[] ?? []).map((s: any) => ({
      label: s.label,
      value: s.value ?? 0,
      tone: s.tone,
    }));
  }, [d]);

  const platformBreakdown = useMemo(() => {
    return (d.platformBreakdown as any[] ?? []);
  }, [d]);

  const landingPages = useMemo(() => {
    return (d.topLandings as any[] ?? []);
  }, [d]);

  const messageMatch = useMemo(() => {
    return (d.messageMatch as any[] ?? []);
  }, [d]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-3 space-y-3">
          {/* Funnel */}
          <div className={`${CARD}`}>
            <H>Funnel: social → site → conv</H>
            {funnelSteps.length > 0 ? (
              <Funnel steps={funnelSteps} accent="#6366f1" />
            ) : (
              <div className="py-4 text-[12px] text-[#666] text-center">No funnel data.</div>
            )}
          </div>

          {/* Platform breakdown */}
          <div className={`${CARD}`}>
            <H>Platform breakdown</H>
            {platformBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="text-[10px] uppercase text-[#666] border-b border-[#171717]">
                    <tr>
                      <th className="text-left py-1.5 font-normal">Platform</th>
                      <th className="text-right font-normal">Clicks</th>
                      <th className="text-right font-normal">Sessions</th>
                      <th className="text-right font-normal">Bounce</th>
                      <th className="text-right font-normal">CvR</th>
                      <th className="text-right font-normal">Rev</th>
                      <th className="text-right font-normal">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformBreakdown.map((p: any) => (
                      <tr key={p.platform} className="border-b border-[#111]">
                        <td className="py-1.5 text-[#ccc]">{p.platform}</td>
                        <td className="py-1.5 text-right font-mono text-white">{fmtCompact(p.clicks)}</td>
                        <td className="py-1.5 text-right font-mono text-white">{fmtCompact(p.sessions)}</td>
                        <td className="py-1.5 text-right font-mono" style={{
                          color: (p.bounceRate ?? 0) > 0.6 ? STATUS.bad : (p.bounceRate ?? 0) > 0.5 ? '#f59e0b' : '#888'
                        }}>
                          {fmtPct(p.bounceRate)}{(p.bounceRate ?? 0) > 0.6 && ' ⚠'}
                        </td>
                        <td className="py-1.5 text-right font-mono" style={{
                          color: (p.cvRate ?? 0) > 0.05 ? STATUS.good : (p.cvRate ?? 0) > 0.02 ? '#888' : STATUS.bad
                        }}>
                          {fmtPct(p.cvRate)}{(p.cvRate ?? 0) < 0.02 && ' ⚠'}
                        </td>
                        <td className="py-1.5 text-right font-mono text-white">${fmtCompact(p.revenue ?? 0)}</td>
                        <td className="py-1.5 text-right font-mono text-[#888]">{p.cost ? `$${fmtCompact(p.cost)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-[12px] text-[#666] text-center">No platform data.</div>
            )}
          </div>

          {/* Top landing pages */}
          <div className={`${CARD}`}>
            <H>Top landing pages from social</H>
            {landingPages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="text-[10px] uppercase text-[#666] border-b border-[#171717]">
                    <tr>
                      <th className="text-left py-1.5 font-normal">Page</th>
                      <th className="text-right font-normal">Sessions</th>
                      <th className="text-right font-normal">Bounce</th>
                      <th className="text-right font-normal">CvR</th>
                      <th className="text-right font-normal">Rev</th>
                      <th className="text-left font-normal pl-2">Top post</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingPages.map((l: any, i: number) => (
                      <tr key={i} className="border-b border-[#111]">
                        <td className="py-1.5 text-[#bdb6ff] truncate max-w-[250px]">{fmtUrl(l.url)}</td>
                        <td className="py-1.5 text-right font-mono text-white">{fmtCompact(l.sessions)}</td>
                        <td className="py-1.5 text-right font-mono" style={{
                          color: (l.bounceRate ?? 0) > 0.6 ? STATUS.bad : '#888'
                        }}>
                          {fmtPct(l.bounceRate)}{(l.bounceRate ?? 0) > 0.6 && ' ⚠'}
                        </td>
                        <td className="py-1.5 text-right font-mono" style={{
                          color: (l.cvRate ?? 0) > 0.05 ? STATUS.good : (l.cvRate ?? 0) < 0.02 ? STATUS.bad : '#888'
                        }}>
                          {fmtPct(l.cvRate)}{(l.cvRate ?? 0) < 0.02 && ' ⚠'}
                        </td>
                        <td className="py-1.5 text-right font-mono text-white">${fmtCompact(l.revenue ?? 0)}</td>
                        <td className="py-1.5 text-[#888] pl-2 truncate max-w-[120px]">{l.topPost ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-[12px] text-[#666] text-center">No landing page data.</div>
            )}
          </div>

          {/* Message-match audit */}
          {messageMatch.length > 0 && (
            <div className={`${CARD}`}>
              <H>Message-match audit (link card vs LP)</H>
              <table className="w-full text-[11px]">
                <thead className="text-[10px] uppercase text-[#666] border-b border-[#171717]">
                  <tr>
                    <th className="text-left py-1.5 font-normal">Post</th>
                    <th className="text-left font-normal">LP</th>
                    <th className="text-right font-normal">Match</th>
                    <th className="text-left font-normal pl-2">Suggestion</th>
                  </tr>
                </thead>
                <tbody>
                  {messageMatch.map((m: any, i: number) => (
                    <tr key={i} className="border-b border-[#111]">
                      <td className="py-1.5 text-[#ccc] truncate max-w-[120px]">{m.post}</td>
                      <td className="py-1.5 text-[#bdb6ff] truncate max-w-[150px]">{fmtUrl(m.lp)}</td>
                      <td className="py-1.5 text-right font-mono" style={{
                        color: (m.matchScore ?? 0) >= 0.8 ? STATUS.good : (m.matchScore ?? 0) >= 0.6 ? '#f59e0b' : STATUS.bad
                      }}>
                        {(m.matchScore ?? 0).toFixed(2)}{(m.matchScore ?? 0) >= 0.8 ? ' ✓' : ''}
                      </td>
                      <td className="py-1.5 text-[#888] pl-2">{m.suggestion ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
