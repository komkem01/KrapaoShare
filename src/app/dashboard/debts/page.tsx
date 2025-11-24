'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

interface Debt {
  id: number;
  person: string;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'settled';
  dueDate: string;
}

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState<'owe-me' | 'i-owe'>('owe-me');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  // TODO: ✅ Backend API Ready!
  // Backend now has /debts and /debt-payments endpoints - integrate with real API:
  //   GET    /debts                    - List debts
  //   POST   /debts                    - Create debt
  //   GET    /debts/:id                - Get debt details
  //   PATCH  /debts/:id                - Update debt (mark settled)
  //   DELETE /debts/:id                - Delete debt
  //   GET    /debts/creditor/:userId   - Debts where user is creditor
  //   GET    /debts/debtor/:userId     - Debts where user is debtor
  //   GET    /debt-payments            - List payments
  //   POST   /debt-payments            - Record payment
  //   GET    /debt-payments/debt/:debtId - Get debt payments
  //   GET    /debt-payments/user/:userId - Get user's payments
  //
  // See src/utils/apiClient.ts for implementation

  // Mock data - ในอนาคตจะเชื่อมกับ API
  const [mockDebtorsOweMe, setMockDebtorsOweMe] = useState<Debt[]>([
    {
      id: 1,
      person: 'มิกิ',
      amount: 312.50,
      description: 'ค่าอาหารเที่ยงที่ MK',
      date: '2025-11-14',
      status: 'pending',
      dueDate: '2025-11-21'
    },
    {
      id: 2,
      person: 'โยชิ',
      amount: 312.50,
      description: 'ค่าอาหารเที่ยงที่ MK',
      date: '2025-11-14',
      status: 'pending',
      dueDate: '2025-11-21'
    },
    {
      id: 3,
      person: 'แอน',
      amount: 312.50,
      description: 'ค่าอาหารเที่ยงที่ MK',
      date: '2025-11-14',
      status: 'pending',
      dueDate: '2025-11-21'
    },
    {
      id: 4,
      person: 'โยศิ',
      amount: 93.34,
      description: 'ค่าแท็กซี่กลับบ้าน',
      date: '2025-11-13',
      status: 'pending',
      dueDate: '2025-11-20'
    },
    {
      id: 5,
      person: 'มิกิ',
      amount: 150,
      description: 'ซื้อของใช้ในหอ',
      date: '2025-11-12',
      status: 'pending',
      dueDate: '2025-11-19'
    },
    {
      id: 6,
      person: 'โยชิ',
      amount: 150,
      description: 'ซื้อของใช้ในหอ',
      date: '2025-11-12',
      status: 'pending',
      dueDate: '2025-11-19'
    }
  ]);

  const [mockDebtsIOwe, setMockDebtsIOwe] = useState<Debt[]>([
    {
      id: 7,
      person: 'มิกิ',
      amount: 93.33,
      description: 'ค่าแท็กซี่กลับบ้าน',
      date: '2025-11-13',
      status: 'pending',
      dueDate: '2025-11-20'
    }
  ]);

  const filteredDebts = activeTab === 'owe-me' ? mockDebtorsOweMe : mockDebtsIOwe;

  const handleSendReminder = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowReminderModal(true);
  };

  const confirmSendReminder = () => {
    if (selectedDebt) {
      // ส่งการแจ้งเตือน
      toast.info(`ส่งการแจ้งเตือนให้ ${selectedDebt.person} เรียบร้อยแล้ว! 📱\nจำนวน: ฿${selectedDebt.amount.toLocaleString()}\nรายการ: ${selectedDebt.description}`);
      setShowReminderModal(false);
      setSelectedDebt(null);
    }
  };

  const handleSettleDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowSettleModal(true);
  };

  const confirmSettleDebt = () => {
    if (selectedDebt) {
      // ลบหนี้จาก mockDebtorsOweMe
      setMockDebtorsOweMe(prev => prev.filter(d => d.id !== selectedDebt.id));
      toast.info(`ยืนยันการรับเงินจาก ${selectedDebt.person} เรียบร้อยแล้ว! ✅\nจำนวน: ฿${selectedDebt.amount.toLocaleString()}`);
      setShowSettleModal(false);
      setSelectedDebt(null);
    }
  };

  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowPayModal(true);
  };

  const confirmPayDebt = () => {
    if (selectedDebt) {
      // ลบหนี้จาก mockDebtsIOwe
      setMockDebtsIOwe(prev => prev.filter(d => d.id !== selectedDebt.id));
      toast.info(`ยืนยันการจ่ายเงินให้ ${selectedDebt.person} เรียบร้อยแล้ว! 💰\nจำนวน: ฿${selectedDebt.amount.toLocaleString()}`);
      setShowPayModal(false);
      setSelectedDebt(null);
    }
  };

  const handleSendAllReminders = () => {
    const pendingOweMeDebts = mockDebtorsOweMe.filter(debt => debt.status === 'pending');
    if (pendingOweMeDebts.length > 0) {
      toast.info(`ส่งการแจ้งเตือนให้ ${pendingOweMeDebts.length} คน เรียบร้อยแล้ว! 📱\nรวม: ฿${pendingOweMeDebts.reduce((sum, debt) => sum + debt.amount, 0).toLocaleString()}`);
    } else {
      toast.info('ไม่มีหนี้ที่ต้องแจ้งเตือน 🎉');
    }
  };

  const handleClearSmallestDebt = () => {
    const allDebts = [...mockDebtorsOweMe, ...mockDebtsIOwe].filter(debt => debt.status === 'pending');
    if (allDebts.length > 0) {
      const smallestDebt = allDebts.reduce((min, debt) => debt.amount < min.amount ? debt : min);
      
      if (smallestDebt.id <= 6) {
        // It's an "owe me" debt
        setMockDebtorsOweMe(prev => prev.filter(d => d.id !== smallestDebt.id));
      } else {
        // It's an "I owe" debt
        setMockDebtsIOwe(prev => prev.filter(d => d.id !== smallestDebt.id));
      }
      
      toast.info(`เคลียร์หนี้ที่เล็กที่สุดเรียบร้อยแล้ว! 💰\n${smallestDebt.person}: ฿${smallestDebt.amount.toLocaleString()}\n${smallestDebt.description}`);
    } else {
      toast.info('ไม่มีหนี้ที่ต้องเคลียร์ 🎉');
    }
  };

  const handleShowStats = () => {
    setShowStatsModal(true);
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
                                onClick={() => handleSendReminder(debt)}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                แจ้งเตือน
                              </button>
                              <button
                                onClick={() => handleSettleDebt(debt)}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                ได้รับแล้ว
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handlePayDebt(debt)}
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
            <button 
              onClick={handleSendAllReminders}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>📱</span>
              <span className="font-medium">ส่งการแจ้งเตือนทั้งหมด</span>
            </button>
            <button 
              onClick={handleClearSmallestDebt}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>💰</span>
              <span className="font-medium">เคลียร์หนี้ที่เล็กที่สุด</span>
            </button>
            <button 
              onClick={handleShowStats}
              className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
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

        {/* Reminder Modal */}
        {showReminderModal && selectedDebt && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowReminderModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      ส่งการแจ้งเตือน
                    </h3>
                    <button
                      onClick={() => setShowReminderModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📱</span>
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            คุณกำลังจะส่งการแจ้งเตือนไปยัง:
                          </p>
                          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                            {selectedDebt.person}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รายละเอียดหนี้:
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>จำนวนเงิน:</strong> ฿{selectedDebt.amount.toLocaleString()}</p>
                        <p><strong>รายการ:</strong> {selectedDebt.description}</p>
                        <p><strong>วันที่สร้าง:</strong> {new Date(selectedDebt.date).toLocaleDateString('th-TH')}</p>
                        <p><strong>กำหนดจ่าย:</strong> {new Date(selectedDebt.dueDate).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-3">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        📌 ข้อความจะถูกส่งผ่าน LINE หรือ SMS ตามการตั้งค่าของผู้ใช้
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={confirmSendReminder}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:w-auto sm:text-sm transition-all"
                  >
                    📱 ส่งการแจ้งเตือน
                  </button>
                  <button
                    onClick={() => setShowReminderModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settle Debt Modal */}
        {showSettleModal && selectedDebt && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowSettleModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      ยืนยันการรับเงิน
                    </h3>
                    <button
                      onClick={() => setShowSettleModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            คุณได้รับเงินจาก:
                          </p>
                          <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                            {selectedDebt.person}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รายละเอียดการจ่าย:
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>จำนวนเงิน:</strong> ฿{selectedDebt.amount.toLocaleString()}</p>
                        <p><strong>รายการ:</strong> {selectedDebt.description}</p>
                        <p><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900 rounded-lg p-3">
                      <p className="text-xs text-red-800 dark:text-red-200">
                        ⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้ กรุณาตรวจสอบความถูกต้องก่อนยืนยัน
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={confirmSettleDebt}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ✅ ยืนยันการรับเงิน
                  </button>
                  <button
                    onClick={() => setShowSettleModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pay Debt Modal */}
        {showPayModal && selectedDebt && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowPayModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      ยืนยันการจ่ายเงิน
                    </h3>
                    <button
                      onClick={() => setShowPayModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">💳</span>
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            คุณจ่ายเงินให้:
                          </p>
                          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                            {selectedDebt.person}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รายละเอียดการจ่าย:
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>จำนวนเงิน:</strong> ฿{selectedDebt.amount.toLocaleString()}</p>
                        <p><strong>รายการ:</strong> {selectedDebt.description}</p>
                        <p><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-3">
                      <p className="text-xs text-green-800 dark:text-green-200">
                        🎉 ยินดีด้วย! คุณกำลังจะเคลียร์หนี้รายการนี้เรียบร้อยแล้ว
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={confirmPayDebt}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:w-auto sm:text-sm transition-all"
                  >
                    💰 ยืนยันการจ่ายเงิน
                  </button>
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Modal */}
        {showStatsModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowStatsModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      📊 สถิติหนี้สิน
                    </h3>
                    <button
                      onClick={() => setShowStatsModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">💰</div>
                        <p className="text-sm text-green-700 dark:text-green-300">คนอื่นติดหนี้เรา</p>
                        <p className="text-lg font-bold text-green-800 dark:text-green-200">
                          ฿{totalOweMe.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {mockDebtorsOweMe.length} รายการ
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">💸</div>
                        <p className="text-sm text-red-700 dark:text-red-300">เราติดหนี้คนอื่น</p>
                        <p className="text-lg font-bold text-red-800 dark:text-red-200">
                          ฿{totalIOwe.toLocaleString()}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {mockDebtsIOwe.length} รายการ
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">⚖️</div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">ยอดรวมสุทธิ</p>
                        <p className={`text-lg font-bold ${
                          totalOweMe - totalIOwe >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {totalOweMe - totalIOwe >= 0 ? '+' : ''}฿{(totalOweMe - totalIOwe).toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {mockDebtorsOweMe.length + mockDebtsIOwe.length} รายการรวม
                        </p>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        📈 รายละเอียดการวิเคราะห์
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            🔍 หนี้ที่ใหญ่ที่สุด
                          </h5>
                          {(() => {
                            const allDebts = [...mockDebtorsOweMe, ...mockDebtsIOwe];
                            const largestDebt = allDebts.reduce((max, debt) => debt.amount > max.amount ? debt : max, allDebts[0] || { amount: 0, person: '-', description: '-' });
                            return (
                              <div className="text-sm space-y-1">
                                <p><strong>คน:</strong> {largestDebt.person}</p>
                                <p><strong>จำนวน:</strong> ฿{largestDebt.amount.toLocaleString()}</p>
                                <p><strong>รายการ:</strong> {largestDebt.description}</p>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            🏃 หนี้ที่เล็กที่สุด
                          </h5>
                          {(() => {
                            const allDebts = [...mockDebtorsOweMe, ...mockDebtsIOwe];
                            const smallestDebt = allDebts.reduce((min, debt) => debt.amount < min.amount ? debt : min, allDebts[0] || { amount: 0, person: '-', description: '-' });
                            return (
                              <div className="text-sm space-y-1">
                                <p><strong>คน:</strong> {smallestDebt.person}</p>
                                <p><strong>จำนวน:</strong> ฿{smallestDebt.amount.toLocaleString()}</p>
                                <p><strong>รายการ:</strong> {smallestDebt.description}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          ⏰ หนี้ที่เกินกำหนด
                        </h5>
                        {(() => {
                          const today = new Date();
                          const overdueDebts = [...mockDebtorsOweMe, ...mockDebtsIOwe].filter(debt => new Date(debt.dueDate) < today);
                          return (
                            <div className="text-sm">
                              {overdueDebts.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-red-600 dark:text-red-400 font-medium">
                                    {overdueDebts.length} รายการ (฿{overdueDebts.reduce((sum, debt) => sum + debt.amount, 0).toLocaleString()})
                                  </p>
                                  {overdueDebts.slice(0, 3).map((debt, index) => (
                                    <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                                      • {debt.person}: ฿{debt.amount.toLocaleString()} ({debt.description})
                                    </p>
                                  ))}
                                  {overdueDebts.length > 3 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      และอีก {overdueDebts.length - 3} รายการ...
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-green-600 dark:text-green-400">🎉 ไม่มีหนี้เกินกำหนด</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setShowStatsModal(false)}
                    className="w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ✅ ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}