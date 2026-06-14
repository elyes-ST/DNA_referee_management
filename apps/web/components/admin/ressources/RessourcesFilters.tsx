import { Filter, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CATEGORY_OPTIONS, RESOURCE_TYPE_OPTIONS ,REFEREE_CATEGORY_OPTIONS} from './constants';
import { useDebounce } from '../../../hooks/useDebounce';

interface RessourcesFiltersProps {
  filters: {
    type?: string;
    category?: string;
    targetAudience?: string;
    search?: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const RessourcesFilters = ({ filters, onFilterChange, onClearFilters }: RessourcesFiltersProps) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Debounced search: applies the search input 500ms after the user stops
  // typing. No Enter submission needed. The guard avoids re-emitting a filter
  // change (and refetch) when the value is unchanged — including when the input
  // is synced back from `filters.search` (e.g. on clear).
  const debouncedSearch = useDebounce(searchInput, 500);
  useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  const hasActiveFilters = filters.type || filters.category || filters.targetAudience || filters.search;

  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-flashscore-card border border-gray-200 dark:border-flashscore-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#ce1126] to-[#a00e1e] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white" />
            <span className="font-semibold text-sm text-white">Filtres & Recherche</span>
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-white dark:bg-flashscore-card/20 text-white text-xs rounded-full">
                Actifs
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-white hover:text-gray-200 flex items-center gap-1.5 transition-colors bg-white dark:bg-flashscore-card/10 hover:bg-white dark:bg-flashscore-card/20 px-3 py-1.5 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          )}
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-flashscore-muted" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher par titre ou description..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-flashscore-hover border-2 border-gray-200 dark:border-flashscore-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Type de ressource</label>
              <select
                value={filters.type || ''}
                onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-flashscore-hover border-2 border-gray-200 dark:border-flashscore-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card transition-all"
              >
                <option value="">Tous les types</option>
                {RESOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Catégorie</label>
              <select
                value={filters.category || ''}
                onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-flashscore-hover border-2 border-gray-200 dark:border-flashscore-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card transition-all"
              >
                <option value="">Toutes les catégories</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Catégorie d'arbitre ciblée</label>
              <select
                value={filters.targetAudience || ''}
                onChange={(e) => onFilterChange({ ...filters, targetAudience: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-flashscore-hover border-2 border-gray-200 dark:border-flashscore-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card transition-all"
              >
                <option value="">Tous les Categorie</option>
                {REFEREE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
