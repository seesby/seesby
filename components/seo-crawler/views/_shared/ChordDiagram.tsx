// ChordDiagram.tsx — SVG chord diagram showing overlap between hosts
import React, { useMemo } from 'react';

const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e',
];

function polarToCart(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function ChordDiagram({
  hosts,
  matrix,
  height = 480,
  gap = 0.03,
}: {
  hosts: ReadonlyArray<string>;
  matrix: Record<string, Record<string, number>>;
  height?: number;
  gap?: number;
}) {
  const size = height;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.38;
  const innerR = outerR - 12;

  const { arcs, chords } = useMemo(() => {
    const n = hosts.length;
    if (n === 0) return { arcs: [], chords: [] };

    const totalGap = gap * n;
    const available = Math.PI * 2 - totalGap;
    const maxVal = Math.max(
      ...hosts.flatMap((a) => hosts.map((b) => matrix[a]?.[b] ?? 0)),
      1,
    );

    const rowSums = hosts.map((h) =>
      hosts.reduce((s, h2) => s + (matrix[h]?.[h2] ?? 0), 0),
    );
    const total = Math.max(rowSums.reduce((a, b) => a + b, 0), 1);

    let angle = -Math.PI / 2;
    const arcList = hosts.map((h, i) => {
      const sweep = (rowSums[i] / total) * available;
      const start = angle + gap / 2;
      const end = angle + sweep - gap / 2;
      angle += sweep;
      return { host: h, start, end, color: PALETTE[i % PALETTE.length] };
    });

    const chordList: Array<{
      from: number;
      to: number;
      value: number;
      color: string;
    }> = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const v = (matrix[hosts[i]]?.[hosts[j]] ?? 0) + (matrix[hosts[j]]?.[hosts[i]] ?? 0);
        if (v > 0) {
          chordList.push({ from: i, to: j, value: v, color: arcList[i].color });
        }
      }
    }

    return { arcs: arcList, chords: chordList };
  }, [hosts, matrix, gap]);

  if (hosts.length === 0) {
    return <div className="text-[11px] text-[var(--brand-text-faint)] p-4">No data</div>;
  }

  const maxChordVal = Math.max(...chords.map((c) => c.value), 1);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block mx-auto">
      {/* Arcs */}
      {arcs.map((arc, i) => {
        const r = outerR;
        const ir = innerR;
        const sa = arc.start;
        const ea = arc.end;
        const largeArc = ea - sa > Math.PI ? 1 : 0;
        const outerStart = polarToCart(cx, cy, r, sa);
        const outerEnd = polarToCart(cx, cy, r, ea);
        const innerStart = polarToCart(cx, cy, ir, ea);
        const innerEnd = polarToCart(cx, cy, ir, sa);
        const d = [
          `M${outerStart.x},${outerStart.y}`,
          `A${r},${r},0,${largeArc},1,${outerEnd.x},${outerEnd.y}`,
          `L${innerStart.x},${innerStart.y}`,
          `A${ir},${ir},0,${largeArc},0,${innerEnd.x},${innerEnd.y}`,
          'Z',
        ].join(' ');
        return <path key={i} d={d} fill={arc.color} opacity={0.85} />;
      })}

      {/* Chords */}
      {chords.map((ch, i) => {
        const fromArc = arcs[ch.from];
        const toArc = arcs[ch.to];
        const fromMid = (fromArc.start + fromArc.end) / 2;
        const toMid = (toArc.start + toArc.end) / 2;
        const r = innerR - 2;
        const p1 = polarToCart(cx, cy, r, fromMid);
        const p2 = polarToCart(cx, cy, r, toMid);
        const t = ch.value / maxChordVal;
        return (
          <path
            key={i}
            d={`M${p1.x},${p1.y} Q${cx},${cy} ${p2.x},${p2.y}`}
            stroke={ch.color}
            strokeOpacity={0.3 + t * 0.5}
            strokeWidth={1 + t * 4}
            fill="none"
          />
        );
      })}

      {/* Labels */}
      {arcs.map((arc, i) => {
        const mid = (arc.start + arc.end) / 2;
        const labelR = outerR + 14;
        const p = polarToCart(cx, cy, labelR, mid);
        const rotate = (mid * 180) / Math.PI;
        const flip = mid > Math.PI / 2 && mid < (Math.PI * 3) / 2;
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={flip ? 'end' : 'start'}
            dominantBaseline="central"
            transform={`rotate(${flip ? rotate + 180 : rotate}, ${p.x}, ${p.y})`}
            className="fill-[var(--brand-text-mid)] text-[9px]"
          >
            {arc.host}
          </text>
        );
      })}
    </svg>
  );
}
