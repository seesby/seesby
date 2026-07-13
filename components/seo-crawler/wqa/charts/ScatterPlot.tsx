import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { getExpectedCtr } from '../../../../services/ExpectedCtrCurve';

interface Point {
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
}

interface Props {
  data: Point[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  showExpectedCurve?: boolean;
}

export default function ScatterPlot({
  data,
  xLabel = 'Position',
  yLabel = 'CTR %',
  height = 180,
  showExpectedCurve = true,
}: Props) {
  const grouped = useMemo(() => {
    const groups = new Map<string, Point[]>();
    data.forEach((d) => {
      if (!groups.has(d.color)) groups.set(d.color, []);
      groups.get(d.color)!.push(d);
    });
    return Array.from(groups.entries());
  }, [data]);

  const curvePoints = useMemo(
    () =>
      showExpectedCurve
        ? [1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 80, 100].map((pos) => ({
            x: pos,
            y: getExpectedCtr(pos) * 100,
            size: 0,
            color: '#444',
            label: `Expected @${pos}`,
          }))
        : [],
    [showExpectedCurve]
  );

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            domain={[1, 100]}
            tick={{ fill: '#666', fontSize: 9 }}
            axisLine={{ stroke: '#222' }}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tick={{ fill: '#666', fontSize: 9 }}
            axisLine={{ stroke: '#222' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#141414', 
              border: '1px solid #222', 
              borderRadius: '8px', 
              fontSize: '11px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
              padding: '8px 12px'
            }}
            itemStyle={{ color: '#F59E0B', padding: '0', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
            labelStyle={{ color: 'white', fontWeight: '800', marginBottom: '4px', fontSize: '11px' }}
            formatter={(value: number, name: string) => {
              return [
                name === 'x' ? `Pos ${Math.round(value)}` : `${Number(value).toFixed(1)}%`,
                name === 'x' ? 'Position' : 'CTR'
              ];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.label;
              }
              return label;
            }}
          />
          {grouped.map(([color, points]) => (
            <Scatter key={color} data={points} fill={color} opacity={0.75} />
          ))}
          {curvePoints.length > 0 && (
            <Scatter data={curvePoints} fill="#444" line={{ stroke: '#333', strokeDasharray: '4 4' }} shape={() => null} />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
