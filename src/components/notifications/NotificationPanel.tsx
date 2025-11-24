'use client';

import { useState, useEffect, useRef } from 'react';
import { Notification } from '@/types';

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

  const formatTimestamp = (created_at: string) => {
    const timestamp = new Date(created_at);
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

  // Helper function to get category from notification data or type
  const getNotificationCategory = (notification: Notification): string => {
    // Try to get category from data object first
    if (notification.data && typeof notification.data.category === 'string') {
      return notification.data.category;
    }
    // Otherwise infer from type or title
    if (notification.title.includes('รายการ') || notification.title.includes('Transaction')) {
      return 'transaction';
    }
    if (notification.title.includes('ใบแจ้ง') || notification.title.includes('Bill')) {
      return 'bill';
    }
    if (notification.title.includes('เป้าหมาย') || notification.title.includes('Goal')) {
      return 'goal';
    }
    return 'system';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filterType) {
      case 'unread':
        return !notification.is_read;
      case 'transaction':
        return getNotificationCategory(notification) === 'transaction';
      case 'bill':
        return getNotificationCategory(notification) === 'bill';
      case 'goal':
        return getNotificationCategory(notification) === 'goal';
      default:
        return true;
    }
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
                  onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
                  className={`relative rounded-lg border p-3 transition-all duration-200 backdrop-blur-sm cursor-pointer hover:shadow-md ${
                    notification.is_read
                      ? 'bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50'
                      : 'bg-gray-100/80 dark:bg-gray-700/80 border-gray-300/60 dark:border-gray-600/60 hover:bg-gray-200/80 dark:hover:bg-gray-600/80'
                  }`}
                >
                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="absolute left-2 top-2 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}

                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{getCategoryIcon(getNotificationCategory(notification))}</span>
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
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-500 font-light">
                              {formatTimestamp(notification.created_at)}
                            </p>
                            {notification.is_read && notification.read_at && (
                              <p className="text-xs text-green-600 dark:text-green-400 font-light">
                                อ่านแล้ว
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.is_read ? null : onMarkAsRead(notification.id);
                            }}
                            className={`p-1 rounded-full transition-colors ${
                              notification.is_read 
                                ? 'text-green-500 dark:text-green-400' 
                                : 'text-gray-400 hover:text-green-500 dark:hover:text-green-400'
                            }`}
                            title={notification.is_read ? 'อ่านแล้ว' : 'ทำเครื่องหมายว่าอ่านแล้ว'}
                          >
                            {notification.is_read ? '✓' : '○'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="ลบการแจ้งเตือน"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Action Button */}
                      {notification.action_url && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.action_url) {
                              window.location.href = notification.action_url;
                            }
                          }}
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-light transition-colors"
                        >
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