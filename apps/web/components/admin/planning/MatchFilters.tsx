import { Card } from '../../ui/Card';

interface MatchFiltersProps {
  activeStatusFilter: string;
  activeCompetitionFilter: string;
  onStatusChange: (status: string) => void;
  onCompetitionChange: (competition: string) => void;
  competitionLabels: Record<string, string>;
}

export const MatchFilters = ({ 
  activeStatusFilter, 
  activeCompetitionFilter, 
  onStatusChange, 
  onCompetitionChange,
  competitionLabels 
}: MatchFiltersProps) => {
  const statusFilters = ["Tous", "Terminés", "À venir", "Suspendus", "Annulés"];
  const competitionFilters = ["Tous", "LIGUE1", "LIGUE2", "COUPE", "AMATEUR_C1", "AMATEUR_C2", "JEUNES", "FEMININE", "REGIONAL"];

  return (
    <Card className="px-6 mt-6 flex justify-between flex-col lg:flex-row gap-4">
      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatusFilter === status
                ? 'bg-[#ce1126] text-white'
                : 'bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-flashscore-border'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Competition Filter Pills */}
      <div className="flex gap-2 flex-wrap"> 
        {competitionFilters.map((comp) => (
          <button
            key={comp}
            onClick={() => onCompetitionChange(comp)}
            className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              activeCompetitionFilter === comp
                ? 'bg-[#ce1126] text-white border-[#ce1126]'
                : 'bg-white dark:bg-flashscore-card text-gray-700 dark:text-gray-300 border-gray-200 dark:border-flashscore-border hover:border-[#ce1126]'
            }`}
          >
            {comp === "Tous" ? comp : competitionLabels[comp] || comp}
          </button>
        ))}
      </div>
    </Card>
  );
};
