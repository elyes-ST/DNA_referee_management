'use client';
import React from 'react';
import { PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '../ui/Card';

interface RefereeCategoryChartProps {
  byCategory: Record<string, number>;
  loading?: boolean;
}

const COLORS = ['#ce1126', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const RefereeCategoryChart: React.FC<RefereeCategoryChartProps> = ({ byCategory, loading }) => {
  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Arbitres par Catégorie</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 dark:text-flashscore-muted">Chargement...</div>
        </div>
      </Card>
    );
  }

  if (!byCategory || Object.keys(byCategory).length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Arbitres par Catégorie</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-gray-400 dark:text-flashscore-muted">Aucune donnée disponible</div>
        </div>
      </Card>
    );
  }

  const chartData = Object.entries(byCategory).map(([category, count], index) => ({
    name: category,
    value: count,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Arbitres par Catégorie</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            dataKey="value"
          />
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
