"use client";
import React, { useEffect, useRef, useCallback } from 'react';
import { X, Check, Trash2, CheckCheck, Bell, CheckCircle, AlertTriangle, XCircle, Calendar, Wallet, Info } from 'lucide-react';
import { useNotifications, Notification } from '../../hooks/useNotifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  const iconClass = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0";
  
  switch (type) {
    case 'SUCCESS':
      return (
        <div className={`${iconClass} bg-green-100 text-green-600`}>
          <CheckCircle size={20} />
        </div>
      );
    case 'WARNING':
      return (
        <div className={`${iconClass} bg-yellow-100 text-yellow-600`}>
          <AlertTriangle size={20} />
        </div>
      );
    case 'ERROR':
      return (
        <div className={`${iconClass} bg-red-100 text-red-600`}>
          <XCircle size={20} />
        </div>
      );
    case 'MATCH_ASSIGNMENT':
      return (
        <div className={`${iconClass} bg-blue-100 text-blue-600`}>
          <Calendar size={20} />
        </div>
      );
    case 'PAYMENT':
      return (
        <div className={`${iconClass} bg-purple-100 text-purple-600`}>
          <Wallet size={20} />
        </div>
      );
    default:
      return (
        <div className={`${iconClass} bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-gray-400 dark:text-flashscore-muted`}>
          <Info size={20} />
        </div>
      );
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = React.memo(({ notification, onMarkAsRead, onDelete }) => {
  return (
    <div 
      className={`p-4 border-b border-gray-100 dark:border-flashscore-border hover:bg-gray-50 dark:bg-flashscore-hover dark:hover:bg-flashscore-hover transition-colors ${
        !notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex gap-3">
        {getNotificationIcon(notification.type)}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted whitespace-nowrap">
              {formatDate(notification.createdAt)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted mb-2 leading-relaxed">
            {notification.message}
          </p>
          
          <div className="flex gap-2">
            {!notification.isRead && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Check size={14} />
                Marquer comme lu
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications();

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchNotifications(1, true);
    } else if (!isOpen) {
      hasLoadedRef.current = false;
    }
  }, [isOpen, fetchNotifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-1100 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-flashscore-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-flashscore-border shrink-0">
          <div className="flex items-center gap-3">
            <Bell className="text-[#ce1126]" size={24} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                  ({unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'})
                </span>
              )}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                <CheckCheck size={16} />
                Tout marquer comme lu
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-gray-400 dark:text-flashscore-muted hover:text-gray-600 dark:text-gray-400 dark:text-flashscore-muted dark:hover:text-gray-300 hover:bg-gray-100 dark:bg-flashscore-border dark:hover:bg-flashscore-hover p-1 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126]"></div>
              <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-4">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-flashscore-border flex items-center justify-center mb-4">
                <Bell className="text-gray-400 dark:text-flashscore-muted" size={32} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-lg font-medium">Aucune notification</p>
              <p className="text-gray-400 dark:text-flashscore-muted text-sm mt-1">Vous êtes à jour !</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
              
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Chargement...' : 'Charger plus'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
