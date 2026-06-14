'use client';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { API_ROUTES } from '../services/apiRoutes';

export interface Payment {
  _id: string;
  refereeId: {
    _id: string;
    matricule: string;
    userId:{
      firstName: string;
      lastName: string;
    };
    category: string;
  };
  startDate: string;
  endDate: string;
  label?: string;
  matchIds: string[];
  totalMatches: number;
  baseAmount: number;
  bonuses: number;
  deductions: number;
  totalAmount: number;
  status: 'PENDING' | 'VALIDATED' | 'PAID' | 'REJECTED';
  validatedBy?: any;
  validatedAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  region: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  month?: string;
  saison?: string;
  region?: string;
  refereeId?: string;
}

export interface PaymentStatistics {
  overview:{totalPayments: number;
  totalAmount: number;
  avgAmount: number;}
  byStatus: {_id: string; count: number; totalAmount: number }[];
  byCategory:{_id: string; count: number; totalAmount: number }[];
  byRegion: {_id: string; count: number; totalAmount: number }[];
}

export const usePayments = (filters?: PaymentFilters) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(filters?.page || 1);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.saison) params.append('saison', filters.saison);
      if (filters?.region) params.append('region', filters.region);
      if (filters?.refereeId) params.append('refereeId', filters.refereeId);

      const response = await api.get(
        `${API_ROUTES.PAYMENTS.GET_ALL}${params.toString() ? '?' + params.toString() : ''}`
      );
      
      const data: any = response.data;
      setPayments(data.payments || data);
      setTotal(data.total || data.length);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
      console.error('Payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filters?.page, filters?.limit, filters?.status, filters?.category, filters?.month, filters?.saison, filters?.region, filters?.refereeId]);

  return { payments, loading, error, total, currentPage, refetch: fetchPayments };
};

export const usePaymentStatistics = (filters?: { startDate?: string; endDate?: string }) => {
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no filters provided, skip entirely (caller doesn't have permission)
    if (!filters) {
      setLoading(false);
      return;
    }
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await api.get(
          `${API_ROUTES.PAYMENTS.GET_STATISTICS}${params.toString() ? '?' + params.toString() : ''}`
        );
        
        setStatistics(response.data as PaymentStatistics);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch statistics');
        console.error('Payment statistics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [filters?.startDate, filters?.endDate, !!filters]);

  return { statistics, loading, error };
};


