'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState<'owe-me' | 'i-owe'>('owe-me');

  // Mock data - ในอนาคตจะเชื่อมกับ API
  const mockDebtorsOweMe = [
    {
      id: 1,
      person: 'มิกิ',
      amount: 312.50,
      description: 'ค่าอาหารเที่ยงที่ MK',
      date: '2025-11-14',
      status: 'pending' as const,
      dueDate: '2025-11-21'
    },
    {
      id: 2,
      person: 'โยชิ',
      amount: 312.50,
      description: 'ค่าอาหารเที่ยงที่ MK',
      date: '2025-11-14',
      status: 'pending' as const,
      dueDate: '2025-11-21'
    },
    {
      id: 3,
      person: 'แอน',
      amount: 312.50,
      description: 'ค่าอาหารเที่ยงที่ MK',
      date: '2025-11-14',
      status: 'pending' as const,
      dueDate: '2025-11-21'
    },
    {
      id: 4,
      person: 'โยศิ',
      amount: 93.34,
      description: 'ค่าแท็กซี่กลับบ้าน',
      date: '2025-11-13',
      status: 'pending' as const,
      dueDate: '2025-11-20'
    },
    {
      id: 5,
      person: 'มิกิ',
      amount: 150,
      description: 'ซื้อของใช้ในหอ',
      date: '2025-11-12',
      status: 'pending' as const,
      dueDate: '2025-11-19'
    },
    {
      id: 6,
      person: 'โยชิ',
      amount: 150,
      description: 'ซื้อของใช้ในหอ',
      date: '2025-11-12',
      status: 'pending' as const,
      dueDate: '2025-11-19'
    }
  ];

  const mockDebtsIOwe = [
    {
      id: 7,
      person: 'มิกิ',
      amount: 93.33,
      description: 'ค่าแท็กซี่กลับบ้าน',
      date: '2025-11-13',
      status: 'pending' as const,
      dueDate: '2025-11-20'
    }
  ];

  const filteredDebts = activeTab === 'owe-me' ? mockDebtorsOweMe : mockDebtsIOwe;

  const handleSendReminder = (debtId: number) => {
    console.log(`Sending reminder for debt ${debtId}`);
  };

  const handleSettleDebt = (debtId: number) => {
    console.log(`Settling debt ${debtId}`);
  };

  const handlePayDebt = (debtId: number) => {
    console.log(`Paying debt ${debtId}`);
  };

  const totalOweMe = mockDebtorsOweMe.reduce((sum, debt) => sum + debt.amount, 0);
  const totalIOwe = mockDebtsIOwe.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              สรุปหนี้สิน
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ติดตามและจัดการหนี้สินจากการแยกบิล
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  คนอื่นติดหนี้เรา
                </p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  ฿{totalOweMe.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-xl">💸</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เราติดหนี้คนอื่น
                </p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  ฿{totalIOwe.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-xl">⚖️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ยอดรวม
                </p>
                <p className={`text-2xl font-semibold ${
                  totalOweMe - totalIOwe >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {totalOweMe - totalIOwe >= 0 ? '+' : ''}฿{(totalOweMe - totalIOwe).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('owe-me')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'owe-me'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              คนอื่นติดหนี้เรา ({mockDebtorsOweMe.length})
            </button>
            <button
              onClick={() => setActiveTab('i-owe')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'i-owe'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              เราติดหนี้คนอื่น ({mockDebtsIOwe.length})
            </button>
          </nav>
        </div>

        {/* Debts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {activeTab === 'owe-me' ? 'รายการที่ต้องได้รับ' : 'รายการที่ต้องจ่าย'}
            </h3>
          </div>
          
          {filteredDebts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                ไม่มีหนี้สิน
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'owe-me' 
                  ? 'ยังไม่มีใครติดหนี้คุณ' 
                  : 'คุณไม่ติดหนี้ใครเลย เยี่ยมมาก!'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDebts.map((debt) => {
                const isOverdue = new Date(debt.dueDate) < new Date();
                
                return (
                  <div key={debt.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${
                          activeTab === 'owe-me' 
                            ? 'bg-green-100 dark:bg-green-900' 
                            : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          <span className={`text-xl ${
                            activeTab === 'owe-me'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {activeTab === 'owe-me' ? '👤' : '💳'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              {debt.person}
                            </p>
                            {isOverdue && (
                              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium px-2 py-1 rounded">
                                เกินกำหนด
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {debt.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>วันที่: {new Date(debt.date).toLocaleDateString('th-TH')}</span>
                            <span>•</span>
                            <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                              กำหนดจ่าย: {new Date(debt.dueDate).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`text-xl font-semibold ${
                            activeTab === 'owe-me'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {activeTab === 'owe-me' ? '+' : '-'}฿{debt.amount.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          {activeTab === 'owe-me' ? (
                            <>
                              <button
                                onClick={() => handleSendReminder(debt.id)}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                แจ้งเตือน
                              </button>
                              <button
                                onClick={() => handleSettleDebt(debt.id)}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                ได้รับแล้ว
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handlePayDebt(debt.id)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              จ่ายแล้ว
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            การดำเนินการด่วน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              <span>📱</span>
              <span className="font-medium">ส่งการแจ้งเตือนทั้งหมด</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
              <span>💰</span>
              <span className="font-medium">เคลียร์หนี้ที่เล็กที่สุด</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              <span>📊</span>
              <span className="font-medium">ดูสถิติหนี้สิน</span>
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 dark:text-blue-400 text-xl">💡</span>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                เคล็ดลับการจัดการหนี้สิน
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• ส่งการแจ้งเตือนอย่างสุภาพและชัดเจน</li>
                <li>• เคลียร์หนี้เล็กๆ ก่อนเพื่อลดจำนวนรายการ</li>
                <li>• ตกลงกำหนดเวลาจ่ายที่ชัดเจนตั้งแต่แรก</li>
                <li>• ใช้แอพเป็นหลักฐานเพื่อหลีกเลี่ยงความไม่เข้าใจ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}