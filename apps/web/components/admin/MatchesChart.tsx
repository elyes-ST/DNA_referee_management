'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

interface MatchesChartProps {
  data: any[];
  groupBy: 'journee' | 'month';
  loading?: boolean;
}

export const MatchesChart: React.FC<MatchesChartProps> = ({ data, groupBy, loading }) => {
  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Matchs par {groupBy === 'journee' ? 'Journée' : 'Mois'}</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 dark:text-flashscore-muted">Chargement...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Matchs par {groupBy === 'journee' ? 'Journée' : 'Mois'}</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-gray-400 dark:text-flashscore-muted">Aucune donnée disponible</div>
        </div>
      </Card>
    );
  }

  const chartData = data.map(item => {
    let label = '';
    if (groupBy === 'journee') {
      label = `J${item._id}`;
    } else if (typeof item._id === 'object' && item._id.month) {
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    }

    return {
      name: label,
      Total: item.total || 0,
      Complétés: item.completed || 0,
      'À venir': item.upcoming || 0,
    };
  });

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">
        Matchs par {groupBy === 'journee' ? 'Journée' : 'Mois'}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Total" fill="#3b82f6" />
          <Bar dataKey="Complétés" fill="#10b981" />
          <Bar dataKey="À venir" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
