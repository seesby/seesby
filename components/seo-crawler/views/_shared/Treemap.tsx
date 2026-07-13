// Treemap.tsx — recharts Treemap
import React from 'react';
import { ResponsiveContainer, Treemap as RT, Tooltip } from 'recharts';
import { CHART_PALETTE } from './tokens';

export function Treemap({
  data, height = 260,
}: {
  data: ReadonlyArray<{ name: string; size: number; color?: string }>;
  height?: number;
}) {
  const colored = data.map((d, i) => ({ ...d, color: d.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RT data={colored as any} dataKey="size" stroke="#0a0a0a" content={<TreemapNode />}>
        <Tooltip contentStyle={ { background: '#0c0c0c', border: '1px solid #1a1a1a', fontSize: 11 } } />
      </RT>
    </ResponsiveContainer>
  );
}

function TreemapNode(props: any) {
  const { x, y, width, height, name, color, size } = props;
  if (width < 2 || height < 2) return null;

  // Truncate text to fit within block width
  const maxChars = Math.max(0, Math.floor((width - 12) / 6)); // ~6px per char at fontSize 10
  const displayName = name.length > maxChars ? name.slice(0, Math.max(0, maxChars - 1)) + '\u2026' : name;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} stroke="#0a0a0a" />
      {width > 40 && height > 18 && displayName && (
        <text x={x + 4} y={y + 13} fill="#fff" fontSize={9} fontWeight={500}>{displayName}</text>
      )}
      {width > 40 && height > 32 && (
        <text x={x + 4} y={y + 25} fill="#fff" fontSize={9} opacity={0.7}>{size}</text>
      )}
    </g>
  );
}
