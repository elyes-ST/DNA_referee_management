import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface FormationsFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
}

export const useFormationsData = (
  currentPage: number, 
  itemsPerPage: number,
  filters: FormationsFilters = {}
) => {
  const [convocations, setConvocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchConvocations = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await api.convocations.getAll(params);
      const convocationsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);
      setConvocations(convocationsData);
      setTotalItems(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);
    } catch (err) {
      let errorMessage = "une erreur est survenue lors du chargement des convocations.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
      setConvocations([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters.type, filters.startDate, filters.endDate]);


  useEffect(() => {
    fetchConvocations();
  }, [fetchConvocations]);

  return {
    convocations,
    loading,
    totalPages,
    totalItems,
    refetchConvocations: fetchConvocations
  };
};
