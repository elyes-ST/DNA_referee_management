'use client';
import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Calendar, MapPin, Clock, Users, CheckCircle, Filter, Eye } from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Pagination } from "../../../components/ui/Pagination";
import { toast } from "sonner";
import { useUser } from "../../../hooks/useUser";
import { AuthGuard } from "../../../components/ui/AuthGuard";
import { CategoryC1C2Filter } from "../../../components/ui/CategoryFilter";
import { Role } from "../../../types/user";
import { renderTeamLogo } from "../../../components/admin/planning/MatchCard";
import { DesignationDetailsModal } from "../../../components/admin/designations/DesignationDetailsModal";
import { COMPETITION_LABELS } from "../../../components/admin/planning/constants";
import { RefereeAssignmentModal } from "../../../components/admin/designations/RefereeAssignmentModal";
// Referee role mappings
const REFEREE_ROLES = {
  ARBITRE_CENTRAL: 'Arbitre Central',
  ASSISTANT_1: 'Assistant 1',
  ASSISTANT_2: 'Assistant 2',
  QUATRIEME_ARBITRE: '4ème Arbitre',
  ARBITRE_VAR: 'Arbitre VAR',
  ASSISTANT_VAR: 'Assistant VAR 1',
};

const REQUIRED_ROLES_NO_VAR = [
  'ARBITRE_CENTRAL',
  'ASSISTANT_1',
  'ASSISTANT_2',
  'QUATRIEME_ARBITRE'
];

const REQUIRED_ROLES_WITH_VAR = [
  'ARBITRE_CENTRAL',
  'ASSISTANT_1',
  'ASSISTANT_2',
  'QUATRIEME_ARBITRE',
  'ARBITRE_VAR',
  'ASSISTANT_VAR'
];

// Compact dark scoreboard-style badge for the two teams, matches the planning page style
const TeamsScoreboard = ({ homeTeam, awayTeam }: { homeTeam: any; awayTeam: any }) => (
  <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg px-3 py-2 flex items-center gap-2.5 flex-shrink-0">
    <div className="flex items-center gap-1.5">
      {renderTeamLogo(homeTeam)}
      <span className="text-xs font-medium text-white truncate max-w-[72px]">{homeTeam?.name}</span>
    </div>
    <span className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-flashscore-muted font-medium">vs</span>
    <div className="flex items-center gap-1.5">
      {renderTeamLogo(awayTeam)}
      <span className="text-xs font-medium text-white truncate max-w-[72px]">{awayTeam?.name}</span>
    </div>
  </div>
);

export default function DesignationsPage() {
  const { user } = useUser();
  const isDesignationDNA = user?.role === Role.DESIGNATION_DNA;
  const canValidate = user?.role === Role.ADMIN_DNA || user?.role === Role.DESIGNATION_DNA;

  /** Auto-category for commission roles */
  const ROLE_CATEGORY: Partial<Record<Role, string>> = {
    [Role.CAA]: 'C1,C2',
    [Role.CAJ]: 'JEUNE',
    [Role.CAF]: 'FEMININE',
    [Role.CRA]: 'REGIONAL',
  };
  const roleCategory = user?.role ? ROLE_CATEGORY[user.role] ?? '' : '';
  // CAA is scoped to both amateur sub-categories and may narrow to C1 / C2
  const isAmateur = user?.role === Role.CAA;
  const [amateurFilter, setAmateurFilter] = useState('');
  const effectiveCategory = isAmateur ? (amateurFilter || 'C1') : roleCategory;
  const [matches, setMatches] = useState<any[]>([]);
  const [teamsMap, setTeamsMap] = useState<Record<string, any>>({});
  const [eligibleReferees, setEligibleReferees] = useState<Record<string, any[]>>({});
  const [loadingReferees, setLoadingReferees] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [designationToValidate, setDesignationToValidate] = useState<any[]>([]);
  const [assigningMatch, setAssigningMatch] = useState<any>(null);
  const [selectedReferees, setSelectedReferees] = useState<Record<string, { refereeId: string, role: string }[]>>({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedJournee, setSelectedJournee] = useState<string>('all');
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>('SCHEDULED');
  const [detailsMatch, setDetailsMatch] = useState<any>(null);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  // Fetch matches with designations
  const fetchDesignations = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { status: 'SUBMITTED' };
      if (isDesignationDNA) {
        params.category = 'C1,C2,JEUNE,FEMININE,REGIONAL';
      } else if (effectiveCategory) {
        params.category = effectiveCategory;
      }
      const response = await api.designations.getAll(params);
      const designationsData = response.data
      setDesignationToValidate(designationsData);
    } catch (error) {
      console.error('Error fetching designations:', error);
      toast.error('Erreur lors du chargement des désignations');
    } finally {
      setLoading(false);
    }
  }, [isDesignationDNA, effectiveCategory]);
  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage, status: matchStatusFilter };
      if (selectedJournee !== 'all') {
        params.journee = selectedJournee;
      }
      // Commission roles only see their category matches (CAA may narrow to C1/C2)
      if (effectiveCategory) {
        params.category = effectiveCategory;
      }
      const response = await api.matches.getAll(params);
      const matchesData = response.data?.data || [];
      setTotalItems(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);

      // Fetch teams by ID for logos
      const teamIds = new Set<string>();
      matchesData.forEach((m: any) => {
        if (m.homeTeamId) teamIds.add(m.homeTeamId);
        if (m.awayTeamId) teamIds.add(m.awayTeamId);
      });

      const teamMap: Record<string, any> = { ...teamsMap };
      await Promise.all(
        Array.from(teamIds).map(async id => {
          if (!teamMap[id]) {
            try {
              const { data } = await api.teams.getOne(id);
              teamMap[id] = data;
            } catch {
              teamMap[id] = { name: "Unknown", logo: "/placeholder-team.png" };
            }
          }
        })
      );

      setTeamsMap(teamMap);

      // Enrich matches
      const enrichedMatches = matchesData.map((match: any) => ({
        ...match,
        homeTeam: teamMap[match.homeTeamId] || { name: match.homeTeam || "Unknown", logo: "/placeholder-team.png" },
        awayTeam: teamMap[match.awayTeamId] || { name: match.awayTeam || "Unknown", logo: "/placeholder-team.png" },
      }));

      setMatches(enrichedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Erreur lors du chargement des matchs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedJournee, matchStatusFilter, effectiveCategory]);

  // Fetch eligible referees for a specific match
  const fetchEligibleReferees = useCallback(async (matchId: string) => {
    if (eligibleReferees[matchId]) {
      return; // Already fetched
    }

    try {
      setLoadingReferees(prev => ({ ...prev, [matchId]: true }));
      const response = await api.designations.getEligibleReferees(matchId);
      const refereesData = Array.isArray(response.data) ? response.data : (response.data?.data || []);

      // Extract referee objects from suggestions and keep metadata
      const refereesList = refereesData.map((suggestion: any) => {
        const r = suggestion.referee || suggestion;
        return {
          ...r,
          __isEligible: suggestion.isEligible !== false,
          __errors: suggestion.errors || [],
          __warnings: suggestion.warnings || [],
        };
      });

      // Sort: eligible first, then alphabetical
      refereesList.sort((a: any, b: any) => {
        if (a.__isEligible && !b.__isEligible) return -1;
        if (!a.__isEligible && b.__isEligible) return 1;
        return 0;
      });

      setEligibleReferees(prev => ({ ...prev, [matchId]: refereesList }));
    } catch (error) {
      console.error('Error fetching eligible referees:', error);
      toast.error('Erreur lors du chargement des arbitres \u00e9ligibles');
      setEligibleReferees(prev => ({ ...prev, [matchId]: [] }));
    } finally {
      setLoadingReferees(prev => ({ ...prev, [matchId]: false }));
    }
  }, [eligibleReferees]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Fetch eligible referees when the assignment modal opens
  useEffect(() => {
    if (assigningMatch) {
      fetchEligibleReferees(assigningMatch._id);
    }
  }, [assigningMatch, fetchEligibleReferees]);

  const toggleRefereeSelection = useCallback((matchId: string, refereeId: string, hasVAR: boolean) => {
    setSelectedReferees(prev => {
      const current = prev[matchId] || [];
      const maxReferees = hasVAR ? 6 : 4;
      const existingIndex = current.findIndex(r => r.refereeId === refereeId);

      if (existingIndex >= 0) {
        // Remove referee
        return { ...prev, [matchId]: current.filter(r => r.refereeId !== refereeId) };
      } else {
        // Add referee
        if (current.length >= maxReferees) {
          toast.warning(`Limite atteinte: ${maxReferees} arbitres maximum`);
          return prev;
        }

        // Find the first missing role instead of using array length
        const requiredRoles = hasVAR ? REQUIRED_ROLES_WITH_VAR : REQUIRED_ROLES_NO_VAR;
        const currentRoles = current.map(r => r.role);
        const missingRole = requiredRoles.find(role => !currentRoles.includes(role));
        const role: string = missingRole ?? requiredRoles[0] ?? 'ARBITRE_CENTRAL';

        // Validate that the referee can take this role
        const matchReferees = eligibleReferees[matchId] || [];
        const referee = matchReferees.find(r => r._id === refereeId);

        if (referee && referee.allowedRoles) {
          if (!referee.allowedRoles.includes(role)) {
            const roleName = REFEREE_ROLES[role as keyof typeof REFEREE_ROLES] || role;
            toast.error(`Cet arbitre n'est pas autorisé pour le rôle: ${roleName}`);
            return prev;
          }
        }

        return { ...prev, [matchId]: [...current, { refereeId, role }] };
      }
    });
  }, [eligibleReferees]);

  const saveDesignation = useCallback(async (matchId: string, hasVAR: boolean) => {
    const selectedRefs = selectedReferees[matchId] || [];
    const requiredCount = hasVAR ? 6 : 4;

    if (selectedRefs.length < requiredCount) {
      toast.error(`Veuillez sélectionner ${requiredCount} arbitres`);
      return;
    }

    const match = matches.find(m => m._id === matchId);

    try {
      const designationData = {
        matchId,
        referees: selectedRefs,
        category: match?.category || 'A',
        hasVAR: hasVAR,

      };

      // Create designation (DRAFT status)
      const response = await api.designations.create(designationData);
      const designationId = response.data?.designation?._id;

      if (!designationId) {
        throw new Error('No designation ID returned');
      }

      // Submit designation (DRAFT -> SUBMITTED)
      await api.designations.submit(designationId);

      toast.success('Désignation créée et soumise avec succès');

      // Refresh data
      await fetchMatches();
      await fetchDesignations();
      setSelectedReferees(prev => ({ ...prev, [matchId]: [] }));
      setAssigningMatch(null);
    } catch (error: any) {
      console.error('Error saving designation:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de la création de la désignation');
    }
  }, [selectedReferees, fetchMatches, matches]);

  const validateDesignation = useCallback(async (designationId: string) => {
    try {
      await api.designations.validate(designationId, { notes: '' });
      toast.success('Désignation validée avec succès');
      await fetchMatches();
      await fetchDesignations();
    } catch (error: any) {
      console.error('Error validating designation:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de la validation');
    }
  }, [fetchMatches]);

  const undoDesignation = useCallback(async (designationId: string) => {
    try {
      await api.designations.delete(designationId);
      toast.success('Désignation annulée avec succès');
      await fetchMatches();
      await fetchDesignations();
    } catch (error: any) {
      console.error('Error undoing designation:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  }, [fetchMatches]);

  const validateAllSubmitted = useCallback(async () => {
    const submittedDesignations = designationToValidate.map(d => d._id);

    if (submittedDesignations.length === 0) {
      toast.info('Aucune désignation à valider');
      return;
    }

    try {
      let validated = 0;
      for (const designationId of submittedDesignations) {
        await api.designations.validate(designationId, { notes: '' });
        validated++;
      }
      toast.success(`${validated} désignation(s) validée(s) avec succès`);
      setShowValidationModal(false);
      await fetchMatches();
      await fetchDesignations();
    } catch (error: any) {
      console.error('Error validating designations:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de la validation');
    }
  }, [matches, fetchMatches]);

  const getSelectedRefereesForMatch = useCallback((matchId: string) => {
    const ids = selectedReferees[matchId] || [];
    const matchReferees = eligibleReferees[matchId] || [];
    return ids.map(({ refereeId, role }) => {
      const referee = matchReferees.find(r => r._id === refereeId);
      return referee ? { ...referee, assignedRole: role } : null;
    }).filter(Boolean);
  }, [selectedReferees, eligibleReferees]);

  const getStatusBadge = (designationStatus: string) => {
    if (!designationStatus) {
      return (
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted bg-gray-100 dark:bg-flashscore-border px-2 py-0.5 rounded-full">
          En attente
        </span>
      );
    }

    switch (designationStatus) {
      case 'SUBMITTED':
        return (
          <span className="text-[11px] font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
            Soumis
          </span>
        );
      case 'VALIDATED':
        return (
          <span className="text-[11px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            Validé
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted bg-gray-100 dark:bg-flashscore-border px-2 py-0.5 rounded-full">
            {designationStatus}
          </span>
        );
    }
  };

  if (loading && matches.length === 0) {
    return (
      <AuthGuard role={[Role.ADMIN_DNA, Role.DESIGNATION_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA]}>
        <div className="animate-fadeIn p-6 flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126]"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.DESIGNATION_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA]}>
      <Card className="animate-fadeIn p-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-2">Gestion des Désignations</h1>
              <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Attribuez les arbitres aux matchs programmés et validez les désignations soumises</p>
            </div>

            {/* CAA: C1/C2 sub-filter. Other commission roles: static scope badge */}
            {isAmateur ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-500 font-medium">Portée :</span>
                <CategoryC1C2Filter
                  value={amateurFilter}
                  onChange={(v) => { setAmateurFilter(v); setCurrentPage(1); }}
                />
              </div>
            ) : roleCategory && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-xs text-blue-500 font-medium">Portée :</span>
                <span className="text-sm font-semibold text-blue-700">{{
                  'JEUNE': 'Jeunes',
                  'FEMININE': 'Féminine',
                  'REGIONAL': 'Régional',
                }[roleCategory] ?? roleCategory}</span>
              </div>
            )}

            {/* Bulk Validation Button — only for ADMIN/DESIGNATION roles */}
            {canValidate && designationToValidate && designationToValidate.length > 0 && (
              <Button
                variant="primary"
                onClick={() => setShowValidationModal(true)}
                className="flex items-center gap-2 shrink-0 bg-[#ce1126] hover:bg-[#a90e1f] border-[#ce1126]"
              >
                <CheckCircle className="w-4 h-4" />
                Valider les désignations ({designationToValidate.length})
              </Button>
            )}
          </div>

          {/* Filters Section */}
          <Card className="px-6 py-4 mt-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Journee Filter Pills */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 dark:text-flashscore-muted" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Journée:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* All button */}
                  <button
                    onClick={() => {
                      setSelectedJournee('all');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedJournee === 'all'
                        ? 'bg-[#ce1126] text-white shadow-md'
                        : 'bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-flashscore-border'
                      }`}
                  >
                    Toutes
                  </button>

                  {/* Custom number input */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">ou</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="N°"
                      value={selectedJournee === 'all' ? '' : selectedJournee}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || parseInt(value) > 0) {
                          setSelectedJournee(value === '' ? 'all' : value);
                          setCurrentPage(1);
                        }
                      }}
                      className="w-16 px-2 py-2 text-sm text-center border border-gray-300 dark:border-flashscore-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ce1126] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              {/* Match Status Filter */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 dark:text-flashscore-muted" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut:</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMatchStatusFilter('SCHEDULED');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${matchStatusFilter === 'SCHEDULED'
                        ? 'bg-[#ce1126] text-white shadow-md'
                        : 'bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-flashscore-border'
                      }`}
                  >
                    À venir
                  </button>

                  <button
                    onClick={() => {
                      setMatchStatusFilter('COMPLETED');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${matchStatusFilter === 'COMPLETED'
                        ? 'bg-[#ce1126] text-white shadow-md'
                        : 'bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-flashscore-border'
                      }`}
                  >
                    Terminé
                  </button>
                </div>
              </div>
              {/* Results Count */}
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-flashscore-muted bg-gray-50 dark:bg-flashscore-hover px-4 py-2 rounded-lg border border-gray-200 dark:border-flashscore-border">
                {totalItems} match{totalItems > 1 ? 'es' : ''} trouvé{totalItems > 1 ? 's' : ''}
              </div>
            </div>
          </Card>
        </div>

        {/* Match Cards */}
        <div className="space-y-3">
          {matches.map((match: any) => {
            const designation = match.designations.length === 0 ? null : { referees: match.designations, status: match.designationStatus, id: match.designationId };
            const hasVAR = match.hasVAR === true;

            return (
              <Card key={match._id} className="overflow-hidden !p-0 border border-gray-200 dark:border-flashscore-border">
                <div className="p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Match Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <TeamsScoreboard homeTeam={match.homeTeam} awayTeam={match.awayTeam} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text truncate">
                            {match.homeTeam.name} vs {match.awayTeam.name}
                          </h3>
                          {getStatusBadge(designation ? designation.status : null)}
                          {hasVAR && (
                            <span className="text-[11px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                              VAR
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(match.date.split('T')[0]).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {match.time || '15:00'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {match.stadium || 'Stade'}
                          </span>
                          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted bg-gray-100 dark:bg-flashscore-border px-2 py-0.5 rounded-full">
                            {COMPETITION_LABELS[match.competition] || match.competition}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">

                      {designation && designation.status === 'SUBMITTED' && !(isDesignationDNA && ['A', 'B'].includes(match.category)) && (
                        <Button
                          variant="primary"
                          onClick={() => validateDesignation(designation.id)}
                          className="flex items-center gap-2 bg-[#ce1126] hover:bg-[#a90e1f] border-[#ce1126]"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Valider
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        onClick={() => (designation ? setDetailsMatch(match) : setAssigningMatch(match))}
                        className="!font-medium flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-flashscore-border transition-colors"
                      >
                        {designation ? <Eye className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        {designation ? 'Détails' : 'Désigner'}
                      </Button>
                    </div>
                  </div>
                </div>

              </Card>
            );
          })}
        </div>
        <RefereeAssignmentModal
          match={assigningMatch}
          eligibleReferees={assigningMatch ? (eligibleReferees[assigningMatch._id] || []) : []}
          loading={assigningMatch ? !!loadingReferees[assigningMatch._id] : false}
          selected={assigningMatch ? (selectedReferees[assigningMatch._id] || []) : []}
          onToggle={(refereeId) =>
            assigningMatch && toggleRefereeSelection(assigningMatch._id, refereeId, assigningMatch.hasVAR === true)
          }
          onSave={() => assigningMatch && saveDesignation(assigningMatch._id, assigningMatch.hasVAR === true)}
          onClose={() => setAssigningMatch(null)}
        />
        <DesignationDetailsModal
          match={detailsMatch}
          designation={detailsMatch ? {
            referees: detailsMatch.designations,
            status: detailsMatch.designationStatus,
            id: detailsMatch.designationId,
          } : null}
          onClose={() => setDetailsMatch(null)}
          onUndo={(id) => { undoDesignation(id); setDetailsMatch(null); }}
          canUndo={true}
        />
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
            />
          </div>
        )}

        {/* Validation Modal */}
        {showValidationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-flashscore-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-flashscore-text">Désignations à valider ({designationToValidate.length})</h2>
                  <button
                    onClick={() => setShowValidationModal(false)}
                    className="text-gray-400 dark:text-flashscore-muted hover:text-gray-600 dark:text-gray-400 dark:text-flashscore-muted"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {designationToValidate.map((designation: any) => (
                    <Card key={designation._id} className="p-4 border-2 border-blue-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-flashscore-text">
                              {designation.matchId.homeTeam} vs {designation.matchId.awayTeam}
                            </h3>
                            {designation.matchId.hasVAR && (
                              <span className="text-[11px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                VAR
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(designation.matchId.date).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {designation.matchId.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {designation.matchId.stadium}
                            </span>
                          </div>

                          {/* Referees List */}
                          {designation.referees && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Arbitres désignés:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {designation.referees.map((ref: any) => (
                                  <div key={ref.refereeId._id || ref.refereeId} className="text-xs px-2 py-1 bg-gray-50 dark:bg-flashscore-hover rounded">
                                    <span className="font-medium text-[#ce1126]">{REFEREE_ROLES[ref.role as keyof typeof REFEREE_ROLES]}:</span>
                                    {' '}
                                    <span className="text-gray-700 dark:text-gray-300">{ref.refereeId.userId.firstName} {ref.refereeId.userId.lastName}({ref.refereeId.matricule || 'Arbitre'})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="secondary"
                          onClick={() => undoDesignation(designation._id)}
                          className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          Annuler
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-flashscore-border flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowValidationModal(false)}
                >
                  Fermer
                </Button>
                <Button
                  variant="primary"
                  onClick={validateAllSubmitted}
                  disabled={designationToValidate.length === 0}
                  className="flex items-center gap-2 bg-[#ce1126] hover:bg-[#a90e1f] border-[#ce1126]"
                >
                  <CheckCircle className="w-4 h-4" />
                  Valider tout ({designationToValidate.length})
                </Button>
              </div>
            </Card>
          </div>

        )}
      </Card>

    </AuthGuard>
  );
}