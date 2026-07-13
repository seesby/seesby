import React, { useState, useMemo } from 'react';
import { useContentDepth, type ContentDepthData } from '../selectors/useContentDepth';
import { CHART_PALETTE } from '../../_shared/tokens';
import { fmtCompact } from '../../_shared/formatters';
import clsx from 'clsx';

const PANEL = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]]';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2';
const selectClass = 'h-7 px-2 bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] rounded text-[11px] text-[var(--brand-text-mid)]] focus:outline-none focus:border-[var(--brand-surface-4)]] appearance-none cursor-pointer';

export default function CompetitorsContentDepthView() {
  const data = useContentDepth();
  const [topic, setTopic] = useState('all');
  const topics = data.topics;

  const filteredScatter = useMemo(() => {
    if (topic === 'all') return data.scatterPoints;
    return data.scatterPoints.filter(p => p.page.toLowerCase().includes(topic));
  }, [data.scatterPoints, topic]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Topic picker */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 border-b border-[var(--brand-surface-3)]]">
        <span className={LABEL} style={{ marginBottom: 0 }}>Topic:</span>
        <select value={topic} onChange={e => setTopic(e.target.value)}
          className={selectClass}>
          <option value="all">All topics</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-[10px] text-[var(--brand-text-mid)]]">{filteredScatter.length} pages</span>
      </div>

      {/* Stacked panels */}
      <div className="flex-1 min-h-0 overflow-auto p-3 flex flex-col gap-3">
        <ScatterPanel points={filteredScatter} />
        <RadarPanel data={data} />
        <FormatGapsPanel data={data} />
      </div>
    </div>
  );
}

function ScatterPanel({ points }: { points: ContentDepthData['scatterPoints'] }) {
  const maxBl = Math.max(...points.map(p => p.backlinks), 1);
  const maxWords = Math.max(...points.map(p => p.words), 1);

  const hosts = useMemo(() => {
    const set = new Set(points.map(p => p.host));
    return [...set];
  }, [points]);

  return (
    <div className={`${PANEL} p-3`}>
      <div className={LABEL}>Content depth scatter</div>
      <div className="relative" style={{ height: 280 }}>
        <svg width="100%" height="100%" viewBox="0 0 600 280" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => (
            <React.Fragment key={`y-${pct}`}>
              <line x1="60" y1={20 + (1 - pct) * 230} x2="580" y2={20 + (1 - pct) * 230}
                stroke="bg-[var(--brand-surface-3)]" strokeWidth="1" />
              <text x="55" y={24 + (1 - pct) * 230} textAnchor="end"
                fill="text-[var(--brand-text-faint)]" fontSize="9" fontFamily="monospace">
                {fmtCompact(Math.round(maxWords * pct))}
              </text>
            </React.Fragment>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => (
            <React.Fragment key={`x-${pct}`}>
              <line x1={60 + pct * 520} y1="20" x2={60 + pct * 520} y2="250"
                stroke="bg-[var(--brand-surface-3)]" strokeWidth="1" />
              <text x={60 + pct * 520} y="265" textAnchor="middle"
                fill="text-[var(--brand-text-faint)]" fontSize="9" fontFamily="monospace">
                {fmtCompact(Math.round(maxBl * pct))}
              </text>
            </React.Fragment>
          ))}

          {/* Axis labels */}
          <text x="300" y="280" textAnchor="middle" fill="text-[var(--brand-text-faint)]" fontSize="9" fontFamily="sans-serif">Backlinks</text>
          <text x="10" y="135" textAnchor="middle" fill="text-[var(--brand-text-faint)]" fontSize="9" fontFamily="sans-serif" transform="rotate(-90, 10, 135)">Words</text>

          {/* Data points */}
          {points.map((p, i) => {
            const x = 60 + (p.backlinks / maxBl) * 520;
            const y = 20 + (1 - p.words / maxWords) * 230;
            const hostIdx = hosts.indexOf(p.host);
            const color = p.isUs ? '#a78bfa' : CHART_PALETTE[Math.max(0, hostIdx - 1) % CHART_PALETTE.length];
            const r = Math.max(6, Math.min(22, Math.sqrt(p.clicks) / 12));
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={color} opacity={0.65} />
                <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth="1.5" opacity={0.3} />
                <text x={x} y={y - r - 4} textAnchor="middle"
                  fill={p.isUs ? 'text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)]'} fontSize="8" fontFamily="sans-serif">
                  {p.isUs ? 'Us' : p.host.replace(/\..+/, '')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-1 text-[9px] text-[var(--brand-text-faint)]]">
        <span>X: backlinks</span>
        <span>Y: words</span>
        <span>Size: clicks</span>
        {hosts.map((h, i) => (
          <span key={h} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: i === 0 ? '#a78bfa' : CHART_PALETTE[Math.max(0, i - 1) % CHART_PALETTE.length] }} />
            {i === 0 ? 'Us' : h.replace(/\..+/, '')}
          </span>
        ))}
      </div>
    </div>
  );
}

function RadarPanel({ data }: { data: ContentDepthData }) {
  const cx = 150, cy = 120, r = 80;
  const dims = data.radarData;
  const n = dims.length;
  if (n === 0) return null;

  const competitors = dims[0]?.competitors.map(c => c.host) ?? [];

  const getPoint = (dim: typeof dims[0], key: 'us' | 'value', host?: string) => {
    const val = key === 'us' ? dim.us : (dim.competitors.find(c => c.host === host)?.value ?? 0);
    const angle = (Math.PI * 2 * dims.indexOf(dim)) / n - Math.PI / 2;
    return { x: cx + (val / 100) * r * Math.cos(angle), y: cy + (val / 100) * r * Math.sin(angle) };
  };

  const usPath = dims.map((d, i) => {
    const p = getPoint(d, 'us');
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ') + ' Z';

  return (
    <div className={`${PANEL} p-3`}>
      <div className={LABEL}>Content dimensions</div>
      <div className="flex items-start gap-4">
        <svg width="300" height="240" viewBox="0 0 300 240">
          {[0.25, 0.5, 0.75, 1].map(s => (
            <polygon key={s}
              points={dims.map((d, i) => {
                const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                return `${cx + s * r * Math.cos(angle)},${cy + s * r * Math.sin(angle)}`;
              }).join(' ')}
              fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="1" />
          ))}
          {dims.map((d, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const x = cx + (r + 14) * Math.cos(angle);
            const y = cy + (r + 14) * Math.sin(angle);
            return (
              <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fill="text-[var(--brand-text-mid)]" fontSize="9" fontFamily="sans-serif">
                {d.dimension}
              </text>
            );
          })}
          {competitors.map((host, ci) => {
            const path = dims.map((d, i) => {
              const p = getPoint(d, 'value', host);
              return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
            }).join(' ') + ' Z';
            const color = CHART_PALETTE[(ci + 1) % CHART_PALETTE.length];
            return (
              <path key={host} d={path} fill={color} fillOpacity={0.08}
                stroke={color} strokeWidth="1.5" />
            );
          })}
          <path d={usPath} fill="#a78bfa" fillOpacity={0.15}
            stroke="#a78bfa" strokeWidth="2" />
        </svg>
        <div className="flex flex-col gap-2 pt-2">
          <LegendItem color="#a78bfa" label="Us" />
          {competitors.map((host, i) => (
            <LegendItem key={host} color={CHART_PALETTE[(i + 1) % CHART_PALETTE.length]}
              label={host.replace(/\..+/, '')} />
          ))}
          <div className="mt-2 flex flex-col gap-1">
            {dims.map(d => (
              <div key={d.dimension} className="flex justify-between gap-3 text-[9px]">
                <span className="text-[var(--brand-text-faint)]]">{d.dimension}</span>
                <span className="text-[var(--brand-text-strong)] tabular-nums">{d.us}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatGapsPanel({ data }: { data: ContentDepthData }) {
  const gaps = data.formatGaps.filter(f => !f.us && f.competitors.some(c => c.present));
  if (gaps.length === 0) return null;

  return (
    <div className={`${PANEL} p-3`}>
      <div className={LABEL}>Format gaps</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {gaps.map(f => {
          const whoHas = f.competitors.filter(c => c.present).map(c => c.host.replace(/\..+/, '')).join(', ');
          return (
            <span key={f.format} className="text-[11px] text-[var(--brand-text-mid)]]">
              <span className="text-[var(--brand-text-strong)]">{f.format}</span>
              <span className="text-[var(--brand-text-faint)]]"> ({whoHas})</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-[var(--brand-text-mid)]]">{label}</span>
    </div>
  );
}
