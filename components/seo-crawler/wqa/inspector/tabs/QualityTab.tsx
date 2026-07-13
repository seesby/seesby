import React from 'react';
import {
  Card, MetricPill, formatNumber, getMetric,
} from '../../../inspector/shared';
import { Sparkline } from '@/components/seo-crawler/right-sidebar/_shared';

export default function QualityTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const healthScore = Number(getMetric(page, 'healthScore') || 0);
  const healthSeries = Array.isArray(page?.healthScoreSeries30d) ? page.healthScoreSeries30d.map(Number) : [];
  const peerPercentile = Number(getMetric(page, 'peerPercentile') || 0);

  const actions = page?.foundationActions || [];
  const deductions = actions
    .filter((a: any) => a.scoreImpact && Number(a.scoreImpact) < 0)
    .sort((a: any, b: any) => Number(a.scoreImpact) - Number(b.scoreImpact))
    .slice(0, 8);

  const positiveOffsets = actions
    .filter((a: any) => a.scoreImpact && Number(a.scoreImpact) > 0)
    .reduce((sum: number, a: any) => sum + Number(a.scoreImpact), 0);

  const upliftItems = actions
    .filter((a: any) => a.estimatedImpact && Number(a.estimatedImpact) > 0)
    .sort((a: any, b: any) => Number(b.estimatedImpact) - Number(a.estimatedImpact))
    .slice(0, 5);

  // Real per-category scores from PostCrawlEnrichment
  const contentScore = Number(getMetric(page, 'contentQualityScore') || page?.contentQualityScore || 0);
  const techScore = Number(getMetric(page, 'techHealthScore') || page?.techHealthScore || 0);
  const linksScore = Number(getMetric(page, 'authorityScore') || page?.authorityScore || 0);
  const searchScore = Number(getMetric(page, 'searchVisibilityScore') || page?.searchVisibilityScore || 0);

  // Use real scores if available, otherwise fall back to proportional splits
  const hasRealScores = contentScore > 0 || techScore > 0 || linksScore > 0 || searchScore > 0;
  const categories = hasRealScores
    ? [
        { label: 'Content', pct: contentScore, color: '#3b82f6' },
        { label: 'Search', pct: searchScore, color: '#a78bfa' },
        { label: 'Links', pct: linksScore, color: '#22c55e' },
        { label: 'Tech', pct: techScore, color: '#f59e0b' },
      ]
    : [
        { label: 'Content', pct: Math.max(5, Math.round(healthScore * 0.35)), color: '#3b82f6' },
        { label: 'Search', pct: Math.max(5, Math.round(healthScore * 0.25)), color: '#a78bfa' },
        { label: 'Links', pct: Math.max(5, Math.round(healthScore * 0.22)), color: '#22c55e' },
        { label: 'Tech', pct: Math.max(5, Math.round(healthScore * 0.18)), color: '#f59e0b' },
      ];

  // Radar chart points (diamond shape for 4 axes)
  const radarSize = 200;
  const radarCenter = radarSize / 2;
  const radarRadius = 70;
  const radarPoints = categories.map((c, i) => {
    const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
    const r = (c.pct / 100) * radarRadius;
    return { x: radarCenter + r * Math.cos(angle), y: radarCenter + r * Math.sin(angle) };
  });
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  // Deduction total
  const totalDeductions = deductions.reduce((sum: number, d: any) => sum + Math.abs(Number(d.scoreImpact)), 0);

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Overall" value={`${healthScore}`} good={healthScore >= 80} />
        <MetricPill label="Content" value={hasRealScores ? `${contentScore}` : '\u2014'} good={contentScore >= 70} />
        <MetricPill label="Tech" value={hasRealScores ? `${techScore}` : '\u2014'} good={techScore >= 70} />
        <MetricPill label="Links" value={hasRealScores ? `${linksScore}` : '\u2014'} good={linksScore >= 70} />
      </div>

      {/* Main 2-col: Score waterfall + Right stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Score waterfall (full height) */}
        <Card title={`Score ${healthScore} / 100`}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] text-[#444] uppercase tracking-wider">Start 100</span>
            </div>
            {deductions.length === 0 ? (
              <div className="text-[11px] text-[#444] py-2">No deductions</div>
            ) : (
              deductions.map((d: any, i: number) => {
                const impact = Math.abs(Number(d.scoreImpact));
                const barWidth = Math.min(100, Math.round((impact / 20) * 100));
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#ef4444] w-[24px] text-right shrink-0">{d.scoreImpact}</span>
                    <span className="text-[10px] text-[#ccc] flex-1 min-w-0 truncate">{d.label || d.description}</span>
                    <div className="shrink-0 w-[60px] h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-[#F59E0B]/60 rounded-full" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })
            )}
            <div className="pt-2 border-t border-[#141414]">
              <div className="text-[11px] font-bold text-white">= {healthScore}</div>
            </div>
            <div className="text-[10px] text-[#444]">
              {positiveOffsets > 0
                ? `Positive offsets applied: +${positiveOffsets}`
                : `Deductions: -${totalDeductions}`}
            </div>
          </div>
        </Card>

        {/* Right: Trend + Peer + Composition (stacked) */}
        <div className="space-y-3">
          {/* 30d Trend */}
          {hasTrend && healthSeries.length > 1 && (
            <Card title="30d Trend">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[20px] font-bold text-white">{healthScore}</span>
                <span className={`text-[11px] font-mono ${healthScore - healthSeries[0] > 0 ? 'text-[#22c55e]' : healthScore - healthSeries[0] < 0 ? 'text-[#ef4444]' : 'text-[#444]'}`}>
                  {healthScore - healthSeries[0] > 0 ? '+' : ''}{healthScore - healthSeries[0]} vs 30d ago
                </span>
              </div>
              <Sparkline values={healthSeries} width={280} height={40} tone={healthScore >= healthSeries[0] ? 'good' : 'bad'} />
            </Card>
          )}

          {/* Peer percentile */}
          <Card title="Peer Percentile">
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-white">{peerPercentile}%</span>
                <span className="text-[10px] text-[#555]">(p{peerPercentile} — {peerPercentile < 20 ? 'bottom quintile' : peerPercentile < 40 ? 'lower half' : peerPercentile < 60 ? 'middle range' : peerPercentile < 80 ? 'upper half' : 'top quintile'})</span>
              </div>
            </div>
            <div className="relative h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="absolute h-full bg-gradient-to-r from-[#ef4444] via-[#f59e0b] to-[#22c55e] rounded-full" style={{ width: '100%' }} />
              <div
                className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg"
                style={{ left: `${Math.min(98, peerPercentile)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-[#333] mt-1">
              <span>p0</span>
              <span>p50</span>
              <span>p100</span>
            </div>
          </Card>

          {/* Score composition (radar) */}
          <Card title="Score Composition">
            <div className="space-y-3">
              <div className="w-full flex justify-center">
                <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="w-full h-auto" style={{ maxWidth: '200px' }}>
                  {/* Grid rings */}
                  {[0.25, 0.5, 0.75, 1].map((s) => (
                    <circle key={s} cx={radarCenter} cy={radarCenter} r={radarRadius * s}
                      fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
                  ))}
                  {/* Axes */}
                  {categories.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
                    return (
                      <line key={i}
                        x1={radarCenter} y1={radarCenter}
                        x2={radarCenter + radarRadius * Math.cos(angle)}
                        y2={radarCenter + radarRadius * Math.sin(angle)}
                        stroke="#1a1a1a" strokeWidth="0.5"
                      />
                    );
                  })}
                  {/* Data shape */}
                  <path d={radarPath} fill="rgba(245,158,11,0.15)" stroke="#F59E0B" strokeWidth="1.5" />
                  {/* Data points */}
                  {radarPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill={categories[i].color} />
                  ))}
                  {/* Labels */}
                  {categories.map((c, i) => {
                    const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
                    const lx = radarCenter + (radarRadius + 16) * Math.cos(angle);
                    const ly = radarCenter + (radarRadius + 16) * Math.sin(angle);
                    return (
                      <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                        className="fill-[#888]" style={{ fontSize: '10px', fontWeight: 500 }}>
                        {c.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
                {categories.map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-[10px] text-[#888] flex-1">{c.label}</span>
                    <span className="text-[10px] font-mono text-[#666]">{c.pct}%</span>
                  </div>
                ))}
              </div>
              {!hasRealScores && (
                <div className="text-[9px] text-[#333] text-center">Estimated breakdown — real scores unavailable</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* What moves this score (full width) */}
      <Card title="What moves this score">
        <div className="space-y-0">
          {upliftItems.length === 0 ? (
            <div className="text-[11px] text-[#444] py-2">No uplift actions available</div>
          ) : (
            upliftItems.map((u: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#111] last:border-b-0">
                <span className="text-[10px] text-[#ccc] flex-1 min-w-0 truncate">{u.label || u.description}</span>
                <span className="text-[10px] font-mono text-[#22c55e] shrink-0">+{u.estimatedImpact}</span>
                <span className="text-[9px] text-[#444] shrink-0">Expected in 60d</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
