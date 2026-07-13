import React, { useMemo } from 'react';
import { useProfiles } from '../selectors/useProfiles.tsx';
import { fmtCompact, fmtPct } from '../../_shared/formatters';
import { STATUS } from '../../_shared/tokens';

const CARD = 'rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 min-h-0';

export default function SocialProfilesView() {
  const list = useProfiles();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((p: any) => (
            <ProfileCard key={`${p.network}|${p.handle}`} profile={p} />
          ))}
          {!list.length && <div className="col-span-full text-[12px] text-[#666] p-4 text-center">No social accounts connected.</div>}
        </div>

        {/* Completeness audit rollup */}
        {list.some((p: any) => (p.completeness ?? 100) < 90) && (
          <div className="mx-3 mb-3">
            <div className={`${CARD}`}>
              <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">Completeness audit</div>
              <div className="space-y-1">
                {list.filter((p: any) => (p.completeness ?? 100) < 90).map((p: any) => (
                  <div key={`${p.network}|${p.handle}`} className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#888] w-20">{p.network}</span>
                    <span className="text-[#f59e0b]">{p.missingFields?.join(', ') ?? 'incomplete profile'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function ProfileCard({ profile: p }: { profile: any }) {
  const growthRate = p.growthRate ?? 0;
  const completeness = p.completeness ?? 100;
  const engRate = p.engagementRate ?? 0;
  const cadenceOk = p.cadenceOk ?? true;
  const connected = p.connected !== false;

  const growthColor = growthRate > 0.01 ? STATUS.good : growthRate < 0 ? STATUS.bad : '#888';
  const completenessColor = completeness >= 90 ? STATUS.good : completeness >= 70 ? '#f59e0b' : STATUS.bad;
  const engColor = engRate > 0.05 ? STATUS.good : engRate > 0.02 ? '#888' : '#666';

  return (
    <article className={`${CARD} flex flex-col`}>
      {/* Header: network + connection + followers */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <NetworkIcon network={p.network} />
          <div>
            <div className="text-[11px] text-white font-medium">{p.network}</div>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#22c55e]' : 'bg-[#666]'}`} />
              <span className="text-[10px] text-[#888]">{connected ? 'connected' : 'disconnected'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[16px] font-mono text-white leading-none">{fmtCompact(p.followers ?? 0)}</div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] mb-2">
        <div className="flex justify-between">
          <span className="text-[#666]">growth 30d</span>
          <span style={{ color: growthColor }}>
            {growthRate > 0 ? '▲' : growthRate < 0 ? '▼' : '—'} {fmtPct(Math.abs(growthRate))}
            {growthRate < 0 && ' ⚠'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">cadence</span>
          <span className={cadenceOk ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>
            {p.postsPerWeek ?? 0}/wk {cadenceOk ? '✓' : '⚠'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">eng</span>
          <span style={{ color: engColor }}>{fmtPct(engRate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">completeness</span>
          <span style={{ color: completenessColor }}>
            {completeness}%
            {completeness < 80 && ' ⚠'}
          </span>
        </div>
      </div>

      {/* Spark line */}
      <div className="h-[24px] mb-2">
        {p.sparkData?.length > 0 ? (
          <svg viewBox="0 0 100 24" className="w-full h-full" preserveAspectRatio="none">
            <polyline
              points={p.sparkData.map((v: number, i: number) => `${(i / (p.sparkData.length - 1)) * 100},${24 - (v / Math.max(...p.sparkData)) * 20}`).join(' ')}
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
            />
          </svg>
        ) : (
          <div className="h-full bg-[#111] rounded" />
        )}
      </div>

      {/* Top post */}
      {p.topPost && (
        <div className="bg-[#111] rounded p-2 mb-2">
          <div className="text-[10px] text-[#888] line-clamp-1">"{p.topPost.text}"</div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-2 border-t border-[#171717] flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <span className={p.bioLink ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>
            bio link {p.bioLink ? '✓' : '⚠'}
          </span>
          {p.verified && <span className="text-[#22c55e]">verified ●</span>}
        </div>
      </div>
    </article>
  );
}

function NetworkIcon({ network }: { network: string }) {
  const colors: Record<string, string> = {
    LinkedIn: '#0a66c2',
    'X (Twitter)': '#1d9bf0',
    Instagram: '#e4405f',
    Meta: '#1877f2',
    Facebook: '#1877f2',
    TikTok: '#000',
    YouTube: '#ff0000',
    Pinterest: '#bd081c',
    Threads: '#000',
    Bluesky: '#0085ff',
  };
  const icons: Record<string, string> = {
    LinkedIn: 'in',
    'X (Twitter)': 'X',
    Instagram: 'ig',
    Meta: 'fb',
    Facebook: 'fb',
    TikTok: 'tt',
    YouTube: 'yt',
    Pinterest: 'pt',
    Threads: 'th',
    Bluesky: 'bs',
  };
  return (
    <div
      className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
      style={{ background: colors[network] ?? '#333' }}
    >
      {icons[network] ?? network[0]}
    </div>
  );
}
