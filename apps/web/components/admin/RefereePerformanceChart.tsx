'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

interface RefereePerformanceChartProps {
  data: any[];
  loading?: boolean;
}

export const RefereePerformanceChart: React.FC<RefereePerformanceChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Performance des Arbitres</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 dark:text-flashscore-muted">Chargement...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Performance des Arbitres</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-gray-400 dark:text-flashscore-muted">Aucune donnée disponible</div>
        </div>
      </Card>
    );
  }

  const chartData = data.map(item => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;

    return {
      name: label,
      'Note Moyenne': item.averageScore ? parseFloat(item.averageScore.toFixed(2)) : 0,
      'Nombre de Rapports': item.totalReports || 0,
    };
  });

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Performance des Arbitres (Évolution)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" domain={[0, 20]} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="Note Moyenne" 
            stroke="#ce1126" 
            strokeWidth={2}
            dot={{ fill: '#ce1126', r: 4 }}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="Nombre de Rapports" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
