'use client';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { API_ROUTES } from '../services/apiRoutes';

export interface DashboardStats {
  overview: {
    totalMatches: number;
    matchesThisSeason: number;
    matchesThisMonth: number;
    matchesToday: number;
    upcomingMatches: number;
  };
  referees: {
    totalActive: number;
    byCategory: Record<string, number>;
    recentlyUpdated: number;
  };
  designations: {
    pending: number;
    validated: number;
    total: number;
    completionRate: number;
  };
  convocations: {
    upcoming: number;
    thisMonth: number;
  };
  inspectorReports: {
    pending: number;
    submitted: number;
    reviewed: number;
  };
  payments: {
    pendingValidation: number;
    validatedThisMonth: number;
    totalAmountThisMonth: number;
  };
  recentActivity: {
    latestMatches: any[];
    latestDesignations: any[];
    latestReports: any[];
  };
}

export interface DashboardFilters {
  saison?: string;
  journee?: number;
  month?: number;
  year?: number;
  region?: string;
  league?: string;
}

export interface MatchChartData {
  _id: number | { year: number; month: number };
  total: number;
  completed: number;
  upcoming?: number;
}

export interface RefereePerformanceData {
  _id: { year: number; month: number };
  averageScore: number;
  totalReports: number;
}

export const useDashboardData = (filters?: DashboardFilters) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (filters?.saison) params.append('saison', filters.saison);
        if (filters?.journee) params.append('journee', filters.journee.toString());
        if (filters?.month) params.append('month', filters.month.toString());
        if (filters?.year) params.append('year', filters.year.toString());
        if (filters?.region) params.append('region', filters.region);
        if (filters?.league) params.append('league', filters.league);

        const response = await api.get(
          `${API_ROUTES.DASHBOARD.GET_STATS}${params.toString() ? '?' + params.toString() : ''}`
        );
        
        setStats(response.data as any);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters?.saison, filters?.journee, filters?.month, filters?.year, filters?.region, filters?.league]);

  return { stats, loading, error };
};

export const useMatchesChart = (groupBy: 'journee' | 'month' = 'journee', filters?: DashboardFilters) => {
  const [data, setData] = useState<MatchChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        params.append('groupBy', groupBy);
        if (filters?.saison) params.append('saison', filters.saison);
        if (filters?.league) params.append('league', filters.league);

        const response = await api.get(
          `${API_ROUTES.DASHBOARD.GET_MATCHES_CHART}?${params.toString()}`
        );
        
        setData(response.data as any[]);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch matches chart data');
        console.error('Matches chart error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [groupBy, filters?.saison, filters?.league]);

  return { data, loading, error };
};

export const useRefereePerformanceChart = (filters?: DashboardFilters) => {
  const [data, setData] = useState<RefereePerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (filters?.saison) params.append('saison', filters.saison);

        const response = await api.get(
          `${API_ROUTES.DASHBOARD.GET_REFEREE_PERFORMANCE_CHART}${params.toString() ? '?' + params.toString() : ''}`
        );
        
        setData(response.data as RefereePerformanceData[]);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch referee performance data');
        console.error('Referee performance error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [filters?.saison]);

  return { data, loading, error };
};
