import React, { useMemo, useState } from 'react';
import { useSerpOverlap, type SerpOverlapData } from '../selectors/useSerpOverlap';
import { fmtCompact } from '../../_shared/formatters';
import clsx from 'clsx';

const PANEL = 'rounded border border-[#1a1a1a] bg-[#0a0a0a]';
const LABEL = 'text-[10px] uppercase tracking-wider text-[#666] mb-2';
const selectClass = 'h-7 px-2 bg-[#0c0c0c] border border-[#1a1a1a] rounded text-[11px] text-[#ccc] focus:outline-none focus:border-[#333] appearance-none cursor-pointer';

export default function CompetitorsSerpOverlapView() {
  const data = useSerpOverlap();
  const [kwFilter, setKwFilter] = useState('any');

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 shrink-0 border-b border-[#161616]">
        <span className={LABEL} style={{ marginBottom: 0 }}>Keywords:</span>
        <select value={kwFilter} onChange={e => setKwFilter(e.target.value)}
          className={selectClass}>
          <option value="any">Any</option>
          <option value="topVolume">Top volume</option>
          <option value="gap">Gap only</option>
        </select>
        <div className="flex-1" />
        <span className="text-[10px] text-[#888]">{data.positionData.length} queries</span>
      </div>

      {/* Stacked panels */}
      <div className="flex-1 min-h-0 overflow-auto p-3 flex flex-col gap-3">
        <VennPanel data={data} />
        <PositionTable data={data} />
        <AiOwnershipPanel data={data} />
      </div>
    </div>
  );
}

function VennPanel({ data }: { data: SerpOverlapData }) {
  const us = data.hosts[0] ?? 'us';
  const comps = data.hosts.slice(1, 3);
  if (comps.length === 0) return null;

  // Calculate overlap regions
  const usShared = data.pairOverlaps.find(p => p.a === us && p.b === comps[0])?.count ?? 0;
  const usShared2 = comps.length > 1 ? (data.pairOverlaps.find(p => p.a === us && p.b === comps[1])?.count ?? 0) : 0;
  const compShared = comps.length > 1 ? (data.pairOverlaps.find(p => p.a === comps[0] && p.b === comps[1])?.count ?? 0) : 0;

  // Estimate unique counts (total shared - overlaps)
  const usTotal = data.matrix[us] ? Object.values(data.matrix[us]).reduce((a, b) => a + b, 0) : 0;
  const c1Total = data.matrix[comps[0]] ? Object.values(data.matrix[comps[0]]).reduce((a, b) => a + b, 0) : 0;
  const c2Total = comps.length > 1 && data.matrix[comps[1]] ? Object.values(data.matrix[comps[1]]).reduce((a, b) => a + b, 0) : 0;

  // Venn layout: two overlapping circles
  const w = 560, h = 200;
  const cx1 = w * 0.35, cx2 = w * 0.65, cy = h * 0.5;
  const r = 75;
  const overlap = 30;

  return (
    <div className={`${PANEL} p-3`}>
      <div className={LABEL}>Overlap</div>
      <div className="flex items-center gap-6">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {/* Left circle (us) */}
          <circle cx={cx1} cy={cy} r={r} fill="#a78bfa" fillOpacity={0.15} stroke="#a78bfa" strokeWidth="1.5" />
          <text x={cx1 - 20} y={cy - 8} fill="#a78bfa" fontSize="11" fontFamily="sans-serif" fontWeight="600">
            {us.replace(/\..+/, '')}
          </text>
          <text x={cx1 - 20} y={cy + 10} fill="#fff" fontSize="14" fontFamily="monospace" fontWeight="700">
            {usTotal}
          </text>

          {/* Right circle (top competitor) */}
          <circle cx={cx2} cy={cy} r={r} fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth="1.5" />
          <text x={cx2 + 5} y={cy - 8} fill="#3b82f6" fontSize="11" fontFamily="sans-serif" fontWeight="600">
            {comps[0].replace(/\..+/, '')}
          </text>
          <text x={cx2 + 5} y={cy + 10} fill="#fff" fontSize="14" fontFamily="monospace" fontWeight="700">
            {c1Total}
          </text>

          {/* Overlap region */}
          <text x={w * 0.5} y={cy - 4} textAnchor="middle" fill="#22c55e" fontSize="13" fontFamily="monospace" fontWeight="700">
            {usShared}
          </text>
          <text x={w * 0.5} y={cy + 12} textAnchor="middle" fill="#666" fontSize="9" fontFamily="sans-serif">
            shared
          </text>
        </svg>

        {/* Second competitor (if exists) */}
        {comps.length > 1 && (
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#14b8a6]" />
              <span className="text-white">{comps[1].replace(/\..+/, '')}</span>
            </div>
            <span className="text-[#888] tabular-nums">{compShared} shared with {comps[0].replace(/\..+/, '')}</span>
            <span className="text-[#888] tabular-nums">{usShared2} shared with us</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PositionTable({ data }: { data: SerpOverlapData }) {
  const top = data.positionData.slice(0, 20);
  const compHosts = data.hosts.slice(1, 3);

  return (
    <div className={`${PANEL}`}>
      <div className="px-3 py-2 border-b border-[#1a1a1a]">
        <span className={LABEL} style={{ marginBottom: 0 }}>SERP positions</span>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#666] border-b border-[#1a1a1a]">
              <th className="text-left px-3 py-2 font-normal w-[200px]">Query</th>
              <th className="text-center px-2 py-2 font-normal w-[60px]">Us</th>
              {compHosts.map(h => (
                <th key={h} className="text-center px-2 py-2 font-normal w-[70px]">{h.replace(/\..+/, '')}</th>
              ))}
              <th className="text-left px-3 py-2 font-normal">SERP features</th>
            </tr>
          </thead>
          <tbody>
            {top.map(row => (
              <tr key={row.keyword} className="border-b border-[#161616] hover:bg-[#0c0c0c] transition-colors">
                <td className="px-3 py-1.5 text-white truncate">{row.keyword}</td>
                <td className="text-center px-2 py-1.5">
                  <RankCell rank={row.us} />
                </td>
                {compHosts.map(h => {
                  const cr = row.competitors.find(c => c.host === h);
                  return (
                    <td key={h} className="text-center px-2 py-1.5">
                      <RankCell rank={cr?.rank ?? null} />
                    </td>
                  );
                })}
                <td className="px-3 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {row.serpFeatures.map(f => (
                      <span key={f} className={clsx(
                        'text-[8px] px-1.5 py-0.5 rounded',
                        f === 'AI ov' ? 'bg-[#3b82f6]/15 text-[#3b82f6]' :
                        f === 'featured snippet' ? 'bg-[#f59e0b]/15 text-[#f59e0b]' :
                        f === 'video' ? 'bg-[#ef4444]/15 text-[#ef4444]' :
                        'bg-[#222] text-[#888]',
                      )}>
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankCell({ rank }: { rank: number | null }) {
  if (rank === null) return <span className="text-[#555]">—</span>;
  return (
    <span className={clsx(
      'tabular-nums font-medium',
      rank <= 3 ? 'text-[#22c55e]' : rank <= 10 ? 'text-[#f59e0b]' : 'text-white',
    )}>
      {rank}
    </span>
  );
}

function AiOwnershipPanel({ data }: { data: SerpOverlapData }) {
  const aiRows = data.positionData.filter(p => p.aiOverview);
  if (aiRows.length === 0) return null;

  const us = data.hosts[0] ?? 'us';

  return (
    <div className={`${PANEL} p-3`}>
      <div className={LABEL}>Who owns the AI overview</div>
      <div className="flex flex-col gap-1.5">
        {aiRows.map(row => {
          const host = row.aiOverview!;
          const isUs = host === us;
          return (
            <div key={row.keyword} className="flex items-start gap-3 text-[11px]">
              <span className="text-white shrink-0 w-[140px] truncate">"{row.keyword}"</span>
              <span className={clsx(
                'shrink-0',
                isUs ? 'text-[#22c55e]' : 'text-[#888]',
              )}>
                {isUs ? 'cites us' : `${host.replace(/\..+/, '')} → we're out`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
