'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/admin/StatCard';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Modal } from '../../../components/ui/Modal';
import { Form } from '../../../components/ui/Form';
import { Avatar } from '../../../components/ui/Avatar';
import { debounce } from '../../../utils/helpers/debounce';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from 'sonner';
import {
  DollarSign,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { usePayments, usePaymentStatistics, type Payment } from '../../../hooks/usePayments';
import { api } from '../../../services/api';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { getSaisonFromDate } from '../../../utils/helpers/season-from-date';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { CategoryC1C2Filter } from '../../../components/ui/CategoryFilter';
import { Role } from '../../../types/user';
import { useUser } from '../../../hooks/useUser';

/** Maps commission role → payment category param */
const ROLE_CATEGORY: Partial<Record<Role, string>> = {
  [Role.CAA]: 'C1',
  [Role.CAJ]: 'JEUNE',
  [Role.CAF]: 'FEMININE',
  [Role.CRA]: 'REGIONAL',
};

// ─── Stepper step type ───────────────────────────────────────────────────────
type GenerateStep = 1 | 2 | 3;

const PaymentsPage = () => {
  const { user } = useUser();
  const isAmateur = user?.role === Role.CAA;
  const [amateurFilter, setAmateurFilter] = useState('');
  const roleCategory = user?.role ? ROLE_CATEGORY[user.role] ?? '' : '';
  const isCommission = !!roleCategory;
  const commissionCategory = isAmateur ? (amateurFilter || 'C1') : roleCategory;
  const [activeTab, setActiveTab] = useState('PAYMENTS');

  // ── Referee tab state ────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    category: '',
    search: '',
    league: '',
  });
  const [loadingReferees, setLoadingReferees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalReferees, setTotalReferees] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [referees, setReferees] = useState<any[]>([]);

  // ── Inline stepper state (replaces the 3 modal chain) ───────────────────
  const [generateStep, setGenerateStep] = useState<GenerateStep | null>(null);
  const [generateForm, setGenerateForm] = useState({ startDate: '', endDate: '', label: '' });
  const [selectedReferee, setSelectedReferee] = useState<any>(null); // full referee object
  const [newReferee, setNewReferee] = useState<any>(null);
  const [previewMatches, setPreviewMatches] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [rejectedMatches, setRejectedMatches] = useState<string[]>([]);
  const [matchToReplace, setMatchToReplace] = useState<any>(null);
  const matchToReplaceRef = useRef<any>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  // ── Rates tab state ──────────────────────────────────────────────────────
  const [rates, setRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesFilters, setRatesFilters] = useState({
    category: '',
    competition: '',
    page: 1,
    limit: 8,
  });
  const [totalRates, setTotalRates] = useState(0);
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [rateForm, setRateForm] = useState({
    category: 'A',
    competition: 'LIGUE_1',
    amount: '',
    role: '',
    saison: getSaisonFromDate(),
  });

  // ── Payments tab state ───────────────────────────────────────────────────
  const [paymentFilters, setPaymentFilters] = useState({
    page: 1,
    limit: 8,
    status: '',
    category: roleCategory,
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [paymentMethodInput, setPaymentMethodInput] = useState('');
  const [referenceNumberInput, setReferenceNumberInput] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ── Sync commission category ─────────────────────────────────────────────
  useEffect(() => {
    if (isCommission) {
      setPaymentFilters((f) => ({ ...f, category: commissionCategory, page: 1 }));
      setFilters((f) => ({ ...f, category: commissionCategory, page: 1 }));
    }
  }, [commissionCategory, isCommission]);

  const { payments, loading, error, refetch, total } = usePayments(paymentFilters);
  const canViewStats = !isCommission;
  const { statistics, loading: statsLoading } = usePaymentStatistics(
    canViewStats ? { startDate: '2025-01-01', endDate: '2026-12-31' } : undefined
  );

  useEffect(() => {
    if (activeTab === 'RATES') fetchRates();
    else if (activeTab === 'REFEREES') fetchReferees();
    else refetch();
  }, [activeTab, ratesFilters, filters]);

  // ── Data fetchers ────────────────────────────────────────────────────────
  const fetchReferees = async () => {
    setLoadingReferees(true);
    try {
      const params: any = { page: filters.page, limit: filters.limit };
      if (filters.category) params.category = filters.category;
      if (filters.league) params.league = filters.league;
      if (filters.search) params.search = filters.search;
      const response = await api.referees.getAll(params);
      const data: any = response.data;
      setReferees(data.data || []);
      setTotalReferees(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error('Erreur lors du chargement des arbitres');
    } finally {
      setLoadingReferees(false);
    }
  };

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const params: any = { page: ratesFilters.page, limit: ratesFilters.limit };
      if (ratesFilters.category) params.category = ratesFilters.category;
      if (ratesFilters.competition) params.competition = ratesFilters.competition;
      const response = await api.paymentRates.getAll(params);
      setRates(response.data.rates || []);
      setTotalRates(response.data.total || 0);
    } catch (err) {
      toast.error('Erreur lors du chargement des barèmes');
    } finally {
      setLoadingRates(false);
    }
  };

  // ── Generate invoice stepper handlers ────────────────────────────────────

  /** Step 1 → 2: validate inputs then preview matches */
  const handleLoadMatches = async () => {
    if (!selectedReferee) { toast.error('Veuillez sélectionner un arbitre'); return; }
    if (!generateForm.startDate || !generateForm.endDate) { toast.error('Veuillez sélectionner une période'); return; }
    setLoadingPreview(true);
    try {
      const response = await api.payments.previewMatches({
        refereeId: selectedReferee._id || selectedReferee.id,
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
      });
      setPreviewMatches(response.data);
      setSelectedMatches([]);
      setRejectedMatches([]);
      setGenerateStep(2);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des matchs');
    } finally {
      setLoadingPreview(false);
    }
  };

  /** Toggle a match in/out of the selection */
  const toggleMatch = (matchId: string, checked: boolean) => {
    setSelectedMatches((prev) =>
      checked ? [...prev, matchId] : prev.filter((id) => id !== matchId)
    );
  };

  /** Select all non-rejected matches */
  const selectAllMatches = () => {
    setSelectedMatches(
      previewMatches.filter((m) => !rejectedMatches.includes(m.matchId)).map((m) => m.matchId)
    );
  };

  /** Exclude a match from the invoice (soft-remove) */
  const excludeMatch = (matchId: string) => {
    setRejectedMatches((prev) => [...prev, matchId]);
    setSelectedMatches((prev) => prev.filter((id) => id !== matchId));
  };

  /** Step 3: generate the actual invoice */
  const handleFinalGenerateInvoice = async () => {
    if (selectedMatches.length === 0) { toast.error('Veuillez sélectionner au moins un match'); return; }
    try {
      await api.payments.generate({
        refereeId: selectedReferee._id || selectedReferee.id,
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
        matchIds: selectedMatches,
        label: generateForm.label || undefined,
      });
      toast.success('Facture générée avec succès');
      resetStepper();
      refetch();
      setActiveTab('PAYMENTS');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération');
    }
  };

  /** Reset stepper back to the referee table */
  const resetStepper = () => {
    setGenerateStep(null);
    setSelectedReferee(null);
    setGenerateForm({ startDate: '', endDate: '', label: '' });
    setPreviewMatches([]);
    setSelectedMatches([]);
    setRejectedMatches([]);
    setNewReferee(null);
  };

  // ── Replace referee (opens a small modal from step 2) ────────────────────
  const debouncedLoadReferees = useCallback(
    debounce(async (inputValue: string, callback: Function) => {
      try {
        const match = matchToReplaceRef.current;
        if (match) {
          const response = await api.designations.getEligibleReferees(match.matchId, { role: match.role });
          let eligible = response.data || [];
          if (inputValue) {
            const terms = inputValue.toLowerCase().split(/\s+/).filter(Boolean);
            eligible = eligible.filter((item: any) => {
              const name = `${item.referee.userId?.firstName || ''} ${item.referee.userId?.lastName || ''} ${item.referee.matricule}`.toLowerCase();
              return terms.every((term) => name.includes(term));
            });
          }
          callback(
            eligible.slice(0, 50).map((item: any) => {
              const r = item.referee;
              const warn = item.warnings?.length ? ` (⚠️ ${item.warnings.join(', ')})` : '';
              return {
                value: r._id,
                label: `${r.userId?.firstName || ''} ${r.userId?.lastName || ''} (${r.matricule}) - ${r.category} - ${r.region}${warn}`,
              };
            })
          );
        } else {
          const response = await api.referees.getAll({ search: inputValue, page: 1, limit: 50 });
          callback(
            response.data.data.map((r: any) => ({
              value: r._id,
              label: `${r.userId?.firstName || ''} ${r.userId?.lastName || ''} (${r.matricule}) - ${r.category} - ${r.region}`,
            }))
          );
        }
      } catch {
        callback([]);
      }
    }, 500),
    []
  );

  const loadRefereesAsync = (inputValue: string) =>
    new Promise((resolve) => debouncedLoadReferees(inputValue, resolve));

  const handleReplaceReferee = async (match: any, newRefereeId: string) => {
    try {
      const res = await api.designations.getByMatch(match.matchId);
      const oldDesig = res.data;
      const refId = selectedReferee?._id || selectedReferee?.id;
      const updatedReferees = oldDesig.referees.map((r: any) => {
        const rid = r.refereeId?._id || r.refereeId;
        return rid === refId ? { refereeId: newRefereeId, role: r.role } : { refereeId: rid, role: r.role };
      });
      await api.designations.update(oldDesig._id, { referees: updatedReferees });
      toast.success('Désignation mise à jour');
      setLoadingPreview(true);
      const response = await api.payments.previewMatches({
        refereeId: refId,
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
      });
      setPreviewMatches(response.data);
      setSelectedMatches([]);
      setNewReferee(null);
      setShowReplaceModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur update désignation');
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Payment tab handlers ─────────────────────────────────────────────────
  const handleValidatePayment = async (paymentId: string) => {
    try {
      await api.payments.validate(paymentId);
      toast.success('Paiement validé avec succès!');
      refetch();
    } catch {
      toast.error('Erreur lors de la validation du paiement');
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment) return;
    if (!rejectReasonInput) { toast.error('Veuillez fournir une raison de rejet'); return; }
    try {
      await api.payments.reject(selectedPayment._id, { reason: rejectReasonInput });
      toast.success('Paiement rejeté avec succès!');
      refetch();
    } catch {
      toast.error('Erreur lors du rejet du paiement');
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedPayment) return;
    if (!paymentMethodInput) { toast.error('Veuillez sélectionner une méthode de paiement'); return; }
    try {
      await api.payments.markPaid(selectedPayment._id, {
        paymentMethod: paymentMethodInput,
        referenceNumber: referenceNumberInput || undefined,
      });
      toast.success('Paiement marqué comme payé avec succès!');
      refetch();
    } catch {
      toast.error('Erreur lors du marquage du paiement comme payé');
    }
  };

  // ── Rates handlers ───────────────────────────────────────────────────────
  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.category || !rateForm.competition || !rateForm.amount || !rateForm.role) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await api.paymentRates.create({
        category: rateForm.category,
        competition: rateForm.competition,
        amount: parseFloat(rateForm.amount),
        role: rateForm.role,
      });
      toast.success('Barème créé avec succès!');
      setShowRateModal(false);
      setRateForm({ category: 'A', competition: 'LIGUE_1', amount: '', role: '', saison: getSaisonFromDate() });
      fetchRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du barème');
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRate || !rateForm.amount) { toast.error('Veuillez remplir le montant'); return; }
    try {
      await api.paymentRates.update(selectedRate._id, { amount: parseFloat(rateForm.amount) });
      toast.success('Barème modifié avec succès!');
      setShowRateModal(false);
      setSelectedRate(null);
      setRateForm({ category: 'A', competition: 'LIGUE1', amount: '', role: '', saison: getSaisonFromDate() });
      fetchRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification du barème');
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce barème ?')) return;
    try {
      await api.paymentRates.delete(rateId);
      toast.success('Barème supprimé avec succès!');
      fetchRates();
    } catch {
      toast.error('Erreur lors de la suppression du barème');
    }
  };

  const openEditModal = (rate: any) => {
    setSelectedRate(rate);
    setRateForm({ category: rate.category, competition: rate.competition, amount: rate.amount.toString(), role: rate.role || '', saison: rate.saison || getSaisonFromDate() });
    setShowRateModal(true);
  };

  const openCreateModal = () => {
    setSelectedRate(null);
    setRateForm({ category: 'A', competition: 'LIGUE1', amount: '', role: '', saison: getSaisonFromDate() });
    setShowRateModal(true);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const map: Record<string, any> = {
      PENDING: { label: 'En attente', status: 'warning' },
      VALIDATED: { label: 'Validé', status: 'success' },
      PAID: { label: 'Payé', status: 'success' },
      REJECTED: { label: 'Rejeté', status: 'error' },
    };
    const cfg = map[status] || { label: status, status: 'default' };
    return <Badge status={cfg.status}>{cfg.label}</Badge>;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  useEffect(() => {
    setFilters((f) => (f.search === debouncedSearchTerm ? f : { ...f, search: debouncedSearchTerm, page: 1 }));
  }, [debouncedSearchTerm]);

  // ── Static option maps ───────────────────────────────────────────────────
  const competitionMapper: Record<string, string> = {
    LIGUE1: 'Ligue 1', LIGUE2: 'Ligue 2', COUPE: 'Coupe de Tunisie',
    AMATEUR_C1: 'Amateur C1', AMATEUR_C2: 'Amateur C2',
    JEUNES: 'Jeunes', FEMININE: 'Féminine', REGIONAL: 'Régional',
  };
  const categoryMapper: Record<string, string> = {
    A: 'Catégorie A', B: 'Catégorie B', C: 'Catégorie C',
    C1: 'Amateur C1', C2: 'Amateur C2',
    JEUNE: 'Jeune', FEMININE: 'Féminine', REGIONAL: 'Régional',
  };
  const roleMapper: Record<string, string> = {
    ARBITRE_CENTRAL: 'Arbitre Central', ASSISTANT_1: 'Assistant 1',
    ASSISTANT_2: 'Assistant 2', QUATRIEME_ARBITRE: '4ème Arbitre',
    ARBITRE_VAR: 'Arbitre VAR', ASSISTANT_VAR: 'Assistant VAR 1',
  };
  const categoryOption = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'A', label: 'Catégorie A' }, { value: 'B', label: 'Catégorie B' },
    { value: 'C1', label: 'Catégorie Amateur C1' }, { value: 'C2', label: 'Catégorie Amateur C2' },
    { value: 'JEUNE', label: 'Catégorie Jeune' }, { value: 'FEMININE', label: 'Catégorie Féminine' },
    { value: 'REGIONAL', label: 'Catégorie Régionale' },
  ];
  const competitionOption = [
    { value: '', label: 'Toutes les compétitions' },
    { value: 'LIGUE1', label: 'Ligue 1' }, { value: 'LIGUE2', label: 'Ligue 2' },
    { value: 'REGIONAL', label: 'Régionale' }, { value: 'COUPE', label: 'Coupe de Tunisie' },
    { value: 'AMATEUR_C1', label: 'Amateur C1' }, { value: 'AMATEUR_C2', label: 'Amateur C2' },
    { value: 'JEUNES', label: 'Jeunes' }, { value: 'FEMININE', label: 'Féminine' },
  ];
  const roleOptions = [
    { value: 'ARBITRE_CENTRAL', label: 'Arbitre Central' }, { value: 'ASSISTANT_1', label: 'Assistant 1' },
    { value: 'ASSISTANT_2', label: 'Assistant 2' }, { value: 'QUATRIEME_ARBITRE', label: '4ème Arbitre' },
    { value: 'ARBITRE_VAR', label: 'Arbitre VAR' }, { value: 'ASSISTANT_VAR', label: 'Assistant VAR 1' },
  ];

  // ── Derived values for step 2 & 3 ────────────────────────────────────────
  const activeMatches = previewMatches.filter((m) => !rejectedMatches.includes(m.matchId));
  const chosenMatches = activeMatches.filter((m) => selectedMatches.includes(m.matchId));
  const totalBase = chosenMatches.reduce((s, m) => s + (m.baseAmount ?? 0), 0);
  const totalBonus = chosenMatches.reduce((s, m) => s + (m.bonus ?? 0), 0);
  const totalDeduct = chosenMatches.reduce((s, m) => s + (m.deduction ?? 0), 0);
  const totalAmount = totalBase + totalBonus - totalDeduct;

  // ── Stepper UI helper ────────────────────────────────────────────────────
  const StepIndicator = () => {
    const steps = [
      { n: 1, label: 'Arbitre & période' },
      { n: 2, label: 'Sélection des matchs' },
      { n: 3, label: 'Aperçu & génération' },
    ];
    return (
      <div className="flex items-center mb-8">
        {steps.map((s, idx) => {
          const done = (generateStep ?? 0) > s.n;
          const active = generateStep === s.n;
          return (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors
                    ${done ? 'bg-green-600 border-green-600 text-white'
                    : active ? 'bg-[#ce1126] border-[#ce1126] text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'}`}
                >
                  {done ? <Check className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-xs mt-1.5 whitespace-nowrap font-medium
                  ${active ? 'text-[#ce1126]' : done ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-5 transition-colors ${done ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── Loading gate ─────────────────────────────────────────────────────────
  if (loading && !payments.length) {
    return (
      <AuthGuard role={[Role.ADMIN_DNA, Role.FINANCE_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126] mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Chargement des paiements...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.FINANCE_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA]}>
      <Card className="animate-fadeIn">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-2">Gestion des Paiements</h1>
          <p className="text-gray-600 dark:text-flashscore-muted">Générez, validez et gérez les paiements des arbitres</p>
        </div>

        {/* ── Statistics ───────────────────────────────────────────────── */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Total des Paiements" value={(statistics.overview.totalPayments || 0).toString()}
              trend={`${((statistics.overview.totalAmount || 0) / 1000).toFixed(1)}k TND`} trendType="positive"
              icon={<DollarSign className="w-8 h-8 text-blue-500" />} />
            <StatCard title="En Attente" value={(statistics.byStatus?.find((s: any) => s._id === 'PENDING')?.count || 0).toString()}
              icon={<Clock className="w-8 h-8 text-amber-500" />} />
            <StatCard title="Validés" value={(statistics.byStatus?.find((s: any) => s._id === 'VALIDATED')?.count || 0).toString()}
              icon={<CheckCircle className="w-8 h-8 text-green-500" />} />
            <StatCard title="Payés" value={(statistics.byStatus?.find((s: any) => s._id === 'PAID')?.count || 0).toString()}
              icon={<CheckCircle className="w-8 h-8 text-blue-500" />} />
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-flashscore-border">
          {[
            { id: 'PAYMENTS', label: 'Paiements' },
            { id: 'REFEREES', label: 'Arbitres' },
            ...(!isCommission ? [{ id: 'RATES', label: 'Barèmes' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== 'REFEREES') resetStepper(); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#ce1126] text-[#ce1126]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            REFEREES TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'REFEREES' && (
          <>
            {/* When no step is active → show the referee table */}
            {generateStep === null && (
              <>
                <Card className="mb-6">
                  <div className="flex flex-wrap gap-3 flex-1">
                    {!isCommission && (
                      <Input
                        id="category-filter2"
                        type="select"
                        placeholder="Toutes les catégories"
                        value={filters.category}
                        onChange={(e: any) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                        options={categoryOption}
                      />
                    )}
                    {isAmateur ? (
                      <CategoryC1C2Filter value={amateurFilter} onChange={setAmateurFilter} />
                    ) : isCommission && (
                      <span className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                        Catégorie : {categoryMapper[roleCategory] || roleCategory}
                      </span>
                    )}
                    <Input
                      id="search-referees"
                      placeholder="Rechercher un arbitre..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      icon={<Search className="w-4 h-4" />}
                    />
                  </div>
                </Card>

                <Card>
                  <Table headers={['Arbitre', 'Matricule', 'Catégorie', 'Région', 'Ligue', 'Statut', 'Actions']}>
                    {referees.map((u: any, idx: number) => {
                      const firstName = u.userId?.firstName || u.firstName || '';
                      const lastName = u.userId?.lastName || u.lastName || '';
                      const fullName = `${firstName} ${lastName}`.trim();
                      return (
                        <TableRow key={`referee-${u._id || u.id}-${idx}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar name={fullName} size="sm" />
                              <div className="font-medium">{fullName || '-'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{u.matricule || '-'}</TableCell>
                          <TableCell>{categoryMapper[u.category] || u.category || '-'}</TableCell>
                          <TableCell>{u.region || '-'}</TableCell>
                          <TableCell>{u.league || '-'}</TableCell>
                          <TableCell>
                            <Badge status={u.userId?.isActive ? 'Actif' : 'Indisponible'}>
                              {u.userId?.isActive ? 'Actif' : 'Indisponible'}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex gap-2 mt-2.5 items-center justify-center">
                            <button
                              title="Générer un Paiement"
                              className="hover:text-red-500 bg-transparent border-none p-0 cursor-pointer"
                              onClick={() => {
                                setSelectedReferee(u);
                                setGenerateStep(1);
                              }}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Table>

                  {referees.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-flashscore-muted">Aucun arbitre trouvé</p>
                    </div>
                  )}

                  {totalPages > 1 && referees.length > 0 && (
                    <Pagination
                      currentPage={filters.page}
                      totalPages={totalPages}
                      onPageChange={(page) => setFilters({ ...filters, page })}
                      totalItems={totalReferees}
                    />
                  )}
                </Card>
              </>
            )}

            {/* ── STEP 1: Période ──────────────────────────────────────── */}
            {generateStep !== null && (
              <div>
                <StepIndicator />

                {generateStep === 1 && (
                  <>
                    {/* Selected referee pill */}
                    <Card className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-flashscore-muted mb-2 font-medium uppercase tracking-wide">Arbitre sélectionné</p>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${selectedReferee?.userId?.firstName || selectedReferee?.firstName || ''} ${selectedReferee?.userId?.lastName || selectedReferee?.lastName || ''}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-flashscore-text">
                            {selectedReferee?.userId?.firstName || selectedReferee?.firstName}{' '}
                            {selectedReferee?.userId?.lastName || selectedReferee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-flashscore-muted">
                            {selectedReferee?.matricule} · {categoryMapper[selectedReferee?.category] || selectedReferee?.category}
                          </p>
                        </div>
                        <button
                          className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 underline"
                          onClick={resetStepper}
                        >
                          Changer
                        </button>
                      </div>
                    </Card>

                    <Card className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-flashscore-muted mb-3 font-medium uppercase tracking-wide">Période de paiement</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-flashscore-muted mb-1">Date de début *</label>
                          <input
                            type="date"
                            className="w-full border border-gray-300 dark:border-flashscore-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-flashscore-card text-gray-900 dark:text-flashscore-text focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
                            value={generateForm.startDate}
                            onChange={(e) => setGenerateForm((f) => ({ ...f, startDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-flashscore-muted mb-1">Date de fin *</label>
                          <input
                            type="date"
                            className="w-full border border-gray-300 dark:border-flashscore-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-flashscore-card text-gray-900 dark:text-flashscore-text focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
                            value={generateForm.endDate}
                            onChange={(e) => setGenerateForm((f) => ({ ...f, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-flashscore-muted mb-1">Libellé <span className="text-gray-400">(optionnel)</span></label>
                        <input
                          type="text"
                          placeholder="Ex : Journée 12 Ligue 1"
                          className="w-full border border-gray-300 dark:border-flashscore-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-flashscore-card text-gray-900 dark:text-flashscore-text focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
                          value={generateForm.label}
                          onChange={(e) => setGenerateForm((f) => ({ ...f, label: e.target.value }))}
                        />
                      </div>
                    </Card>

                    <div className="flex justify-between gap-3 mt-4">
                      <Button variant="secondary" onClick={resetStepper}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux arbitres
                      </Button>
                      <Button variant="primary" onClick={handleLoadMatches} disabled={loadingPreview}>
                        {loadingPreview ? 'Chargement...' : <><ArrowRight className="w-4 h-4 mr-1" /> Charger les matchs</>}
                      </Button>
                    </div>
                  </>
                )}

                {/* ── STEP 2: Match selection ─────────────────────────── */}
                {generateStep === 2 && (
                  <>
                    {/* Summary metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 dark:bg-flashscore-hover rounded-xl">
                        <p className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">{activeMatches.length}</p>
                        <p className="text-xs text-gray-500 dark:text-flashscore-muted mt-1">Matchs trouvés</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-flashscore-hover rounded-xl">
                        <p className="text-2xl font-bold text-green-600">{chosenMatches.length}</p>
                        <p className="text-xs text-gray-500 dark:text-flashscore-muted mt-1">Sélectionnés</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-flashscore-hover rounded-xl">
                        <p className="text-2xl font-bold text-[#ce1126]">{totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-flashscore-muted mt-1">TND estimé</p>
                      </div>
                    </div>

                    {/* Bulk actions toolbar */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <span className="text-sm text-gray-600 dark:text-flashscore-muted">
                        {chosenMatches.length} match(s) sélectionné(s)
                      </span>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={selectAllMatches}>
                          Tout valider
                        </Button>
                        <Button variant="secondary" onClick={() => setSelectedMatches([])}>
                          Tout désélectionner
                        </Button>
                      </div>
                    </div>

                    {/* Match cards */}
                    {loadingPreview ? (
                      <div className="text-center py-12 text-gray-500 dark:text-flashscore-muted">
                        Chargement des matchs...
                      </div>
                    ) : activeMatches.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-flashscore-muted">
                        Aucun match trouvé pour cette période
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                        {previewMatches.map((match) => {
                          const isRejected = rejectedMatches.includes(match.matchId);
                          const isSelected = selectedMatches.includes(match.matchId);
                          const matchTotal = (match.totalAmount ?? (match.baseAmount ?? 0) + (match.bonus ?? 0) - (match.deduction ?? 0));

                          return (
                            <div
                              key={match.matchId}
                              className={`rounded-xl border p-4 transition-all ${
                                isRejected
                                  ? 'opacity-40 border-gray-200 dark:border-flashscore-border bg-gray-50 dark:bg-flashscore-hover'
                                  : isSelected
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                                  : 'border-gray-200 dark:border-flashscore-border'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <input
                                  type="checkbox"
                                  className="mt-1 w-4 h-4 accent-green-600 cursor-pointer"
                                  checked={isSelected && !isRejected}
                                  disabled={isRejected}
                                  onChange={(e) => toggleMatch(match.matchId, e.target.checked)}
                                />

                                {/* Match info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div>
                                      <h3 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text">
                                        {match.homeTeam} <span className="text-gray-400 font-normal">vs</span> {match.awayTeam}
                                      </h3>
                                      <p className="text-xs text-gray-500 dark:text-flashscore-muted mt-0.5">
                                        #{match.matchNumber} · {new Date(match.date).toLocaleDateString('fr-FR')} · {match.stadium}
                                      </p>
                                      <div className="flex gap-2 mt-1.5 flex-wrap">
                                        <Badge status={match.paymentCalculated ? 'success' : 'warning'}>
                                          {match.paymentCalculated ? 'Calculé' : 'Non calculé'}
                                        </Badge>
                                        <span className="text-xs text-gray-500 dark:text-flashscore-muted self-center">
                                          {match.competition} · {match.role?.replaceAll('_', ' ')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Amount + actions */}
                                    <div className="text-right shrink-0">
                                      <p className="text-base font-bold text-gray-900 dark:text-flashscore-text">
                                        {matchTotal.toFixed(2)} TND
                                      </p>
                                      <p className="text-xs text-gray-400 dark:text-flashscore-muted">
                                        {match.baseAmount} base
                                        {match.bonus > 0 && <span className="text-green-600"> +{match.bonus}</span>}
                                        {match.deduction > 0 && <span className="text-red-500"> -{match.deduction}</span>}
                                      </p>
                                      {!isRejected ? (
                                        <div className="flex gap-1 justify-end mt-1.5">
                                          <button
                                            className="text-xs text-gray-400 hover:text-red-500 underline"
                                            onClick={() => excludeMatch(match.matchId)}
                                          >
                                            Exclure
                                          </button>
                                          <span className="text-gray-300 mx-0.5">·</span>
                                          <button
                                            className="text-xs text-gray-400 hover:text-blue-500 underline"
                                            onClick={() => {
                                              matchToReplaceRef.current = match;
                                              setMatchToReplace(match);
                                              setShowReplaceModal(true);
                                            }}
                                          >
                                            Remplacer
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="inline-block mt-1.5 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                          Exclu
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-flashscore-border">
                      <Button variant="secondary" onClick={() => setGenerateStep(1)}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                      </Button>
                      <Button
                        variant="primary"
                        disabled={chosenMatches.length === 0}
                        onClick={() => setGenerateStep(3)}
                      >
                        Aperçu de la facture <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </>
                )}

                {/* ── STEP 3: Invoice preview ─────────────────────────── */}
                {generateStep === 3 && (
                  <>
                    {/* Invoice preview card */}
                    <Card className="mb-4 bg-gray-50 dark:bg-flashscore-hover">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-flashscore-muted mb-1">
                            Facture paiement arbitre
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-flashscore-text">
                            {generateForm.label || `Paiement — ${selectedReferee?.userId?.firstName || selectedReferee?.firstName} ${selectedReferee?.userId?.lastName || selectedReferee?.lastName}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-flashscore-muted">
                            Du {new Date(generateForm.startDate).toLocaleDateString('fr-FR')} au {new Date(generateForm.endDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-flashscore-muted">
                          {new Date().toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-flashscore-card rounded-lg border border-gray-200 dark:border-flashscore-border">
                        <Avatar
                          name={`${selectedReferee?.userId?.firstName || selectedReferee?.firstName || ''} ${selectedReferee?.userId?.lastName || selectedReferee?.lastName || ''}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-flashscore-text">
                            {selectedReferee?.userId?.firstName || selectedReferee?.firstName}{' '}
                            {selectedReferee?.userId?.lastName || selectedReferee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-flashscore-muted">
                            {selectedReferee?.matricule} · {categoryMapper[selectedReferee?.category] || selectedReferee?.category}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Match summary list */}
                    <Card className="mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-flashscore-text mb-3">
                        Matchs inclus ({chosenMatches.length})
                      </p>
                      <div className="space-y-2">
                        {chosenMatches.map((match) => {
                          const t = (match.totalAmount ?? (match.baseAmount ?? 0) + (match.bonus ?? 0) - (match.deduction ?? 0));
                          return (
                            <div key={match.matchId} className="flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-flashscore-border last:border-0">
                              <span className="text-gray-700 dark:text-flashscore-text">
                                {match.homeTeam} vs {match.awayTeam}
                                <span className="text-gray-400 text-xs ml-2">{new Date(match.date).toLocaleDateString('fr-FR')}</span>
                              </span>
                              <span className="font-medium text-gray-900 dark:text-flashscore-text shrink-0 ml-3">{t.toFixed(2)} TND</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Financial summary */}
                    <Card className="mb-6">
                      <p className="text-sm font-medium text-gray-900 dark:text-flashscore-text mb-3">Détail financier</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-flashscore-muted">Montant de base</span>
                          <span className="text-gray-900 dark:text-flashscore-text">{totalBase.toFixed(2)} TND</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Bonus</span>
                          <span className="text-green-600">+ {totalBonus.toFixed(2)} TND</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-500">Déductions</span>
                          <span className="text-red-500">- {totalDeduct.toFixed(2)} TND</span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-flashscore-border pt-2 mt-2">
                          <span className="text-gray-900 dark:text-flashscore-text">Total à payer</span>
                          <span className="text-[#ce1126] text-lg">{totalAmount.toFixed(2)} TND</span>
                        </div>
                      </div>
                    </Card>

                    <div className="flex justify-between gap-3">
                      <Button variant="secondary" onClick={() => setGenerateStep(2)}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Modifier la sélection
                      </Button>
                      <Button variant="primary" onClick={handleFinalGenerateInvoice}>
                        <Check className="w-4 h-4 mr-1" /> Confirmer et générer
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Replace referee modal (compact, from step 2) ─────────── */}
            <Modal
              isOpen={showReplaceModal}
              onClose={() => { setShowReplaceModal(false); setNewReferee(null); }}
              title="Remplacer l'arbitre"
            >
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-flashscore-muted">
                  Match : <strong>{matchToReplace?.homeTeam} vs {matchToReplace?.awayTeam}</strong>
                </p>
                <Input
                  id="referee-select"
                  type="async-select"
                  placeholder="Rechercher un arbitre..."
                  value={newReferee}
                  loadOptions={loadRefereesAsync as any}
                  onChange={(e: any) => setNewReferee(e.target.value)}
                />
                <Button
                  disabled={!newReferee}
                  onClick={() => handleReplaceReferee(matchToReplaceRef.current, newReferee)}
                  className="w-full"
                >
                  Confirmer le remplacement
                </Button>
              </div>
            </Modal>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PAYMENTS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'PAYMENTS' && (
          <>
            <Card className="mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                <div className="flex flex-wrap gap-3 flex-1">
                  {isAmateur ? (
                    <CategoryC1C2Filter value={amateurFilter} onChange={setAmateurFilter} />
                  ) : isCommission ? (
                    <span className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                      Catégorie : {categoryMapper[roleCategory] || roleCategory}
                    </span>
                  ) : (
                    <Input
                      id="category-filter3"
                      type="select"
                      placeholder="Toutes les catégories"
                      value={paymentFilters.category}
                      onChange={(e: any) => setPaymentFilters({ ...paymentFilters, category: e.target.value, page: 1 })}
                      options={categoryOption}
                    />
                  )}
                  <Input
                    id="status-filter"
                    type="select"
                    placeholder="Tous les statuts"
                    value={paymentFilters.status}
                    onChange={(e: any) => setPaymentFilters({ ...paymentFilters, status: e.target.value, page: 1 })}
                    options={[
                      { value: '', label: 'Tous les statuts' },
                      { value: 'PENDING', label: 'En attente' },
                      { value: 'VALIDATED', label: 'Validé' },
                      { value: 'PAID', label: 'Payé' },
                      { value: 'REJECTED', label: 'Rejeté' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <Table headers={['Arbitre', 'Période', 'Matchs', 'Montant', 'Statut', 'Région', 'Actions']}>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-flashscore-text">
                          {payment.refereeId.userId.firstName} {payment.refereeId.userId.lastName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-flashscore-muted">{payment.refereeId.matricule}</span>
                        <span className="text-xs text-gray-500 dark:text-flashscore-muted">Cat. {payment.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {payment.label && <span className="font-medium text-gray-900 dark:text-flashscore-text">{payment.label}</span>}
                        <span className="text-xs text-gray-500 dark:text-flashscore-muted">
                          {new Date(payment.startDate).toLocaleDateString('fr-FR')} - {new Date(payment.endDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-bold text-gray-900 dark:text-flashscore-text">{payment.totalMatches}</span></TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-flashscore-text">{payment.totalAmount.toFixed(2)} TND</span>
                        {payment.bonuses > 0 && <span className="text-xs text-green-600">+{payment.bonuses} bonus</span>}
                        {payment.deductions > 0 && <span className="text-xs text-red-600">-{payment.deductions} retenues</span>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{payment.region}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }}
                          className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded" title="Détails">
                          <FileText className="w-4 h-4" />
                        </button>
                        {payment.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleValidatePayment(payment._id)}
                              className="p-1 hover:text-green-600 hover:bg-green-50 rounded" title="Valider">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedPayment(payment); setShowRejectModal(true); }}
                              className="p-1 hover:text-red-600 hover:bg-red-50 rounded" title="Rejeter">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {payment.status === 'VALIDATED' && (
                          <button onClick={() => { setSelectedPayment(payment); setShowMarkPaidModal(true); }}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded" title="Marquer comme payé">
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>

              {payments.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-flashscore-muted">Aucun paiement trouvé</p>
                </div>
              )}

              {Math.ceil(total / (paymentFilters.limit || 10)) > 1 && payments.length > 0 && (
                <Pagination
                  currentPage={paymentFilters.page || 1}
                  totalPages={Math.ceil(total / (paymentFilters.limit || 10))}
                  onPageChange={(page) => setPaymentFilters({ ...paymentFilters, page })}
                  totalItems={total}
                />
              )}
            </Card>

            {/* Detail modal */}
            <Modal title="Détails du Paiement" isOpen={showDetailModal}
              onClose={() => { setShowDetailModal(false); setSelectedPayment(null); }}>
              {!selectedPayment ? (
                <div className="py-10 text-center text-gray-500 dark:text-flashscore-muted">Chargement...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-flashscore-muted mb-2">Arbitre</h3>
                      <p className="text-lg font-bold text-gray-900 dark:text-flashscore-text">
                        {selectedPayment.refereeId.userId.firstName} {selectedPayment.refereeId.userId.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-flashscore-muted">{selectedPayment.refereeId.matricule}</p>
                      <p className="text-sm text-gray-600 dark:text-flashscore-muted">Catégorie {selectedPayment.category}</p>
                    </Card>
                    <Card>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-flashscore-muted mb-2">Période</h3>
                      {selectedPayment.label && <p className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-1">{selectedPayment.label}</p>}
                      <p className="text-sm text-gray-600 dark:text-flashscore-muted">Du {new Date(selectedPayment.startDate).toLocaleDateString('fr-FR')}</p>
                      <p className="text-sm text-gray-600 dark:text-flashscore-muted">Au {new Date(selectedPayment.endDate).toLocaleDateString('fr-FR')}</p>
                    </Card>
                  </div>
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Détails Financiers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><p className="text-sm text-gray-500 dark:text-flashscore-muted">Montant de base</p><p className="text-xl font-bold text-gray-900 dark:text-flashscore-text">{selectedPayment.baseAmount.toFixed(2)} TND</p></div>
                      <div><p className="text-sm text-gray-500 dark:text-flashscore-muted">Bonus</p><p className="text-xl font-bold text-green-600">+{selectedPayment.bonuses.toFixed(2)} TND</p></div>
                      <div><p className="text-sm text-gray-500 dark:text-flashscore-muted">Retenues</p><p className="text-xl font-bold text-red-600">-{selectedPayment.deductions.toFixed(2)} TND</p></div>
                      <div><p className="text-sm text-gray-500 dark:text-flashscore-muted">Total</p><p className="text-2xl font-bold text-[#ce1126]">{selectedPayment.totalAmount.toFixed(2)} TND</p></div>
                    </div>
                  </Card>
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Statut & Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-flashscore-muted">Statut actuel:</span>{getStatusBadge(selectedPayment.status)}</div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-flashscore-muted">Région:</span><span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.region}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-flashscore-muted">Nombre de matchs:</span><span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.totalMatches}</span></div>
                      {selectedPayment.validatedAt && <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-flashscore-muted">Validé le:</span><span className="font-medium text-gray-900 dark:text-flashscore-text">{new Date(selectedPayment.validatedAt).toLocaleDateString('fr-FR')}</span></div>}
                      {selectedPayment.paidAt && <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-flashscore-muted">Payé le:</span><span className="font-medium text-gray-900 dark:text-flashscore-text">{new Date(selectedPayment.paidAt).toLocaleDateString('fr-FR')}</span></div>}
                      {selectedPayment.paymentMethod && <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-flashscore-muted">Méthode de paiement:</span><span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.paymentMethod}</span></div>}
                      {selectedPayment.referenceNumber && <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-flashscore-muted">Référence:</span><span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.referenceNumber}</span></div>}
                      {selectedPayment.notes && <div><span className="text-sm text-gray-600 dark:text-flashscore-muted">Notes:</span><p className="mt-1 text-gray-900 dark:text-flashscore-text">{selectedPayment.notes}</p></div>}
                    </div>
                  </Card>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowDetailModal(false); setSelectedPayment(null); }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-flashscore-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-flashscore-hover transition-colors">
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </Modal>

            {/* Reject modal */}
            <Modal isOpen={showRejectModal} onClose={() => { setShowRejectModal(false); setSelectedPayment(null); }} title="Rejeter le paiement">
              <div className="space-y-4">
                <Input id="reject-reason" label="Raison du rejet" placeholder="Entrez la raison du rejet" type="textarea"
                  value={rejectReasonInput} onChange={(e: any) => setRejectReasonInput(e.target.value)} />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="secondary" onClick={() => { setShowRejectModal(false); setSelectedPayment(null); }}>Annuler</Button>
                  <Button variant="primary" disabled={!rejectReasonInput}
                    onClick={() => { handleRejectPayment(); setShowRejectModal(false); setRejectReasonInput(''); setSelectedPayment(null); }}>
                    Rejeter
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Mark paid modal */}
            <Modal isOpen={showMarkPaidModal} onClose={() => { setShowMarkPaidModal(false); setSelectedPayment(null); }} title="Marquer le paiement comme payé">
              <div className="space-y-4">
                <Input id="payment-method" label="Méthode de paiement" type="select"
                  placeholder="Sélectionnez une méthode de paiement"
                  options={[{ value: 'BANK_TRANSFER', label: 'Virement bancaire' }, { value: 'CHECK', label: 'Chèque' }, { value: 'CASH', label: 'Espèces' }]}
                  value={paymentMethodInput} onChange={(e: any) => setPaymentMethodInput(e.target.value)} />
                <Input id="reference-number" label="Numéro de référence (optionnel)" placeholder="Référence de transaction"
                  value={referenceNumberInput} onChange={(e: any) => setReferenceNumberInput(e.target.value)} />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="secondary" onClick={() => { setShowMarkPaidModal(false); setSelectedPayment(null); }}>Annuler</Button>
                  <Button variant="primary" disabled={!paymentMethodInput}
                    onClick={() => { handleMarkPaid(); setShowMarkPaidModal(false); setPaymentMethodInput(''); setReferenceNumberInput(''); setSelectedPayment(null); }}>
                    Marquer comme payé
                  </Button>
                </div>
              </div>
            </Modal>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            RATES TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'RATES' && (
          <>
            <Card className="mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <Input id="category-filter" type="select" placeholder="Toutes les catégories"
                  value={ratesFilters.category}
                  onChange={(e: any) => setRatesFilters({ ...ratesFilters, category: e.target.value, page: 1 })}
                  options={categoryOption} />
                <Input id="competition-filter" type="select" placeholder="Toutes les compétitions"
                  value={ratesFilters.competition}
                  onChange={(e: any) => setRatesFilters({ ...ratesFilters, competition: e.target.value, page: 1 })}
                  options={competitionOption} />
                <Button variant="primary" onClick={openCreateModal} className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Plus className="w-4 h-4" /> Nouveau Barème
                </Button>
              </div>
            </Card>

            <Card>
              {loadingRates ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126] mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-flashscore-muted">Chargement des barèmes...</p>
                </div>
              ) : rates.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-flashscore-muted">Aucun barème trouvé</p>
                </div>
              ) : (
                <>
                  <Table headers={['Catégorie', 'Compétition', 'Montant', 'Role', 'Actions']}>
                    {rates.map((rate) => (
                      <TableRow key={rate._id}>
                        <TableCell>
                          <Badge status={rate.category === 'A' ? 'success' : rate.category === 'B' ? 'warning' : 'default'}>
                            {categoryMapper[rate.category] || rate.category}
                          </Badge>
                        </TableCell>
                        <TableCell><span className="font-medium text-gray-900 dark:text-flashscore-text">{competitionMapper[rate.competition] || rate.competition}</span></TableCell>
                        <TableCell><span className="font-bold text-gray-900 dark:text-flashscore-text">{rate.amount.toFixed(2)} TND</span></TableCell>
                        <TableCell><span className="text-gray-600 dark:text-flashscore-muted">{roleMapper[rate.role] || rate.role || '-'}</span></TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => openEditModal(rate)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Modifier"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteRate(rate._id)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Table>
                  {Math.ceil(totalRates / ratesFilters.limit) > 1 && (
                    <Pagination currentPage={ratesFilters.page} totalPages={Math.ceil(totalRates / ratesFilters.limit)}
                      onPageChange={(page) => setRatesFilters({ ...ratesFilters, page })} totalItems={totalRates} />
                  )}
                </>
              )}
            </Card>

            <Modal isOpen={showRateModal}
              onClose={() => { setShowRateModal(false); setSelectedRate(null); setRateForm({ category: 'A', competition: 'LIGUE_1', amount: '', role: '', saison: getSaisonFromDate() }); }}
              title={selectedRate ? 'Modifier le Barème' : 'Nouveau Barème'}>
              <form onSubmit={selectedRate ? handleUpdateRate : handleCreateRate} className="space-y-6">
                <Form
                  fields={[
                    { name: 'category', label: 'Catégorie', type: 'select', required: !selectedRate, disabled: !!selectedRate, options: categoryOption.filter((o) => o.value !== ''), className: 'md:col-span-2' },
                    { name: 'competition', label: 'Compétition', type: 'select', required: !selectedRate, disabled: !!selectedRate, options: competitionOption.filter((o) => o.value !== ''), className: 'md:col-span-2' },
                    { name: 'amount', label: 'Montant (TND)', type: 'number', placeholder: 'Ex: 150.00', required: true, step: 0.01, min: 0 },
                    { name: 'role', label: 'Rôle', type: 'select', required: !selectedRate, disabled: !!selectedRate, options: roleOptions },
                  ]}
                  formData={rateForm}
                  onChange={(e: any) => { const { id, value } = e.target; setRateForm({ ...rateForm, [id]: value }); }}
                />
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-flashscore-border">
                  <Button type="button" variant="secondary" className="flex-1"
                    onClick={() => { setShowRateModal(false); setSelectedRate(null); setRateForm({ category: 'A', competition: 'LIGUE_1', amount: '', role: '', saison: getSaisonFromDate() }); }}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1">{selectedRate ? 'Modifier' : 'Créer'}</Button>
                </div>
              </form>
            </Modal>
          </>
        )}
      </Card>
    </AuthGuard>
  );
};

export default PaymentsPage;