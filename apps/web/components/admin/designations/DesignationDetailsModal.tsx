'use client';
import { X, MapPin, Video, Calendar } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { renderTeamLogo } from '../../../components/admin/planning/MatchCard';
import { COMPETITION_LABELS } from '../../../components/admin/planning/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const REFEREE_ROLES: Record<string, string> = {
  ARBITRE_CENTRAL:  'Arbitre Central',
  ASSISTANT_1:      'Assistant 1',
  ASSISTANT_2:      'Assistant 2',
  QUATRIEME_ARBITRE:'4ème Arbitre',
  ARBITRE_VAR:      'Arbitre VAR',
  ASSISTANT_VAR:    'Assistant VAR 1',
};

const ROLE_JERSEY: Record<string, string> = {
  ARBITRE_CENTRAL:  'C',
  ASSISTANT_1:      '1',
  ASSISTANT_2:      '2',
  QUATRIEME_ARBITRE:'4',
  ARBITRE_VAR:      'V',
  ASSISTANT_VAR:    'AV',
};

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; pillBg: string; pillText: string; hint: string }> = {
  SUBMITTED: {
    label:    'Soumis',
    dotColor: '#fde047',
    pillBg:   'rgba(250,204,21,0.15)',
    pillText: '#fde047',
    hint:     'En attente de validation par le superviseur',
  },
  VALIDATED: {
    label:    'Validé',
    dotColor: '#4ade80',
    pillBg:   'rgba(34,197,94,0.15)',
    pillText: '#4ade80',
    hint:     'Désignation validée — officiels notifiés',
  },
};

// ─── Jersey Badge ─────────────────────────────────────────────────────────────

function JerseyBadge({ role }: { role: string }) {
  const label = ROLE_JERSEY[role] || '?';
  const isSmall = label.length > 1;
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
      style={{
        fontSize: isSmall ? 9 : 11,
        background: 'linear-gradient(135deg,#ce1126,#8b000d)',
        boxShadow: '0 1px 4px rgba(206,17,38,0.35)',
      }}
    >
      {label}
    </div>
  );
}

// ─── Official Card ────────────────────────────────────────────────────────────

function OfficialCard({ ref: refData }: { ref: any }) {
  const refereeData = refData.refereeId || refData;
  const user        = refereeData.userId || {};
  const fullName    = user.firstName ? `${user.firstName} ${user.lastName}` : 'Arbitre rattaché';
  const matricule   = refereeData.matricule || 'N/A';
  const roleName    = REFEREE_ROLES[refData.role] || refData.role;

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-flashscore-border bg-gray-50 dark:bg-flashscore-hover">
      <JerseyBadge role={refData.role} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-[#ce1126] uppercase tracking-wider mb-0.5">
          {roleName}
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-flashscore-text truncate leading-tight">
          {fullName}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-flashscore-muted font-mono">{matricule}</p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DesignationDetailsModalProps {
  match: any | null;
  designation: { referees: any[]; status: string; id: string } | null;
  onClose: () => void;
  onUndo?: (designationId: string) => void;
  canUndo?: boolean;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export const DesignationDetailsModal = ({
  match,
  designation,
  onClose,
  onUndo,
  canUndo = true,
}: DesignationDetailsModalProps) => {
  if (!match || !designation) return null;

  const statusCfg  = STATUS_CONFIG[designation.status] ?? {
    label:    designation.status,
    dotColor: '#94a3b8',
    pillBg:   'rgba(148,163,184,0.15)',
    pillText: '#94a3b8',
    hint:     '',
  };
  const isValidated = designation.status === 'VALIDATED';

  const formattedDate = (() => {
    try {
      return new Date(match.date.split('T')[0]).toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch {
      return match.date;
    }
  })();

  return (
    <Modal isOpen={!!match} onClose={onClose} title="">
      <div className="flex flex-col -m-px" style={{ maxHeight: '85vh' }}>

        {/* ── Scoreboard ── */}
        <div
          className="rounded-xl px-5 pt-4 pb-4 mb-4 flex-shrink-0"
          style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Competition + status */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {COMPETITION_LABELS[match.competition] || match.competition}
              {match.journee !== undefined ? ` · J${match.journee}` : ''}
            </span>
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
              style={{ background: statusCfg.pillBg, color: statusCfg.pillText }}
            >
              {statusCfg.label}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center gap-3">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
              <div className="w-11 h-11 rounded-full bg-gray-700/60 flex items-center justify-center [&_img]:w-7 [&_img]:h-7">
                {renderTeamLogo(match.homeTeam)}
              </div>
              <span className="text-[13px] font-bold text-white leading-tight">{match.homeTeam?.name}</span>
            </div>

            {/* Centre info */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <span className="text-[10px] text-gray-500 font-bold">VS</span>
              <span className="text-xl font-black text-white" style={{ letterSpacing: '-0.03em' }}>
                {match.time || '--:--'}
              </span>
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            </div>

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
              <div className="w-11 h-11 rounded-full bg-gray-700/60 flex items-center justify-center [&_img]:w-7 [&_img]:h-7">
                {renderTeamLogo(match.awayTeam)}
              </div>
              <span className="text-[13px] font-bold text-white leading-tight">{match.awayTeam?.name}</span>
            </div>
          </div>

          {/* Venue / VAR meta */}
          <div
            className="flex items-center gap-4 mt-3 pt-3 text-[11px]"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}
          >
            <span className="flex items-center gap-1.5 text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              {match.stadium || 'Stade'}
            </span>
            {match.hasVAR && (
              <span className="flex items-center gap-1.5" style={{ color: '#c4b5fd' }}>
                <Video className="w-3.5 h-3.5" />
                VAR activé
              </span>
            )}
          </div>
        </div>

        {/* ── Officials ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-flashscore-muted uppercase tracking-widest mb-2.5 px-0.5">
            Officiels désignés
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {(designation.referees || []).map((ref: any, idx: number) => (
              <OfficialCard key={idx} ref={ref} />
            ))}
          </div>

          {/* Status hint row */}
          {statusCfg.hint && (
            <div className="flex items-center gap-2 px-0.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: statusCfg.dotColor }}
              />
              <span className="text-[11px] text-gray-400 dark:text-flashscore-muted">
                {statusCfg.hint}
              </span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-flashscore-border flex-shrink-0">
          {/* Destructive action — left-aligned so it's less prominent */}
          <div>
            {canUndo && !isValidated && (
              <button
                onClick={() => onUndo?.(designation.id)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: '#ce1126', border: '0.5px solid #fca5a5', background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X className="w-4 h-4" />
                Annuler la désignation
              </button>
            )}
          </div>

          {/* Close — right-aligned */}
          <button
            onClick={onClose}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-flashscore-border dark:bg-flashscore-hover dark:hover:bg-flashscore-border dark:text-flashscore-text transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
};