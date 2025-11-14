'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationPanel from '@/components/notifications/NotificationPanel';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pathname = usePathname();
  
  const {
    notifications,
    unreadCount,
    isNotificationPanelOpen,
    toggleNotificationPanel,
    closeNotificationPanel,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const handleLogout = () => {
    console.log('Logout clicked, showing modal...');
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear any stored auth data here if needed
    window.location.href = '/auth/login';
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const navigation = [
    { 
      name: 'ภาพรวม', 
      href: '/dashboard', 
      icon: '📊',
      description: 'สรุปยอดเงินและรายการล่าสุด'
    },
    { 
      name: 'รายรับ-จ่าย', 
      href: '/dashboard/transactions', 
      icon: '💰',
      description: 'บันทึกและดูประวัติรายการเงิน'
    },
    { 
      name: 'แบ่งบิล', 
      href: '/dashboard/bills', 
      icon: '🧾',
      description: 'แบ่งค่าใช้จ่ายกับเพื่อน'
    },
    { 
      name: 'หนี้สิน', 
      href: '/dashboard/debts', 
      icon: '🤝',
      description: 'ติดตามหนี้สินและการเคลียร์'
    },
    { 
      name: 'งบประมาณ', 
      href: '/dashboard/budgets', 
      icon: '🎯',
      description: 'ตั้งและติดตามงบประมาณ'
    },
    { 
      name: 'เป้าหมายออม', 
      href: '/dashboard/goals', 
      icon: '💎',
      description: 'ตั้งเป้าหมายและออมเงิน'
    },
    { 
      name: 'ออมร่วมกัน', 
      href: '/dashboard/shared-goals', 
      icon: '🤲',
      description: 'ออมเงินร่วมกันกับเพื่อน'
    },
    { 
      name: 'รายงาน', 
      href: '/dashboard/analytics', 
      icon: '📈',
      description: 'กราฟและวิเคราะห์การเงิน'
    },
    { 
      name: 'ตั้งค่า', 
      href: '/dashboard/settings', 
      icon: '⚙️',
      description: 'จัดการข้อมูลส่วนตัวและการตั้งค่า'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-bold text-lg">K</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              KrapaoShare
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">U</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">ผู้ใช้งาน</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">user@example.com</div>
              </div>
              <Link 
                href="/dashboard/settings"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="text-lg">⚙️</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 lg:hidden"
              >
                <span className="text-xl">☰</span>
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notification Button */}
              <button
                onClick={toggleNotificationPanel}
                className="relative p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium min-w-[1.2rem] h-5 rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={closeNotificationPanel}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0" onClick={cancelLogout}></div>

            <div className="inline-block align-bottom bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-light text-gray-900 dark:text-white">
                    ยืนยันการออกจากระบบ
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
                      คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ? ข้อมูลที่ยังไม่ได้บันทึกอาจสูญหาย
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-light text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  ออกจากระบบ
                </button>
                <button
                  type="button"
                  onClick={cancelLogout}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}