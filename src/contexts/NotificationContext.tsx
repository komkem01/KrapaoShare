'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  category: 'transaction' | 'bill' | 'debt' | 'budget' | 'goal' | 'system';
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isNotificationPanelOpen: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  toggleNotificationPanel: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Mock notifications สำหรับทดสอบ
const getMockNotifications = (): Notification[] => [
  {
    id: '1',
    type: 'warning',
    title: 'งบประมาณเกือบหมด',
    message: 'งบประมาณหมวด "อาหาร" เหลือเพียง 15% แล้ว (฿450 จาก ฿3,000)',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false,
    category: 'budget',
    actionUrl: '/dashboard/budgets'
  },
  {
    id: '2',
    type: 'success',
    title: 'บิลถูกแบ่งเรียบร้อย',
    message: 'บิลร้านอาหาร ฿1,200 ถูกแบ่งให้เพื่อน 4 คนแล้ว คุณได้รับ ฿300',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    category: 'bill'
  },
  {
    id: '3',
    type: 'info',
    title: 'เป้าหมายการออมใกล้สำเร็จ',
    message: 'เป้าหมาย "MacBook ใหม่" เหลืออีก ฿15,000 (75% สำเร็จแล้ว)',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: true,
    category: 'goal',
    actionUrl: '/dashboard/goals'
  },
  {
    id: '4',
    type: 'error',
    title: 'ชำระหนี้เกินกำหนด',
    message: 'หนี้ให้ "สมชาย" จำนวน ฿2,500 เกินกำหนดชำระแล้ว 3 วัน',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: false,
    category: 'debt',
    actionUrl: '/dashboard/debts'
  },
  {
    id: '5',
    type: 'success',
    title: 'รายการใหม่ถูกเพิ่ม',
    message: 'รายจ่าย "ค่าน้ำมัน" ฿800 ถูกบันทึกเรียบร้อยแล้ว',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    category: 'transaction'
  },
  {
    id: '6',
    type: 'info',
    title: 'อัปเดตระบบ',
    message: 'ระบบได้รับการอัปเดตแล้ว เพิ่มฟีเจอร์การวิเคราะห์ใหม่',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    category: 'system'
  },
  {
    id: '7',
    type: 'warning',
    title: 'เป้าหมายร่วมกันใกล้หมดเวลา',
    message: 'เป้าหมาย "ทริปเชียงใหม่" เหลือเวลาอีก 15 วัน และยังขาดเงิน ฿8,500',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: false,
    category: 'goal',
    actionUrl: '/dashboard/shared-goals'
  }
];

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(getMockNotifications());
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((newNotification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const notification: Notification = {
      ...newNotification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false
    };
    
    setNotifications(prev => [notification, ...prev]);
    
    // แสดง toast notification (optional)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const openNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(true);
  }, []);

  const closeNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(false);
  }, []);

  const toggleNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(prev => !prev);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isNotificationPanelOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    openNotificationPanel,
    closeNotificationPanel,
    toggleNotificationPanel
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper functions สำหรับสร้างการแจ้งเตือนแบบง่าย
export const createNotification = {
  success: (title: string, message: string, category: Notification['category'] = 'system') => ({
    type: 'success' as const,
    title,
    message,
    category
  }),
  
  warning: (title: string, message: string, category: Notification['category'] = 'system') => ({
    type: 'warning' as const,
    title,
    message,
    category
  }),
  
  error: (title: string, message: string, category: Notification['category'] = 'system') => ({
    type: 'error' as const,
    title,
    message,
    category
  }),
  
  info: (title: string, message: string, category: Notification['category'] = 'system') => ({
    type: 'info' as const,
    title,
    message,
    category
  })
};