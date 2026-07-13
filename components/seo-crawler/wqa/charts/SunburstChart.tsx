import React, { useState } from 'react';

interface Segment { label: string; value: number; color?: string; }
interface Props { data: Segment[]; size?: number; }

export default function SunburstChart({ data, size = 180 }: Props) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return null;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 6;
    let angle = -Math.PI / 2;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {data.map((d, i) => {
                const slice = (d.value / total) * (2 * Math.PI);
                const start = angle;
                angle += slice;
                const end = angle;
                const largeArc = slice > Math.PI ? 1 : 0;
                const x1 = cx + radius * Math.cos(start);
                const y1 = cy + radius * Math.sin(start);
                const x2 = cx + radius * Math.cos(end);
                const y2 = cy + radius * Math.sin(end);
                const path = `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
                
                const isHovered = hoveredIndex === i;
                const fillColor = d.color || ['#3b82f6','#22c55e','#f59e0b','#ef4444'][i % 4];

                return (
                    <path
                        key={i}
                        d={path}
                        fill={fillColor}
                        style={{
                            opacity: hoveredIndex === null || isHovered ? 1 : 0.6,
                            transition: 'opacity 0.2s, transform 0.2s',
                            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                            transformOrigin: `${cx}px ${cy}px`,
                            cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <title>{`${d.label}: ${d.value.toLocaleString()}`}</title>
                    </path>
                );
            })}
            <circle cx={cx} cy={cy} r={radius * 0.45} fill="bg-[var(--brand-surface-0)]" />
            {hoveredIndex !== null && (
                <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="text-[var(--brand-text-strong)]"
                    className="text-[10px] font-bold pointer-events-none"
                >
                    {Math.round((data[hoveredIndex].value / total) * 100)}%
                </text>
            )}
        </svg>
    );
}
