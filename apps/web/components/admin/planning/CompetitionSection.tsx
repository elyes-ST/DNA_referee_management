import { Trophy } from 'lucide-react';
import { Card } from '../../ui/Card';
import { MatchCard } from './MatchCard';

interface CompetitionSectionProps {
  competition: string;
  matches: any[];
  competitionLabel: string;
  onEditMatch: (match: any) => void;
  onDeleteMatch: (matchId: string) => void;
  canEditDelete?: boolean;
  canSubmitSheet?: boolean;
  onSubmitSheet?: (match: any) => void;
  onMatchClick?: (match: any) => void;
}

export const CompetitionSection = ({
  competition,
  matches,
  competitionLabel,
  onEditMatch,
  onDeleteMatch,
  canEditDelete = true,
  canSubmitSheet = false,
  onSubmitSheet,
  onMatchClick
}: CompetitionSectionProps) => {
  const liveCount = matches.filter((m: any) => m.status === 'LIVE').length;

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-flashscore-border shadow-sm !p-0 mb-6">
      {/* Competition Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-flashscore-border flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-4 h-4 text-[#ce1126]" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 dark:text-flashscore-muted font-semibold uppercase tracking-wider">Tunisie</div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-flashscore-text leading-tight">
              {competitionLabel}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <span className="text-[10px] font-bold text-[#ce1126] bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
              {liveCount} en direct
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-flashscore-muted font-medium">{matches.length} matchs</span>
        </div>
      </div>

      {/* Matches List */}
      <div className="divide-y divide-gray-100">
        {matches.map((match: any) => (
          <MatchCard
            key={match._id}
            match={match}
            onEdit={onEditMatch}
            onDelete={onDeleteMatch}
            canEditDelete={canEditDelete}
            canSubmitSheet={canSubmitSheet}
            onSubmitSheet={onSubmitSheet}
            onMatchClick={onMatchClick}
          />
        ))}
      </div>
    </Card>
  );
};