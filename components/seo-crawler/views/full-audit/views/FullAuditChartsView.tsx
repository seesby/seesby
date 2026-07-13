import React from 'react';
import { Donut } from '../../_shared/Donut';
import { BarChart } from '../../_shared/BarChart';
import { Treemap } from '../../_shared/Treemap';
import { useFullAuditCharts } from '../selectors/useFullAuditCharts';
import { STATUS_HEX } from '../../_shared/shared-columns';

const PANEL = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2';

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${PANEL} ${className}`}>
      <div className={LABEL}>{title}</div>
      {children}
    </div>
  );
}

export default function FullAuditChartsView() {
  const c = useFullAuditCharts();
  const hasData = c.statusDonut.some(d => d.value > 0);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Status donut + Depth funnel + Indexability stack */}
      <Panel title="Status Codes" className="col-span-12 lg:col-span-4">
        {hasData ? (
          <Donut
            data={c.statusDonut.map((d, i) => ({ ...d, color: [STATUS_HEX.good, STATUS_HEX.warn, STATUS_HEX.bad, '#7f1d1d'][i] }))}
            label="pages"
          />
        ) : (
          <EmptyChart text="No pages crawled" />
        )}
      </Panel>
      <Panel title="Crawl Depth" className="col-span-12 lg:col-span-4">
        {c.byDepth.some(d => d.pages > 0) ? (
          <BarChart data={c.byDepth} x="depth" y="pages" color="#a78bfa" height={200} />
        ) : (
          <EmptyChart text="No depth data" />
        )}
      </Panel>
      <Panel title="Indexability" className="col-span-12 lg:col-span-4">
        {c.indexabilityStack.some(d => d.count > 0) ? (
          <BarChart data={c.indexabilityStack} x="label" y="count" color="#3b82f6" height={200} />
        ) : (
          <EmptyChart text="No indexability data" />
        )}
      </Panel>

      {/* Row 2: Issue category treemap + Content quality radar + Score histogram */}
      <Panel title="Issues by Category" className="col-span-12 lg:col-span-6">
        {c.issueCategoryTreemap.length > 0 ? (
          <Treemap data={c.issueCategoryTreemap} height={180} />
        ) : (
          <EmptyChart text="No issues found" />
        )}
      </Panel>
      <Panel title="Content Quality" className="col-span-12 lg:col-span-3">
        {c.contentQualityRadar.some(d => d.value > 0) ? (
          <RadarMini data={c.contentQualityRadar} />
        ) : (
          <EmptyChart text="No quality data" />
        )}
      </Panel>
      <Panel title="Score Distribution" className="col-span-12 lg:col-span-3">
        {c.scoreHistogram.some(d => d.count > 0) ? (
          <BarChart data={c.scoreHistogram} x="label" y="count" color="#22c55e" height={180} />
        ) : (
          <EmptyChart text="No scores yet" />
        )}
      </Panel>

      {/* Row 3: Performance heatmap (template × metric) */}
      <Panel title="Performance by Template" className="col-span-12">
        <PerfHeatmap data={c.perfHeatmap} />
      </Panel>

      {/* Row 4: Crawl-over-time (only if multiple sessions) */}
      {c.crawlOverTime.length > 1 && (
        <Panel title="Crawl over Time" className="col-span-12">
          <div className="flex items-center gap-4 text-[10px] text-[var(--brand-text-mid)]] mb-2">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#a78bfa] inline-block" /> Pages</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#ef4444] inline-block" /> Issues</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#22c55e] inline-block" /> Score</span>
          </div>
          <div className="h-24 flex items-end gap-1 relative">
            {c.crawlOverTime.map((s, i) => {
              const pageH = (s.pages / c.maxCrawlPages) * 60;
              const issueH = (s.issues / c.maxCrawlIssues) * 30;
              const scoreH = (s.score / 100) * 60;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group" title={`Session ${i + 1}: ${s.pages} pages, ${s.issues} issues, score ${s.score}`}>
                  <div className="flex gap-px items-end" style={{ height: '64px' }}>
                    <div className="w-1/3 bg-[#a78bfa] rounded-t" style={{ height: `${pageH}px` }} />
                    <div className="w-1/3 bg-[#ef4444] rounded-t" style={{ height: `${issueH}px` }} />
                    <div className="w-1/3 bg-[#22c55e] rounded-t" style={{ height: `${scoreH}px` }} />
                  </div>
                  <span className="text-[9px] text-[var(--brand-text-faint)]]">{i + 1}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

function RadarMini({ data }: { data: { axis: string; value: number }[] }) {
  // Square viewBox — chart + labels fit within it
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50; // chart radius
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;

  const points = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const dist = (d.value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  });

  const labelPositions = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const lx = cx + (r + 18) * Math.cos(angle);
    const ly = cy + (r + 18) * Math.sin(angle);
    const anchor: 'middle' | 'start' | 'end' =
      Math.abs(Math.cos(angle)) < 0.1 ? 'middle' :
      Math.cos(angle) > 0 ? 'start' : 'end';
    const dy = Math.sin(angle) > 0.5 ? 10 : Math.sin(angle) < -0.5 ? -2 : 4;
    return { x: lx, y: ly + dy, anchor, label: d.axis };
  });

  const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-h-[180px]">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(s => (
          <polygon key={s} points={data.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return `${cx + r * s * Math.cos(angle)},${cy + r * s * Math.sin(angle)}`;
          }).join(' ')} fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="0.5" />
        ))}
        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="bg-[var(--brand-surface-3)]" strokeWidth="0.5" />;
        })}
        {/* Data polygon */}
        <polygon points={pathPoints} fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="1.5" />
        {/* Data points + connector lines */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <circle cx={p.x} cy={p.y} r="2.5" fill="#a78bfa" />
            <line x1={p.x} y1={p.y} x2={labelPositions[i].x} y2={labelPositions[i].y - 4} stroke="bg-[var(--brand-surface-4)]" strokeWidth="0.5" strokeDasharray="2,2" />
          </React.Fragment>
        ))}
        {/* Labels */}
        {labelPositions.map((lp, i) => (
          <text key={i} x={lp.x} y={lp.y} textAnchor={lp.anchor} fontSize="9" fill="text-[var(--brand-text-mid)]">{lp.label}</text>
        ))}
      </svg>
    </div>
  );
}

function PerfHeatmap({ data }: { data: { template: string; metrics: { name: string; value: number }[] }[] }) {
  if (!data.length) return <EmptyChart text="No template data" />;
  const maxVal = Math.max(...data.flatMap(d => d.metrics.map(m => m.value)), 1);

  function formatMetric(name: string, value: number): string {
    if (name === 'CLS') return value < 1 ? value.toFixed(3) : value.toFixed(2);
    return Math.round(value).toString();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="text-left text-[var(--brand-text-faint)]] pr-3 py-1">Template</th>
            {data[0]?.metrics.map((m, i, arr) => (
              <th key={m.name} className={`text-center text-[var(--brand-text-faint)]] py-1 ${i === arr.length - 1 ? 'pl-3' : 'px-3'}`}>{m.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.template}>
              <td className="text-[var(--brand-text-mid)]] pr-3 py-1 font-mono">{row.template}</td>
              {row.metrics.map((m, i, arr) => {
                const intensity = m.value / maxVal;
                return (
                  <td key={m.name} className={`text-center py-1 ${i === arr.length - 1 ? 'pl-3' : 'px-3'}`}>
                    <div
                      className="inline-flex items-center justify-center w-14 h-5 rounded text-[10px] font-mono"
                      style={{ background: `rgba(167,139,250,${Math.max(0.1, intensity)})` }}
                      title={`${m.name}: ${formatMetric(m.name, m.value)}`}
                    >
                      {formatMetric(m.name, m.value)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-[180px] text-[11px] text-[var(--brand-text-faint)]]">
      {text}
    </div>
  );
}
