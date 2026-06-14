import { CalendarIcon, FileText, Plus } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface PlanningHeaderProps {
  onImport: () => void;
  onAddMatch: () => void;
  onGoToToday: () => void;
  onShowAll?: () => void;
  canImport?: boolean;
  canAddMatch?: boolean;
}

export const PlanningHeader = ({ onImport, onAddMatch, onGoToToday, onShowAll, canImport = true, canAddMatch = true }: PlanningHeaderProps) => {
  return (

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-flashscore-border pb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#ce1126]" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-flashscore-text">Calendrier des matchs</h2>
        </div>
        <div className="flex flex-col sm:flex-wrap sm:flex-row gap-2 w-full lg:w-auto">
          {canImport && (
            <Button variant="secondary" onClick={onImport} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <FileText className="w-4 h-4" />
              <span className="whitespace-nowrap">Importer CSV</span>
            </Button>
          )}
          {canAddMatch && (
            <Button variant="primary" onClick={onAddMatch} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">Ajouter un match</span>
            </Button>
          )}
          <Button variant="secondary" onClick={onGoToToday} className="w-full sm:w-auto">
            Aujourd'hui
          </Button>
          {onShowAll && (
            <Button variant="secondary" onClick={onShowAll} className="w-full sm:w-auto">
              Toutes les dates
            </Button>
          )}
        </div>
      </div>
  );
};
