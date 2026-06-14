import { CalendarIcon } from 'lucide-react';
import { Card } from '../../ui/Card';
import { CompetitionSection } from './CompetitionSection';

interface MatchListProps {
  matches: any[];
  loading: boolean;
  competitionLabels: Record<string, string>;
  onEditMatch: (match: any) => void;
  onDeleteMatch: (matchId: string) => void;
  canEditDelete?: boolean;
  canSubmitSheet?: boolean;
  onSubmitSheet?: (match: any) => void;
  onMatchClick?: (match: any) => void;
}

export const  MatchList = ({
  matches,
  loading,
  competitionLabels,
  onEditMatch,
  onDeleteMatch,
  canEditDelete = true,
  canSubmitSheet = false,
  onSubmitSheet,
  onMatchClick
}: MatchListProps) => {
  // Group matches by competition
  const groupedMatches = matches.reduce((groups: any, match: any) => {
    const competition = match.competition || 'LIGUE1';
    if (!groups[competition]) {
      groups[competition] = [];
    }
    groups[competition].push(match);
    return groups;
  }, {});

  if (loading) {
    return (
      <Card className="px-6 mt-6 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126]"></div>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="px-6 mt-6 p-12 text-center">
        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-lg">Aucun match prévu pour cette date</p>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {Object.entries(groupedMatches).map(([competition, competitionMatches]: [string, any]) => (
        <CompetitionSection
          key={competition}
          competition={competition}
          matches={competitionMatches}
          competitionLabel={competitionLabels[competition] || competition}
          onEditMatch={onEditMatch}
          onDeleteMatch={onDeleteMatch}
          canEditDelete={canEditDelete}
          canSubmitSheet={canSubmitSheet}
          onSubmitSheet={onSubmitSheet}
          onMatchClick={onMatchClick}
        />
      ))}
    </div>
  );
};