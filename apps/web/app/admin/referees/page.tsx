'use client';
import { useEffect, useState, useMemo } from "react";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Table, TableCell, TableRow } from "../../../components/ui/Table";
import { Pagination } from "../../../components/ui/Pagination";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Form, FormField } from "../../../components/ui/Form";
import { DeleteModal } from "../../../components/ui/DeleteModel";
import { api } from "../../../services/api";
import { Search, Plus, Pencil, Trash2, ShieldCheck, CalendarOff } from "lucide-react";
import { AuthGuard } from "../../../components/ui/AuthGuard";
import { toast } from "sonner";
import { Role } from "../../../types/user";
import { useUser } from "../../../hooks/useUser";
import { useDebounce } from "../../../hooks/useDebounce";
import { can, allowedCategoriesForRole } from "../../../utils/helpers/permissions";
import { validateForm } from "../../../utils/helpers/form-validator";

// ── Constants ────────────────────────────────────────────────────────────────

const ROLE_LOCKED_CATEGORY: Partial<Record<Role, string>> = {
  [Role.CAA]: 'C1',
  [Role.CAJ]: 'JEUNE',
  [Role.CAF]: 'FEMININE',
  [Role.CRA]: 'REGIONAL',
};

const ROLE_SCOPE_LABEL: Partial<Record<Role, string>> = {
  [Role.CAA]: 'Amateur (C1 & C2)',
  [Role.CAJ]: 'Jeunes',
  [Role.CAF]: 'Féminines',
  [Role.CRA]: 'Régionaux',
};

const CATEGORY_OPTIONS = [
  { value: '',         label: 'Toutes',     color: '#888780' },
  { value: 'A',        label: 'Catégorie A', color: '#ce1126' },
  { value: 'B',        label: 'Catégorie B', color: '#185fa5' },
  { value: 'C1',       label: 'Catégorie C1', color: '#3b6d11' },
  { value: 'C2',       label: 'Catégorie C2', color: '#854f0b' },
  { value: 'JEUNE',    label: 'Jeune',       color: '#534ab7' },
  { value: 'FEMININE', label: 'Féminine',    color: '#993556' },
  { value: 'REGIONAL', label: 'Régionale',   color: '#0f6e56' },
];

const ALL_REFEREE_CATEGORIES = [
  { value: 'A',        label: 'Catégorie A'         },
  { value: 'B',        label: 'Catégorie B'         },
  { value: 'C1',       label: 'Catégorie C1'        },
  { value: 'C2',       label: 'Catégorie C2'        },
  { value: 'JEUNE',    label: 'Catégorie Jeune'     },
  { value: 'FEMININE', label: 'Catégorie Féminine'  },
  { value: 'REGIONAL', label: 'Catégorie Régionale' },
];

const ALLOWED_REFEREE_ROLES = [
  { value: 'ARBITRE_CENTRAL',    label: 'Arbitre Central' },
  { value: 'ASSISTANT_1',        label: 'Assistant 1' },
  { value: 'ASSISTANT_2',        label: 'Assistant 2' },
  { value: 'QUATRIEME_ARBITRE',  label: '4ème Arbitre' },
  { value: 'ARBITRE_VAR',        label: 'Arbitre VAR' },
  { value: 'ASSISTANT_VAR',      label: 'Assistant VAR' },
];

const STATUS_FILTERS = [
  { value: '',         label: 'Tous' },
  { value: 'active',   label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
];

const ROLE_FILTERS = [
  { value: '',                 label: 'Tous' },
  { value: 'ARBITRE_CENTRAL', label: 'Central' },
  { value: 'ARBITRE_VAR',     label: 'VAR' },
];

const AVAILABILITY_FILTERS = [
  { value: '',      label: 'Tous' },
  { value: 'true',  label: 'Disponible' },
  { value: 'false', label: 'Indisponible' },
];

const emptyForm = {
  recordId: '',
  firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phoneNumber: '',
  matricule: '', cin: '', dateOfBirth: '', category: '', region: '', league: '',
  address: '', notes: '',
  allowedRoles: [] as string[],
  isVARCertified: false,
  isAvailable: true,
  emergencyContactName: '', emergencyContactPhone: '',
};

// ── Component ────────────────────────────────────────────────────────────────

const RefereesListPage = () => {
  const { user } = useUser();

  const lockedCategory = user?.role ? ROLE_LOCKED_CATEGORY[user.role] ?? null : null;
  const isAmateur = user?.role === Role.CAA;
  const isAdmin = user?.role === Role.ADMIN_DNA ||
                  user?.role === Role.DESIGNATION_DNA ||
                  user?.role === Role.FINANCE_DNA;

  const canCreate = can(user?.role, 'createReferee');
  const canEdit   = can(user?.role, 'editReferee');
  const canDelete = can(user?.role, 'deleteReferee');
  const showActions = canEdit || canDelete;

  const scopedCategories = useMemo(() => {
    const allowed = allowedCategoriesForRole(user?.role);
    return allowed
      ? ALL_REFEREE_CATEGORIES.filter((o) => allowed.includes(o.value))
      : ALL_REFEREE_CATEGORIES;
  }, [user?.role]);

  // ── Filter state ───────────────────────────────────────────────────────────
  // For admin: driven by the sidebar. Commission roles use lockedCategory.
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amateurFilter, setAmateurFilter]       = useState('');
  const [statusFilter, setStatusFilter]         = useState('');
  const [roleFilter, setRoleFilter]             = useState('');
  const [availFilter, setAvailFilter]           = useState('');
  const [searchTerm, setSearchTerm]             = useState('');
  const [appliedSearch, setAppliedSearch]       = useState('');
  const [page, setPage]                         = useState(1);
  const limit = 10;

  // ── Data state ─────────────────────────────────────────────────────────────
  const [referees, setReferees]     = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(false);

  // Per-category counts for the sidebar badges & stat cards
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ active: 0, var: 0, unavail: 0 });

  // ── CRUD modal state ────────────────────────────────────────────────────────
  const [showFormModal, setShowFormModal]       = useState(false);
  const [isEditMode, setIsEditMode]             = useState(false);
  const [formData, setFormData]                 = useState<any>(emptyForm);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [refereeToDelete, setRefereeToDelete]   = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchReferees = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };

      if (isAmateur) {
        params.category = amateurFilter || 'C1';
      } else if (lockedCategory) {
        params.category = lockedCategory;
      } else if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (appliedSearch)  params.search       = appliedSearch;
      if (statusFilter) {
        if (statusFilter === 'active') params.isActive = true;
        else if (statusFilter === 'inactive') params.isActive = false;
      }
      if (roleFilter)     params.allowedRole  = roleFilter;
      if (availFilter)    params.isAvailable  = availFilter === 'true';

      const response  = await api.referees.getAll(params);
      const data: any = response.data;
      setReferees(data.data       || []);
      setTotal(data.total         || 0);
      setTotalPages(data.totalPages || 0);

      // Derive quick stats from the current page's data while we wait for a
      // dedicated endpoint; replace with a real aggregation call if available.
      const list: any[] = data.data || [];
      // Stats removed as requested because they vary with pagination
    } catch {
      toast.error('Erreur lors du chargement des arbitres');
    } finally {
      setLoading(false);
    }
  };

  // Fetch total counts per category once on mount (admin only) for sidebar badges.
  const fetchCategoryCounts = async () => {
    if (!isAdmin) return;
    try {
      const results = await Promise.all(
        CATEGORY_OPTIONS.filter(c => c.value !== '').map(async (c) => {
          const res: any = await api.referees.getAll({ page: 1, limit: 1, category: c.value });
          return { value: c.value, count: res.data.total || 0 };
        })
      );
      const map: Record<string, number> = {};
      results.forEach(r => { map[r.value] = r.count; });
      // Total = sum of all
      map[''] = results.reduce((s, r) => s + r.count, 0);
      setCategoryCounts(map);
    } catch {
      // Non-critical — sidebar will just show no counts
    }
  };

  useEffect(() => { fetchCategoryCounts(); }, [isAdmin]);

  useEffect(() => {
    fetchReferees();
  }, [page, appliedSearch, selectedCategory, lockedCategory, amateurFilter, isAmateur,
      statusFilter, roleFilter, availFilter]);

  const debouncedSearch = useDebounce(searchTerm, 500);
  useEffect(() => {
    setAppliedSearch(debouncedSearch);
    setPage(1);
  }, [debouncedSearch]);

  // Reset page when filters change
  const handleCategorySelect = (val: string) => {
    setSelectedCategory(val);
    setPage(1);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setIsEditMode(false);
    setFormData({ ...emptyForm, category: scopedCategories[0]?.value ?? '' });
    setShowFormModal(true);
  };

  const openEdit = (r: any) => {
    setIsEditMode(true);
    setFormData({
      recordId: r._id || r.id || '',
      firstName: r.userId?.firstName || '',
      lastName: r.userId?.lastName || '',
      email: r.userId?.email || '',
      password: '',
      confirmPassword: '',
      phoneNumber: r.userId?.phoneNumber || '',
      matricule: r.matricule || '',
      cin: r.cin || '',
      dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toISOString().split('T')[0] : '',
      category: r.category || (scopedCategories[0]?.value ?? ''),
      region: r.region || '',
      league: r.league || '',
      address: r.address || '',
      notes: r.notes || '',
      allowedRoles: r.allowedRoles || [],
      isVARCertified: r.isVARCertified || false,
      isAvailable: r.isAvailable !== undefined ? r.isAvailable : true,
      emergencyContactName: r.emergencyContact?.name || '',
      emergencyContactPhone: r.emergencyContact?.phone || '',
    });
    setShowFormModal(true);
  };

  const handleFormChange = (e: any) => {
    const { id, value, checked, type } = e.target;

    if (id.startsWith('allowedRoles-')) {
      setFormData((prev: any) => {
        const currentRoles: string[] = prev.allowedRoles || [];
        const newRoles = checked
          ? [...currentRoles, value]
          : currentRoles.filter((r: string) => r !== value);
        return { ...prev, allowedRoles: newRoles };
      });
      return;
    }

    if (type === 'checkbox' && (id === 'isVARCertified' || id === 'isAvailable')) {
      setFormData((prev: any) => ({ ...prev, [id]: checked }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode) {
        if (!validateForm(
          { category: formData.category, region: formData.region, cin: formData.cin, dateOfBirth: formData.dateOfBirth },
          ['category', 'region', 'cin', 'dateOfBirth'],
        )) return;

        const refereeData: any = {
          category: formData.category,
          region: formData.region,
          league: formData.league || undefined,
          cin: formData.cin,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address || undefined,
          notes: formData.notes || undefined,
          allowedRoles: formData.allowedRoles?.length > 0 ? formData.allowedRoles : undefined,
          isVARCertified: formData.isVARCertified || false,
          isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
        };
        if (formData.emergencyContactName && formData.emergencyContactPhone) {
          refereeData.emergencyContact = {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
          };
        }
        await api.referees.update(formData.recordId, refereeData);
        toast.success('Arbitre modifié avec succès');
      } else {
        if (!validateForm(
          {
            email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword,
            firstName: formData.firstName, lastName: formData.lastName,
            matricule: formData.matricule, category: formData.category,
            region: formData.region, cin: formData.cin, dateOfBirth: formData.dateOfBirth,
          },
          ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'matricule', 'category', 'region', 'cin', 'dateOfBirth'],
        )) return;

        const refereeData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber || undefined,
          matricule: formData.matricule,
          cin: formData.cin,
          dateOfBirth: formData.dateOfBirth,
          category: formData.category,
          region: formData.region,
          league: formData.league || undefined,
          address: formData.address || undefined,
          notes: formData.notes || undefined,
          allowedRoles: formData.allowedRoles,
          isVARCertified: formData.isVARCertified || false,
          isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
        };
        if (formData.emergencyContactName && formData.emergencyContactPhone) {
          refereeData.emergencyContact = {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
          };
        }
        await api.referees.create(refereeData);
        toast.success('Arbitre créé avec succès');
      }
      setShowFormModal(false);
      fetchReferees();
      fetchCategoryCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement de l'arbitre");
    }
  };

  const handleDelete = async () => {
    if (!refereeToDelete) return;
    try {
      await api.referees.delete(refereeToDelete);
      toast.success('Arbitre supprimé avec succès');
      setShowDeleteModal(false);
      setRefereeToDelete(null);
      fetchReferees();
      fetchCategoryCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // ── Form field definitions ─────────────────────────────────────────────────

  const baseProfileFields: FormField[] = [
    { name: 'matricule',    label: 'Matricule',          placeholder: 'Matricule',  required: true, disabled: isEditMode },
    { name: 'cin',          label: 'CIN',                placeholder: 'CIN',        required: true },
    { name: 'dateOfBirth',  label: 'Date de naissance',  type: 'date',              required: true },
    { name: 'category',     label: 'Catégorie',          type: 'select', options: scopedCategories, required: true },
    { name: 'region',       label: 'Région',             placeholder: 'Région',     required: true },
    { name: 'league',       label: 'Ligue (optionnel)',   placeholder: 'Ligue',      required: false },
  ];

  const createOnlyFields: FormField[] = [
    { name: 'firstName',    label: 'Prénom',              placeholder: 'Prénom',     required: true },
    { name: 'lastName',     label: 'Nom',                 placeholder: 'Nom',        required: true },
    { name: 'email',        label: 'Email',               type: 'email',             placeholder: 'Email',      required: true },
    { name: 'phoneNumber',  label: 'Téléphone (optionnel)', type: 'tel',             placeholder: 'Téléphone',  required: false },
    { name: 'password',     label: 'Mot de passe',        type: 'password',          placeholder: 'Mot de passe', required: true },
    { name: 'confirmPassword', label: 'Confirmer mot de passe', type: 'password',   placeholder: 'Confirmer',  required: true },
  ];

  const extendedProfileFields: FormField[] = [
    { name: 'address', label: 'Adresse (optionnel)', placeholder: 'Adresse', required: false },
    {
      name: 'allowedRoles',
      label: 'Rôles Autorisés (optionnel)',
      type: 'checkbox',
      options: ALLOWED_REFEREE_ROLES,
      required: false,
      className: 'col-span-1 md:col-span-2',
    },
    { name: 'isVARCertified', label: 'Certifié VAR',    type: 'checkbox', required: false },
    { name: 'isAvailable',    label: 'Disponible',       type: 'checkbox', required: false },
    { name: 'emergencyContactName',  label: "Contact d'urgence - Nom (optionnel)",       placeholder: 'Nom du contact',       required: false },
    { name: 'emergencyContactPhone', label: "Contact d'urgence - Téléphone (optionnel)", type: 'tel', placeholder: 'Téléphone du contact', required: false },
    { name: 'notes', label: 'Notes (optionnel)', placeholder: 'Notes', required: false, className: 'col-span-1 md:col-span-2' },
  ];

  const formFields = isEditMode
    ? [...baseProfileFields, ...extendedProfileFields]
    : [...createOnlyFields, ...baseProfileFields, ...extendedProfileFields];

  // ── Sidebar visible categories ─────────────────────────────────────────────
  // Commission roles only see their own locked category; admins see all.
  const sidebarCategories = useMemo(() => {
    if (lockedCategory) {
      return CATEGORY_OPTIONS.filter(c => c.value === lockedCategory || c.value === '');
    }
    return CATEGORY_OPTIONS;
  }, [lockedCategory]);

  // The active category key to drive sidebar highlight
  const activeCatKey = lockedCategory ?? selectedCategory;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.DESIGNATION_DNA, Role.FINANCE_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA, Role.CDC, Role.CDE, Role.INSPECTEUR]}>
      <div className="flex gap-0 border border-gray-200 dark:border-flashscore-border rounded-xl overflow-hidden bg-white dark:bg-flashscore-card min-h-[600px]">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="w-48 shrink-0 border-r border-gray-200 dark:border-flashscore-border bg-gray-50 dark:bg-black/10 py-4 hidden md:flex flex-col">
          <p className="px-4 pb-3 text-[10px] font-medium text-gray-400 dark:text-flashscore-muted uppercase tracking-widest">
            Catégories
          </p>
          {sidebarCategories.map((cat) => {
            const isActive = activeCatKey === cat.value || (cat.value === '' && !activeCatKey);
            const count    = categoryCounts[cat.value] ?? null;
            return (
              <button
                key={cat.value}
                onClick={() => !lockedCategory && handleCategorySelect(cat.value)}
                disabled={!!lockedCategory && cat.value !== '' && cat.value !== lockedCategory}
                className={[
                  'flex items-center justify-between px-4 py-2 text-left w-full transition-colors border-l-2',
                  isActive
                    ? 'border-l-[#ce1126] bg-white dark:bg-flashscore-hover'
                    : 'border-l-transparent hover:bg-white dark:hover:bg-flashscore-hover/50',
                  lockedCategory && cat.value !== lockedCategory && cat.value !== '' ? 'opacity-40 cursor-default' : 'cursor-pointer',
                ].join(' ')}
              >
                <span className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-flashscore-text">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                  {cat.label}
                </span>
                {count !== null && (
                  <span className={[
                    'text-[10px] rounded-full px-1.5 py-0.5 font-medium',
                    isActive ? 'bg-[#ce1126] text-white' : 'bg-gray-200 dark:bg-flashscore-hover text-gray-500 dark:text-flashscore-muted',
                  ].join(' ')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Top bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-flashscore-border">
            <div className="flex items-center gap-3">
              <h3 className="text-[15px] font-medium text-gray-900 dark:text-flashscore-text">
                Liste des Arbitres
              </h3>
              {lockedCategory && (
                <span className="text-[11px] bg-red-50 dark:bg-red-950/30 text-[#ce1126] dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-full px-2.5 py-0.5 font-medium">
                  {ROLE_SCOPE_LABEL[user!.role] ?? lockedCategory}
                </span>
              )}
              {!lockedCategory && selectedCategory && (
                <span className="text-[11px] bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-flashscore-muted rounded-full px-2.5 py-0.5 font-medium">
                  {CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile category selector — hidden on md+ where sidebar shows */}
              <select
                value={lockedCategory ?? selectedCategory}
                onChange={(e) => !lockedCategory && handleCategorySelect(e.target.value)}
                disabled={!!lockedCategory}
                className="md:hidden text-[12px] border border-gray-200 dark:border-flashscore-border rounded-lg px-2 py-1.5 bg-white dark:bg-flashscore-card"
              >
                {sidebarCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un arbitre…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-[13px] border border-gray-200 dark:border-flashscore-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ce1126] bg-white dark:bg-flashscore-card w-44 sm:w-52"
                />
              </div>

              {canCreate && (
                <Button variant="primary" onClick={openCreate} className="flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </Button>
              )}
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-gray-200 dark:border-flashscore-border text-[12px]">
            <span className="text-gray-400 dark:text-flashscore-muted mr-0.5">Statut :</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={[
                  'rounded-full px-3 py-0.5 border transition-colors',
                  statusFilter === f.value
                    ? 'bg-[#ce1126] text-white border-[#ce1126]'
                    : 'border-gray-200 dark:border-flashscore-border text-gray-500 dark:text-flashscore-muted hover:border-gray-400',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}

            <span className="mx-1 text-gray-300 dark:text-flashscore-border">|</span>
            <span className="text-gray-400 dark:text-flashscore-muted mr-0.5">Rôle :</span>
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setRoleFilter(f.value); setPage(1); }}
                className={[
                  'rounded-full px-3 py-0.5 border transition-colors',
                  roleFilter === f.value
                    ? 'bg-[#ce1126] text-white border-[#ce1126]'
                    : 'border-gray-200 dark:border-flashscore-border text-gray-500 dark:text-flashscore-muted hover:border-gray-400',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}

            <span className="mx-1 text-gray-300 dark:text-flashscore-border">|</span>
            <span className="text-gray-400 dark:text-flashscore-muted mr-0.5">Dispo :</span>
            {AVAILABILITY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setAvailFilter(f.value); setPage(1); }}
                className={[
                  'rounded-full px-3 py-0.5 border transition-colors',
                  availFilter === f.value
                    ? 'bg-[#ce1126] text-white border-[#ce1126]'
                    : 'border-gray-200 dark:border-flashscore-border text-gray-500 dark:text-flashscore-muted hover:border-gray-400',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}

            {/* Clear all filters */}
            {(statusFilter || roleFilter || availFilter) && (
              <button
                onClick={() => { setStatusFilter(''); setRoleFilter(''); setAvailFilter(''); setPage(1); }}
                className="ml-auto text-[11px] text-gray-400 dark:text-flashscore-muted underline underline-offset-2 hover:text-[#ce1126]"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ce1126]" />
            </div>
          ) : (
            <>
              <Table headers={[
                "Arbitre", "Matricule", "Catégorie", "Région",
                ...(showActions ? ["Actions"] : []),
              ]}>
                {referees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 5 : 4} className="text-center text-gray-400 dark:text-flashscore-muted py-12">
                      Aucun arbitre trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  referees.map((u: any, idx: number) => {
                    const firstName = u.userId?.firstName || u.firstName || '';
                    const lastName  = u.userId?.lastName  || u.lastName  || '';
                    const fullName  = `${firstName} ${lastName}`.trim();
                    const email     = u.userId?.email || '';
                    const isActive  = u.userId?.isActive;
                    const isVAR     = u.isVARCertified;
                    const unavail   = u.isAvailable === false;

                    return (
                      <TableRow key={`referee-${u._id || u.id}-${idx}`}>

                        {/* Arbitre — name + email + inline status pills */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={fullName} size="sm" />
                            <div>
                              <div className="font-medium text-[13px] leading-tight">{fullName || '-'}</div>
                              {email && (
                                <div className="text-[11px] text-gray-400 dark:text-flashscore-muted mt-0.5">{email}</div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge status={isActive ? 'success' : 'error'}>
                                  {isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                                {isVAR && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400">
                                    <ShieldCheck className="w-3 h-3" />
                                    VAR
                                  </span>
                                )}
                                {unavail && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500">
                                    <CalendarOff className="w-3 h-3" />
                                    Indisponible
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Matricule */}
                        <TableCell className="font-mono text-[12px] text-gray-600 dark:text-flashscore-muted">
                          {u.matricule || '-'}
                        </TableCell>

                        {/* Catégorie */}
                        <TableCell>
                          {u.category ? (
                            <span
                              className="text-[11px] font-medium rounded px-2 py-0.5"
                              style={{
                                background: (CATEGORY_OPTIONS.find(c => c.value === u.category)?.color ?? '#888') + '1a',
                                color: CATEGORY_OPTIONS.find(c => c.value === u.category)?.color ?? '#888',
                              }}
                            >
                              {u.category}
                            </span>
                          ) : '-'}
                        </TableCell>

                        {/* Région */}
                        <TableCell className="text-[13px]">
                          {u.region || '-'}
                        </TableCell>

                        {/* Actions */}
                        {showActions && (
                          <TableCell>
                            <div className="flex gap-1">
                              {canEdit && (
                                <button
                                  onClick={() => openEdit(u)}
                                  className="p-1.5 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                                  title="Modifier"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => { setRefereeToDelete(u._id || u.id); setShowDeleteModal(true); }}
                                  className="p-1.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </Table>

              {totalPages > 1 && referees.length > 0 && (
                <div className="mt-4 px-5 pb-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={total}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEditMode ? "Modifier l'arbitre" : "Ajouter un arbitre"}
      >
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          <Form fields={formFields} formData={formData} onChange={handleFormChange} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>{isEditMode ? 'Enregistrer' : 'Créer'}</Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        setEventToDelete={setRefereeToDelete}
        handleDelete={handleDelete}
        message="Êtes-vous sûr de vouloir supprimer cet arbitre ? Cette action est irréversible."
      />
    </AuthGuard>
  );
};

export default RefereesListPage;