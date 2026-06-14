"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Form, FormField } from "../../../components/ui/Form";
import { Table, TableRow, TableCell } from "../../../components/ui/Table";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { DeleteModal } from "../../../components/ui/DeleteModel";
import { Pagination } from "../../../components/ui/Pagination";
import {
  Pencil,
  Trash2,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Wifi,
  WifiOff,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { validateForm } from "../../../utils/helpers/form-validator";
import { AuthGuard } from "../../../components/ui/AuthGuard";
import { Role } from "../../../types/user";
import { useDebounce } from "../../../hooks/useDebounce";

// ─── Types ────────────────────────────────────────────────────────────────────
type SortDir = "asc" | "desc" | null;
type SortKey = string | null;

interface ActiveFilters {
  category: string;
  role: string;
  status: string; // 'all' | 'active' | 'inactive'
  varCertified: boolean;
  available: boolean;
}

const DEFAULT_FILTERS: ActiveFilters = {
  category: "",
  role: "",
  status: "all",
  varCertified: false,
  available: false,
};

// ─── Mapper constants ─────────────────────────────────────────────────────────
const RoleMapper: Record<string, string> = {
  ADMIN_DNA: "Admin DNA",
  FINANCE_DNA: "Finance DNA",
  DESIGNATION_DNA: "Désignation DNA",
  CAA: "Commission Amateur",
  CAJ: "Commission Jeunes",
  CAF: "Commission Féminine",
  CRA: "Commission Régionale",
};

const RoleColorMapper: Record<string, string> = {
  ADMIN_DNA: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  FINANCE_DNA:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  DESIGNATION_DNA:
    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  CAA: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  CAJ: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
  CAF: "bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-600/20",
  CRA: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
};

const CategoryColorMapper: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  B: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  C: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  C1: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  C2: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  JEUNE: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
  FEMININE: "bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-600/20",
  REGIONAL: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
};

const CategoryLabelMapper: Record<string, string> = {
  A: "A",
  B: "B",
  C: "C",
  C1: "C1",
  C2: "C2",
  JEUNE: "Jeune",
  FEMININE: "Féminin",
  REGIONAL: "Régional",
};

const REFEREE_CATEGORIES = [
  "A",
  "B",
  "C",
  "C1",
  "C2",
  "JEUNE",
  "FEMININE",
  "REGIONAL",
];
const ADMIN_ROLES = [
  "ADMIN_DNA",
  "FINANCE_DNA",
  "DESIGNATION_DNA",
  "CAA",
  "CAJ",
  "CAF",
];

// ─── Small reusable chips / badges ───────────────────────────────────────────
const RoleBadge = ({ role }: { role: string }) => {
  if (!role)
    return <span className="text-gray-400 dark:text-flashscore-muted">-</span>;
  const label = RoleMapper[role] || role;
  const colors =
    RoleColorMapper[role] ||
    "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-500/20";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors}`}
    >
      {label}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  if (!category)
    return <span className="text-gray-400 dark:text-flashscore-muted">-</span>;
  const label = CategoryLabelMapper[category] || category;
  const colors =
    CategoryColorMapper[category] ||
    "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-500/20";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors}`}
    >
      {label}
    </span>
  );
};

const MatriculeChip = ({ value }: { value: string }) => {
  if (!value)
    return <span className="text-gray-400 dark:text-flashscore-muted">-</span>;
  return (
    <span className="inline-flex items-center font-mono text-xs font-medium bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">
      {value}
    </span>
  );
};

const ActionButtons = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="flex gap-1.5 items-center">
    <button
      title="Modifier"
      className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer text-gray-400 dark:text-flashscore-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
      onClick={onEdit}
    >
      <Pencil className="w-4 h-4" />
    </button>
    <button
      title="Supprimer"
      className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer text-gray-400 dark:text-flashscore-muted hover:text-red-600 hover:bg-red-50 transition-colors"
      onClick={onDelete}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

// ─── Sort header helper ───────────────────────────────────────────────────────
interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (k: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}) => {
  const active = currentKey === sortKey;
  return (
    <button
      className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide hover:text-[#ce1126] transition-colors"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="flex flex-col -space-y-1">
        <ChevronUp
          className={`w-3 h-3 ${active && currentDir === "asc" ? "text-[#ce1126]" : "text-gray-300"}`}
        />
        <ChevronDown
          className={`w-3 h-3 ${active && currentDir === "desc" ? "text-[#ce1126]" : "text-gray-300"}`}
        />
      </span>
    </button>
  );
};

// ─── Filter pill ──────────────────────────────────────────────────────────────
const StatPill = ({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${
              active
                ? `${color} border-transparent shadow-sm scale-105`
                : "bg-white dark:bg-flashscore-card border-gray-200 dark:border-flashscore-border text-gray-500 dark:text-flashscore-muted hover:border-gray-300"
            }`}
  >
    {label}
  </button>
);

// ─── Filter toggle pill ───────────────────────────────────────────────────────
const FilterToggle = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${
              active
                ? "bg-[#ce1126] text-white border-[#ce1126] shadow-sm"
                : "bg-white dark:bg-flashscore-card border-gray-200 dark:border-flashscore-border text-gray-500 dark:text-flashscore-muted hover:border-gray-300"
            }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Utilisateurs = () => {
  const [activeTab, setActiveTab] = useState("Arbitre");
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Client-side filters (applied after fetch)
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const limit = 8;

  const defaultNewUser = {
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    type: "Arbitre",
    matricule: "",
    category: "",
    region: "",
    dateOfBirth: "",
    cin: "",
    league: "",
    address: "",
    notes: "",
    specialization: "",
    startDate: "",
    role: "",
    allowedRoles: [],
    isVARCertified: false,
    isAvailable: true,
    emergencyContactName: "",
    emergencyContactPhone: "",
  };

  const [newUser, setNewUser] = useState<any>(defaultNewUser);

  const tabs = [
    { id: "Arbitre", label: "Arbitres" },
    { id: "Inspecteur", label: "Inspecteurs" },
    { id: "PresidentCRA", label: "Présidents CRA" },
    { id: "Admin", label: "Administration" },
  ];

  const userTypes = [
    { value: "Arbitre", label: "Arbitre" },
    { value: "Inspecteur", label: "Inspecteur" },
    { value: "PresidentCRA", label: "Président CRA" },
    { value: "Admin", label: "Administration" },
  ];

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchDataByTab = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (activeTab === "Arbitre") {
        const response = await api.referees.getAll({
          limit,
          page: currentPage,
          search: searchTerm,
        });
        data = response?.data?.data ?? [];
        setTotal(response?.data?.total ?? 0);
        setTotalPages(response?.data?.totalPages ?? 1);
      } else if (activeTab === "Inspecteur") {
        const response = await api.inspectors.getAll({
          limit,
          page: currentPage,
          search: searchTerm,
        });
        data = response?.data?.data ?? [];
        setTotal(response?.data?.total ?? 0);
        setTotalPages(response?.data?.totalPages ?? 1);
      } else if (activeTab === "PresidentCRA") {
        const response = await api.craPresidents.getAll({
          limit,
          page: currentPage,
          search: searchTerm,
        });
        data = response?.data?.data ?? [];
        setTotal(response?.data?.total ?? 0);
        setTotalPages(response?.data?.totalPages ?? 1);
      } else if (activeTab === "Admin") {
        const response = await api.users.getAll({
          limit,
          page: currentPage,
          search: searchTerm,
          role: "ADMIN_DNA,FINANCE_DNA,DESIGNATION_DNA,CAA,CAJ,CAF",
        });
        data = Array.isArray(response?.data?.data) ? response.data.data : [];
        setTotal(response?.data?.total ?? 0);
        setTotalPages(response?.data?.totalPages ?? 1);
      }
      setCurrentData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setCurrentData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setSortKey(null);
    setSortDir(null);
  }, [activeTab]);

  useEffect(() => {
    fetchDataByTab();
  }, [activeTab, currentPage, searchTerm]);

  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    setSearchTerm(debouncedSearch);
    setCurrentPage(1);
  }, [debouncedSearch]);

  // ── Sort handler ─────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ── Client-side filter + sort ────────────────────────────────────────────
  const processedData = useMemo(() => {
    let data = [...currentData];

    // Category filter (Arbitre)
    if (filters.category && activeTab === "Arbitre") {
      data = data.filter((u) => u.category === filters.category);
    }
    // Role filter (Admin)
    if (filters.role && activeTab === "Admin") {
      data = data.filter((u) => (u.role || u.userId?.role) === filters.role);
    }
    // Status filter
    if (filters.status !== "all") {
      data = data.filter((u) => {
        const isActive = u.userId?.isActive ?? u.isActive;
        return filters.status === "active" ? isActive : !isActive;
      });
    }
    // VAR certified (Arbitre only)
    if (filters.varCertified && activeTab === "Arbitre") {
      data = data.filter((u) => u.isVARCertified);
    }
    // Available (Arbitre only)
    if (filters.available && activeTab === "Arbitre") {
      data = data.filter((u) => u.isAvailable);
    }

    // Sort
    if (sortKey && sortDir) {
      data.sort((a, b) => {
        let aVal = "";
        let bVal = "";
        if (sortKey === "name") {
          const aFirst = a.userId?.firstName || a.firstName || "";
          const aLast = a.userId?.lastName || a.lastName || "";
          aVal = `${aFirst} ${aLast}`.trim().toLowerCase();
          const bFirst = b.userId?.firstName || b.firstName || "";
          const bLast = b.userId?.lastName || b.lastName || "";
          bVal = `${bFirst} ${bLast}`.trim().toLowerCase();
        } else if (sortKey === "category") {
          aVal = a.category || "";
          bVal = b.category || "";
        } else if (sortKey === "region") {
          aVal = a.region || "";
          bVal = b.region || "";
        } else if (sortKey === "matricule") {
          aVal = a.matricule || "";
          bVal = b.matricule || "";
        } else if (sortKey === "role") {
          aVal = a.role || a.userId?.role || "";
          bVal = b.role || b.userId?.role || "";
        }
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [currentData, filters, sortKey, sortDir, activeTab]);

  // ── Which categories / roles are present on the current page ────────────
  const presentCategories = useMemo(() => {
    if (activeTab !== "Arbitre") return new Set<string>();
    return new Set(currentData.map((u) => u.category).filter(Boolean));
  }, [currentData, activeTab]);

  const presentRoles = useMemo(() => {
    if (activeTab !== "Admin") return new Set<string>();
    return new Set(
      currentData.map((u) => u.role || u.userId?.role).filter(Boolean),
    );
  }, [currentData, activeTab]);

  // ── Active filter count ──────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.role) count++;
    if (filters.status !== "all") count++;
    if (filters.varCertified) count++;
    if (filters.available) count++;
    return count;
  }, [filters]);

  const clearAllFilters = () => setFilters(DEFAULT_FILTERS);

  // ── Form field definitions ───────────────────────────────────────────────
  const getFields = (
    currentType: string = "Arbitre",
    isEditMode: boolean = false,
  ): FormField[] => {
    const baseFields: FormField[] = [
      {
        name: "type",
        label: "Type Utilisateur",
        type: "select",
        options: userTypes,
        required: true,
        className: "col-span-1 md:col-span-2",
      },
      {
        name: "firstName",
        label: "Prénom",
        placeholder: "Prénom",
        required: true,
      },
      { name: "lastName", label: "Nom", placeholder: "Nom", required: true },
      {
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "Email",
        required: true,
      },
      {
        name: "phoneNumber",
        type: "tel",
        label: "Téléphone",
        placeholder: "Téléphone",
        required: false,
      },
    ];

    if (!isEditMode) {
      baseFields.push(
        {
          name: "password",
          type: "password",
          label: "Mot de passe",
          placeholder: "Mot de passe",
          required: true,
        },
        {
          name: "confirmPassword",
          label: "Confirmer mot de passe",
          placeholder: "Confirmer",
          type: "password",
          required: true,
        },
      );
    }

    if (currentType === "Arbitre") {
      return [
        ...baseFields,
        {
          name: "matricule",
          label: "Matricule",
          placeholder: "Matricule",
          required: true,
        },
        { name: "cin", label: "CIN", placeholder: "CIN", required: true },
        {
          name: "dateOfBirth",
          label: "Date de Naissance",
          placeholder: "YYYY-MM-DD",
          type: "date",
          required: true,
        },
        {
          name: "category",
          label: "Catégorie",
          type: "select",
          options: [
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
            { value: "C1", label: "C1" },
            { value: "C2", label: "C2" },
            { value: "JEUNE", label: "Jeune" },
            { value: "FEMININE", label: "Féminin" },
            { value: "REGIONAL", label: "Régional" },
          ],
          required: true,
        },
        {
          name: "region",
          label: "Région",
          placeholder: "Région",
          required: true,
        },
        {
          name: "league",
          label: "Ligue (optionnel)",
          placeholder: "Ligue",
          required: false,
        },
        {
          name: "address",
          label: "Adresse (optionnel)",
          placeholder: "Adresse",
          required: false,
        },
        {
          name: "allowedRoles",
          label: "Rôles Autorisés (optionnel)",
          type: "checkbox",
          options: [
            { value: "ARBITRE_CENTRAL", label: "Arbitre Central" },
            { value: "ASSISTANT_1", label: "Assistant 1" },
            { value: "ASSISTANT_2", label: "Assistant 2" },
            { value: "QUATRIEME_ARBITRE", label: "4ème Arbitre" },
            { value: "ARBITRE_VAR", label: "Arbitre VAR" },
            { value: "ASSISTANT_VAR", label: "Assistant VAR" },
          ],
          required: false,
          className: "col-span-1 md:col-span-2",
        },
        {
          name: "isVARCertified",
          label: "Certifié VAR",
          type: "checkbox",
          required: false,
        },
        {
          name: "isAvailable",
          label: "Disponible",
          type: "checkbox",
          required: false,
        },
        {
          name: "emergencyContactName",
          label: "Contact d'urgence - Nom (optionnel)",
          placeholder: "Nom du contact",
          required: false,
        },
        {
          name: "emergencyContactPhone",
          type: "tel",
          label: "Contact d'urgence - Téléphone (optionnel)",
          placeholder: "Téléphone du contact",
          required: false,
        },
        {
          name: "notes",
          label: "Notes (optionnel)",
          placeholder: "Notes",
          required: false,
          className: "col-span-1 md:col-span-2",
        },
      ];
    } else if (currentType === "Inspecteur") {
      return [
        ...baseFields,
        {
          name: "matricule",
          label: "Matricule",
          placeholder: "Matricule",
          required: true,
        },
        {
          name: "region",
          label: "Région",
          placeholder: "Région",
          required: true,
        },
        {
          name: "specialization",
          label: "Spécialisation (optionnel)",
          placeholder: "Spécialisation",
          required: false,
          className: "col-span-1 md:col-span-2",
        },
      ];
    } else if (currentType === "PresidentCRA") {
      return [
        ...baseFields,
        {
          name: "region",
          label: "Région",
          placeholder: "Région",
          required: true,
        },
        {
          name: "startDate",
          label: "Date de Début",
          placeholder: "YYYY-MM-DD",
          type: "date",
          required: true,
          className: "col-span-1 md:col-span-2",
        },
      ];
    } else if (currentType === "Admin") {
      return [
        ...baseFields,
        {
          name: "role",
          label: "Rôle",
          type: "select",
          options: [
            { value: "ADMIN_DNA", label: "Admin DNA" },
            { value: "FINANCE_DNA", label: "Finance DNA" },
            { value: "DESIGNATION_DNA", label: "Désignation DNA" },
            { value: "CAA", label: "Commission Amateur (CAA)" },
            { value: "CAJ", label: "Commission Jeunes (CAJ)" },
            { value: "CAF", label: "Commission Féminine (CAF)" },
            { value: "CDC", label: "Commission des Commissaires (CDC)" },
          ],
          required: true,
          className: "col-span-1 md:col-span-2",
        },
      ];
    }
    return baseFields;
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (
      !validateForm(
        {
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          confirmPassword: newUser.confirmPassword,
        },
        ["email", "password", "firstName", "lastName", "confirmPassword"],
      )
    )
      return;
    try {
      const userType = newUser.type;
      if (userType === "Arbitre") {
        if (
          !validateForm(
            {
              matricule: newUser.matricule,
              category: newUser.category,
              region: newUser.region,
              dateOfBirth: newUser.dateOfBirth,
              cin: newUser.cin,
            },
            ["matricule", "category", "region", "dateOfBirth", "cin"],
          )
        )
          return;
        const refereeData: any = {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          phoneNumber: newUser.phoneNumber || undefined,
          matricule: newUser.matricule,
          cin: newUser.cin,
          dateOfBirth: newUser.dateOfBirth,
          category: newUser.category,
          region: newUser.region,
          league: newUser.league || undefined,
          address: newUser.address || undefined,
          notes: newUser.notes || undefined,
          allowedRoles: newUser.allowedRoles,
          isVARCertified: newUser.isVARCertified || false,
          isAvailable:
            newUser.isAvailable !== undefined ? newUser.isAvailable : true,
        };
        if (newUser.emergencyContactName && newUser.emergencyContactPhone) {
          refereeData.emergencyContact = {
            name: newUser.emergencyContactName,
            phone: newUser.emergencyContactPhone,
          };
        }
        await api.referees.create(refereeData);
      } else if (userType === "Inspecteur") {
        if (
          !validateForm(
            { matricule: newUser.matricule, region: newUser.region },
            ["matricule", "region"],
          )
        )
          return;
        await api.inspectors.create({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          phoneNumber: newUser.phoneNumber || undefined,
          matricule: newUser.matricule,
          region: newUser.region,
          specialization: newUser.specialization || undefined,
        });
      } else if (userType === "PresidentCRA") {
        if (
          !validateForm(
            { region: newUser.region, startDate: newUser.startDate },
            ["region", "startDate"],
          )
        )
          return;
        await api.craPresidents.create({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          phoneNumber: newUser.phoneNumber || undefined,
          region: newUser.region,
          startDate: newUser.startDate,
        });
      } else if (userType === "Admin") {
        if (!validateForm({ role: newUser.role }, ["role"])) return;
        await api.users.create({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          phoneNumber: newUser.phoneNumber || undefined,
          role: newUser.role,
        });
      }
      await fetchDataByTab();
      setNewUser(defaultNewUser);
      setIsModalOpen(false);
      toast.success("Utilisateur ajouté avec succès");
    } catch (err: any) {
      toast.error(
        "Erreur lors de l'ajout: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      if (activeTab === "Arbitre") await api.referees.delete(userToDelete);
      else if (activeTab === "Inspecteur")
        await api.inspectors.delete(userToDelete);
      else if (activeTab === "PresidentCRA")
        await api.craPresidents.delete(userToDelete);
      else if (activeTab === "Admin") await api.users.delete(userToDelete);
      await fetchDataByTab();
      setUserToDelete(null);
      setShowDeleteModal(false);
      toast.success("Utilisateur supprimé avec succès");
    } catch (err: any) {
      toast.error("Erreur lors de la suppression: " + (err.message || err));
    }
  };

  const handleEditUser = (record: any) => {
    const userId =
      record.userId?._id || record.userId?.id || record._id || record.id;
    const recordId = record._id || record.id;
    const firstName = record.userId?.firstName || record.firstName || "";
    const lastName = record.userId?.lastName || record.lastName || "";
    const email = record.userId?.email || record.email || "";
    const phoneNumber = record.userId?.phoneNumber || record.phoneNumber || "";
    setEditingUser({
      id: userId,
      recordId,
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      phoneNumber: String(phoneNumber),
      type: activeTab,
      role: record.userId?.role || record.role || "",
      matricule: String(record.matricule || ""),
      originalMatricule: String(record.matricule || ""),
      cin: String(record.cin || ""),
      dateOfBirth: String(
        record.dateOfBirth
          ? new Date(record.dateOfBirth).toISOString().split("T")[0]
          : "",
      ),
      category: String(record.category || ""),
      region: String(record.region || ""),
      league: String(record.league || ""),
      address: String(record.address || ""),
      notes: String(record.notes || ""),
      specialization: String(record.specialization || ""),
      startDate: String(
        record.startDate
          ? new Date(record.startDate).toISOString().split("T")[0]
          : "",
      ),
      allowedRoles: record.allowedRoles || [],
      isVARCertified: record.isVARCertified || false,
      isAvailable: record.isAvailable !== undefined ? record.isAvailable : true,
      emergencyContactName: record.emergencyContact?.name || "",
      emergencyContactPhone: record.emergencyContact?.phone || "",
      password: "",
      confirmPassword: "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (
      !validateForm(
        {
          email: editingUser.email,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
        },
        ["email", "firstName", "lastName"],
      )
    )
      return;
    try {
      const userId = editingUser.id;
      const recordId = editingUser.recordId;
      await api.users.update(userId, {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        phoneNumber: editingUser.phoneNumber || undefined,
      });
      if (activeTab === "Arbitre") {
        if (
          !validateForm(
            {
              matricule: editingUser.matricule,
              category: editingUser.category,
              region: editingUser.region,
              dateOfBirth: editingUser.dateOfBirth,
              cin: editingUser.cin,
            },
            ["matricule", "category", "region", "dateOfBirth", "cin"],
          )
        )
          return;
        const refereeData: any = {
          cin: editingUser.cin,
          dateOfBirth: editingUser.dateOfBirth,
          category: editingUser.category,
          region: editingUser.region,
          league: editingUser.league || undefined,
          address: editingUser.address || undefined,
          notes: editingUser.notes || undefined,
          allowedRoles:
            editingUser.allowedRoles?.length > 0
              ? editingUser.allowedRoles
              : undefined,
          isVARCertified: editingUser.isVARCertified || false,
          isAvailable:
            editingUser.isAvailable !== undefined
              ? editingUser.isAvailable
              : true,
        };
        if (
          editingUser.emergencyContactName &&
          editingUser.emergencyContactPhone
        ) {
          refereeData.emergencyContact = {
            name: editingUser.emergencyContactName,
            phone: editingUser.emergencyContactPhone,
          };
        }
        if (editingUser.matricule !== editingUser.originalMatricule)
          refereeData.matricule = editingUser.matricule;
        await api.referees.update(recordId, refereeData);
      } else if (activeTab === "Inspecteur") {
        if (
          !validateForm(
            { matricule: editingUser.matricule, region: editingUser.region },
            ["matricule", "region"],
          )
        )
          return;
        const inspectorData: any = {
          region: editingUser.region,
          specialization: editingUser.specialization || undefined,
        };
        if (editingUser.matricule !== editingUser.originalMatricule)
          inspectorData.matricule = editingUser.matricule;
        await api.inspectors.update(recordId, inspectorData);
      } else if (activeTab === "PresidentCRA") {
        if (
          !validateForm(
            { region: editingUser.region, startDate: editingUser.startDate },
            ["region", "startDate"],
          )
        )
          return;
        await api.craPresidents.update(recordId, {
          region: editingUser.region,
          startDate: editingUser.startDate,
        });
      } else if (activeTab === "Admin") {
        if (!validateForm({ role: editingUser.role }, ["role"])) return;
        await api.users.update(userId, { role: editingUser.role });
      }
      await fetchDataByTab();
      setIsEditModalOpen(false);
      setEditingUser(null);
      toast.success("Utilisateur modifié avec succès");
    } catch (err: any) {
      toast.error(
        "Erreur lors de la modification: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleFormChange = (e: any, isEditMode: boolean = false) => {
    const { id, value, checked, type } = e.target;
    if (id.startsWith("allowedRoles-")) {
      const roleValue = value;
      const currentRoles = isEditMode
        ? editingUser?.allowedRoles || []
        : newUser.allowedRoles || [];
      const newRoles = checked
        ? [...currentRoles, roleValue]
        : currentRoles.filter((r: string) => r !== roleValue);
      isEditMode
        ? setEditingUser({ ...editingUser, allowedRoles: newRoles })
        : setNewUser({ ...newUser, allowedRoles: newRoles });
      return;
    }
    if (
      type === "checkbox" &&
      (id === "isVARCertified" || id === "isAvailable")
    ) {
      isEditMode
        ? setEditingUser({ ...editingUser, [id]: checked })
        : setNewUser({ ...newUser, [id]: checked });
      return;
    }
    isEditMode
      ? setEditingUser({ ...editingUser, [id]: value })
      : setNewUser({ ...newUser, [id]: value });
  };

  const handleOpenAddModal = () => {
    setNewUser({ ...defaultNewUser, type: activeTab });
    setIsModalOpen(true);
  };

  // ── Table renderers ──────────────────────────────────────────────────────
  const renderRefereeTable = () => (
    <Table
      headers={
        [
          <SortableHeader
            key="name"
            label="Utilisateur"
            sortKey="name"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          <SortableHeader
            key="mat"
            label="Matricule"
            sortKey="matricule"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          <SortableHeader
            key="cat"
            label="Catégorie"
            sortKey="category"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          <SortableHeader
            key="reg"
            label="Région"
            sortKey="region"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          "Ligue",
          "VAR",
          "Statut",
          "Actions",
        ] as any[]
      }
    >
      {processedData.map((u: any, idx: number) => {
        const firstName = u.userId?.firstName || u.firstName || "";
        const lastName = u.userId?.lastName || u.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return (
          <TableRow key={`referee-${u._id || u.id}-${idx}`}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={fullName} size="sm" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-flashscore-text">
                    {fullName || "-"}
                  </div>
                  {(u.userId?.email || u.email) && (
                    <div className="text-xs text-gray-400 dark:text-flashscore-muted">
                      {u.userId?.email || u.email}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <MatriculeChip value={u.matricule} />
            </TableCell>
            <TableCell>
              <CategoryBadge category={u.category} />
            </TableCell>
            <TableCell className="text-gray-600 dark:text-flashscore-muted">
              {u.region || "-"}
            </TableCell>
            <TableCell className="text-gray-600 dark:text-flashscore-muted">
              {u.league || "-"}
            </TableCell>
            <TableCell>
              {u.isVARCertified ? (
                <span
                  title="Certifié VAR"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full ring-1 ring-emerald-200"
                >
                  <ShieldCheck className="w-3 h-3" />
                  VAR
                </span>
              ) : (
                <span className="text-gray-300 dark:text-flashscore-muted text-xs">
                  —
                </span>
              )}
            </TableCell>
            <TableCell>
              <Badge status={u.userId?.isActive ? "Actif" : "Indisponible"}>
                {u.userId?.isActive ? "Actif" : "Indisponible"}
              </Badge>
            </TableCell>
            <TableCell>
              <ActionButtons
                onEdit={() => handleEditUser(u)}
                onDelete={() => confirmDelete(u._id || u.id)}
              />
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );

  const renderInspectorTable = () => (
    <Table
      headers={
        [
          <SortableHeader
            key="name"
            label="Utilisateur"
            sortKey="name"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          <SortableHeader
            key="mat"
            label="Matricule"
            sortKey="matricule"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          <SortableHeader
            key="reg"
            label="Région"
            sortKey="region"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          "Spécialisation",
          "Statut",
          "Actions",
        ] as any[]
      }
    >
      {processedData.map((u: any, idx: number) => {
        const firstName = u.userId?.firstName || u.firstName || "";
        const lastName = u.userId?.lastName || u.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return (
          <TableRow key={`inspector-${u._id || u.id}-${idx}`}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={fullName} size="sm" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-flashscore-text">
                    {fullName || "-"}
                  </div>
                  {(u.userId?.email || u.email) && (
                    <div className="text-xs text-gray-400 dark:text-flashscore-muted">
                      {u.userId?.email || u.email}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <MatriculeChip value={u.matricule} />
            </TableCell>
            <TableCell className="text-gray-600 dark:text-flashscore-muted">
              {u.region || "-"}
            </TableCell>
            <TableCell className="text-gray-600 dark:text-flashscore-muted">
              {u.specialization || "-"}
            </TableCell>
            <TableCell>
              <Badge status={u.userId?.isActive ? "Actif" : "Indisponible"}>
                {u.userId?.isActive ? "Actif" : "Indisponible"}
              </Badge>
            </TableCell>
            <TableCell>
              <ActionButtons
                onEdit={() => handleEditUser(u)}
                onDelete={() => confirmDelete(u._id || u.id)}
              />
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );

  const renderCRAPTable = () => (
    <Table
      headers={
        [
          <SortableHeader
            key="name"
            label="Utilisateur"
            sortKey="name"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          <SortableHeader
            key="reg"
            label="Région"
            sortKey="region"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          "Date de Début",
          "Statut",
          "Actions",
        ] as any[]
      }
    >
      {processedData.map((u: any, idx: number) => {
        const firstName = u.userId?.firstName || u.firstName || "";
        const lastName = u.userId?.lastName || u.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const startDate = u.startDate
          ? new Date(u.startDate).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-";
        return (
          <TableRow key={`cra-${u._id || u.id}-${idx}`}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={fullName} size="sm" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-flashscore-text">
                    {fullName || "-"}
                  </div>
                  {(u.userId?.email || u.email) && (
                    <div className="text-xs text-gray-400 dark:text-flashscore-muted">
                      {u.userId?.email || u.email}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-gray-600 dark:text-flashscore-muted">
              {u.region || "-"}
            </TableCell>
            <TableCell className="text-gray-600 dark:text-flashscore-muted">
              {startDate}
            </TableCell>
            <TableCell>
              <Badge status={u.userId?.isActive ? "Actif" : "Indisponible"}>
                {u.userId?.isActive ? "Actif" : "Indisponible"}
              </Badge>
            </TableCell>
            <TableCell>
              <ActionButtons
                onEdit={() => handleEditUser(u)}
                onDelete={() => confirmDelete(u._id || u.id)}
              />
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );

  const renderAdminTable = () => (
    <Table
      headers={
        [
          <SortableHeader
            key="name"
            label="Utilisateur"
            sortKey="name"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          "Email",
          <SortableHeader
            key="role"
            label="Rôle"
            sortKey="role"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
          />,
          "Statut",
          "Actions",
        ] as any[]
      }
    >
      {processedData.map((u: any, idx: number) => {
        const firstName = u.firstName || "";
        const lastName = u.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return (
          <TableRow key={`admin-${u._id || u.id}-${idx}`}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={fullName} size="sm" />
                <div className="font-medium text-gray-900 dark:text-flashscore-text">
                  {fullName || "-"}
                </div>
              </div>
            </TableCell>
            <TableCell className="max-w-xs truncate text-gray-600 dark:text-flashscore-muted">
              {u.email || "-"}
            </TableCell>
            <TableCell>
              <RoleBadge role={u.role} />
            </TableCell>
            <TableCell>
              <Badge status={u.isActive ? "Actif" : "Indisponible"}>
                {u.isActive ? "Actif" : "Indisponible"}
              </Badge>
            </TableCell>
            <TableCell>
              <ActionButtons
                onEdit={() => handleEditUser(u)}
                onDelete={() =>
                  confirmDelete(u.userId?._id || u.userId?.id || u._id || u.id)
                }
              />
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AuthGuard role={[Role.ADMIN_DNA]}>
      <div className="animate-fadeIn">
        <Card className="mb-6">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold">Gestion des Utilisateurs</h3>
            <Button
              variant="primary"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              + Ajouter Utilisateur
            </Button>
          </div>

          {loading && (
            <div className="text-gray-500 dark:text-flashscore-muted mb-4">
              Chargement des utilisateurs...
            </div>
          )}

          {!loading && (
            <>
              {/* ── Tabs ── */}
              <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-200 dark:border-flashscore-border items-center">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "border-[#ce1126] text-[#ce1126]"
                        : "border-transparent text-gray-500 dark:text-flashscore-muted hover:text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Search + filter bar ── */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 max-w-md">
                  <Input
                    id="search-users"
                    placeholder={
                      activeTab === "Arbitre"
                        ? "Rechercher un arbitre..."
                        : activeTab === "Inspecteur"
                          ? "Rechercher un inspecteur..."
                          : activeTab === "PresidentCRA"
                            ? "Rechercher un président CRA..."
                            : "Rechercher un administrateur..."
                    }
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearch(e.target.value)
                    }
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>

                {/* Filter toggle button */}
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all
                                        ${
                                          showFilters || activeFilterCount > 0
                                            ? "border-[#ce1126] text-[#ce1126] bg-red-50 dark:bg-red-900/10"
                                            : "border-gray-200 dark:border-flashscore-border text-gray-500 dark:text-flashscore-muted hover:border-gray-300 bg-white dark:bg-flashscore-card"
                                        }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ce1126] text-white text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-flashscore-muted hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Effacer tout
                  </button>
                )}
              </div>

              {/* ── Expandable filter panel ── */}
              {showFilters && (
                <div className="flex flex-col gap-3 mb-4 p-3 bg-gray-50 dark:bg-flashscore-hover rounded-xl border border-gray-200 dark:border-flashscore-border">
                  {/* Category filter — Arbitre only */}
                  {activeTab === "Arbitre" && presentCategories.size > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">
                        Catégorie :
                      </span>
                      {REFEREE_CATEGORIES.filter((cat) =>
                        presentCategories.has(cat),
                      ).map((cat) => (
                        <StatPill
                          key={cat}
                          label={CategoryLabelMapper[cat] ?? cat}
                          color={
                            CategoryColorMapper[cat] ??
                            "bg-gray-100 text-gray-700"
                          }
                          active={filters.category === cat}
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              category: f.category === cat ? "" : cat,
                            }))
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* Role filter — Admin only */}
                  {activeTab === "Admin" && presentRoles.size > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">
                        Rôle :
                      </span>
                      {ADMIN_ROLES.filter((role) => presentRoles.has(role)).map(
                        (role) => (
                          <StatPill
                            key={role}
                            label={RoleMapper[role] ?? role}
                            color={
                              RoleColorMapper[role] ??
                              "bg-gray-100 text-gray-700"
                            }
                            active={filters.role === role}
                            onClick={() =>
                              setFilters((f) => ({
                                ...f,
                                role: f.role === role ? "" : role,
                              }))
                            }
                          />
                        ),
                      )}
                    </div>
                  )}

                  {/* Divider only when category/role row is present */}
                  {(activeTab === "Arbitre" && presentCategories.size > 0) ||
                  (activeTab === "Admin" && presentRoles.size > 0) ? (
                    <div className="border-t border-gray-200 dark:border-flashscore-border" />
                  ) : null}

                  {/* Status filter — always visible */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">
                      Statut :
                    </span>
                    {[
                      { value: "all", label: "Tous" },
                      { value: "active", label: "Actifs" },
                      { value: "inactive", label: "Inactifs" },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() =>
                          setFilters((f) => ({ ...f, status: s.value }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${
                          filters.status === s.value
                            ? "bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-transparent"
                            : "bg-white dark:bg-flashscore-card border-gray-200 dark:border-flashscore-border text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Referee-specific toggles */}
                  {activeTab === "Arbitre" && (
                    <>
                      <div className="border-t border-gray-200 dark:border-flashscore-border" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">
                          Options :
                        </span>
                        <FilterToggle
                          icon={ShieldCheck}
                          label="Certifié VAR"
                          active={filters.varCertified}
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              varCertified: !f.varCertified,
                            }))
                          }
                        />
                        <FilterToggle
                          icon={filters.available ? Wifi : WifiOff}
                          label="Disponibles"
                          active={filters.available}
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              available: !f.available,
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Active filter chips summary ── */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {filters.category && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${CategoryColorMapper[filters.category]}`}
                    >
                      {CategoryLabelMapper[filters.category]}
                      <button
                        onClick={() =>
                          setFilters((f) => ({ ...f, category: "" }))
                        }
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.role && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${RoleColorMapper[filters.role] || "bg-gray-100 text-gray-700"}`}
                    >
                      {RoleMapper[filters.role] || filters.role}
                      <button
                        onClick={() => setFilters((f) => ({ ...f, role: "" }))}
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.status !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300">
                      {filters.status === "active" ? "Actifs" : "Inactifs"}
                      <button
                        onClick={() =>
                          setFilters((f) => ({ ...f, status: "all" }))
                        }
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.varCertified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      Certifié VAR
                      <button
                        onClick={() =>
                          setFilters((f) => ({ ...f, varCertified: false }))
                        }
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.available && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                      <Wifi className="w-3 h-3" />
                      Disponibles
                      <button
                        onClick={() =>
                          setFilters((f) => ({ ...f, available: false }))
                        }
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* ── Tables ── */}
              {activeTab === "Arbitre" && renderRefereeTable()}
              {activeTab === "Inspecteur" && renderInspectorTable()}
              {activeTab === "PresidentCRA" && renderCRAPTable()}
              {activeTab === "Admin" && renderAdminTable()}

              {processedData.length === 0 && (
                <div className="text-center p-12 text-gray-400 dark:text-flashscore-muted">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">
                    {activeFilterCount > 0
                      ? "Aucun résultat pour ces filtres"
                      : "Aucun utilisateur trouvé"}
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-2 text-sm text-[#ce1126] hover:underline"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={total}
                />
              )}
            </>
          )}
        </Card>

        {/* ── Modals ── */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Ajouter un Utilisateur"
        >
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <Form
              fields={getFields(newUser.type)}
              formData={newUser}
              onChange={(e: any) => handleFormChange(e, false)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAddUser}>
              Ajouter
            </Button>
          </div>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier l'Utilisateur"
        >
          {editingUser && (
            <>
              <div className="max-h-[60vh] overflow-y-auto pr-4">
                <Form
                  key={`edit-${editingUser.id}`}
                  fields={getFields(editingUser.type, true)}
                  formData={editingUser}
                  onChange={(e: any) => handleFormChange(e, true)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button variant="primary" onClick={handleSaveEdit}>
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </Modal>

        <DeleteModal
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          setEventToDelete={setUserToDelete}
          handleDelete={handleDeleteUser}
          message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
        />
      </div>
    </AuthGuard>
  );
};

export default Utilisateurs;
