import React, { useState, useMemo } from 'react';
import { useAds } from '../selectors/useAds.tsx';
import { fmtCompact, fmtPct } from '../../_shared/formatters';
import clsx from 'clsx';
import { STATUS_HEX } from '../../_shared/shared-columns';

type SortKey = 'spend' | 'ctr' | 'conv';
type ViewMode = 'gallery' | 'table';

export default function PaidAdsView() {
  const ads = useAds();
  const [network, setNetwork] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('spend');
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');

  const networks = useMemo(() => ['all', ...new Set(ads.map((a: any) => a.network))], [ads]);
  const statuses = useMemo(() => ['all', ...new Set(ads.map((a: any) => a.status))], [ads]);

  const filtered = useMemo(() => {
    const result = ads.filter((a: any) =>
      (network === 'all' || a.network === network) &&
      (status === 'all' || a.status === status)
    );
    return [...result].sort((a: any, b: any) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
  }, [ads, network, status, sortBy]);

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ads.forEach((a: any) => { counts[a.network] = (counts[a.network] ?? 0) + 1; });
    return counts;
  }, [ads]);

  // Summary stats
  const summary = useMemo(() => {
    const strong = ads.filter((a: any) => (a.assetCoverage ?? 0) >= 80).length;
    const fatigued = ads.filter((a: any) => (a.fatigue ?? 0) > 0).length;
    const disapproved = ads.filter((a: any) => a.status === 'disapproved').length;
    const avgCoverage = ads.length > 0 ? ads.reduce((s: number, a: any) => s + (a.assetCoverage ?? 0), 0) / ads.length : 0;
    return { strong, fatigued, disapproved, avgCoverage, total: ads.length };
  }, [ads]);

  return (
    <div className="flex flex-col h-full">
      {/* Filter strip matching wireframe */}
      <div className="flex items-center gap-2 p-3 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[#666]">{filtered.length} ads</span>
        <div className="flex gap-1 ml-2">
          {networks.map(n => (
            <button key={n} onClick={() => setNetwork(n)}
              className={clsx('h-6 px-2 text-[10px] rounded transition-colors flex items-center gap-1',
                network === n ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]')}>
              {n === 'all' ? 'All' : n}
              {n !== 'all' && networkCounts[n] && (
                <span className="text-[9px] opacity-60">{networkCounts[n]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="w-[1px] h-4 bg-[#222]" />
        <div className="flex gap-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={clsx('h-6 px-2 text-[10px] rounded transition-colors',
                status === s ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]')}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="w-[1px] h-4 bg-[#222]" />
        <div className="flex gap-1">
          {(['spend', 'ctr', 'conv'] as SortKey[]).map(k => (
            <button key={k} onClick={() => setSortBy(k)}
              className={clsx('h-6 px-2 text-[10px] rounded transition-colors',
                sortBy === k ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]')}>
              {k === 'spend' ? 'Spend' : k === 'ctr' ? 'CTR' : 'Conv'}
            </button>
          ))}
        </div>
        <div className="w-[1px] h-4 bg-[#222]" />
        <div className="flex gap-1">
          <button onClick={() => setViewMode('gallery')}
            className={clsx('h-6 px-2 text-[10px] rounded transition-colors',
              viewMode === 'gallery' ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]')}>
            Gallery
          </button>
          <button onClick={() => setViewMode('table')}
            className={clsx('h-6 px-2 text-[10px] rounded transition-colors',
              viewMode === 'table' ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]')}>
            Table
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'gallery' ? (
        <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-4 gap-3 min-h-0">
          {filtered.map((a: any) => {
            const clicks = a.ctr > 0 ? Math.round((a.conv ?? 0) / a.ctr) : 0;
            const cpc = clicks > 0 ? (a.spend ?? 0) / clicks : 0;
            const convRate = clicks > 0 ? (a.conv ?? 0) / clicks : 0;
            const ctrPct = (a.ctr ?? 0) * 100;
            const fatigue = a.fatigue ?? 0;
            const coverage = a.assetCoverage ?? 0;
            return (
              <article key={a.id} className="rounded border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden flex flex-col">
                {a.imageUrl ? <img src={a.imageUrl} alt="" className="block w-full aspect-video object-cover" /> :
                 a.videoUrl ? <video src={a.videoUrl} className="block w-full aspect-video" muted /> :
                 <div className="aspect-video grid place-items-center bg-[#111] text-[#444] text-[11px]">RSA · text only</div>}
                <div className="p-2.5 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-[#666]">{a.network} · {a.type}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{
                      background: ctrPct >= 3 ? STATUS_HEX.good : ctrPct >= 1 ? STATUS_HEX.warn : STATUS_HEX.bad,
                    }} />
                    <span className="text-[9px] text-[#555] ml-auto">{a.status}</span>
                  </div>
                  {a.campaign && <div className="text-[9px] text-[#555] mt-0.5 truncate">{a.campaign}</div>}
                  <div className="text-[11px] text-[#ddd] mt-1 line-clamp-2">{(a.headlines ?? [])[0] ?? ''}</div>
                  <div className="text-[10px] text-[#bbb] line-clamp-1 mt-0.5">{(a.descriptions ?? [])[0] ?? ''}</div>

                  {/* Fatigue + Coverage indicators */}
                  <div className="flex items-center gap-2 mt-1.5 text-[9px]">
                    <span className="flex items-center gap-1">
                      Fatigue
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{
                        background: fatigue === 0 ? STATUS_HEX.good : fatigue === 1 ? STATUS_HEX.warn : STATUS_HEX.bad,
                      }} />
                    </span>
                    <span className="flex items-center gap-1">
                      Coverage {coverage}%
                    </span>
                  </div>

                  <div className="mt-auto pt-1.5">
                    <dl className="grid grid-cols-4 gap-1 text-[10px]">
                      <Stat label="CTR" value={fmtPct(a.ctr)} tone={a.ctr >= 0.03 ? 'good' : a.ctr >= 0.01 ? 'warn' : 'bad'} />
                      <Stat label="CvR" value={`${(convRate * 100).toFixed(1)}%`} />
                      <Stat label="CPC" value={`$${fmtCompact(cpc)}`} />
                      <Stat label="Spend" value={fmtCompact(a.spend)} />
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
          {!filtered.length && <div className="col-span-4 text-[12px] text-[#666] p-4 text-center">No ads match filters.</div>}
        </div>
      ) : (
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-[12px]">
            <thead className="text-[10px] uppercase text-[#666] sticky top-0 bg-[#0a0a0a] z-10">
              <tr>
                <th className="text-left px-3 py-2 font-normal">Creative</th>
                <th className="text-left font-normal">Campaign</th>
                <th className="text-left font-normal">Type</th>
                <th className="text-right font-normal">Impr</th>
                <th className="text-right font-normal">CTR</th>
                <th className="text-right font-normal">CvR</th>
                <th className="text-right font-normal">Spend</th>
                <th className="text-center font-normal">Fatigue</th>
                <th className="text-right font-normal">Coverage</th>
                <th className="text-left font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => {
                const clicks = a.ctr > 0 ? Math.round((a.conv ?? 0) / a.ctr) : 0;
                const convRate = clicks > 0 ? (a.conv ?? 0) / clicks : 0;
                const fatigue = a.fatigue ?? 0;
                const coverage = a.assetCoverage ?? 0;
                return (
                  <tr key={a.id} className="border-t border-[#171717] hover:bg-[#0c0c0c]">
                    <td className="px-3 py-1.5 text-[#ddd] truncate max-w-[250px]">{(a.headlines ?? [])[0] ?? a.id}</td>
                    <td className="text-[#aaa] truncate max-w-[150px]">{a.campaign ?? '—'}</td>
                    <td className="text-[#aaa]">{a.type}</td>
                    <td className="text-right font-mono">{fmtCompact(a.impressions ?? 0)}</td>
                    <td className="text-right font-mono" style={{ color: (a.ctr ?? 0) >= 0.03 ? STATUS_HEX.good : STATUS_HEX.warn }}>{fmtPct(a.ctr)}</td>
                    <td className="text-right font-mono">{(convRate * 100).toFixed(1)}%</td>
                    <td className="text-right font-mono">{fmtCompact(a.spend)}</td>
                    <td className="text-center">
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{
                        background: fatigue === 0 ? STATUS_HEX.good : fatigue === 1 ? STATUS_HEX.warn : STATUS_HEX.bad,
                      }} />
                    </td>
                    <td className="text-right font-mono" style={{ color: coverage >= 80 ? STATUS_HEX.good : coverage >= 60 ? STATUS_HEX.warn : STATUS_HEX.bad }}>
                      {coverage}%
                    </td>
                    <td className="text-[#aaa]">{a.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary bar matching wireframe */}
      <div className="px-3 py-1.5 border-t border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#666] shrink-0 flex gap-4">
        <span>◆ {summary.total} ads</span>
        <span>{summary.strong} strong</span>
        {summary.fatigued > 0 && <span className="text-[#f59e0b]">{summary.fatigued} fatigued ⚠</span>}
        {summary.disapproved > 0 && <span className="text-[#ef4444]">{summary.disapproved} disapproved ⚠</span>}
        <span>asset coverage {Math.round(summary.avgCoverage)}%</span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'good' | 'warn' | 'bad' }) {
  const color = tone === 'good' ? STATUS_HEX.good : tone === 'warn' ? STATUS_HEX.warn : tone === 'bad' ? STATUS_HEX.bad : undefined;
  return (
    <div>
      <div className="text-[9px] uppercase text-[#666]">{label}</div>
      <div className="font-mono" style={{ color: color ?? '#fff' }}>{value}</div>
    </div>
  );
}
