'use client';

import { useState, useEffect, useRef } from 'react';

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

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'transaction' | 'bill' | 'goal'>('all');
  const itemsPerPage = 5;

  // ปิด panel เมื่อคลิกนอก component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transaction': return '💰';
      case 'bill': return '🧾';
      case 'debt': return '📊';
      case 'budget': return '📈';
      case 'goal': return '🎯';
      case 'system': return '⚙️';
      default: return '📱';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return timestamp.toLocaleDateString('th-TH');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filterType) {
      case 'unread':
        return !notification.isRead;
      case 'transaction':
        return notification.category === 'transaction';
      case 'bill':
        return notification.category === 'bill';
      case 'goal':
        return notification.category === 'goal';
      default:
        return true;
    }
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Pagination logic
  const totalPages = Math.ceil(sortedNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = sortedNotifications.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div 
        ref={panelRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-light text-gray-900 dark:text-white">
              การแจ้งเตือน
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-light transition-colors"
                disabled={unreadCount === 0}
              >
                อ่านทั้งหมด
              </button>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="text-sm border border-gray-200/50 dark:border-gray-700/50 rounded px-2 py-1 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white font-light backdrop-blur-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="unread">ยังไม่อ่าน</option>
                <option value="transaction">การเงิน</option>
                <option value="bill">บิล</option>
                <option value="goal">เป้าหมาย</option>
              </select>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {paginatedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
              <span className="text-4xl mb-3">🔔</span>
              <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
                ไม่มีการแจ้งเตือน
              </h3>
              <p className="text-gray-500 dark:text-gray-400 font-light">
                การแจ้งเตือนใหม่จะแสดงที่นี่
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {paginatedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative rounded-lg border p-3 transition-all duration-200 backdrop-blur-sm ${
                    notification.isRead
                      ? 'bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50'
                      : 'bg-gray-100/80 dark:bg-gray-700/80 border-gray-300/60 dark:border-gray-600/60'
                  }`}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute left-2 top-2 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}

                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{getCategoryIcon(notification.category)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-light text-gray-900 dark:text-white leading-tight">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-light leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-light">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Type indicator */}
                        <span className="text-xs ml-2 mt-1">{getNotificationIcon(notification.type)}</span>
                      </div>

                      {/* Action Button */}
                      {notification.actionUrl && (
                        <button className="mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-light transition-colors">
                          ดูรายละเอียด →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-light">
                      หน้า {currentPage} จาก {totalPages} ({sortedNotifications.length} รายการ)
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm font-light border border-gray-200/50 dark:border-gray-700/50 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50/70 dark:hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm"
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm font-light border border-gray-200/50 dark:border-gray-700/50 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50/70 dark:hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 backdrop-blur-sm">
            <button className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-light py-2 transition-colors">
              ดูการแจ้งเตือนทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}