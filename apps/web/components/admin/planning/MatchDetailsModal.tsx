'use client';
import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Shield } from 'lucide-react';

interface MatchDetailsModalProps {
  match: any | null;
  onClose: () => void;
  competitionLabels?: Record<string, string>;
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'À venir',
  LIVE: 'En direct',
  COMPLETED: 'Terminé',
  POSTPONED: 'Reporté',
  CANCELLED: 'Annulé',
};

const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const TeamBadge = ({ team }: { team: any }) => {
  if (team?.logo) {
    return (
      <img src={team.logo} alt={team?.name || team} className="w-14 h-14 object-contain" />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-flashscore-border flex items-center justify-center">
      <Shield className="w-7 h-7 text-gray-400 dark:text-flashscore-muted" />
    </div>
  );
};

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  onClose,
  competitionLabels = {},
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'stats'>('info');

  if (!match) return null;

  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'COMPLETED';
  const isPostponed = match.status === 'POSTPONED';
  const isCancelled = match.status === 'CANCELLED';

  const homeScore = match.homeScore ?? match.score?.homeScore;
  const awayScore = match.awayScore ?? match.score?.awayScore;
  const hasScore = homeScore !== null && homeScore !== undefined
    && awayScore !== null && awayScore !== undefined;

  const homeName = match.homeTeam?.name || match.homeTeam || 'Équipe A';
  const awayName = match.awayTeam?.name || match.awayTeam || 'Équipe B';

  return (
    <Modal isOpen={!!match} onClose={onClose} title="Détails du match">
      <div className="space-y-4 -m-px">
        {/* Scoreboard header */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl px-4 pt-4 pb-5 -mx-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-flashscore-muted mb-4 px-1">
            <span className="font-medium uppercase tracking-wide">
              {competitionLabels[match.competition] || match.competition}
              {match.category ? ` · ${match.category}` : ''}
            </span>
            {match.journee !== undefined && (
              <span className="font-medium">Journée {match.journee}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            {/* Home team */}
            <div className="flex-1 flex flex-col items-center text-center gap-2">
              <TeamBadge team={match.homeTeam} />
              <span className="text-sm font-semibold text-white leading-tight">{homeName}</span>
            </div>

            {/* Score / status */}
            <div className="flex flex-col items-center justify-center px-3 min-w-[120px]">
              {hasScore ? (
                <div className="text-4xl font-bold text-white tracking-wider tabular-nums">
                  {homeScore} <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">-</span> {awayScore}
                </div>
              ) : (
                <div className="text-3xl font-bold text-white tabular-nums">
                  {match.time || '--:--'}
                </div>
              )}
              <span
                className={`mt-2 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                  isLive
                    ? 'bg-[#ce1126] text-white'
                    : isFinished
                    ? 'bg-gray-700 text-gray-300'
                    : isPostponed
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : isCancelled
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-flashscore-card animate-pulse" />}
                {STATUS_LABELS[match.status] || match.status}
              </span>
            </div>

            {/* Away team */}
            <div className="flex-1 flex flex-col items-center text-center gap-2">
              <TeamBadge team={match.awayTeam} />
              <span className="text-sm font-semibold text-white leading-tight">{awayName}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-flashscore-border">
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-[#ce1126] text-[#ce1126]'
                : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setActiveTab('info')}
          >
            Informations
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-[#ce1126] text-[#ce1126]'
                : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            Statistiques
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'info' ? (
          <div className="space-y-0 text-sm">
            <InfoRow icon="calendar" label="Date" value={formatDate(match.date)} capitalize />
            <InfoRow icon="clock" label="Heure" value={match.time || '-'} />
            <InfoRow icon="map-pin" label="Stade" value={match.stadium || '-'} />
            <InfoRow icon="hash" label="N° Match" value={match.matchNumber || '-'} />
            <InfoRow icon="calendar-stats" label="Saison" value={match.saison || '-'} />
            <InfoRow
              icon="trophy"
              label="Compétition"
              value={competitionLabels[match.competition] || match.competition || '-'}
            />
            {match.category && (
              <InfoRow icon="tag" label="Catégorie" value={match.category} />
            )}
            {match.notes && (
              <div className="pt-3">
                <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-xs uppercase tracking-wide block mb-1.5">Notes</span>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-flashscore-hover rounded-lg p-3 text-sm leading-relaxed">
                  {match.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            {hasScore ? (
              <div className="flex items-center justify-between py-3 px-1 bg-gray-50 dark:bg-flashscore-hover rounded-lg">
                <span className="text-xl font-bold text-gray-900 dark:text-flashscore-text w-10 text-center">{homeScore}</span>
                <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-xs uppercase tracking-wide font-medium">Buts</span>
                <span className="text-xl font-bold text-gray-900 dark:text-flashscore-text w-10 text-center">{awayScore}</span>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-flashscore-muted text-center py-2">
                Le score sera disponible après le match.
              </p>
            )}

            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-flashscore-border">
              <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Assistance vidéo (VAR)</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  match.hasVAR
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 dark:bg-flashscore-border text-gray-500 dark:text-gray-400 dark:text-flashscore-muted'
                }`}
              >
                {match.hasVAR ? 'Activée' : 'Non disponible'}
              </span>
            </div>

            {match.designationStatus && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-flashscore-border">
                <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Désignation</span>
                <span className="font-medium text-gray-800 dark:text-flashscore-text">{match.designationStatus}</span>
              </div>
            )}

            {match.designations && match.designations.length > 0 ? (
              <div className="pt-1">
                <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-xs uppercase tracking-wide block mb-2">Officiels du match</span>
                <div className="space-y-2">
                  {match.designations.map((d: any, idx: number) => (
                    <div
                      key={d.refereeId?._id || d.refereeId || idx}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {d.refereeId?.name || d.refereeId?.fullName || 'Arbitre'}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted bg-gray-100 dark:bg-flashscore-border px-2 py-0.5 rounded">
                          {d.role}
                        </span>
                        {d.confirmed ? (
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            Confirmé
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                            En attente
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-flashscore-muted text-center py-2">
                Aucun officiel désigné pour ce match.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
  capitalize = false,
}: {
  icon: string;
  label: string;
  value: string;
  capitalize?: boolean;
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-flashscore-border">
    <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{label}</span>
    <span className={`font-medium text-gray-800 dark:text-flashscore-text text-right ${capitalize ? 'capitalize' : ''}`}>{value}</span>
  </div>
);