import React, { useState, useMemo } from 'react';
import { Avatar } from '../ui/Avatar';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  ClipboardList, 
  Settings, 
  CalendarDays,
  BookOpen,
  MessageSquare,
  Trophy,
  GraduationCap,
  Shield,
  DollarSign,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { useUser } from '../../hooks/useUser';
import { Role } from '../../types/user';

export const Sidebar = ({ activePage, onNavigate, mobileOpen, onClose ,menuItems }: { activePage: string, onNavigate: (page: string) => void, mobileOpen: boolean, onClose: () => void, menuItems?: { id: string, icon: React.ReactNode, label: string, path: string }[] }) => {
  const RoleMapper = {
    'ADMIN_DNA': 'Admin DNA',
    'ARBITRE': 'Arbitre',
    'FINANCE_DNA': 'Finance DNA',
    'DESIGNATION_DNA': 'Désignation DNA',
    'CAA': 'CAA',
    'CAJ': 'CAJ',
    'CAF': 'CAF',
    'CRA': 'CRA',
    'CDC': 'CDC',
    'CDE': 'CDE',
    'INSPECTEUR': 'Inspecteur',

  }
  
  const {user} = useUser();
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
            mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside className={`
        fixed inset-y-0 left-0 h-screen bg-white dark:bg-flashscore-card border-r border-gray-200 dark:border-flashscore-border
        flex flex-col z-50 transition-transform duration-300
        w-[260px] md:w-[220px] lg:w-[260px]
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 
      `}>
        <div className="p-3 border-b border-gray-200 dark:border-flashscore-border">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="DNA Logo" width={32} height={32} className="rounded-full" />
            <div>
              <h1 className="text-base font-bold text-[#ce1126]">DNA</h1>
              <p className="text-xs text-gray-400 dark:text-flashscore-muted">Direction Nationale d'Arbitrage</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          {(menuItems ?? []).map((item) => (
            <Link
              key={item.id}
              href={item.path}
              onClick={(e) => {
                onNavigate(item.id);
              }}
              className={`
                flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 border-l-[3px]
                ${activePage === item.id 
                  ? 'bg-[#ce1126]/10 border-[#ce1126] text-[#ce1126] font-semibold' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-50 dark:bg-flashscore-hover dark:hover:bg-flashscore-hover hover:text-[#ce1126] dark:hover:text-[#ce1126]'}
              `}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-flashscore-border">
          <div className="flex items-center gap-3 cursor-pointer">
            <Avatar name={user?.firstName + ' ' + user?.lastName } />
            <div>
              <div className="text-xs font-semibold text-gray-900 dark:text-flashscore-text">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px] text-gray-400 dark:text-flashscore-muted">{(user?.role && RoleMapper[user.role]) || 'Utilisateur'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
