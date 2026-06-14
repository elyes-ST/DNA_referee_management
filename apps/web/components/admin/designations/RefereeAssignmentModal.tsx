'use client';
import { useState } from 'react';
import { Send, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Avatar } from '../../../components/ui/Avatar';
import { renderTeamLogo } from '../../../components/admin/planning/MatchCard';
import { COMPETITION_LABELS } from '../../../components/admin/planning/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const REFEREE_ROLES: Record<string, string> = {
  ARBITRE_CENTRAL: 'Arbitre Central',
  ASSISTANT_1: 'Assistant 1',
  ASSISTANT_2: 'Assistant 2',
  QUATRIEME_ARBITRE: '4ème Arbitre',
  ARBITRE_VAR: 'Arbitre VAR',
  ASSISTANT_VAR: 'Assistant VAR 1',
};

const ROLE_SHORT_LABELS: Record<string, string> = {
  ARBITRE_CENTRAL: 'Central',
  ASSISTANT_1: 'Assistant 1',
  ASSISTANT_2: 'Assistant 2',
  QUATRIEME_ARBITRE: '4ème arbitre',
  ARBITRE_VAR: 'Arbitre VAR',
  ASSISTANT_VAR: 'Assistant VAR',
};

const REQUIRED_ROLES_NO_VAR = ['ARBITRE_CENTRAL', 'ASSISTANT_1', 'ASSISTANT_2', 'QUATRIEME_ARBITRE'];
const REQUIRED_ROLES_WITH_VAR = [...REQUIRED_ROLES_NO_VAR, 'ARBITRE_VAR', 'ASSISTANT_VAR'];

const ROLE_META: Record<string, { desc: string; jersey: string; pitch: string }> = {
  ARBITRE_CENTRAL:  { desc: 'Dirige le match depuis le terrain, autorité principale',    jersey: 'C',  pitch: 'center' },
  ASSISTANT_1:      { desc: 'Côté gauche de la touche, gestion du hors-jeu',             jersey: '1',  pitch: 'left'   },
  ASSISTANT_2:      { desc: 'Côté droit de la touche, gestion du hors-jeu',              jersey: '2',  pitch: 'right'  },
  QUATRIEME_ARBITRE:{ desc: 'Gère les remplaçants et le temps additionnel',              jersey: '4',  pitch: 'bottom' },
  ARBITRE_VAR:      { desc: 'Assiste depuis la salle vidéo, décisions critiques',        jersey: 'V',  pitch: 'var'    },
  ASSISTANT_VAR:    { desc: "Supporte l'arbitre VAR dans l'analyse vidéo",               jersey: 'AV', pitch: 'var'    },
};

// ─── Pitch Diagram ────────────────────────────────────────────────────────────
// viewBox="0 0 180 120" — all dots kept ≥8px from any edge so nothing clips.
// Positions (cx,cy):  center=90,60  left=10,30  right=170,90  bottom=90,112  var=rect at top-right

function PitchDiagram({ activePosition, filled }: { activePosition: string; filled: Record<string, boolean> }) {
  const isActive = (pos: string) => activePosition === pos;
  const isFilled = (pos: string) => !!filled[pos];

  const dotFill   = (pos: string) => isActive(pos) ? '#ce1126' : isFilled(pos) ? '#22c55e' : '#374151';
  const dotStroke = (pos: string) => isActive(pos) ? '#ff4d66' : isFilled(pos) ? '#16a34a' : '#4b5563';

  const Pulse = ({ cx, cy }: { cx: number; cy: number }) => (
    <circle cx={cx} cy={cy} r="9" fill="none" stroke="#ce1126" strokeWidth="1.2" opacity="0.5">
      <animate attributeName="r"       values="7;12;7"     dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.6;0;0.6"  dur="1.5s" repeatCount="indefinite" />
    </circle>
  );

  return (
    // Extra 8px padding on all sides via viewBox so edge dots are never clipped
    <svg viewBox="-8 -8 196 136" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' }}>
      {/* Pitch fill */}
      <rect x="0" y="0" width="180" height="120" rx="5" fill="#166534" />
      {/* Alternating stripe */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <rect key={i} x={i*20} y="0" width="10" height="120" fill="rgba(255,255,255,0.025)" />
      ))}
      {/* Outer border */}
      <rect x="0" y="0" width="180" height="120" rx="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
      {/* Halfway line */}
      <line x1="90" y1="0" x2="90" y2="120" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      {/* Centre circle */}
      <circle cx="90" cy="60" r="18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <circle cx="90" cy="60" r="1.5" fill="rgba(255,255,255,0.7)" />
      {/* Left penalty box */}
      <rect x="0" y="36" width="32" height="48" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <rect x="0" y="47" width="12" height="26" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <circle cx="26" cy="60" r="1.2" fill="rgba(255,255,255,0.7)" />
      {/* Right penalty box */}
      <rect x="148" y="36" width="32" height="48" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <rect x="168" y="47" width="12" height="26" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <circle cx="154" cy="60" r="1.2" fill="rgba(255,255,255,0.7)" />

      {/* ── Referee position dots ── */}

      {/* ARBITRE_CENTRAL — centre */}
      {isActive('center') && <Pulse cx={90} cy={60} />}
      <circle cx="90" cy="60" r="7" fill={dotFill('center')} stroke={dotStroke('center')} strokeWidth="1.5" />
      <text x="90" y="63.5" textAnchor="middle" fontSize="6.5" fill="white" fontWeight="bold">C</text>

      {/* ASSISTANT_1 — top-left touchline (well inside viewBox) */}
      {isActive('left') && <Pulse cx={10} cy={30} />}
      <circle cx="10" cy="30" r="6.5" fill={dotFill('left')} stroke={dotStroke('left')} strokeWidth="1.5" />
      <text x="10" y="33.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">1</text>

      {/* ASSISTANT_2 — bottom-right touchline */}
      {isActive('right') && <Pulse cx={170} cy={90} />}
      <circle cx="170" cy="90" r="6.5" fill={dotFill('right')} stroke={dotStroke('right')} strokeWidth="1.5" />
      <text x="170" y="93.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">2</text>

      {/* QUATRIEME_ARBITRE — below centre (technical area, still inside viewBox) */}
      {isActive('bottom') && <Pulse cx={90} cy={112} />}
      <circle cx="90" cy="112" r="6.5" fill={dotFill('bottom')} stroke={dotStroke('bottom')} strokeWidth="1.5" />
      <text x="90" y="115.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">4</text>

      {/* VAR — booth in top-right, offset so it doesn't overlap pitch markings */}
      {(isActive('var') || isFilled('var')) && (
        <g>
          <rect x="118" y="-5" width="46" height="16" rx="3" fill={dotFill('var')} opacity="0.95" />
          <text x="141" y="6.5" textAnchor="middle" fontSize="6.5" fill="white" fontWeight="bold">VAR</text>
          {isActive('var') && (
            <rect x="118" y="-5" width="46" height="16" rx="3" fill="none" stroke="#ff4d66" strokeWidth="1.2">
              <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
            </rect>
          )}
        </g>
      )}
    </svg>
  );
}

// ─── Progress Timeline ─────────────────────────────────────────────────────────

function ProgressTimeline({
  roles, currentStep, selected, onJump,
}: {
  roles: string[];
  currentStep: number;
  selected: { refereeId: string; role: string }[];
  onJump: (i: number) => void;
}) {
  return (
    // Use a flex row that never wraps; connector lines are flex-1 so they share space evenly
    <div className="flex items-center w-full mb-4">
      {roles.map((role, i) => {
        const isDone    = selected.some((s) => s.role === role);
        const isCurrent = i === currentStep;
        const isClickable = i < currentStep || isDone;

        return (
          <div key={role} className="flex items-center" style={{ flex: i < roles.length - 1 ? '1 1 0' : '0 0 auto' }}>
            <button
              onClick={() => isClickable && onJump(i)}
              disabled={!isClickable}
              title={ROLE_SHORT_LABELS[role]}
              className="relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all flex-shrink-0"
              style={
                isCurrent
                  ? { background: 'linear-gradient(135deg,#ce1126,#8b000d)', boxShadow: '0 0 0 3px rgba(206,17,38,0.25)', color: 'white', transform: 'scale(1.1)' }
                  : isDone
                  ? { background: '#15803d', color: 'white', cursor: 'pointer' }
                  : { background: 'transparent', border: '1.5px solid #374151', color: '#6b7280', cursor: 'not-allowed' }
              }
            >
              {isDone && !isCurrent ? <Check className="w-3 h-3" /> : (ROLE_META[role]?.jersey || i + 1)}
            </button>
            {/* Connector — fills available space between dots */}
            {i < roles.length - 1 && (
              <div
                className="h-[2px] flex-1 mx-1 transition-colors"
                style={{ background: isDone ? '#15803d' : '#374151', minWidth: 8 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Referee Card ──────────────────────────────────────────────────────────────

function RefereeCard({
  referee, isSelected, isAlreadyUsed, onSelect,
}: {
  referee: any;
  isSelected: boolean;
  isAlreadyUsed: boolean;
  onSelect: () => void;
}) {
  const isAvailable = referee.isAvailable !== false;
  const isDisabled  = !isAvailable || isAlreadyUsed;
  const initials    = `${referee.userId?.firstName?.[0] || ''}${referee.userId?.lastName?.[0] || 'A'}`;

  return (
    <button
      onClick={() => !isDisabled && onSelect()}
      disabled={isDisabled}
      className={`relative w-full text-left border rounded-xl p-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ce1126] ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 dark:bg-flashscore-hover dark:border-flashscore-border'
          : isSelected
          ? 'border-2 bg-red-50 dark:bg-red-950/20 cursor-pointer'
          : 'border-gray-200 hover:border-red-300 bg-white dark:border-flashscore-border dark:bg-flashscore-card dark:hover:border-red-900/50 cursor-pointer'
      }`}
      style={isSelected ? { borderColor: '#ce1126' } : {}}
    >
      {isSelected && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: '#ce1126', boxShadow: '0 1px 4px rgba(206,17,38,0.5)' }}
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <Avatar name={initials} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-flashscore-text truncate">
            {referee.userId?.firstName} {referee.userId?.lastName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {referee.category || 'N/A'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-flashscore-muted">{referee.region || '—'}</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-300 dark:text-flashscore-muted font-mono flex-shrink-0">
          {referee.matricule || '—'}
        </span>
      </div>

      {/* Overlay labels */}
      {!isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-flashscore-card/80 rounded-xl">
          <span className="text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2 py-1 rounded-full">
            Indisponible
          </span>
        </div>
      )}
      {isAvailable && isAlreadyUsed && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-flashscore-card/80 rounded-xl">
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-1 rounded-full">
            Déjà désigné
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Lineup Review ─────────────────────────────────────────────────────────────

function LineupReview({
  roles, selected, eligibleReferees, onEdit,
}: {
  roles: string[];
  selected: { refereeId: string; role: string }[];
  eligibleReferees: any[];
  onEdit: (stepIndex: number) => void;
}) {
  return (
    <div className="space-y-2">
      {roles.map((role, i) => {
        const assignment = selected.find((s) => s.role === role);
        const referee    = eligibleReferees.find((r) => r._id === assignment?.refereeId);
        const meta       = ROLE_META[role];
        const initials   = `${referee?.userId?.firstName?.[0] || ''}${referee?.userId?.lastName?.[0] || ''}`;

        return (
          <div
            key={role}
            className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-flashscore-border bg-white dark:bg-flashscore-card px-3 py-2.5"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ce1126,#8b000d)' }}
            >
              {meta?.jersey}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-flashscore-muted uppercase tracking-wider">
                {ROLE_SHORT_LABELS[role]}
              </p>
              {referee ? (
                <p className="text-sm font-bold text-gray-900 dark:text-flashscore-text truncate">
                  {referee.userId?.firstName} {referee.userId?.lastName}
                </p>
              ) : (
                <p className="text-sm text-gray-300 italic">Non désigné</p>
              )}
            </div>
            {referee && <Avatar name={initials} size="sm" />}
            <button
              onClick={() => onEdit(i)}
              className="text-[10px] font-semibold flex-shrink-0 ml-1"
              style={{ color: '#ce1126' }}
            >
              Modifier
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface RefereeAssignmentModalProps {
  match: any | null;
  eligibleReferees: any[];
  loading: boolean;
  selected: { refereeId: string; role: string }[];
  onToggle: (refereeId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────

export const RefereeAssignmentModal = ({
  match,
  eligibleReferees,
  loading,
  selected,
  onToggle,
  onSave,
  onClose,
}: RefereeAssignmentModalProps) => {
  const [step, setStep]           = useState(0);
  const [showPitch, setShowPitch] = useState(true);

  if (!match) return null;

  const hasVAR       = match.hasVAR === true;
  const requiredRoles = hasVAR ? REQUIRED_ROLES_WITH_VAR : REQUIRED_ROLES_NO_VAR;
  const isLastStep   = step === requiredRoles.length;
  const isComplete   = requiredRoles.every((role) => selected.some((s) => s.role === role));

  const currentRole      = !isLastStep ? requiredRoles[step] : null;
  const currentSelection = currentRole ? selected.find((s) => s.role === currentRole) : null;

  // IDs already assigned to OTHER roles — these must be blocked from re-selection
  const usedElsewhere = new Set(
    selected
      .filter((s) => s.role !== currentRole)
      .map((s) => s.refereeId)
  );

  // Filter eligible refs for this step by allowedRoles
  const eligibleForStep = currentRole
    ? eligibleReferees.filter(
        (r) => !r.allowedRoles?.length || r.allowedRoles.includes(currentRole)
      )
    : [];

  // Build filled-positions map for pitch diagram
  const filledPositions: Record<string, boolean> = {};
  selected.forEach((s) => {
    const pos = ROLE_META[s.role]?.pitch;
    if (pos) filledPositions[pos] = true;
  });
  const activePosition = currentRole ? (ROLE_META[currentRole]?.pitch ?? '') : '';

  const handleSelectReferee = (refereeId: string) => {
    // If this ref is already selected for *this* role, toggle it off
    // If it's a new pick, onToggle will add it (parent handles dedup per role)
    onToggle(refereeId);
    // Auto-advance only when we are picking a new referee (not deselecting)
    const isDeselecting = currentSelection?.refereeId === refereeId;
    if (!isDeselecting) {
      setTimeout(() => setStep((s) => Math.min(s + 1, requiredRoles.length)), 320);
    }
  };

  return (
    <Modal isOpen={!!match} onClose={onClose} title="">
      <div className="flex flex-col" style={{ maxHeight: '85vh', minWidth: 0 }}>

        {/* ── Scoreboard ── */}
        <div
          className="rounded-xl px-4 py-3 mb-4 flex-shrink-0"
          style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {COMPETITION_LABELS[match.competition] || match.competition}
              {match.journee !== undefined ? ` · J${match.journee}` : ''}
            </span>
            {hasVAR && (
              <span className="text-[10px] font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                VAR
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-bold text-white truncate text-right">{match.homeTeam?.name}</span>
              <div className="w-7 h-7 rounded-full bg-gray-700/60 flex items-center justify-center flex-shrink-0 [&_img]:w-4 [&_img]:h-4">
                {renderTeamLogo(match.homeTeam)}
              </div>
            </div>
            <span className="text-[10px] text-gray-500 font-bold flex-shrink-0">VS</span>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-gray-700/60 flex items-center justify-center flex-shrink-0 [&_img]:w-4 [&_img]:h-4">
                {renderTeamLogo(match.awayTeam)}
              </div>
              <span className="text-sm font-bold text-white truncate">{match.awayTeam?.name}</span>
            </div>
          </div>
        </div>

        {/* ── Title row ── */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h2
            className="text-sm font-black text-gray-900 dark:text-flashscore-text uppercase tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            {isLastStep ? '📋 Composition finale' : 'Composition arbitrale'}
          </h2>
          {!isLastStep && (
            <button
              onClick={() => setShowPitch((v) => !v)}
              className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-flashscore-text transition-colors"
            >
              {showPitch ? 'Masquer terrain' : 'Voir terrain'}
            </button>
          )}
        </div>

        {/* ── Stepper ── */}
        <div className="flex-shrink-0">
          <ProgressTimeline
            roles={requiredRoles}
            currentStep={isLastStep ? requiredRoles.length : step}
            selected={selected}
            onJump={(i) => setStep(i)}
          />
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLastStep ? (
            <div>
              <p className="text-[11px] text-gray-400 dark:text-flashscore-muted mb-3">
                Vérifiez la composition avant de soumettre la désignation officielle.
              </p>
              <LineupReview
                roles={requiredRoles}
                selected={selected}
                eligibleReferees={eligibleReferees}
                onEdit={(i) => setStep(i)}
              />
            </div>
          ) : (
            <div>
              {/* Pitch — fixed aspect ratio container */}
              {showPitch && (
                <div className="mb-3 rounded-xl overflow-visible" style={{ height: 108 }}>
                  <PitchDiagram activePosition={activePosition} filled={filledPositions} />
                </div>
              )}

              {/* Role header */}
              {currentRole && (
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#ce1126,#8b000d)', boxShadow: '0 2px 8px rgba(206,17,38,0.4)' }}
                  >
                    {ROLE_META[currentRole]?.jersey || '?'}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-flashscore-muted uppercase tracking-widest mb-0.5">
                      Étape {step + 1} sur {requiredRoles.length}
                    </p>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-flashscore-text leading-tight">
                      {REFEREE_ROLES[currentRole] || currentRole}
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-flashscore-muted mt-0.5">
                      {ROLE_META[currentRole]?.desc}
                    </p>
                  </div>
                </div>
              )}

              {/* Referee grid */}
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ce1126]" />
                </div>
              ) : eligibleForStep.length === 0 ? (
                <p className="text-center py-10 text-gray-400 dark:text-flashscore-muted text-sm">
                  Aucun arbitre éligible pour ce rôle
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {eligibleForStep.map((referee: any) => (
                    <RefereeCard
                      key={referee._id}
                      referee={referee}
                      isSelected={currentSelection?.refereeId === referee._id}
                      isAlreadyUsed={usedElsewhere.has(referee._id)}
                      onSelect={() => handleSelectReferee(referee._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="pt-3 mt-3 border-t border-gray-100 dark:border-flashscore-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => step > 0 && setStep((s) => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-flashscore-border dark:bg-flashscore-hover dark:hover:bg-flashscore-border dark:text-flashscore-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>

            <span className="text-[11px] text-gray-400 dark:text-flashscore-muted font-mono">
              {isLastStep ? 'Récap' : `${step + 1} / ${requiredRoles.length}`}
            </span>

            {isLastStep ? (
              <button
                onClick={onSave}
                disabled={!isComplete}
                className="flex items-center gap-1.5 text-sm font-black px-4 py-2 rounded-lg text-white transition-all disabled:cursor-not-allowed"
                style={
                  isComplete
                    ? { background: 'linear-gradient(135deg,#ce1126,#8b000d)', boxShadow: '0 2px 10px rgba(206,17,38,0.4)' }
                    : { background: 'rgba(206,17,38,0.3)' }
                }
              >
                <Send className="w-4 h-4" />
                Coup d'envoi
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(s + 1, requiredRoles.length))}
                disabled={!currentSelection}
                className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg text-white transition-all disabled:cursor-not-allowed"
                style={
                  currentSelection
                    ? { background: 'linear-gradient(135deg,#ce1126,#8b000d)' }
                    : { background: 'rgba(206,17,38,0.3)' }
                }
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};