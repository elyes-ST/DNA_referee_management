import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'MATCH_ASSIGNMENT' | 'PAYMENT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

// Lightweight hook for just the unread count (used in Header)
export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.notifications.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh unread count every 30 seconds
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnreadCount]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
};

// Full notifications hook (used in NotificationModal)
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.notifications.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number = 1, isNew: boolean = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const { data } = await api.notifications.getMy({ 
        page: pageNum, 
        limit: 10 
      });

      const normalize = (n: any): Notification => ({ ...n, id: n._id || n.id, isRead: n.isRead ?? n.read ?? false });
      
      setNotifications(prev => {
        if (isNew || pageNum === 1) {
          return (data.data || []).map(normalize);
        }
        return [...prev, ...(data.data || []).map(normalize)];
      });
      
      setHasMore(data.meta?.hasNextPage || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.notifications.delete(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [fetchUnreadCount]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      fetchNotifications(page + 1, false);
    }
  }, [hasMore, page, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    page,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refreshUnreadCount: fetchUnreadCount,
  };
};
