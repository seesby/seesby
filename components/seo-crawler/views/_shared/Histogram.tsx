// Histogram.tsx — bar chart with bucketed data
import React from 'react';
import { BarChart } from './BarChart';

export function Histogram({
  values, buckets, height = 200, color, label = 'count',
}: {
  values: ReadonlyArray<number>;
  buckets: ReadonlyArray<{ label: string; min: number; max: number }>;
  height?: number;
  color?: string;
  label?: string;
}) {
  const data = buckets.map(b => ({
    label: b.label,
    [label]: values.filter(v => v >= b.min && v < b.max).length,
  }));
  return <BarChart data={data} x="label" y={label} color={color} height={height} />;
}
