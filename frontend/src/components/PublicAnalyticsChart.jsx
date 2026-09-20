import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const PublicAnalyticsChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
          <XAxis dataKey="name_en" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 12, fill: '#475569' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
          <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '8px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
