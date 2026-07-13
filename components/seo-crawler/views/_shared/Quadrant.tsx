// Quadrant.tsx — scatter plot with 4 labeled quadrants
import React, { useMemo } from 'react';

type Point = { id: string; x: number; y: number; label: string; color?: string };

export function Quadrant({
  xLabel,
  yLabel,
  points,
  quadrants,
  height = 260,
}: {
  xLabel: string;
  yLabel: string;
  points: ReadonlyArray<Point>;
  quadrants: [string, string, string, string];
  height?: number;
}) {
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const w = 500;
  const plotW = w - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { xMin, xMax, yMin, yMax, xMid, yMid } = useMemo(() => {
    if (!points.length) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1, xMid: 0.5, yMid: 0.5 };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xLo = Math.min(...xs);
    const xHi = Math.max(...xs);
    const yLo = Math.min(...ys);
    const yHi = Math.max(...ys);
    const xPad = (xHi - xLo) * 0.05 || 1;
    const yPad = (yHi - yLo) * 0.05 || 1;
    return {
      xMin: xLo - xPad, xMax: xHi + xPad,
      yMin: yLo - yPad, yMax: yHi + yPad,
      xMid: (xLo + xHi) / 2, yMid: (yLo + yHi) / 2,
    };
  }, [points]);

  const tx = (v: number) => pad.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const ty = (v: number) => pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const mx = tx(xMid);
  const my = ty(yMid);

  const QLABEL: Array<{ text: string; x: number; y: number; anchor: string }> = [
    { text: quadrants[0], x: (pad.left + mx) / 2, y: pad.top + 10, anchor: 'middle' },
    { text: quadrants[1], x: (mx + pad.left + plotW) / 2, y: pad.top + 10, anchor: 'middle' },
    { text: quadrants[2], x: (pad.left + mx) / 2, y: pad.top + plotH - 4, anchor: 'middle' },
    { text: quadrants[3], x: (mx + pad.left + plotW) / 2, y: pad.top + plotH - 4, anchor: 'middle' },
  ];

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} className="block" preserveAspectRatio="xMidYMid meet">
      {/* Quadrant backgrounds */}
      <rect x={pad.left} y={pad.top} width={mx - pad.left} height={my - pad.top} fill="#22c55e08" rx={2} />
      <rect x={mx} y={pad.top} width={pad.left + plotW - mx} height={my - pad.top} fill="#f59e0b08" rx={2} />
      <rect x={pad.left} y={my} width={mx - pad.left} height={pad.top + plotH - my} fill="#f59e0b08" rx={2} />
      <rect x={mx} y={my} width={pad.left + plotW - mx} height={pad.top + plotH - my} fill="#ef444408" rx={2} />

      {/* Crosshairs */}
      <line x1={mx} y1={pad.top} x2={mx} y2={pad.top + plotH} stroke="bg-[var(--brand-surface-4)]" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={pad.left} y1={my} x2={pad.left + plotW} y2={my} stroke="bg-[var(--brand-surface-4)]" strokeWidth={1} strokeDasharray="3 3" />

      {/* Quadrant labels */}
      {QLABEL.map((q, i) => (
        <text key={i} x={q.x} y={q.y} textAnchor={q.anchor as any} className="fill-[var(--brand-text-faint)] text-[9px] uppercase tracking-wider">
          {q.text}
        </text>
      ))}

      {/* Axis labels */}
      <text x={w / 2} y={height - 4} textAnchor="middle" className="fill-[var(--brand-text-faint)] text-[10px]">{xLabel}</text>
      <text x={8} y={height / 2} textAnchor="middle" transform={`rotate(-90, 8, ${height / 2})`} className="fill-[var(--brand-text-faint)] text-[10px]">{yLabel}</text>

      {/* Points */}
      {points.map((p) => {
        const px = tx(p.x);
        const py = ty(p.y);
        return (
          <circle key={p.id} cx={px} cy={py} r={4} fill={p.color ?? 'text-[var(--brand-text-mid)]'} opacity={0.85} className="hover:opacity-100 transition-opacity">
            <title>{p.label}: {xLabel}={p.x}, {yLabel}={p.y}</title>
          </circle>
        );
      })}
    </svg>
  );
}
