import { Filter, X } from 'lucide-react';
import { EVENT_TYPE_OPTIONS } from './constants';

interface FormationsFiltersProps {
  filters: {
    type?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const FormationsFilters = ({ filters, onFilterChange, onClearFilters }: FormationsFiltersProps) => {
  const hasActiveFilters = filters.type || filters.startDate || filters.endDate;

  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-flashscore-card border border-gray-200 dark:border-flashscore-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#ce1126] to-[#a00e1e] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white" />
            <span className="font-semibold text-sm text-white">Filtres de recherche</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Type d'événement</label>
              <select
                value={filters.type || ''}
                onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-flashscore-hover border-2 border-gray-200 dark:border-flashscore-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card transition-all"
              >
                <option value="">Tous les types</option>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date de début</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-flashscore-hover border-2 border-gray-200 dark:border-flashscore-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date de fin</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-flashscore-hover border-2 border-gray-200 dark:border-flashscore-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
