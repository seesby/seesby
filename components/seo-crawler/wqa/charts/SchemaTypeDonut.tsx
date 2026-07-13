import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#F59E0B', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#94a3b8'];

export default function SchemaTypeDonut({ data, size = 120 }: {
    data: Array<{ label: string; value: number }>;
    size?: number;
}) {
    if (!data?.length) return null;
    return (
        <div style={{ width: size, height: size }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="label" innerRadius={size * 0.32} outerRadius={size * 0.48} stroke="none">
                        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
