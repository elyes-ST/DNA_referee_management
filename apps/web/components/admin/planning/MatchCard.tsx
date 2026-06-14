import { Shield, FileText, ChevronRight } from 'lucide-react';
import { TableActions } from '../../ui/TableActions';
import Image from 'next/image';

interface MatchCardProps {
  match: any;
  onEdit: (match: any) => void;
  onDelete: (matchId: string) => void;
  canEditDelete?: boolean;
  canSubmitSheet?: boolean;
  onSubmitSheet?: (match: any) => void;
  onMatchClick?: (match: any) => void;
}

export const renderTeamLogo = (team: any) => {
  if (team?.logo) {
    return (
      <Image
        src={team.logo}
        alt={team.name}
        width={22}
        height={22}
        className="object-contain rounded-full flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-[22px] h-[22px] flex items-center justify-center bg-gray-100 dark:bg-flashscore-border rounded-full flex-shrink-0">
      <Shield className="w-3.5 h-3.5 text-gray-400 dark:text-flashscore-muted" />
    </div>
  );
};

export const MatchCard = ({ match, onEdit, onDelete, canEditDelete = true, canSubmitSheet = false, onSubmitSheet, onMatchClick }: MatchCardProps) => {
  const matchDate = match.date
    ? new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '';

  const homeScore = match.homeScore ?? match.score?.homeScore;
  const awayScore = match.awayScore ?? match.score?.awayScore;
  const hasScore = homeScore !== null && homeScore !== undefined
    && awayScore !== null && awayScore !== undefined;

  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isPostponed = match.status === 'POSTPONED';
  const isCancelled = match.status === 'CANCELLED';

  return (
    <div
      className="group relative flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:bg-flashscore-hover transition-colors cursor-pointer border-l-[3px]"
      style={{ borderLeftColor: isLive ? '#ce1126' : 'transparent' }}
      onClick={() => onMatchClick?.(match)}
    >
      {/* Left: Status / time */}
      <div className="w-12 flex-shrink-0 flex flex-col items-center justify-center gap-0.5">
        {isLive ? (
          <>
            <span className="text-[10px] font-bold text-[#ce1126] bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wide animate-pulse">
              Live
            </span>
            <span className="text-[11px] text-gray-400 dark:text-flashscore-muted font-medium">{match.minute ? `${match.minute}'` : ''}</span>
          </>
        ) : isCompleted ? (
          <span className="text-xs font-semibold text-gray-400 dark:text-flashscore-muted uppercase">FT</span>
        ) : isPostponed ? (
          <span className="text-[11px] font-semibold text-yellow-600 text-center leading-tight">Suspendu</span>
        ) : isCancelled ? (
          <span className="text-[11px] font-semibold text-red-600 text-center leading-tight">Annulé</span>
        ) : (
          <>
            <span className="text-sm font-semibold text-gray-800 dark:text-flashscore-text">{match.time}</span>
            {matchDate && (
              <span className="text-[10px] text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">{matchDate}</span>
            )}
          </>
        )}
      </div>

      {/* Middle: Teams */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {renderTeamLogo(match.homeTeam)}
            <span className={`text-sm truncate ${isLive || isCompleted ? 'font-medium text-gray-900 dark:text-flashscore-text' : 'font-normal text-gray-700 dark:text-gray-300'}`}>
              {match.homeTeam?.name || match.homeTeam}
            </span>
          </div>
          {hasScore && (
            <span className={`text-sm font-semibold ${isLive ? 'text-[#ce1126]' : 'text-gray-900 dark:text-flashscore-text'} tabular-nums`}>
              {homeScore}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {renderTeamLogo(match.awayTeam)}
            <span className={`text-sm truncate ${isLive || isCompleted ? 'font-medium text-gray-900 dark:text-flashscore-text' : 'font-normal text-gray-700 dark:text-gray-300'}`}>
              {match.awayTeam?.name || match.awayTeam}
            </span>
          </div>
          {hasScore && (
            <span className={`text-sm font-semibold ${isLive ? 'text-[#ce1126]' : 'text-gray-900 dark:text-flashscore-text'} tabular-nums`}>
              {awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Right: meta on hover + actions */}
      <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="hidden md:flex flex-col items-end text-right opacity-0 group-hover:opacity-100 transition-opacity">
          {match.journee !== undefined && (
            <span className="text-[10px] font-medium text-gray-400 dark:text-flashscore-muted bg-gray-100 dark:bg-flashscore-border px-1.5 py-0.5 rounded uppercase mb-0.5">
              J{match.journee}
            </span>
          )}
          {match.stadium && (
            <span className="text-[11px] text-gray-400 dark:text-flashscore-muted truncate max-w-[120px]">{match.stadium}</span>
          )}
        </div>

        {canEditDelete && (
          <TableActions onEdit={() => onEdit(match)} onDelete={() => onDelete(match._id)} />
        )}

        {canSubmitSheet && match.status !== 'COMPLETED' && (
          <button
            onClick={() => onSubmitSheet?.(match)}
            title="Soumettre la feuille de match"
            className="flex items-center gap-1 text-xs font-medium text-[#ce1126] hover:bg-red-50 rounded px-2 py-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Feuille</span>
          </button>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 dark:text-flashscore-muted transition-colors" />
    </div>
  );
};