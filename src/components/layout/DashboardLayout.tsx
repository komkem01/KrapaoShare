'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

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
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <span className="text-lg">⚙️</span>
              </button>
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
              <button className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                <span className="text-xl">🔔</span>
              </button>
              <Link 
                href="/"
                className="text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ออกจากระบบ
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}