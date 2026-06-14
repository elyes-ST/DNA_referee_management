'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { debounce } from '../../../utils/helpers/debounce';
import { toast } from 'sonner';
import { FormField } from '../../../components/ui/Form';
import { DeleteModal } from '../../../components/ui/DeleteModel';
import { Pagination } from '../../../components/ui/Pagination';
import { 
  PlanningHeader, 
  DateNavigator, 
  MatchFilters, 
  MatchList,
  MatchFormModal 
} from '../../../components/admin/planning';
import { 
  COMPETITION_LABELS, 
  COMPETITION_OPTIONS, 
  CATEGORY_OPTIONS, 
  STATUS_OPTIONS 
} from '../../../components/admin/planning/constants';
import { usePlanningData } from '../../../hooks/usePlanningData';
import { usePlanningActions } from '../../../hooks/usePlanningActions';
import { Card } from '../../../components/ui/Card';
import { useUser } from '../../../hooks/useUser';
import { Role } from '../../../types/user';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { CategoryC1C2Filter } from '../../../components/ui/CategoryFilter';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { can, allowedCategoriesForRole, allowedLeaguesForRole } from '../../../utils/helpers/permissions';
import { MatchDetailsModal } from '../../../components/admin/planning/MatchDetailsModal';

// ── Role → locked competition filter ────────────────────────────────────────
// These map to the backend `competition` enum values in the planning hook.
// Commission roles see ONLY their competition; the filter UI is hidden.
// CAA is handled separately via the C1/C2 category filter (covers both amateur
// competitions), so it is intentionally omitted here.
const ROLE_COMPETITION_FILTER: Partial<Record<Role, string>> = {
  [Role.CAJ]: 'JEUNES',
  [Role.CAF]: 'FEMININE',
  [Role.CRA]: 'REGIONAL',
};

// Display label for the locked filter badge
const ROLE_SCOPE_LABEL: Partial<Record<Role, string>> = {
  [Role.CAJ]: 'Jeunes',
  [Role.CAF]: 'Féminine',
  [Role.CRA]: 'Régional',
};

const Planning = () => {
  const { user } = useUser();
  // Capability flags mirror the backend MatchesController @Roles so restricted
  // admins (CAA/CAJ/CAF/CRA) get scoped CRUD + import, not just ADMIN_DNA.
  const canImportMatch = can(user?.role, 'importMatch');
  const canAddMatch    = can(user?.role, 'createMatch');
  const canEditMatch   = can(user?.role, 'editMatch');
  // CRA only: submit the played match sheet (score + notes) to the DNA
  const canSubmitSheet = user?.role === Role.CRA;
  // Restrict the category selector to the role's scope so writes never hit a 403
  const scopedCategoryOptions = (() => {
    const allowed = allowedCategoriesForRole(user?.role);
    return allowed ? CATEGORY_OPTIONS.filter((o) => allowed.includes(o.value)) : CATEGORY_OPTIONS;
  })();
  const scopedLeagueOptions = (() => {
    const allowedleagues = allowedLeaguesForRole(user?.role);
    return allowedleagues ? COMPETITION_OPTIONS.filter((o) => allowedleagues.includes(o.value)) : COMPETITION_OPTIONS;
  })();
  const lockedCompetition = user?.role ? ROLE_COMPETITION_FILTER[user.role] ?? '' : '';
  const isCommission = !!lockedCompetition;
  // CAA is scoped to both amateur sub-categories and may narrow to C1 / C2
  const isAmateur = user?.role === Role.CAA;
  const [amateurFilter, setAmateurFilter] = useState('');
  const amateurCategory = isAmateur ? (amateurFilter || 'C1') : undefined;
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // CRA match-sheet submission modal state
  const [sheetMatch, setSheetMatch] = useState<any>(null);
  const [sheetForm, setSheetForm] = useState({ homeScore: '', awayScore: '', notes: '' });

  const [activeStatusFilter, setActiveStatusFilter] = useState("Tous");
  // Commission roles start with their locked competition; admins start with "Tous"
  const [activeCompetitionFilter, setActiveCompetitionFilter] = useState(
    lockedCompetition || "Tous"
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(Date.now()));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  // Keep competition filter synced when user loads asynchronously
  useEffect(() => {
    if (isCommission && lockedCompetition) {
      setActiveCompetitionFilter(lockedCompetition);
    }
  }, [lockedCompetition, isCommission]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, activeStatusFilter, activeCompetitionFilter, amateurCategory]);

  // Fetch data
  const { matches, teams, loading, totalPages, totalItems, refetchMatches } = usePlanningData(
    selectedDate,
    activeStatusFilter,
    activeCompetitionFilter,
    currentPage,
    itemsPerPage,
    amateurCategory
  );

  // Actions
  const {
    isModalOpen,
    setIsModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    showDeleteModal,
    setShowDeleteModal,
    matchToDelete,
    setMatchToDelete,
    editForm,
    newMatch,
    handleImport,
    startEdit,
    saveEdit,
    confirmDeleteMatch,
    handleDeleteMatch,
    handleAddMatch,
    handleEditFormChange,
    handleNewMatchChange
  } = usePlanningActions(refetchMatches, teams, matches, currentPage, setCurrentPage);

  // Date navigation
  const goToPreviousDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => { setSelectedDate(new Date(Date.now())); };
  const showAllDates = () => { setSelectedDate(null); };

  // ── CRA: submit played match sheet to DNA ───────────────────────────────────
  const openSheetModal = (match: any) => {
    setSheetMatch(match);
    setSheetForm({
      homeScore: match.homeScore?.toString() ?? '',
      awayScore: match.awayScore?.toString() ?? '',
      notes: '',
    });
  };

  const handleSubmitSheet = async () => {
    if (!sheetMatch) return;
    if (sheetForm.homeScore === '' || sheetForm.awayScore === '') {
      toast.error('Veuillez saisir le score final');
      return;
    }
    try {
      await api.matches.submitSheet(sheetMatch._id, {
        score: {
          homeScore: Number(sheetForm.homeScore),
          awayScore: Number(sheetForm.awayScore),
        },
        notes: sheetForm.notes || undefined,
      });
      toast.success('Feuille de match transmise à la DNA');
      setSheetMatch(null);
      refetchMatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi de la feuille de match");
    }
  };

  // Debounced team loader for async-select
  const debouncedLoadTeamOptions = useCallback(
    debounce(async (inputValue: string, callback: Function) => {
      try {
        const response = await api.teams.getAll({ search: inputValue, page: 1, limit: 15 });
        const data = response.data.data || response.data || [];
        callback(data.map((team: any) => ({ value: team._id, label: team.name })));
      } catch {
        toast.error('Erreur lors de la récupération des équipes');
        callback([]);
      }
    }, 500),
    []
  );
  const loadTeamOptions = (inputValue: string): Promise<{ value: string; label: string }[]> => {
    if (!inputValue) {
      return Promise.resolve(
        api.teams.getAll({ page: 1, limit: 15 })
          .then((response: any) => {
            const data = response.data.data || response.data || [];
            return data.map((team: any) => ({ value: team._id, label: team.name }));
          })
          .catch(() => [] as { value: string; label: string }[])
      );
    }
    return new Promise<{ value: string; label: string }[]>((resolve) =>
      debouncedLoadTeamOptions(inputValue, resolve)
    );
  };

  // Form fields
  const matchFormFields: FormField[] = [
    { name: 'matchNumber', label: 'Numéro Match', placeholder: 'Ex: M001', required: true },
    { name: 'journee', label: 'Journée', type: 'number', required: true, min: 0 },
    { name: 'homeTeamId', type: 'async-select', loadOptions: loadTeamOptions, label: 'Équipe Domicile', placeholder: 'Rechercher une équipe...', required: true, className: 'col-span-1 md:col-span-2' },
    { name: 'awayTeamId', type: 'async-select', loadOptions: loadTeamOptions, label: 'Équipe Extérieure', placeholder: 'Rechercher une équipe...', required: true, className: 'col-span-1 md:col-span-2' },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'time', label: 'Heure', type: 'time', required: true },
    { name: 'stadium', label: 'Stade/Lieu', placeholder: 'Ex: Rades', required: true, className: "col-span-1 md:col-span-2" },
    { name: 'competition', label: 'Compétition', type: 'select', options: scopedLeagueOptions, className: "col-span-1 md:col-span-2" },
    { name: 'category', label: 'Catégorie', type: 'select', options: scopedCategoryOptions, className: "col-span-1 md:col-span-2" },
  ];

  const editFormFields: FormField[] = [
    { name: 'matchNumber', label: 'Numéro Match', placeholder: 'Ex: M001', required: true },
    { name: 'journee', label: 'Journée', type: 'number', required: true, min: 0 },
    { name: 'homeTeamId', type: 'async-select', loadOptions: loadTeamOptions, label: 'Équipe Domicile', placeholder: 'Rechercher une équipe...', required: true, className: 'col-span-1 md:col-span-2', defaultLabel: editForm.homeTeam },
    { name: 'awayTeamId', type: 'async-select', loadOptions: loadTeamOptions, label: 'Équipe Extérieure', placeholder: 'Rechercher une équipe...', required: true, className: 'col-span-1 md:col-span-2', defaultLabel: editForm.awayTeam },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'time', label: 'Heure', type: 'time', required: true },
    { name: 'stadium', label: 'Stade/Lieu', placeholder: 'Ex: Rades', required: true, className: "col-span-1 md:col-span-2" },
    { name: 'competition', label: 'Compétition', type: 'select', options: scopedLeagueOptions, className: "col-span-1 md:col-span-2" },
    { name: 'category', label: 'Catégorie', type: 'select', options: scopedCategoryOptions, className: "col-span-1 md:col-span-2" },
    { name: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS, className: "col-span-1 md:col-span-2" },
    { name: 'homeScore', label: 'Score Domicile', type: 'number', min: 0 },
    { name: 'awayScore', label: 'Score Extérieur', type: 'number', min: 0 },
  ];

  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.DESIGNATION_DNA, Role.FINANCE_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA, Role.CDC, Role.CDE, Role.INSPECTEUR]}>
    <div className="animate-fadeIn">
      {/* Header with actions */}
    <Card className="px-6">
      <PlanningHeader
        onImport={handleImport}
        onAddMatch={() => setIsModalOpen(true)}
        onGoToToday={goToToday}
        onShowAll={showAllDates}
        canImport={canImportMatch}
        canAddMatch={canAddMatch}
      />

      {/* Date Navigation */}
      <DateNavigator
        selectedDate={selectedDate}
        onPrevious={goToPreviousDay}
        onNext={goToNextDay}
      />
      </Card>

      {/* CAA: C1/C2 sub-filter. Other commission roles: scope badge. Admin: full filters */}
      {isAmateur ? (
        <div className="mt-4 px-1 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Catégorie amateur :</span>
          <CategoryC1C2Filter value={amateurFilter} onChange={setAmateurFilter} />
        </div>
      ) : isCommission ? (
        <div className="mt-4 px-1 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Affichage limité au match du categorie :</span>
          <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
            {ROLE_SCOPE_LABEL[user!.role] ?? lockedCompetition}
          </span>
        </div>
      ) : (
        /* Filters — only shown for admin/designation/finance */
        <MatchFilters
          activeStatusFilter={activeStatusFilter}
          activeCompetitionFilter={activeCompetitionFilter}
          onStatusChange={setActiveStatusFilter}
          onCompetitionChange={setActiveCompetitionFilter}
          competitionLabels={COMPETITION_LABELS}
        />
      )}

      {/* Matches List */}
          <MatchList
        matches={matches}
        loading={loading}
        competitionLabels={COMPETITION_LABELS}
        onEditMatch={startEdit}
        onDeleteMatch={confirmDeleteMatch}
        canEditDelete={canEditMatch}
        canSubmitSheet={canSubmitSheet}
        onSubmitSheet={openSheetModal}
        onMatchClick={setSelectedMatch}
      />

      {/* Pagination */}
      {!loading && matches.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
        />
      )}

      {/* Add Match Modal */}
      <MatchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un Match"
        formData={newMatch}
        onChange={handleNewMatchChange}
        onSubmit={handleAddMatch}
        fields={matchFormFields}
        teams={teams}
      />

      {/* Edit Match Modal */}
      <MatchFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier le Match"
        formData={editForm}
        onChange={handleEditFormChange}
        onSubmit={saveEdit}
        fields={editFormFields}
        teams={teams}
      />
            <MatchDetailsModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        competitionLabels={COMPETITION_LABELS}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        setEventToDelete={setMatchToDelete}
        handleDelete={handleDeleteMatch}
        message="Êtes-vous sûr de vouloir supprimer ce match ? Cette action est irréversible."
      />

      {/* CRA: Submit Match Sheet Modal */}
      <Modal
        isOpen={!!sheetMatch}
        onClose={() => setSheetMatch(null)}
        title="Feuille de match"
      >
        {sheetMatch && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
              {sheetMatch.homeTeam?.name} <span className="text-gray-400 dark:text-flashscore-muted">vs</span> {sheetMatch.awayTeam?.name}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="homeScore"
                type="number"
                min={0}
                label="Score domicile"
                value={sheetForm.homeScore}
                onChange={(e: any) => setSheetForm({ ...sheetForm, homeScore: e.target.value })}
              />
              <Input
                id="awayScore"
                type="number"
                min={0}
                label="Score extérieur"
                value={sheetForm.awayScore}
                onChange={(e: any) => setSheetForm({ ...sheetForm, awayScore: e.target.value })}
              />
            </div>
            <Input
              id="notes"
              type="textarea"
              label="Notes (optionnel)"
              placeholder="Observations de la CRA"
              value={sheetForm.notes}
              onChange={(e: any) => setSheetForm({ ...sheetForm, notes: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSheetMatch(null)}>Annuler</Button>
              <Button variant="primary" onClick={handleSubmitSheet}>Transmettre à la DNA</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </AuthGuard>
  );
};

export default Planning;
