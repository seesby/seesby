import React, { useMemo, useState } from 'react';
import { formatCompact } from '../wqaUtils';

interface DataPoint {
  label: string;
  value1: number;
  value2?: number;
}

interface Props {
  data: DataPoint[];
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function AreaTrendChart({
  data,
  label1 = 'Series 1',
  label2,
  color1 = '#F59E0B',
  color2 = '#F59E0B',
  height = 140,
  formatValue = (v) => v.toLocaleString(),
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 320;
  const pad = { top: 10, right: 10, bottom: 28, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { maxVal, points1, points2, areaPath1, areaPath2, linePath1, linePath2 } = useMemo(() => {
    if (data.length === 0) {
      return { maxVal: 0, points1: [], points2: [], areaPath1: '', areaPath2: '', linePath1: '', linePath2: '' };
    }

    const allVals = data.flatMap((d) => [d.value1, d.value2 || 0]);
    const mv = Math.max(...allVals, 1) * 1.1;

    const scaleX = (i: number) => pad.left + (i / Math.max(1, data.length - 1)) * plotW;
    const scaleY = (v: number) => pad.top + plotH - (v / mv) * plotH;

    const p1 = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.value1) }));
    const p2 = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.value2 || 0) }));

    const baseLine = pad.top + plotH;
    const toLine = (pts: typeof p1) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const toArea = (pts: typeof p1) => {
      if (pts.length === 0) return '';
      return `M${pts[0].x},${baseLine} ${pts.map((p) => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${baseLine} Z`;
    };

    return {
      maxVal: mv,
      points1: p1,
      points2: p2,
      areaPath1: toArea(p1),
      areaPath2: label2 ? toArea(p2) : '',
      linePath1: toLine(p1),
      linePath2: label2 ? toLine(p2) : '',
    };
  }, [data, label2, plotH, plotW]);

  if (data.length === 0) return null;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: Math.round(maxVal * pct),
    y: pad.top + plotH - pct * plotH,
  }));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {yTicks.map((tick) => (
          <g key={tick.value}>
            <line x1={pad.left} y1={tick.y} x2={width - pad.right} y2={tick.y} stroke="bg-[var(--brand-surface-3)]" strokeWidth={1} />
            <text x={pad.left - 4} y={tick.y + 3} fill="text-[var(--brand-text-faint)]" fontSize={8} textAnchor="end">
              {formatCompact(tick.value)}
            </text>
          </g>
        ))}

        <path d={areaPath1} fill={color1} opacity={0.12} />
        {areaPath2 && <path d={areaPath2} fill={color2} opacity={0.12} />}

        <path d={linePath1} fill="none" stroke={color1} strokeWidth={1.5} />
        {linePath2 && <path d={linePath2} fill="none" stroke={color2} strokeWidth={1.5} />}

        {points1.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 4 : 2.5}
            fill={color1}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="transition-all cursor-pointer"
          />
        ))}

        {label2 && points2.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 4 : 2.5}
            fill={color2}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="transition-all cursor-pointer"
          />
        ))}

        {data.map((d, i) => (
          <text
            key={d.label}
            x={pad.left + (i / Math.max(1, data.length - 1)) * plotW}
            y={height - 4}
            fill="text-[var(--brand-text-faint)]"
            fontSize={8}
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}
      </svg>

      <div className="flex items-center gap-4 mt-1 px-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-[2px] rounded" style={{ backgroundColor: color1 }} />
          <span className="text-[9px] text-[var(--brand-text-mid)]]">{label1}</span>
        </div>
        {label2 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-[2px] rounded" style={{ backgroundColor: color2 }} />
            <span className="text-[9px] text-[var(--brand-text-mid)]]">{label2}</span>
          </div>
        )}
      </div>
      {hoveredIdx !== null && (
        <div 
          className="absolute z-50 bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]] rounded-lg p-2.5 shadow-xl pointer-events-none"
          style={{
            left: Math.min(width - 100, Math.max(0, points1[hoveredIdx].x - 60)),
            bottom: height - points1[hoveredIdx].y + 20
          }}
        >
          <div className="text-[10px] font-bold text-[var(--brand-text-strong)] mb-1 border-b border-[var(--brand-border-2)]] pb-0.5">{data[hoveredIdx].label}</div>
          <div className="space-y-0.5">
            <div className="flex justify-between gap-4 text-[9px]">
              <span className="text-[var(--brand-text-mid)]]">{label1}</span>
              <span className="font-mono font-bold text-[var(--brand-text-strong)]">{formatValue(data[hoveredIdx].value1)}</span>
            </div>
            {label2 && (
              <div className="flex justify-between gap-4 text-[9px]">
                <span className="text-[var(--brand-text-mid)]]">{label2}</span>
                <span className="font-mono font-bold text-[#F59E0B]">{formatValue(data[hoveredIdx].value2 || 0)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
