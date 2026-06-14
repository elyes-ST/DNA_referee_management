"use client";
import React, { useState, useMemo } from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';
import {  LogOut } from 'lucide-react';
import { Settings, Bell } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useRouter } from 'next/navigation';
import { NotificationModal } from './NotificationModal';
import { useUnreadCount } from '../../hooks/useNotifications';

export const Header = ({ title, onMenuToggle }: { title: string, onMenuToggle?: () => void }) => {
  const { logout } = useUser();
  const router = useRouter();
  const { unreadCount } = useUnreadCount();
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  }

  const unreadBadge = useMemo(() => {
    if (unreadCount === 0) return null;
    return (
      <span className="absolute top-0 right-0 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  }, [unreadCount]);

  return (
    <>
      <div className="bg-white dark:bg-flashscore-card border-b border-gray-200 dark:border-flashscore-border px-6 py-4 flex justify-between items-center sticky top-0 gap-3 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuToggle}
            className="md:hidden text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:text-[#ce1126] dark:hover:text-[#ce1126] text-2xl"
          >
            ☰
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-flashscore-text truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-4 justify-end flex-1 sm:flex-initial">
          <ThemeToggle />
          <button 
            onClick={() => setIsNotificationModalOpen(true)}
            className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-50 dark:bg-flashscore-hover dark:hover:bg-flashscore-hover hover:text-[#ce1126] dark:hover:text-[#ce1126] p-1.5 rounded-md transition-all text-lg relative"
            title="Notifications"
          >
            <Bell size={20}/>
            {unreadBadge}
          </button>
          <button className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-50 dark:bg-flashscore-hover dark:hover:bg-flashscore-hover hover:text-[#ce1126] dark:hover:text-[#ce1126] p-1.5 rounded-md transition-all text-lg"
                  title="Paramètres"
                  onClick={() => router.push('/parametre')}        
          >
            <Settings size={20}/>
          </button>
          <button 
            onClick={handleLogout}
            className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-50 dark:bg-flashscore-hover dark:hover:bg-flashscore-hover hover:text-red-600 dark:hover:text-red-500 p-1.5 rounded-md transition-all text-lg"
            title="Déconnexion"
          >
            <LogOut size={20}/>
          </button>
        </div>
      </div>

      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={() => setIsNotificationModalOpen(false)} 
      />
    </>
  );
};
