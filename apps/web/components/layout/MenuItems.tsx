import {
  BookOpen, CalendarCheck, CalendarDays, ClipboardList, DollarSign,
  GraduationCap, LayoutDashboard, MessageSquare, Settings,
  Shield, Target , Trophy, User, Users, AlertCircle, ClipboardCheck
} from "lucide-react";
import { Role } from "../../types/user";

// ─── Admin DNA (full access) ────────────────────────────────────────────────
export const adminMenuItems = [
  { id: 'dashboard',    icon: <LayoutDashboard size={20}/>, label: 'Tableau de Bord',      path: '/admin/dashboard' },
  { id: 'planning',     icon: <CalendarDays size={20}/>,    label: 'Planning & Matchs',    path: '/admin/planning' },
  { id: 'utilisateurs', icon: <Users size={20}/>,           label: 'Utilisateurs',          path: '/admin/utilisateurs' },
  { id: 'equipes',      icon: <Shield size={20}/>,          label: 'Équipes',               path: '/admin/equipes' },
  { id: 'designations', icon: <Target size={20}/>,          label: 'Désignations',          path: '/admin/designations' },
  { id: 'paiements',    icon: <DollarSign size={20}/>,      label: 'Paiements',             path: '/admin/paiements' },
  { id: 'formations',   icon: <GraduationCap size={20}/>,   label: 'Formations',            path: '/admin/formations' },
  { id: 'ressources',   icon: <BookOpen size={20}/>,        label: 'Ressources Pédago.',    path: '/admin/ressources' },
  { id: 'rapport',      icon: <ClipboardList size={20}/>,   label: 'Rapports',              path: '/admin/rapport' },
  { id: 'classement',   icon: <Trophy size={20}/>,          label: 'Classement',            path: '/admin/classement' },
  { id: 'communication',icon: <MessageSquare size={20}/>,   label: 'Communication',         path: '/admin/communication' },
  { id: 'parametre',    icon: <Settings size={20}/>,        label: 'Paramètres',            path: '/parametre' },
];

// ─── Arbitre ────────────────────────────────────────────────────────────────
export const arbitreMenuItems = [
  { id: 'dashboard',   icon: <LayoutDashboard size={20}/>, label: 'Tableau de Bord',      path: '/referee/dashboard' },
  { id: 'matches',     icon: <CalendarDays size={20}/>,    label: 'Mes Matchs',            path: '/referee/matches' },
  { id: 'formations',  icon: <GraduationCap size={20}/>,   label: 'Formations',            path: '/referee/formations' },
  { id: 'ressources',  icon: <BookOpen size={20}/>,        label: 'Ressources',            path: '/referee/ressources' },
  { id: 'paiements',   icon: <DollarSign size={20}/>,      label: 'Paiements',             path: '/referee/paiements' },
  { id: 'availability',icon: <CalendarCheck size={20}/>,   label: 'Disponibilité',         path: '/referee/availability' },
  { id: 'parametre',   icon: <Settings size={20}/>,        label: 'Paramètres',            path: '/parametre' },
];

// ─── CAA — Commission d'Arbitrage Amateur (C1 & C2) ─────────────────────────
export const caaMenuItems = [
  { id: 'dashboard',    icon: <LayoutDashboard size={20}/>, label: 'Tableau de Bord',      path: '/admin/dashboard' },
  { id: 'planning',     icon: <CalendarDays size={20}/>,    label: 'Planning Amateur',      path: '/admin/planning' },
  { id: 'designations', icon: <Target size={20}/>,          label: 'Désignations',          path: '/admin/designations' },
  { id: 'referees',     icon: <User size={20}/>,            label: 'Arbitres C1 & C2',      path: '/admin/referees' },
  { id: 'paiements',    icon: <DollarSign size={20}/>,      label: 'Paiements',             path: '/admin/paiements' },
  { id: 'parametre',    icon: <Settings size={20}/>,        label: 'Paramètres',            path: '/parametre' },
];

// ─── CAJ — Commission d'Arbitrage Jeunes ────────────────────────────────────
export const cajMenuItems = [
  { id: 'dashboard',    icon: <LayoutDashboard size={20}/>, label: 'Tableau de Bord',      path: '/admin/dashboard' },
  { id: 'planning',     icon: <CalendarDays size={20}/>,    label: 'Planning Jeunes',       path: '/admin/planning' },
  { id: 'designations', icon: <Target size={20}/>,          label: 'Désignations',          path: '/admin/designations' },
  { id: 'referees',     icon: <User size={20}/>,            label: 'Arbitres Jeunes',       path: '/admin/referees' },
  { id: 'paiements',    icon: <DollarSign size={20}/>,      label: 'Paiements',             path: '/admin/paiements' },
  { id: 'parametre',    icon: <Settings size={20}/>,        label: 'Paramètres',            path: '/parametre' },
];

// ─── CAF — Commission d'Arbitrage Féminine ───────────────────────────────────
export const cafMenuItems = [
  { id: 'dashboard',    icon: <LayoutDashboard size={20}/>, label: 'Tableau de Bord',      path: '/admin/dashboard' },
  { id: 'planning',     icon: <CalendarDays size={20}/>,    label: 'Planning Féminin',      path: '/admin/planning' },
  { id: 'designations', icon: <Target size={20}/>,          label: 'Désignations',          path: '/admin/designations' },
  { id: 'referees',     icon: <User size={20}/>,            label: 'Arbitres Féminines',    path: '/admin/referees' },
  { id: 'paiements',    icon: <DollarSign size={20}/>,      label: 'Paiements',             path: '/admin/paiements' },
  { id: 'parametre',    icon: <Settings size={20}/>,        label: 'Paramètres',            path: '/parametre' },
];

// ─── CRA — Commission Régionale d'Arbitrage ──────────────────────────────────
export const craMenuItems = [
  { id: 'dashboard',    icon: <LayoutDashboard size={20}/>, label: 'Tableau de Bord',      path: '/admin/dashboard' },
  { id: 'planning',     icon: <CalendarDays size={20}/>,    label: 'Planning Régional',     path: '/admin/planning' },
  { id: 'designations', icon: <Target size={20}/>,          label: 'Désignations',          path: '/admin/designations' },
  { id: 'referees',     icon: <User size={20}/>,            label: 'Arbitres Régionaux',    path: '/admin/referees' },
  { id: 'paiements',    icon: <DollarSign size={20}/>,      label: 'Paiements',             path: '/admin/paiements' },
  { id: 'cra-pending',  icon: <AlertCircle size={20}/>,     label: 'Excuses & Blessures',   path: '/admin/cra-pending' },
  { id: 'parametre',    icon: <Settings size={20}/>,        label: 'Paramètres',            path: '/parametre' },
];

// ─── CDC — Commission des Commissaires ──────────────────────────────────────
export const cdcMenuItems = [
  { id: 'inspecteurs', icon: <ClipboardCheck size={20}/>,          label: 'Inspecteurs',             path: '/admin/inspecteurs' },
  { id: 'referees',               icon: <User size={20}/>,            label: 'Arbitres',                 path: '/admin/referees' },
  { id: 'rapport',                icon: <ClipboardList size={20}/>,   label: 'Rapports Commissaires',    path: '/admin/rapport' },
  { id: 'parametre',              icon: <Settings size={20}/>,        label: 'Paramètres',               path: '/parametre' },
];


// ─── FINANCE DNA ─────────────────────────────────────────────────────────────
export const financeMenuItems = [
  { id: 'planning',  icon: <CalendarDays size={20}/>, label: 'Planning & Matchs', path: '/admin/planning' },
  { id: 'referees',  icon: <User size={20}/>,         label: 'Arbitres',           path: '/admin/referees' },
  { id: 'paiements', icon: <DollarSign size={20}/>,   label: 'Paiements',          path: '/admin/paiements' },
  { id: 'parametre', icon: <Settings size={20}/>,     label: 'Paramètres',         path: '/parametre' },
];

// ─── DESIGNATION DNA ─────────────────────────────────────────────────────────
export const designationMenuItems = [
  { id: 'planning',     icon: <CalendarDays size={20}/>, label: 'Planning & Matchs', path: '/admin/planning' },
  { id: 'designations', icon: <Target size={20}/>,       label: 'Désignations',       path: '/admin/designations' },
  { id: 'referees',     icon: <User size={20}/>,         label: 'Arbitres',           path: '/admin/referees' },
  { id: 'parametre',    icon: <Settings size={20}/>,     label: 'Paramètres',         path: '/parametre' },
];

/**
 * Single source of truth: maps a user role to its full authorized navigation.
 * Used by BOTH the admin layout and the parametre layout so the sidebar shows
 * the same complete menu everywhere — clicking "Paramètres" never collapses it.
 */
export const getMenuItemsByRole = (role?: Role | string) => {
  switch (role) {
    case Role.ADMIN_DNA:       return adminMenuItems;
    case Role.FINANCE_DNA:     return financeMenuItems;
    case Role.DESIGNATION_DNA: return designationMenuItems;
    case Role.ARBITRE:         return arbitreMenuItems;
    case Role.CAA:             return caaMenuItems;
    case Role.CAJ:             return cajMenuItems;
    case Role.CAF:             return cafMenuItems;
    case Role.CRA:             return craMenuItems;
    case Role.CDC:             return cdcMenuItems;
    default:                   return [];
  }
};