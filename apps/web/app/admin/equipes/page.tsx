'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { Pagination } from '../../../components/ui/Pagination';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import {
  Search, Plus, Edit2, Trash2, MapPin, Building2,
  Shield, ChevronRight, AlertCircle, LayoutGrid, List, Trophy, X,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useUser } from '../../../hooks/useUser';
import { useDebounce } from '../../../hooks/useDebounce';
import { Role } from '../../../types/user';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Team {
  _id?: string;
  id?: string;
  name: string;
  shortName: string;
  city: string;
  region: string;
  league: string;
  stadium?: string;
  logo?: string | null;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateTeamPayload {
  name: string;
  shortName: string;
  city: string;
  region: string;
  league: string;
  stadium?: string;
  logo?: string;
}

interface UpdateTeamPayload {
  name?: string;
  shortName?: string;
  city?: string;
  region?: string;
  league?: string;
  stadium?: string;
  logo?: string;
  isActive?: boolean;
}

interface TeamFormData {
  name: string;
  shortName: string;
  city: string;
  region: string;
  league: string;
  stadium: string;
  logo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_FORM_DATA: TeamFormData = {
  name: '', shortName: '', city: '', region: '',
  league: 'LIGUE1', stadium: '', logo: '',
};

const ALL_LEAGUES = [
  { value: 'LIGUE1', label: 'Ligue 1' },
  { value: 'LIGUE2', label: 'Ligue 2' },
  { value: 'COUPE', label: 'Coupe' },
  { value: 'AMATEUR_C1', label: 'Amateur C1' },
  { value: 'AMATEUR_C2', label: 'Amateur C2' },
  { value: 'JEUNES', label: 'Jeunes' },
  { value: 'FEMININE', label: 'Féminine' },
  { value: 'REGIONAL', label: 'Régional' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalize = (team: any): Team => ({ ...team, id: team._id || team.id });

const toCreatePayload = (f: TeamFormData): CreateTeamPayload => ({
  name: f.name.trim(), shortName: f.shortName.trim(),
  city: f.city.trim(), region: f.region.trim(), league: f.league,
  ...(f.stadium.trim() && { stadium: f.stadium.trim() }),
  ...(f.logo && { logo: f.logo }),
});

const toUpdatePayload = (f: TeamFormData): UpdateTeamPayload => ({
  ...(f.name.trim()      && { name:      f.name.trim()      }),
  ...(f.shortName.trim() && { shortName: f.shortName.trim() }),
  ...(f.city.trim()      && { city:      f.city.trim()      }),
  ...(f.region.trim()    && { region:    f.region.trim()    }),
  ...(f.league           && { league:    f.league           }),
  ...(f.stadium.trim()   && { stadium:   f.stadium.trim()   }),
  ...(f.logo             && { logo:      f.logo             }),
});

const getInitials = (name = '', short = '') =>
  short ? short.slice(0, 3) : name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// ─── League Badge ─────────────────────────────────────────────────────────────

const LEAGUE_BADGE_CONFIG: Record<string, { label: string, color: string, dot: string }> = {
  'LIGUE1':     { label: 'Ligue 1',    color: 'bg-[#C8102E1A] text-[#9E0C24] border-[#C8102E]/25', dot: '●' },
  'LIGUE2':     { label: 'Ligue 2',    color: 'bg-[#E8EDF5] dark:bg-flashscore-hover text-[#1A3260] border-[#E8EDF5]', dot: '○' },
  'COUPE':      { label: 'Coupe',      color: 'bg-amber-50 text-amber-700 border-amber-200', dot: '🏆' },
  'AMATEUR_C1': { label: 'Amateur C1', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'A1' },
  'AMATEUR_C2': { label: 'Amateur C2', color: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'A2' },
  'JEUNES':     { label: 'Jeunes',     color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'J' },
  'FEMININE':   { label: 'Féminine',   color: 'bg-pink-50 text-pink-700 border-pink-200', dot: 'F' },
  'REGIONAL':   { label: 'Régional',   color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'R' },
};

const LeagueBadge = ({ league }: { league: string }) => {
  const config = LEAGUE_BADGE_CONFIG[league?.toUpperCase()] || { label: league || 'Inconnu', color: 'bg-gray-50 dark:bg-flashscore-hover text-gray-700 dark:text-gray-300 border-gray-200 dark:border-flashscore-border', dot: '?' };
  
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full',
        'text-[10px] font-bold tracking-wider uppercase border',
        config.color
      ].join(' ')}
    >
      {config.dot} {config.label}
    </span>
  );
};

// ─── Team Avatar ──────────────────────────────────────────────────────────────

const SIZE_MAP = {
  sm: { box: 'w-10 h-10 rounded-[10px]', text: 'text-[11px]' },
  md: { box: 'w-[52px] h-[52px] rounded-xl', text: 'text-[13px]' },
  lg: { box: 'w-[72px] h-[72px] rounded-2xl', text: 'text-lg' },
};

const TeamAvatar = ({
  logo, name, shortName, size = 'md',
}: { logo?: string | null; name: string; shortName?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const s = SIZE_MAP[size];
  const initials = getInitials(name, shortName);
  if (logo) {
    return (
      <div className={`${s.box} flex-shrink-0 overflow-hidden border border-[#E4E7EF] dark:border-flashscore-border bg-white dark:bg-flashscore-card flex items-center justify-center`}>
        <img src={logo} alt={name} className="w-full h-full object-contain p-1" />
      </div>
    );
  }
  return (
    <div className={`${s.box} flex-shrink-0 bg-[#C8102E1A] border-[1.5px] border-[#C8102E]/25 flex items-center justify-center`}>
      <span className={`${s.text} font-bold text-[#C8102E] tracking-widest`}>{initials}</span>
    </div>
  );
};

// ─── Logo Picker ──────────────────────────────────────────────────────────────

const LogoPicker = ({ value, onChange }: { value: string; onChange: (base64: string) => void }) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="mt-4">
      <label className="block text-[11px] font-bold text-[#8896A8] dark:text-gray-400 tracking-wider uppercase mb-2">
        Logo
      </label>
      <div className="flex items-center gap-3.5">
        <div className="w-[52px] h-[52px] rounded-xl border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border bg-[#F7F8FC] dark:bg-flashscore-hover flex items-center justify-center overflow-hidden flex-shrink-0">
          {value
            ? <img src={value} alt="aperçu" className="w-full h-full object-cover" />
            : <Shield size={20} className="text-[#8896A8] dark:text-gray-400" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[9px] border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border bg-white dark:bg-flashscore-card text-[13px] text-[#4A5568] dark:text-gray-300 font-semibold">
            <Plus size={13} />
            Choisir une image
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-[#C8102E] bg-transparent border-none cursor-pointer text-left p-0"
            >
              Retirer le logo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Team Card (Grid View) ────────────────────────────────────────────────────

const TeamCard = ({
  team, isAdmin, onView, onEdit, onDelete,
}: {
  team: Team;
  isAdmin: boolean;
  onView: (t: Team) => void;
  onEdit: (t: Team) => void;
  onDelete: (t: Team) => void;
}) => {
  return (
    <div
      onClick={() => onView(team)}
      className={[
        'group bg-white dark:bg-flashscore-card rounded-2xl overflow-hidden cursor-pointer flex flex-col',
        'border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border hover:border-[#C8D0E0] dark:border-flashscore-hover',
        'shadow-sm hover:shadow-[0_8px_32px_rgba(11,29,58,0.10)]',
        'hover:-translate-y-0.5 transition-all duration-200',
      ].join(' ')}
    >
      <div className="p-[18px] pb-3.5 flex-1">
        <div className="flex items-start justify-between mb-3.5">
          <TeamAvatar logo={team.logo} name={team.name} shortName={team.shortName} size="md" />
          <LeagueBadge league={team.league} />
        </div>
        <h3 className="text-sm font-bold text-[#0B1D3A] dark:text-flashscore-text group-hover:text-[#C8102E] leading-snug mb-1 transition-colors line-clamp-2">
          {team.name}
        </h3>
        {team.shortName && (
          <span className="text-[10px] font-extrabold text-[#8896A8] dark:text-gray-400 bg-[#F7F8FC] dark:bg-flashscore-hover px-2 py-0.5 rounded-md tracking-widest inline-block mb-2.5">
            {team.shortName}
          </span>
        )}
        <div className="flex flex-col gap-1.5 mt-1">
          {team.city && (
            <div className="flex items-center gap-1.5 text-xs text-[#4A5568] dark:text-gray-300">
              <MapPin size={11} className="text-[#8896A8] dark:text-gray-400" strokeWidth={2} />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {team.city}{team.region && team.region !== team.city ? `, ${team.region}` : ''}
              </span>
            </div>
          )}
          {team.stadium && (
            <div className="flex items-center gap-1.5 text-xs text-[#4A5568] dark:text-gray-300">
              <Building2 size={11} className="text-[#8896A8] dark:text-gray-400" strokeWidth={2} />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{team.stadium}</span>
            </div>
          )}
        </div>
      </div>
      {isAdmin && (
        <div
          className="border-t border-[#E4E7EF] dark:border-flashscore-border px-[18px] py-2.5 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(team)}
            className="flex items-center gap-1.5 border-none bg-transparent cursor-pointer text-[11px] font-semibold text-blue-500 px-2 py-1 rounded-md transition-colors hover:bg-blue-50"
          >
            <Edit2 size={11} /> Modifier
          </button>
          <button
            onClick={() => onDelete(team)}
            className="flex items-center gap-1.5 border-none bg-transparent cursor-pointer text-[11px] font-semibold text-[#8896A8] dark:text-gray-400 px-2 py-1 rounded-md transition-all hover:bg-red-50 hover:text-[#C8102E]"
          >
            <Trash2 size={11} /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Team Row (List View) ─────────────────────────────────────────────────────

const TeamRow = ({
  team, isAdmin, onView, onEdit, onDelete,
}: {
  team: Team;
  isAdmin: boolean;
  onView: (t: Team) => void;
  onEdit: (t: Team) => void;
  onDelete: (t: Team) => void;
}) => {
  return (
    <div
      onClick={() => onView(team)}
      className={[
        'group flex items-center gap-3.5 px-4 py-3 rounded-[10px] cursor-pointer',
        'bg-white dark:bg-flashscore-card hover:bg-[#F7F8FC] dark:bg-flashscore-hover border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border hover:border-[#C8D0E0] dark:border-flashscore-hover',
        'transition-all duration-150',
      ].join(' ')}
    >
      <TeamAvatar logo={team.logo} name={team.name} shortName={team.shortName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[13px] text-[#0B1D3A] dark:text-flashscore-text group-hover:text-[#C8102E] transition-colors overflow-hidden text-ellipsis whitespace-nowrap">
            {team.name}
          </span>
          {team.shortName && (
            <span className="text-[9px] font-extrabold text-[#8896A8] dark:text-gray-400 bg-[#F7F8FC] dark:bg-flashscore-hover px-1.5 py-px rounded tracking-widest">
              {team.shortName}
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-0.5">
          {team.city && (
            <span className="text-[11px] text-[#8896A8] dark:text-gray-400 flex items-center gap-1">
              <MapPin size={9} />{team.city}
            </span>
          )}
          {team.stadium && (
            <span className="text-[11px] text-[#8896A8] dark:text-gray-400 flex items-center gap-1">
              <Building2 size={9} />{team.stadium}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <LeagueBadge league={team.league} />
        {isAdmin && (
          <div
            className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit(team)}
              className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer text-blue-500 transition-colors hover:bg-blue-50"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(team)}
              className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer text-[#8896A8] dark:text-gray-400 transition-all hover:bg-red-50 hover:text-[#C8102E]"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
        <ChevronRight size={14} className="text-[#8896A8] dark:text-gray-400" />
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ hasSearch, isAdmin, onAdd }: { hasSearch: boolean; isAdmin: boolean; onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="w-16 h-16 rounded-[20px] bg-[#E8EDF5] dark:bg-flashscore-hover border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border flex items-center justify-center mb-4">
      <Trophy size={26} className="text-[#8896A8] dark:text-gray-400" strokeWidth={1.5} />
    </div>
    <p className="text-[15px] font-semibold text-[#0B1D3A] dark:text-flashscore-text mb-1.5">
      {hasSearch ? 'Aucun résultat trouvé' : 'Aucune équipe dans cette ligue'}
    </p>
    <p className="text-[13px] text-[#8896A8] dark:text-gray-400 mb-6 max-w-[280px]">
      {hasSearch
        ? 'Essayez un autre terme de recherche.'
        : isAdmin
          ? 'Ajoutez la première équipe pour commencer.'
          : 'Les équipes apparaîtront ici une fois ajoutées.'}
    </p>
    {!hasSearch && isAdmin && (
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#C8102E] hover:bg-[#9E0C24] text-white border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all shadow-[0_4px_14px_rgba(200,16,46,0.25)]"
      >
        <Plus size={15} />Ajouter une équipe
      </button>
    )}
  </div>
);

// ─── Skeletons ────────────────────────────────────────────────────────────────

const SK = 'bg-[linear-gradient(90deg,#F7F8FC_25%,#E4E7EF_50%,#F7F8FC_75%)] bg-[length:200%_100%] animate-shimmer rounded-md';

const ShimmerKeyframes = () => (
  <style>{`
    @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
    .animate-shimmer { animation: shimmer 1.4s infinite }
  `}</style>
);

const GridSkeleton = () => (
  <>
    <ShimmerKeyframes />
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-flashscore-card rounded-2xl border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border overflow-hidden">
        <div className={`h-[3px] ${SK}`} />
        <div className="p-[18px]">
          <div className="flex justify-between mb-3.5">
            <div className={`w-[52px] h-[52px] rounded-xl ${SK}`} />
            <div className={`w-[54px] h-[18px] rounded-full ${SK}`} />
          </div>
          <div className={`h-3.5 w-[80%] mb-2 ${SK}`} />
          <div className={`h-2.5 w-[35%] mb-3.5 ${SK}`} />
          <div className={`h-[11px] w-[65%] mb-1.5 ${SK}`} />
          <div className={`h-[11px] w-1/2 ${SK}`} />
        </div>
      </div>
    ))}
    </div>
  </>
);

const ListSkeleton = () => (
  <>
    <ShimmerKeyframes />
    <div className="flex flex-col gap-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3.5 px-4 py-3 bg-white dark:bg-flashscore-card rounded-xl border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border">
        <div className={`w-10 h-10 rounded-[10px] flex-shrink-0 ${SK}`} />
        <div className="flex-1">
          <div className={`h-[13px] w-[40%] mb-1.5 ${SK}`} />
          <div className={`h-2.5 w-[55%] ${SK}`} />
        </div>
        <div className={`w-[52px] h-[18px] rounded-full ${SK}`} />
      </div>
    ))}
    </div>
  </>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const { user } = useUser();
  const isAdmin = user?.role === Role.ADMIN_DNA;

  // ── UI state ──
  const [activeTab, setActiveTab]                   = useState('LIGUE1');
  const [searchQuery, setSearchQuery]               = useState('');
  const [search, setSearch]                         = useState('');
  const [viewMode, setViewMode]                     = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen]         = useState(false);
  const [isEditModalOpen, setIsEditModalOpen]       = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen]   = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam]             = useState<Team | null>(null);
  const [currentPage, setCurrentPage]               = useState(1);
  const [totalPages, setTotalPages]                 = useState(1);
  const [total, setTotal]                           = useState(0);
  const limit = 10;

  // ── Form state ──
  const [newTeam, setNewTeam]     = useState<TeamFormData>(INITIAL_FORM_DATA);
  const [editTeam, setEditTeam]   = useState<TeamFormData>(INITIAL_FORM_DATA);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Data state ──
  const [teams, setTeams]               = useState<Team[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page: currentPage, limit, league: activeTab };
      if (search) params.search = search;
      const response = await api.teams.getAll(params);
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      setTeams(data.map(normalize));
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, [activeTab, currentPage, search]);
  useEffect(() => { setCurrentPage(1); setSearch(''); setSearchQuery(''); }, [activeTab]);

  // Debounced search: applies the search query 500ms after the user stops
  // typing, resetting to the first page. No Enter / button submission needed.
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  useEffect(() => {
    setCurrentPage(1);
    setSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // ─── Form fields ─────────────────────────────────────────────────────────────

  const getFormFields = (): FormField[] => [
    {
      name: 'name', label: "Nom de l'équipe",
      placeholder: 'Ex: Espérance Sportive de Tunis',
      required: true, className: 'col-span-1 md:col-span-2',
    },
    { name: 'shortName', label: 'Abréviation', placeholder: 'Ex: EST', required: true },
    { name: 'city',      label: 'Ville',        placeholder: 'Ex: Tunis', required: true },
    { name: 'region',    label: 'Région',       placeholder: 'Ex: Grand Tunis', required: true },
    { name: 'league',    label: 'Ligue',        type: 'select', options: ALL_LEAGUES, required: true },
    { name: 'stadium',   label: 'Stade',        placeholder: 'Ex: Stade Hammadi Agrebi' },
  ];

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validateCreate = (f: TeamFormData): string | null => {
    if (!f.name.trim())      return "Le nom de l'équipe est requis";
    if (!f.shortName.trim()) return "L'abréviation est requise";
    if (!f.city.trim())      return 'La ville est requise';
    if (!f.region.trim())    return 'La région est requise';
    if (!f.league)           return 'La ligue est requise';
    return null;
  };

  const validateUpdate = (f: TeamFormData): string | null => {
    if (f.league && !ALL_LEAGUES.find((l) => l.value === f.league)) return 'Ligue invalide';
    return null;
  };

  // ─── CRUD handlers ───────────────────────────────────────────────────────────

  const handleAddTeam = async () => {
    const validationError = validateCreate(newTeam);
    if (validationError) return setFormError(validationError);
    setFormError(null); setIsSubmitting(true);
    try {
      await api.teams.create(toCreatePayload(newTeam));
      setSearchQuery(''); await fetchTeams();
      setNewTeam(INITIAL_FORM_DATA); setIsAddModalOpen(false);
    } catch (err: any) {
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(', ')
        : (err.response?.data?.message ?? err.message ?? "Erreur lors de l'ajout");
      setFormError(msg);
    } finally { setIsSubmitting(false); }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam) return setFormError('Aucune équipe sélectionnée');
    const validationError = validateUpdate(editTeam);
    if (validationError) return setFormError(validationError);
    setFormError(null); setIsSubmitting(true);
    try {
      await api.teams.update(selectedTeam.id, toUpdatePayload(editTeam));
      await fetchTeams(); setIsEditModalOpen(false);
      setSelectedTeam(null); setEditTeam(INITIAL_FORM_DATA);
    } catch (err: any) {
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(', ')
        : (err.response?.data?.message ?? err.message ?? 'Erreur lors de la modification');
      setFormError(msg);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    setIsSubmitting(true);
    try {
      await api.teams.delete(selectedTeam.id);
      await fetchTeams(); setIsDeleteModalOpen(false); setSelectedTeam(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? err.message ?? 'Erreur lors de la suppression');
    } finally { setIsSubmitting(false); }
  };

  // ─── Modal helpers ───────────────────────────────────────────────────────────

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setEditTeam({
      name: team.name ?? '', shortName: team.shortName ?? '',
      logo: team.logo ?? '', city: team.city ?? '',
      region: team.region ?? '', league: team.league ?? '',
      stadium: team.stadium ?? '',
    });
    setFormError(null); setIsEditModalOpen(true);
  };

  const openDeleteModal = (team: Team) => {
    setSelectedTeam(team); setFormError(null); setIsDeleteModalOpen(true);
  };

  // ─── Shared modal footer ─────────────────────────────────────────────────────

  const ModalFooter = ({
    onCancel, onConfirm, confirmLabel, danger = false,
  }: {
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel: string;
    danger?: boolean;
  }) => (
    <div className="flex flex-col gap-3 mt-6">
      {formError && (
        <div className="flex gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-[10px] text-[13px] text-red-700">
          <AlertCircle size={14} className="flex-shrink-0 mt-px" />
          <span>{formError}</span>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-[18px] py-2.5 bg-transparent hover:bg-[#F7F8FC] dark:bg-flashscore-hover text-[#4A5568] dark:text-gray-300 border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border rounded-[10px] text-[13px] font-semibold cursor-pointer transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className={[
            'flex items-center justify-center gap-1.5 px-[18px] py-2.5',
            'bg-[#C8102E] hover:bg-[#9E0C24] text-white border-none rounded-[10px]',
            'text-[13px] font-bold transition-all shadow-[0_4px_14px_rgba(200,16,46,0.25)]',
            isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ].join(' ')}
        >
          {isSubmitting ? (
            <>
              <div className="w-[13px] h-[13px] border-2 border-white/25 border-t-white rounded-full animate-spin" />
              Chargement…
            </>
          ) : confirmLabel}
        </button>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.DESIGNATION_DNA, Role.FINANCE_DNA]}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .animate-fade-up { animation: fadeUp 0.3s ease-out }
      `}</style>
      <div className="animate-fade-up flex flex-col gap-5">

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchTeams}
              className="text-xs underline bg-transparent border-none cursor-pointer text-red-700 font-semibold"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── Main Card ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-flashscore-card rounded-[10px] border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border overflow-hidden shadow-[0_4px_24px_rgba(11,29,58,0.07)]">

          {/* ── Card Header ─────────────────────────────────────────────── */}
          <div className="px-8 pt-7 border-b border-[#E4E7EF] dark:border-flashscore-border">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-flashscore-text mb-2">Équipes</h1>
                  <p className="text-xs text-[#8896A8] dark:text-gray-400 mt-0.5">
                    {total > 0
                      ? `${total} équipe${total > 1 ? 's' : ''} enregistrée${total > 1 ? 's' : ''}`
                      : "Aucune équipe pour l'instant"}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setFormError(null); setIsAddModalOpen(true); }}
                  className={[
                    'flex items-center gap-2 px-5 py-2.5 bg-[#C8102E] hover:bg-[#9E0C24]',
                    'text-white border-none rounded-[5px] text-[13px] font-bold cursor-pointer',
                    'shadow-[0_4px_16px_rgba(200,16,46,0.25)] transition-all whitespace-nowrap',
                    'hover:-translate-y-px',
                  ].join(' ')}
                >
                  <Plus size={15} />Ajouter une équipe
                </button>
              )}
            </div>

            {/* Tabs + view toggle */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-0">
                {ALL_LEAGUES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setActiveTab(l.value)}
                    className={[
                      'px-[22px] py-3 text-[13px] font-bold border-none bg-transparent cursor-pointer',
                      'transition-all border-b-[2.5px]',
                      activeTab === l.value
                        ? 'border-[#C8102E] text-[#C8102E]'
                        : 'border-transparent text-[#8896A8] dark:text-gray-400 hover:text-[#4A5568] dark:text-gray-300',
                    ].join(' ')}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-0.5 bg-[#F7F8FC] dark:bg-flashscore-hover p-1 rounded-[10px] border border-[#E4E7EF] dark:border-flashscore-border mb-1">
                {([['grid', <LayoutGrid size={14} key="g" />], ['list', <List size={14} key="l" />]] as const).map(([mode, icon]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as 'grid' | 'list')}
                    className={[
                      'px-2.5 py-1.5 border-none rounded-lg cursor-pointer transition-all flex items-center',
                      viewMode === mode
                        ? 'bg-white dark:bg-flashscore-card text-[#0B1D3A] dark:text-flashscore-text shadow-[0_1px_4px_rgba(11,29,58,0.08)]'
                        : 'bg-transparent text-[#8896A8] dark:text-gray-400',
                    ].join(' ')}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Card Body ───────────────────────────────────────────────── */}
          <div className="px-8 pt-6 pb-8">

            {/* Search */}
            <div className="relative max-w-[340px] mb-6">
              <Search size={15} className="text-[#8896A8] dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher…"
                className={[
                  'w-full px-9 py-2.5 border-[1.5px] border-[#E4E7EF] dark:border-flashscore-border rounded-[10px]',
                  'text-sm text-[#0B1D3A] dark:text-flashscore-text bg-[#F7F8FC] dark:bg-flashscore-hover outline-none font-inherit',
                  'transition-colors focus:border-[#C8102E] focus:bg-white dark:bg-flashscore-card',
                ].join(' ')}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearch(''); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#8896A8] dark:text-gray-400 flex p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Content */}
            {loading ? (
              viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />
            ) : teams.length === 0 ? (
              <EmptyState
                hasSearch={!!search}
                isAdmin={isAdmin}
                onAdd={() => { setFormError(null); setIsAddModalOpen(true); }}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isAdmin={isAdmin}
                    onView={(t) => { setSelectedTeam(t); setIsDetailsModalOpen(true); }}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {teams.map((team) => (
                  <TeamRow
                    key={team.id}
                    team={team}
                    isAdmin={isAdmin}
                    onView={(t) => { setSelectedTeam(t); setIsDetailsModalOpen(true); }}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            )}

            {/* Pagination — uses your existing Pagination component */}
            {totalPages > 1 && !loading && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={total}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Add Modal ─────────────────────────────────────────────────── */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => { setIsAddModalOpen(false); setNewTeam(INITIAL_FORM_DATA); setFormError(null); }}
          title="Nouvelle équipe"
        >
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <Form
              fields={getFormFields()}
              formData={newTeam}
              onChange={(e: any) => setNewTeam({ ...newTeam, [e.target.id]: e.target.value })}
            />
            <LogoPicker
              value={newTeam.logo}
              onChange={(base64) => setNewTeam((prev) => ({ ...prev, logo: base64 }))}
            />
          </div>
          <ModalFooter
            onCancel={() => { setIsAddModalOpen(false); setNewTeam(INITIAL_FORM_DATA); setFormError(null); }}
            onConfirm={handleAddTeam}
            confirmLabel="Créer l'équipe"
          />
        </Modal>

        {/* ── Edit Modal ────────────────────────────────────────────────── */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedTeam(null); setEditTeam(INITIAL_FORM_DATA); setFormError(null); }}
          title="Modifier l'équipe"
        >
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <Form
              key={`edit-${selectedTeam?.id}`}
              fields={getFormFields()}
              formData={editTeam}
              onChange={(e: any) => setEditTeam({ ...editTeam, [e.target.id]: e.target.value })}
            />
            <LogoPicker
              value={editTeam.logo}
              onChange={(base64) => setEditTeam((prev) => ({ ...prev, logo: base64 }))}
            />
          </div>
          <ModalFooter
            onCancel={() => { setIsEditModalOpen(false); setSelectedTeam(null); setEditTeam(INITIAL_FORM_DATA); setFormError(null); }}
            onConfirm={handleEditTeam}
            confirmLabel="Enregistrer"
          />
        </Modal>

        {/* ── Delete Modal ──────────────────────────────────────────────── */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setSelectedTeam(null); setFormError(null); }}
          title="Supprimer l'équipe"
        >
          <div className="flex gap-3.5 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 size={16} className="text-[#C8102E]" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#0B1D3A] dark:text-flashscore-text mb-1">
                Supprimer <span className="text-[#C8102E]">{selectedTeam?.name}</span> ?
              </p>
              <p className="text-[13px] text-[#4A5568] dark:text-gray-300 leading-relaxed">
                Cette action est irréversible. Toutes les données associées à cette équipe seront définitivement supprimées.
              </p>
            </div>
          </div>
          <ModalFooter
            onCancel={() => { setIsDeleteModalOpen(false); setSelectedTeam(null); setFormError(null); }}
            onConfirm={handleDeleteTeam}
            confirmLabel="Supprimer définitivement"
            danger
          />
        </Modal>

        {/* ── Details Modal ─────────────────────────────────────────────── */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => { setIsDetailsModalOpen(false); setSelectedTeam(null); }}
          title=""
        >
          {selectedTeam && (
            <div>
              {/* Hero */}
              <div className="h-20 bg-gradient-to-br from-[#C8102E1A] to-[#E8EDF5] rounded-t-2xl -mx-6 -mt-6 px-6 pt-6 flex items-end gap-4">
                <div className="-mb-5 flex-shrink-0">
                  <TeamAvatar logo={selectedTeam.logo} name={selectedTeam.name} shortName={selectedTeam.shortName} size="lg" />
                </div>
              </div>

              <div className="pt-8">
                <div className="mb-1.5">
                  <LeagueBadge league={selectedTeam.league} />
                </div>
                <h2 className="text-xl font-extrabold text-[#0B1D3A] dark:text-flashscore-text tracking-tight leading-tight mb-1">
                  {selectedTeam.name}
                </h2>
                {selectedTeam.shortName && (
                  <span className="text-[11px] font-extrabold text-[#8896A8] dark:text-gray-400 bg-[#F7F8FC] dark:bg-flashscore-hover px-2.5 py-0.5 rounded-md tracking-[0.15em] inline-block mb-5">
                    {selectedTeam.shortName}
                  </span>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    { icon: <MapPin size={14} className="text-[#C8102E]" />,   label: 'Ville',   value: selectedTeam.city },
                    { icon: <MapPin size={14} className="text-[#8896A8] dark:text-gray-400" />, label: 'Région',  value: selectedTeam.region },
                    selectedTeam.stadium
                      ? { icon: <Building2 size={14} className="text-[#1A3260]" />, label: 'Stade', value: selectedTeam.stadium }
                      : null,
                    { icon: <Trophy size={14} className="text-[#D4A843]" />, label: 'Ligue', value: selectedTeam.league?.replace('LIGUE', 'Ligue ') },
                  ].filter(Boolean).map(({ icon, label, value }: any) => (
                    <div key={label} className="bg-[#F7F8FC] dark:bg-flashscore-hover rounded-xl px-3.5 py-3 border border-[#E4E7EF] dark:border-flashscore-border">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {icon}
                        <span className="text-[9px] font-extrabold text-[#8896A8] dark:text-gray-400 tracking-widest uppercase">{label}</span>
                      </div>
                      <p className="text-[13px] font-bold text-[#0B1D3A] dark:text-flashscore-text m-0">{value}</p>
                    </div>
                  ))}
                </div>

                {selectedTeam.createdAt && (
                  <p className="text-[11px] text-[#8896A8] dark:text-gray-400 text-right mb-4">
                    Ajoutée le {new Date(selectedTeam.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}

                {isAdmin && (
                  <div className="flex gap-2.5 pt-4 border-t border-[#E4E7EF] dark:border-flashscore-border">
                    <button
                      onClick={() => { setIsDetailsModalOpen(false); openEditModal(selectedTeam); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-[13px] font-bold cursor-pointer transition-colors"
                    >
                      <Edit2 size={13} />Modifier
                    </button>
                    <button
                      onClick={() => { setIsDetailsModalOpen(false); openDeleteModal(selectedTeam); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-[#C8102E] border border-red-200 rounded-xl text-[13px] font-bold cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

      </div>
    </AuthGuard>
  );
}