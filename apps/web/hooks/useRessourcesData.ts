import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface RessourcesFilters {
  type?: string;
  category?: string;
  targetAudience?: string;
  search?: string;
}

export const useRessourcesData = (
  currentPage: number, 
  itemsPerPage: number,
  filters: RessourcesFilters = {}
) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.targetAudience) params.targetAudience = filters.targetAudience;
      if (filters.search) params.search = filters.search;
      
      const response = await api.trainingResources.getAll(params);
      setResources(response.data.data);
      setTotalItems(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors de la récupération des ressources.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters.type, filters.category, filters.targetAudience, filters.search]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    totalPages,
    totalItems,
    refetchResources: fetchResources
  };
};
