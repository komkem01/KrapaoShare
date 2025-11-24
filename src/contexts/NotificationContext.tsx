'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { notificationApi } from '@/utils/apiClient';
import { getStoredUser } from '@/utils/authStorage';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  icon?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Backward compatibility properties
  timestamp?: Date;
  isRead?: boolean;
  category?: 'transaction' | 'bill' | 'debt' | 'budget' | 'goal' | 'system';
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isNotificationPanelOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Notification operations
  refreshNotifications: () => Promise<void>;
  addNotification: (notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    icon?: string;
    data?: Record<string, unknown>;
    action_url?: string;
    expires_at?: string;
  }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Panel operations
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  toggleNotificationPanel: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Mock notifications สำหรับ fallback เมื่อ API ไม่พร้อม
const getMockNotifications = (userId: string): Notification[] => [
  {
    id: '1',
    user_id: userId,
    type: 'warning',
    title: 'งบประมาณเกือบหมด',
    message: 'งบประมาณหมวด "อาหาร" เหลือเพียง 15% แล้ว (฿450 จาก ฿3,000)',
    priority: 'high',
    is_read: false,
    action_url: '/dashboard/budgets',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
    category: 'budget',
    actionUrl: '/dashboard/budgets'
  },
  {
    id: '2',
    user_id: userId,
    type: 'success',
    title: 'บิลถูกแบ่งเรียบร้อย',
    message: 'บิลร้านอาหาร ฿1,200 ถูกแบ่งให้เพื่อน 4 คนแล้ว คุณได้รับ ฿300',
    priority: 'normal',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    category: 'bill'
  },
  {
    id: '3',
    user_id: userId,
    type: 'info',
    title: 'เป้าหมายการออมใกล้สำเร็จ',
    message: 'เป้าหมาย "MacBook ใหม่" เหลืออีก ฿15,000 (75% สำเร็จแล้ว)',
    priority: 'normal',
    is_read: true,
    read_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    action_url: '/dashboard/goals',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isRead: true,
    category: 'goal',
    actionUrl: '/dashboard/goals'
  }
];

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const refreshNotifications = useCallback(async () => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id;
    
    if (!userId) {
      console.warn('No user ID available for fetching notifications');
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationApi.getByUser(userId);
      console.log('Notifications API response:', response);
      
      const notificationsData = Array.isArray(response) ? response : [];
      
      // Add backward compatibility properties
      const enrichedNotifications = notificationsData.map((notification: Notification) => ({
        ...notification,
        timestamp: new Date(notification.created_at),
        isRead: notification.is_read,
        actionUrl: notification.action_url,
        category: inferCategoryFromMessage(notification.message)
      }));
      
      setNotifications(enrichedNotifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      
      // Only use mock data in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock notifications as fallback (development mode)');
        const mockNotifications = getMockNotifications(userId);
        setNotifications(mockNotifications);
        setError('ใช้ข้อมูลจำลองเนื่องจากไม่สามารถเชื่อมต่อ API ได้ (โหมดพัฒนา)');
      } else {
        // In production, surface the error properly
        setNotifications([]);
        setError('ไม่สามารถโหลดการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to infer category from message content
  const inferCategoryFromMessage = (message: string): 'transaction' | 'bill' | 'debt' | 'budget' | 'goal' | 'system' => {
    if (message.includes('งบประมาณ') || message.includes('budget')) return 'budget';
    if (message.includes('บิล') || message.includes('bill')) return 'bill';
    if (message.includes('หนี้') || message.includes('debt')) return 'debt';
    if (message.includes('เป้าหมาย') || message.includes('goal')) return 'goal';
    if (message.includes('รายการ') || message.includes('transaction')) return 'transaction';
    return 'system';
  };

  const addNotification = useCallback(async (notificationData: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    icon?: string;
    data?: Record<string, unknown>;
    action_url?: string;
    expires_at?: string;
  }) => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id;
    
    if (!userId) {
      console.warn('No user ID available for adding notification');
      return;
    }

    try {
      const newNotification = await notificationApi.create({
        user_id: userId,
        ...notificationData,
        priority: notificationData.priority || 'normal'
      }) as Notification;
      
      // Add backward compatibility properties
      const enrichedNotification = {
        ...newNotification,
        timestamp: new Date(newNotification.created_at),
        isRead: newNotification.is_read,
        actionUrl: newNotification.action_url,
        category: inferCategoryFromMessage(newNotification.message)
      };
      
      setNotifications(prev => [enrichedNotification, ...prev]);
    } catch (err) {
      console.error('Failed to create notification:', err);
      
      // Fallback to local notification
      const localNotification: Notification = {
        id: Date.now().toString(),
        user_id: userId,
        ...notificationData,
        priority: notificationData.priority || 'normal',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timestamp: new Date(),
        isRead: false,
        actionUrl: notificationData.action_url,
        category: inferCategoryFromMessage(notificationData.message)
      };
      
      setNotifications(prev => [localNotification, ...prev]);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      
      setNotifications(prev => prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true, isRead: true, read_at: new Date().toISOString() }
          : notification
      ));
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
      
      // Fallback to local update
      setNotifications(prev => prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true, isRead: true, read_at: new Date().toISOString() }
          : notification
      ));
    }
  }, []);

  const markAsUnread = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsUnread(id);
      
      setNotifications(prev => prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: false, isRead: false, read_at: undefined }
          : notification
      ));
    } catch (err) {
      console.error(`Failed to mark notification ${id} as unread:`, err);
      
      // Fallback to local update
      setNotifications(prev => prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: false, isRead: false, read_at: undefined }
          : notification
      ));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id;
    
    if (!userId) {
      console.warn('No user ID available for marking all notifications as read');
      return;
    }

    try {
      await notificationApi.markAllAsRead(userId);
      
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true,
        isRead: true,
        read_at: new Date().toISOString()
      })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      
      // Fallback to local update
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true,
        isRead: true,
        read_at: new Date().toISOString()
      })));
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err);
      
      // Fallback to local deletion
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id;
    
    if (!userId) {
      console.warn('No user ID available for clearing notifications');
      return;
    }

    try {
      // Delete all notifications for the user
      const deletePromises = notifications.map(notification => 
        notificationApi.delete(notification.id).catch(console.error)
      );
      
      await Promise.all(deletePromises);
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      
      // Fallback to local clearing
      setNotifications([]);
    }
  }, [notifications]);

  const openNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(true);
  }, []);

  const closeNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(false);
  }, []);

  const toggleNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(prev => !prev);
  }, []);

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isNotificationPanelOpen,
    isLoading,
    error,
    refreshNotifications,
    addNotification,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    openNotificationPanel,
    closeNotificationPanel,
    toggleNotificationPanel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};