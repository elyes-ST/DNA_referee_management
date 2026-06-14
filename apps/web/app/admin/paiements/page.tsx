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

/** Maps commission role → payment category param (CAA covers both C1 & C2) */
const ROLE_CATEGORY: Partial<Record<Role, string>> = {
  [Role.CAA]: 'C1',
  [Role.CAJ]: 'JEUNE',
  [Role.CAF]: 'FEMININE',
  [Role.CRA]: 'REGIONAL',
};

const PaymentsPage = () => {
  const { user } = useUser();
  // CAA is scoped to both amateur sub-categories and may narrow to C1 / C2
  const isAmateur = user?.role === Role.CAA;
  const [amateurFilter, setAmateurFilter] = useState('');
  const roleCategory = user?.role ? ROLE_CATEGORY[user.role] ?? '' : '';
  const isCommission = !!roleCategory;
  // Effective category for commission roles: amateur narrowing, else the full role scope.
  // 'C' is included for the amateur default so referees/payments stored as the general
  // 'C' category are not dropped (payments & referees both use the RefereeCategory enum).
  const commissionCategory = isAmateur ? (amateurFilter || 'C1') : roleCategory;
  const [activeTab, setActiveTab]= useState('PAYMENTS');


  /*referee tab state variables*/
  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    category: '',
    search: '',
    league:'',
  });
  const [loadingReferees, setLoadingReferees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalReferees, setTotalReferees] = useState(0);
  const [totalPages , setTotalPages] = useState(0);
  const [referees, setReferees] = useState<any[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    startDate: '',
    endDate: '',
    label: '',
  });
  const [selectedReferee, setSelectedReferee] = useState<any>();
  const [newReferee, setNewReferee] = useState<any>(null);
  const [previewMatches, setPreviewMatches] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [matchToReplace, setMatchToReplace] = useState<any>(null);
  const matchToReplaceRef = useRef<any>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showMatchListModal, setShowMatchListModal] = useState(false);



  /*rates tab state variables*/
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

  /*payments tab state variables*/
  const [paymentFilters, setPaymentFilters] = useState({
    page: 1,
    limit: 8,
    status: '',
    category: roleCategory, // auto-set from role
  });
const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectReasonInput, setRejectReasonInput] = useState('');
const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
const [paymentMethodInput, setPaymentMethodInput] = useState('');
const [referenceNumberInput, setReferenceNumberInput] = useState('');
const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);


  

  
  // Keep commission category filters in sync (CAA may narrow to C1 / C2)
  useEffect(() => {
    if (isCommission) {
      setPaymentFilters((f) => ({ ...f, category: commissionCategory, page: 1 }));
      setFilters((f) => ({ ...f, category: commissionCategory, page: 1 }));
    }
  }, [commissionCategory, isCommission]);

  const { payments, loading, error, refetch, total } = usePayments(paymentFilters);
  // GET /payments/statistics is ADMIN_DNA + FINANCE_DNA only (backend 403 for others)
  const canViewStats = !isCommission;
  const { statistics, loading: statsLoading } = usePaymentStatistics(
    canViewStats ? { startDate: '2025-01-01', endDate: '2026-12-31' } : undefined
  );


  useEffect(() => {
    if (activeTab === 'RATES') {
      fetchRates();
    }
    else if (activeTab === 'REFEREES') {
      fetchReferees();
    }
    else {
      refetch();
    }
  }, [activeTab, ratesFilters , filters]);
  

  const fetchReferees = async () => {
    setLoadingReferees(true);
    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.league) {
        params.league = filters.league;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      const response = await api.referees.getAll(params);
      const data: any = response.data;
      setReferees(data.data || []);
      setTotalReferees(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching referees:', err);
      toast.error('Erreur lors du chargement des arbitres');
    } finally {
      setLoadingReferees(false);
    }
  };


  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const params: any = {
        page: ratesFilters.page,
        limit: ratesFilters.limit,
      };
      
      // Only add filters if they have values
      if (ratesFilters.category) {
        params.category = ratesFilters.category;
      }
      if (ratesFilters.competition) {
        params.competition = ratesFilters.competition;
      }
      
      const response = await api.paymentRates.getAll(params);
      setRates(response.data.rates || []);
      setTotalRates(response.data.total || 0);
    } catch (err) {
      console.error('Error fetching rates:', err);
      toast.error('Erreur lors du chargement des barèmes');
    } finally {
      setLoadingRates(false);
    }
  };

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
      setRateForm({
        category: 'A',
        competition: 'LIGUE_1',
        amount: '',
        role: '',
        saison: getSaisonFromDate(),
      });
      fetchRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du barème');
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRate || !rateForm.amount) {
      toast.error('Veuillez remplir le montant');
      return;
    }

    try {
      await api.paymentRates.update(selectedRate._id, {
        amount: parseFloat(rateForm.amount),
      });
      toast.success('Barème modifié avec succès!');
      setShowRateModal(false);
      setSelectedRate(null);
      setRateForm({
        category: 'A',
        competition: 'LIGUE1',
        amount: '',
        role: '',
        saison: getSaisonFromDate(),
      });
      fetchRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification du barème');
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce barème ?')) {
      return;
    }
    
    try {
      await api.paymentRates.delete(rateId);
      toast.success('Barème supprimé avec succès!');
      fetchRates();
    } catch (err) {
      toast.error('Erreur lors de la suppression du barème');
    }
  };

  const openEditModal = (rate: any) => {
    setSelectedRate(rate);
    setRateForm({
      category: rate.category,
      competition: rate.competition,
      amount: rate.amount.toString(),
      role: rate.role || '',
      saison: rate.saison || getSaisonFromDate(),
    });
    setShowRateModal(true);
  };

  const openCreateModal = () => {
    setSelectedRate(null);
    setRateForm({
      category: 'A',
      competition: 'LIGUE1',
      amount: '',
      role: '',
      saison: getSaisonFromDate(),
    });
    setShowRateModal(true);
  };
  const handleGeneratePayment = async (e: React.FormEvent) => {
    e.preventDefault();
   if (!selectedReferee || !generateForm.startDate || !generateForm.endDate) {
    toast.error("Veuillez remplir tous les champs");
    return;
  }

    try {
      setLoadingPreview(true);
      const response = await api.payments.previewMatches({
        refereeId: selectedReferee,
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
      });
      setPreviewMatches(response.data);
      setSelectedMatches([]); 
      setShowGenerateModal(false);
      setShowMatchListModal(true);

    } catch (err: any) {
      toast.error("Erreur lors du preview des matchs");
    } finally {
    setLoadingPreview(false);
  }
  };
  const debouncedLoadReferees = useCallback(
    debounce(async (inputValue: string, callback: Function) => {
      try {
        const match = matchToReplaceRef.current;
        if (match) {
          // Fetch only eligible referees for this match and role
          const response = await api.designations.getEligibleReferees(match.matchId, { role: match.role });
          
          let eligible = response.data || [];
          if (inputValue) {
            const lowerInput = inputValue.toLowerCase();
            eligible = eligible.filter((item: any) => {
              const name = `${item.referee.userId?.firstName || ''} ${item.referee.userId?.lastName || ''} ${item.referee.matricule}`.toLowerCase();
              return name.includes(lowerInput);
            });
          }

          callback(eligible.slice(0, 50).map((item: any) => {
            const referee = item.referee;
            const hasWarnings = item.warnings && item.warnings.length > 0;
            const warningText = hasWarnings ? ` (⚠️ ${item.warnings.join(', ')})` : '';
            return {
              value: referee._id,
              label: `${referee.userId?.firstName || ''} ${referee.userId?.lastName || ''} (${referee.matricule}) - ${referee.category} - ${referee.region}${warningText}`,
            };
          }));
        } else {
          // Fallback to all referees if no match context
          const response = await api.referees.getAll({
            search: inputValue,
            page: 1,
            limit: 50,
          });

          callback(response.data.data.map((referee: any) => ({
            value: referee._id,
            label: `${referee.userId?.firstName || ''} ${referee.userId?.lastName || ''} (${referee.matricule}) - ${referee.category} - ${referee.region}`,
          })));
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des arbitres");
        callback([]);
      }
    }, 500), 
  []);

  const loadReferees = (inputValue: string) =>
    new Promise((resolve) => debouncedLoadReferees(inputValue, resolve));

const handleReplaceReferee = async (
  match: any,
  newRefereeId: string
) => {
  try {
    const res = await api.designations.getByMatch(match.matchId); 
    const oldDesignation = res.data;
    const updatedReferees = oldDesignation.referees.map((r: any) => {
      const refIdStr = r.refereeId?._id || r.refereeId;
      return refIdStr === selectedReferee
        ? { refereeId: newRefereeId, role: r.role } 
        : { refereeId: refIdStr, role: r.role };
    });

    await api.designations.update(oldDesignation._id, {
      referees: updatedReferees,
    });
    toast.success("Désignation mise à jour");

    setLoadingPreview(true);
      const response = await api.payments.previewMatches({
        refereeId: selectedReferee,
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
      });
    setPreviewMatches(response.data);
    setSelectedMatches([]);
    setNewReferee(null);
    setShowReplaceModal(false);
    setShowMatchListModal(true);
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Erreur update désignation");
  } finally {
    setLoadingPreview(false);
  }
};
const handleFinalGenerateInvoice = async () => {
  if (selectedMatches.length === 0) {
    toast.error("Veuillez sélectionner au moins un match");
    return;
  }
  try {
    await api.payments.generate({
      refereeId: selectedReferee,
      startDate: generateForm.startDate,
      endDate: generateForm.endDate,
      matchIds: selectedMatches,
      label: generateForm.label || undefined,
    });

    toast.success("Facture générée avec succès");

    setShowMatchListModal(false);
    setPreviewMatches([]);
    setSelectedMatches([]);
    setSelectedReferee(null);
    setGenerateForm({startDate: '', endDate: '', label: '' });
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Erreur lors de la génération de la facture");
  }
};

  const handleValidatePayment = async (paymentId: string) => {
    try {
    await api.payments.validate(paymentId);
    toast.success('Paiement validé avec succès!');
    refetch();
    } catch (err) {
      toast.error('Erreur lors de la validation du paiement');
    }
  };

  const handleRejectPayment = async () => {
    if(!selectedPayment) {
      return
    }
    if (!rejectReasonInput) {
      toast.error('Veuillez fournir une raison de rejet');
      return;
    }
    try {
    const result = await api.payments.reject(selectedPayment._id, { reason: rejectReasonInput });
    toast.success('Paiement rejeté avec succès!');
    refetch();
    } catch (err) {
      toast.error('Erreur lors du rejet du paiement');
    } 
  };

  const handleMarkPaid = async () => {
    if(!selectedPayment) {
      return
    }
    if(!paymentMethodInput) {
      toast.error('Veuillez sélectionner une méthode de paiement');
      return;
    }
    try {
      const result = await api.payments.markPaid(selectedPayment._id, {
        paymentMethod: paymentMethodInput,
        referenceNumber: referenceNumberInput || undefined,
      });
      toast.success('Paiement marqué comme payé avec succès!');
      refetch();
    } catch (err) {
      toast.error('Erreur lors du marquage du paiement comme payé');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, any> = {
      PENDING: { label: 'En attente', status: 'warning' },
      VALIDATED: { label: 'Validé', status: 'success' },
      PAID: { label: 'Payé', status: 'success' },
      REJECTED: { label: 'Rejeté', status: 'error' },
    };
    const config = statusMap[status] || { label: status, status: 'default' };
    return <Badge status={config.status}>{config.label}</Badge>;
  };


  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  useEffect(() => {
    setFilters((f) => (f.search === debouncedSearchTerm ? f : { ...f, search: debouncedSearchTerm, page: 1 }));
  }, [debouncedSearchTerm]);
  const competitionMapper: Record<string, string> = {
    LIGUE1: 'Ligue 1',
    LIGUE2: 'Ligue 2',
    COUPE: 'Coupe de Tunisie',
    AMATEUR_C1: 'Amateur C1',
    AMATEUR_C2: 'Amateur C2',
    JEUNES: 'Jeunes',
    FEMININE: 'Féminine',
    REGIONAL: 'Régional',
  };
  const categoryMapper: Record<string, string> = {
    A: 'Catégorie A',
    B: 'Catégorie B',
    C: 'Catégorie C',
    C1: 'Amateur C1',
    C2: 'Amateur C2',
    JEUNE: 'Jeune',
    FEMININE: 'Féminine',
    REGIONAL: 'Régional',
  };
  const roleMapper: Record<string, string> = {
  ARBITRE_CENTRAL: 'Arbitre Central',
  ASSISTANT_1: 'Assistant 1',
  ASSISTANT_2: 'Assistant 2',
  QUATRIEME_ARBITRE: '4ème Arbitre',
  ARBITRE_VAR: 'Arbitre VAR',
  ASSISTANT_VAR: 'Assistant VAR 1',
   };
const categoryOption=[
                  { value: '', label: 'Toutes les catégories' },
                  { value: 'A', label: 'Catégorie A' },
                  { value: 'B', label: 'Catégorie B' },
                  { value: 'C1', label: 'Catégorie Amateur C1' },
                  { value: 'C2', label: 'Catégorie Amateur C2' },
                  { value: 'JEUNE', label: 'Catégorie Jeune' },
                  { value: 'FEMININE', label: 'Catégorie Féminine' },
                  { value: 'REGIONAL', label: 'Catégorie Régionale' },
]
const competitionOption=[
                  { value: '', label: 'Toutes les compétitions' },
                  { value: 'LIGUE1', label: 'Ligue 1' },
                  { value: 'LIGUE2', label: 'Ligue 2' },
                  { value: 'REGIONAL', label: 'Régionale' },
                  { value: 'COUPE', label: 'Coupe de Tunisie' },
                  { value: 'AMATEUR_C1', label: 'Amateur C1' },
                  { value: 'AMATEUR_C2', label: 'Amateur C2' },
                  { value: 'JEUNES', label: 'Jeunes' },
                  { value: 'FEMININE', label: 'Féminine' },
                ]
const roleOptions=[
  { value: 'ARBITRE_CENTRAL', label: 'Arbitre Central' },
  { value: 'ASSISTANT_1', label: 'Assistant 1' },
  { value: 'ASSISTANT_2', label: 'Assistant 2' },
  { value: 'QUATRIEME_ARBITRE', label: '4ème Arbitre' },
  { value: 'ARBITRE_VAR', label: 'Arbitre VAR' },
  { value: 'ASSISTANT_VAR', label: 'Assistant VAR 1' },
];
  if (loading && !payments.length) {
    return (
      <AuthGuard role={[Role.ADMIN_DNA, Role.FINANCE_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA]}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Chargement des paiements...</p>
        </div>
      </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.FINANCE_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA]}>
    <Card className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-2">Gestion des Paiements</h1>
        <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Générez, validez et gérez les paiements des arbitres</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total des Paiements"
            value={(statistics.overview.totalPayments || 0).toString()}
            trend={`${((statistics.overview.totalAmount || 0) / 1000).toFixed(1)}k TND`}
            trendType="positive"
            icon={<DollarSign className="w-8 h-8 text-blue-500" />}
          />
          
          <StatCard
            title="En Attente"
            value={(statistics.byStatus?.find((s: any) => s._id === 'PENDING')?.count || 0).toString()}
            icon={<Clock className="w-8 h-8 text-amber-500" />}
          />
          
          <StatCard
            title="Validés"
            value={(statistics.byStatus?.find((s: any) => s._id === 'VALIDATED')?.count || 0).toString()}
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
          />
          
          <StatCard
            title="Payés"
            value={(statistics.byStatus?.find((s: any) => s._id === 'PAID')?.count || 0).toString()}
            icon={<CheckCircle className="w-8 h-8 text-blue-500" />}
          />
        </div>
      )}

      {/* Tabs — commission roles only see Paiements + Arbitres */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-flashscore-border">
          {[{ id: 'PAYMENTS', label: 'Paiements' },{ id: 'REFEREES', label: 'Arbitres' }, ...(!isCommission ? [{ id: 'RATES', label: 'Barémes' }] : [])].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#ce1126] text-[#ce1126]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>


      {/* Referees Tab Content */}
      {activeTab === 'REFEREES' && (
      <>
      <Card className="mb-6">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* Only show category dropdown for admin/finance; commission roles are auto-locked */}
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
                icon={<Search className="w-4 h-4" />
                                      
                } 
              />
          </div>
      </Card>
      {/* Referee Table */}
      <Card>
        <Table headers={["Arbitre", "Matricule", "Catégorie", "Région", "Ligue", "Statut", "Actions"]}>
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
                          <button className="hover:text-red-500 bg-transparent border-none p-0 cursor-pointer" onClick={() => {
                            setSelectedReferee(u._id || u.id);
                            setShowGenerateModal(true);
                          }}
                          title='Generer un Paiement'
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
            <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Aucun arbitre trouvé</p>
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

      {/* Generate Payment Modal */}
      <Modal 
      isOpen={showGenerateModal}
      onClose={() => {
        setShowGenerateModal(false);
        setGenerateForm({startDate: '', endDate: '', label: '' });
        setSelectedReferee(null);
      }}
      title='Générer un Paiement'
      >
                <Form
                fields={[
                  {name: 'startDate', label: 'Date de début', placeholder: 'Sélectionnez une date', type: 'date', required: true},
                  {name: 'endDate', label: 'Date de fin', placeholder: 'Sélectionnez une date', type: 'date', required: true},
                  {name: 'label', label: 'Libellé (optionnel)', placeholder: 'Entrez un libellé optionnel', type: 'text', required: false , className: 'col-span-1 md:col-span-2'}
                ]} 
                formData={{
                  startDate: generateForm.startDate,
                  endDate: generateForm.endDate,
                  label: generateForm.label,
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                        const { id, value } = e.target;
                        setGenerateForm(prev => ({ ...prev, [id]: value }));
                    }}
                />
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={() =>{setShowGenerateModal(false)
                    setGenerateForm({startDate: '', endDate: '', label: '' });
                    setSelectedReferee(null);
                    }}>Annuler</Button>
                    <Button variant="primary" onClick={handleGeneratePayment}>Valider les match de cette période</Button>
                </div>
      </Modal>
      
      <Modal
  isOpen={showMatchListModal}
  onClose={() => {setShowMatchListModal(false)
    setShowGenerateModal(true);
  }}
  title="Matchs dans la période sélectionnée"
>
  {loadingPreview ? (
    <div className="flex justify-center py-10 text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
      Chargement des matchs...
    </div>
  ) : (
    <>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {previewMatches.map((match) => {
          const isSelected = selectedMatches.includes(match.matchId);

          return (
            <Card
              key={match.matchId}
              className={`p-5 rounded-xl border transition-all
                ${isSelected ? "border-green-500 bg-green-50" : "border-gray-200 dark:border-flashscore-border"}
              `}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {match.homeTeam} 
                    <span className="mx-2 text-gray-400 dark:text-flashscore-muted">vs</span> 
                    {match.awayTeam}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1">
                    Match #{match.matchNumber} •{" "}
                    {new Date(match.date).toLocaleDateString()}
                  </p>
                </div>

                <Badge status={match.paymentCalculated ? "success" : "warning"}>
                  {match.paymentCalculated ? "Calculé" : "Non calculé"}
                </Badge>
              </div>

              {/* META INFO */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                <div>
                  <p className="text-sm text-gray-400 dark:text-flashscore-muted">Compétition</p>
                  <p className="font-medium">{match.competition}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 dark:text-flashscore-muted">Stade</p>
                  <p className="font-medium">{match.stadium}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 dark:text-flashscore-muted">Rôle</p>
                  <p className="font-medium">
                    {match.role.replaceAll("_", " ")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 dark:text-flashscore-muted">Total estimé</p>
                  <p className="font-semibold text-gray-900 dark:text-flashscore-text">
                    {match.totalAmount ?? "-"} TND
                  </p>
                </div>
              </div>

              {/* FINANCIAL DETAILS */}
              <div className="mt-4 bg-gray-50 dark:bg-flashscore-hover rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Base</span>
                  <span>{match.baseAmount ?? "-"} TND</span>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>Bonus</span>
                  <span>+ {match.bonus} TND</span>
                </div>

                <div className="flex justify-between text-red-600">
                  <span>Déduction</span>
                  <span>- {match.deduction} TND</span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowReplaceModal(true);
                    setShowMatchListModal(false);
                    matchToReplaceRef.current = match;
                  }}
                >
                  Rejeter
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-6 border-t border-gray-300 dark:border-flashscore-border pt-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
          {selectedMatches.length} match(s) validé(s)
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowMatchListModal(false);
              setShowGenerateModal(true);
            }}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={() => {
             if (selectedMatches.length === previewMatches.length) {
                     setSelectedMatches([]);
            } else {
                 setSelectedMatches(previewMatches.map(m => m.matchId));
                 }
                }}
            disabled={previewMatches.length === 0}
  >
    {selectedMatches.length === previewMatches.length ? "Annuler tous" : "Valider tous"}
  </Button>
          <Button
            variant="primary"
            onClick={handleFinalGenerateInvoice}
          >
            Générer la facture
          </Button>
        </div>
      </div>
    </>
  )}
     </Modal>

<Modal
  isOpen={showReplaceModal}
  onClose={() => {
    setShowReplaceModal(false);
    setShowMatchListModal(true);
    setNewReferee(null);
  }}
  title="Remplacer l'arbitre"
>
  <div className="space-y-4">
    <Input
      id="referee-select"
      type="async-select"
      placeholder="Rechercher un arbitre..."
      value={newReferee}
      loadOptions={loadReferees as any}
      onChange={(e: any) => setNewReferee(e.target.value)}
    />

    <Button
      disabled={!newReferee}
      onClick={() => {
        handleReplaceReferee(matchToReplaceRef.current, newReferee);
        setShowReplaceModal(false);
        setShowMatchListModal(true);
        setNewReferee(null);
      }}
      className="w-full"
    >
      Confirmer le remplacement
    </Button>
  </div>
</Modal>
      </>)}

      {activeTab === 'PAYMENTS' && (
        <>
         <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* CAA: C1/C2 sub-filter. Other commission roles: locked badge. Admin/Finance: full dropdown */}
            {isAmateur ? (
              <CategoryC1C2Filter value={amateurFilter} onChange={setAmateurFilter} />
            ) : isCommission ? (
              <span className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                Catégorie :  {categoryMapper[roleCategory] || roleCategory}
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

      {/* Payments Table */}
      <Card>
        <Table headers={[ "Arbitre", "Période", "Matchs", "Montant", "Statut", "Région", "Actions"]}>
          {payments.map((payment) => (
            <TableRow key={payment._id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-flashscore-text">
                    {payment.refereeId.userId.firstName} {payment.refereeId.userId.lastName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{payment.refereeId.matricule}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Cat. {payment.category}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {payment.label && <span className="font-medium text-gray-900 dark:text-flashscore-text">{payment.label}</span>}
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                    {new Date(payment.startDate).toLocaleDateString('fr-FR')} - {new Date(payment.endDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-bold text-gray-900 dark:text-flashscore-text">{payment.totalMatches}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 dark:text-flashscore-text">{payment.totalAmount.toFixed(2)} TND</span>
                  {payment.bonuses > 0 && (
                    <span className="text-xs text-green-600">+{payment.bonuses} bonus</span>
                  )}
                  {payment.deductions > 0 && (
                    <span className="text-xs text-red-600">-{payment.deductions} retenues</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(payment.status)}</TableCell>
              <TableCell>{payment.region}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowDetailModal(true);
                    }}
                    className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Détails"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  
                  {payment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleValidatePayment(payment._id)}
                        className="p-1 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        title="Valider"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRejectModal(true);
                        }}
                        className="p-1 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Rejeter"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {payment.status === 'VALIDATED' && (
                    <button
                      onClick={() => {
                          setSelectedPayment(payment);
                          setShowMarkPaidModal(true);
                        }}
                      className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Marquer comme payé"
                    >
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
            <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Aucun paiement trouvé</p>
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
        <Modal 
          title="Détails du Paiement"
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPayment(null);
          }}
        >

{!selectedPayment ? (
    <div className="py-10 text-center text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Chargement...</div>
  ) : (
            <div className="space-y-6">
                {/* General Information */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-2">Arbitre</h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-flashscore-text">
                      {selectedPayment.refereeId.userId.firstName} {selectedPayment.refereeId.userId.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{selectedPayment.refereeId.matricule}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Catégorie {selectedPayment.category}</p>
                  </Card>
                  <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-2">Période</h3>
                    {selectedPayment.label && (
                      <p className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-1">{selectedPayment.label}</p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                      Du {new Date(selectedPayment.startDate).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                      Au {new Date(selectedPayment.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </Card>
                </div>

                {/* Financial Details */}
                <Card>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Détails Financiers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Montant de base</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-flashscore-text">{selectedPayment.baseAmount.toFixed(2)} TND</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Bonus</p>
                      <p className="text-xl font-bold text-green-600">+{selectedPayment.bonuses.toFixed(2)} TND</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Retenues</p>
                      <p className="text-xl font-bold text-red-600">-{selectedPayment.deductions.toFixed(2)} TND</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Total</p>
                      <p className="text-2xl font-bold text-[#ce1126]">{selectedPayment.totalAmount.toFixed(2)} TND</p>
                    </div>
                  </div>
                </Card>

                {/* Status Information */}
                <Card>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Statut & Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Statut actuel:</span>
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Région:</span>
                      <span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.region}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Nombre de matchs:</span>
                      <span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.totalMatches}</span>
                    </div>
                    {selectedPayment.validatedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Validé le:</span>
                        <span className="font-medium text-gray-900 dark:text-flashscore-text">
                          {new Date(selectedPayment.validatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {selectedPayment.paidAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Payé le:</span>
                        <span className="font-medium text-gray-900 dark:text-flashscore-text">
                          {new Date(selectedPayment.paidAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {selectedPayment.paymentMethod && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Méthode de paiement:</span>
                        <span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.paymentMethod}</span>
                      </div>
                    )}
                    {selectedPayment.referenceNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Référence:</span>
                        <span className="font-medium text-gray-900 dark:text-flashscore-text">{selectedPayment.referenceNumber}</span>
                      </div>
                    )}
                    {selectedPayment.notes && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Notes:</span>
                        <p className="mt-1 text-gray-900 dark:text-flashscore-text">{selectedPayment.notes}</p>
                      </div>
                    )}
                  </div>
                  
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedPayment(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-flashscore-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-flashscore-hover transition-colors"
                  >
                    Fermer
                  </button>
                </div>
            </div>)}
              </Modal>
      <Modal
  isOpen={showRejectModal}
  onClose={() => {
    setShowRejectModal(false);
    setSelectedPayment(null);
  }}
  title="Rejeter le paiement"
>
  <div className="space-y-4">
    <Input 
      id="reject-reason"
      label="Raison du rejet (optionnel)"
      placeholder="Entrez la raison du rejet"
      type='textarea'
      value={rejectReasonInput}
      onChange={(e: any) => setRejectReasonInput(e.target.value)}
    />
    <div className="flex justify-end gap-2 mt-2">
      <Button
        variant="secondary"
        onClick={() => {
          setShowRejectModal(false);
          setSelectedPayment(null);
        }}
      >
        Annuler
      </Button>
      <Button
        variant="primary"
        disabled={!rejectReasonInput}
        onClick={() => {
          handleRejectPayment();
          setShowRejectModal(false);
          setRejectReasonInput('');
          setSelectedPayment(null);
        }}
      >
        Rejeter
      </Button>
    </div>
  </div>
</Modal>

<Modal
  isOpen={showMarkPaidModal}
  onClose={() => {
    setShowMarkPaidModal(false);
    setSelectedPayment(null);
  }}
  title="Marquer le paiement comme payé"
>
  <div className="space-y-4">
    <Input
      id="payment-method"
  label="Méthode de paiement"
  type="select"
  placeholder="Sélectionnez une méthode de paiement"
  options={[
    { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
    { value: 'CHECK', label: 'Chèque' },
    { value: 'CASH', label: 'Espèces' },
  ]}
  value={paymentMethodInput}
  onChange={(e: any) => setPaymentMethodInput(e.target.value)}
/>
    <Input
      id="reference-number"
      label="Numéro de référence (optionnel)"
      placeholder="Référence de transaction"
      value={referenceNumberInput}
      onChange={(e: any) => setReferenceNumberInput(e.target.value)}
    />

    <div className="flex justify-end gap-2 mt-2">
      <Button
        variant="secondary"
        onClick={() => {
          setShowMarkPaidModal(false);
          setSelectedPayment(null);
        }}
      >
        Annuler
      </Button>
      <Button
        variant="primary"
        disabled={!paymentMethodInput}
        onClick={() => {
          handleMarkPaid();
          setShowMarkPaidModal(false);
          setPaymentMethodInput('');
          setReferenceNumberInput('');
          setSelectedPayment(null);
        }}
      >
        Marquer comme payé
      </Button>
    </div>
  </div>
</Modal>
        </>
      )}



      {/* RATES Tab Content */}
      {activeTab === 'RATES' && (
        <>
          {/* Filters and Actions */}
          <Card className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <Input 
                id="category-filter"
                type="select"
                placeholder="Toutes les catégories"
                value={ratesFilters.category}
                onChange={(e: any) => setRatesFilters({ ...ratesFilters, category: e.target.value, page: 1 })}
                options={categoryOption}
              />
              <Input 
                id="competition-filter"
               type='select'
                placeholder="Toutes les compétitions"
                value={ratesFilters.competition}
                onChange={(e: any) => setRatesFilters({ ...ratesFilters, competition: e.target.value, page: 1 })}
                options={competitionOption}
              />
              <Button
              variant="primary" onClick={openCreateModal} className="flex items-center gap-2 w-full sm:w-auto justify-center">
               
                <Plus className="w-4 h-4" />
                Nouveau Barème
              </Button>
            </div>
            
          </Card>

          {/* Rates Table */}
          <Card>
            {loadingRates ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126] mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Chargement des barèmes...</p>
              </div>
            ) : (
              <>
              {rates.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Aucun barème trouvé</p>
                  </div>
                ):(
                <Table headers={["Catégorie", "Compétition", "Montant", "Role", "Actions"]}>
                  {rates
                    .map((rate) => (
                      <TableRow key={rate._id}>
                        <TableCell>
                          <Badge status={rate.category === 'A' ? 'success' : rate.category === 'B' ? 'warning' : 'default'}>
                            {categoryMapper[rate.category] || rate.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900 dark:text-flashscore-text">
                            {competitionMapper[rate.competition] || rate.competition}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-gray-900 dark:text-flashscore-text">{rate.amount.toFixed(2)} TND</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{roleMapper[rate.role] || rate.role || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openEditModal(rate)}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRate(rate._id)}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </Table>)}

                {rates.length > 0 && Math.ceil(totalRates / ratesFilters.limit) > 1 && (
                  <Pagination
                    currentPage={ratesFilters.page}
                    totalPages={Math.ceil(totalRates / ratesFilters.limit)}
                    onPageChange={(page) => setRatesFilters({ ...ratesFilters, page })}
                    totalItems={totalRates}
                  />
                )}
              </>
            )}
          </Card>
          {/* Rate Modal (Create/Edit) */}
          <Modal
            isOpen={showRateModal}
            onClose={() => {
              setShowRateModal(false);
              setSelectedRate(null);
              setRateForm({
                category: 'A',
                competition: 'LIGUE_1',
                amount: '',
                role: '',
                saison: getSaisonFromDate(),
              });
            }}
            title={selectedRate ? 'Modifier le Barème' : 'Nouveau Barème'}
          >
            <form onSubmit={selectedRate ? handleUpdateRate : handleCreateRate} className="space-y-6">
              <Form
                fields={[
                  {
                    name: 'category',
                    label: 'Catégorie',
                    type: 'select',
                    required: !selectedRate,
                    disabled: !!selectedRate,
                    options: categoryOption.filter(opt => opt.value !== ''),
                    className: 'md:col-span-2',
                  },
                  {
                    name: 'competition',
                    label: 'Compétition',
                    type: 'select',
                    required: !selectedRate,
                    disabled: !!selectedRate,
                    options: competitionOption.filter(opt => opt.value !== ''),
                    className: 'md:col-span-2',
                  },
                  {
                    name: 'amount',
                    label: 'Montant (TND)',
                    type: 'number',
                    placeholder: 'Ex: 150.00',
                    required: true,
                    step: 0.01,
                    min: 0,
                  },
                  {
                    name: 'role',
                    label: 'Rôle',
                    type: 'select',
                    required: !selectedRate,
                    disabled: !!selectedRate,
                    options: roleOptions,
                  },

                ]}
                formData={rateForm}
                onChange={(e: any) => {
                  const { id, value } = e.target;
                  setRateForm({ ...rateForm, [id]: value });
                }}
              />

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-flashscore-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowRateModal(false);
                    setSelectedRate(null);
                    setRateForm({
                      category: 'A',
                      competition: 'LIGUE_1',
                      amount: '',
                      role: '',
                      saison: getSaisonFromDate(),
                    });
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  {selectedRate ? 'Modifier' : 'Créer'}
                </Button>
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
