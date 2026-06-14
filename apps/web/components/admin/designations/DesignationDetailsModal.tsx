'use client';
import { useEffect, useState } from 'react';
import { X, MapPin, Video, Calendar } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Avatar } from '../../../components/ui/Avatar';
import { renderTeamLogo } from '../../../components/admin/planning/MatchCard';
import { COMPETITION_LABELS } from '../../../components/admin/planning/constants';
import { api } from "../../../services/api";

const REFEREE_ROLES: Record<string, string> = {
  ARBITRE_CENTRAL: 'Arbitre Central',
  ASSISTANT_1: 'Assistant 1',
  ASSISTANT_2: 'Assistant 2',
  QUATRIEME_ARBITRE: '4ème Arbitre',
  ARBITRE_VAR: 'Arbitre VAR',
  ASSISTANT_VAR: 'Assistant VAR 1',
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Soumis',
  VALIDATED: 'Validé',
};

interface DesignationDetailsModalProps {
  match: any | null;
  designation: { referees: any[]; status: string; id: string } | null;
  onClose: () => void;
  onUndo?: (designationId: string) => void;
  canUndo?: boolean;
}

export const DesignationDetailsModal = ({
  match,
  designation,
  onClose,
  onUndo,
  canUndo = true,
}: DesignationDetailsModalProps) => {
  // Map of refereeId → full referee object fetched from the API
  const [resolvedReferees, setResolvedReferees] = useState<Record<string, any>>({});
  const [loadingReferees, setLoadingReferees] = useState(false);

  useEffect(() => {
    if (!designation?.referees?.length) return;

    const fetchAll = async () => {
      setLoadingReferees(true);
      try {
        // Collect the raw ID from each entry — handle both shapes:
        //   { refereeId: { _id, ... } }  (populated)
        //   { refereeId: "abc123" }       (just an ID string)
        const ids: string[] = designation.referees.map((ref) => {
          const raw = ref.refereeId;
          return typeof raw === 'string' ? raw : raw?._id ?? ref._id ?? ref;
        });

        const results = await Promise.all(
  ids.map((id) =>
    api.referees.getOne(id)
      .then((res: any) => res.data)   // ← unwrap the axios response
      .catch(() => null)
  )
);
        const map: Record<string, any> = {};
        ids.forEach((id, i) => {
          if (results[i]) map[id] = results[i];
        });
        setResolvedReferees(map);
      } finally {
        setLoadingReferees(false);
      }
    };

    fetchAll();
  }, [designation]);

  if (!match || !designation) return null;

  const isValidated = designation.status === 'VALIDATED';

  return (
    <Modal isOpen={!!match} onClose={onClose} title="Détails de la désignation">
      <div className="space-y-5 -m-px">
        {/* Scoreboard header */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl px-5 pt-5 pb-5 -mx-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">
              {COMPETITION_LABELS[match.competition] || match.competition}
              {match.journee !== undefined ? ` · journée ${match.journee}` : ''}
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                isValidated
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-yellow-500/15 text-yellow-400'
              }`}
            >
              {STATUS_LABELS[designation.status] || designation.status}
            </span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex-1 flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center [&_img]:w-9 [&_img]:h-9">
                {renderTeamLogo(match.homeTeam)}
              </div>
              <span className="text-sm font-semibold text-white leading-tight">{match.homeTeam?.name}</span>
            </div>

            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-xs text-gray-500 font-medium">vs</span>
              <span className="text-xl font-bold text-white tabular-nums">{match.time || '--:--'}</span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(match.date.split('T')[0]).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center [&_img]:w-9 [&_img]:h-9">
                {renderTeamLogo(match.awayTeam)}
              </div>
              <span className="text-sm font-semibold text-white leading-tight">{match.awayTeam?.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {match.stadium || 'Stade'}
            </span>
            {match.hasVAR && (
              <span className="flex items-center gap-1.5 text-purple-300">
                <Video className="w-3.5 h-3.5" />
                VAR activé
              </span>
            )}
          </div>
        </div>

        {/* Officials grid */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-flashscore-muted uppercase tracking-wide mb-3 px-1">
            Officiels désignés
          </h3>

          {loadingReferees ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ce1126]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(designation.referees || []).map((ref: any, idx: number) => {
                // Resolve the raw ID the same way as in the effect
                const rawId = ref.refereeId;
                const id = typeof rawId === 'string' ? rawId : rawId?._id ?? ref._id ?? ref;

                // Prefer the freshly-fetched data, fall back to whatever was embedded
                const refereeData = resolvedReferees[id] ?? (typeof rawId === 'object' ? rawId : null);
                const user = refereeData?.userId || {};

                const fullName =
                  user.firstName
                    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                    : 'Arbitre rattaché';
                const initials =
                  user.firstName
                    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
                    : 'AR';
                const matricule = refereeData?.matricule ?? 'N/A';
                const roleName = REFEREE_ROLES[ref.role] || ref.role;

                return (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-flashscore-border rounded-lg p-3 flex items-center gap-3 bg-white dark:bg-flashscore-card"
                  >
                    <Avatar name={initials} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#ce1126] uppercase tracking-wide mb-0.5">
                        {roleName}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-flashscore-text truncate">
                        {fullName}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-flashscore-muted font-mono">
                        {matricule}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-flashscore-border">
          <button
            onClick={onClose}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-flashscore-border bg-gray-50 dark:bg-flashscore-hover hover:bg-gray-100 transition-colors"
          >
            Fermer
          </button>
          {canUndo && !isValidated && (
            <button
              onClick={() => onUndo?.(designation.id)}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Annuler la désignation
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};