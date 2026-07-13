import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarPoint {
  axis: string;
  value: number;
}

interface Props {
  data: RadarPoint[];
  size?: number;
}

export default function RadarChart({ data, size = 220 }: Props) {
  const height = Math.max(180, size);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
          <PolarGrid stroke="#222" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#888', fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="#F59E0B"
            fill="#F59E0B"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ r: 3, fill: '#F59E0B' }}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#141414', 
              border: '1px solid #222', 
              borderRadius: '8px', 
              fontSize: '11px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
              padding: '6px 10px'
            }}
            labelStyle={{ color: 'white', fontWeight: 'bold', marginBottom: '2px' }}
            itemStyle={{ color: '#F59E0B', fontSize: '10px', textTransform: 'uppercase' }}
            formatter={(value) => [String(value), 'Score']}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
