'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    category: 'ทั่วไป'
  });

  // Mock data - ในอนาคตจะเชื่อมกับ API
  const mockActiveGoals = [
    {
      id: 1,
      name: 'ซื้อ MacBook ใหม่',
      currentAmount: 25000,
      targetAmount: 65000,
      targetDate: '2026-06-15',
      description: 'MacBook Air M3 สำหรับทำงาน',
      category: 'เทคโนโลยี',
      createdDate: '2025-10-01',
      deposits: [
        { date: '2025-11-01', amount: 10000, note: 'เงินเดือนเดือนแรก' },
        { date: '2025-11-15', amount: 15000, note: 'โบนัสจากงาน' }
      ]
    },
    {
      id: 2,
      name: 'ทริปญี่ปุ่น',
      currentAmount: 8500,
      targetAmount: 45000,
      targetDate: '2026-03-01',
      description: 'เที่ยวญี่ปุ่น 7 วัน รวมตั้งเครื่อง',
      category: 'ท่องเที่ยว',
      createdDate: '2025-09-15',
      deposits: [
        { date: '2025-10-01', amount: 5000, note: 'เริ่มออม' },
        { date: '2025-11-01', amount: 3500, note: 'ออมต่อเนื่อง' }
      ]
    },
    {
      id: 3,
      name: 'กองทุนฉุกเฉิน',
      currentAmount: 15000,
      targetAmount: 30000,
      targetDate: '2025-12-31',
      description: 'เงินสำรองสำหรับเหตุฉุกเฉิน 3 เดือน',
      category: 'การเงิน',
      createdDate: '2025-08-01',
      deposits: [
        { date: '2025-08-15', amount: 5000, note: 'เริ่มต้น' },
        { date: '2025-09-15', amount: 5000, note: 'รายเดือน' },
        { date: '2025-10-15', amount: 5000, note: 'รายเดือน' }
      ]
    }
  ];

  const mockCompletedGoals = [
    {
      id: 4,
      name: 'iPhone 15 Pro',
      currentAmount: 42000,
      targetAmount: 42000,
      targetDate: '2025-10-15',
      completedDate: '2025-10-10',
      description: 'อัพเกรดโทรศัพท์ใหม่',
      category: 'เทคโนโลยี',
      createdDate: '2025-06-01'
    }
  ];

  const filteredGoals = activeTab === 'active' ? mockActiveGoals : mockCompletedGoals;

  const handleCreateGoal = () => {
    console.log('Creating goal:', newGoal);
    setShowCreateModal(false);
    setNewGoal({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
      category: 'ทั่วไป'
    });
  };

  const handleDeposit = () => {
    console.log(`Depositing ${depositAmount} to goal ${selectedGoal}`);
    setShowDepositModal(false);
    setDepositAmount('');
    setSelectedGoal(null);
  };

  const openDepositModal = (goalId: number) => {
    setSelectedGoal(goalId);
    setShowDepositModal(true);
  };

  const categories = ['ทั่วไป', 'เทคโนโลยี', 'ท่องเที่ยว', 'การเงิน', 'สุขภาพ', 'การศึกษา', 'บ้านและที่อยู่', 'รถยนต์'];

  const totalSaved = mockActiveGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = mockActiveGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              เป้าหมายการออม
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ตั้งเป้าหมายและติดตามความคืบหน้าการออมเงิน
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            + ตั้งเป้าหมายใหม่
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เป้าหมายทั้งหมด
                </p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {mockActiveGoals.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ออมไปแล้ว
                </p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  ฿{totalSaved.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 text-xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เป้าหมายรวม
                </p>
                <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  ฿{totalTarget.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ความคืบหน้า
                </p>
                <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                  {Math.round((totalSaved / totalTarget) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              กำลังดำเนินการ ({mockActiveGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              สำเร็จแล้ว ({mockCompletedGoals.length})
            </button>
          </nav>
        </div>

        {/* Goals List */}
        <div className="grid gap-6">
          {filteredGoals.map((goal) => {
            const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
            const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isCompleted = progressPercentage >= 100;
            const isNearDeadline = daysLeft <= 30 && daysLeft > 0;
            const isOverdue = daysLeft < 0 && !isCompleted;
            
            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {goal.name}
                      </h3>
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded">
                        {goal.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>สร้างเมื่อ: {new Date(goal.createdDate).toLocaleDateString('th-TH')}</span>
                      <span>•</span>
                      <span>เป้าหมาย: {new Date(goal.targetDate).toLocaleDateString('th-TH')}</span>
                      {activeTab === 'completed' && 'completedDate' in goal && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            สำเร็จ: {new Date(goal.completedDate).toLocaleDateString('th-TH')}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Status indicators */}
                    <div className="flex space-x-2 mt-2">
                      {isCompleted && (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded">
                          ✅ สำเร็จแล้ว!
                        </span>
                      )}
                      {isNearDeadline && !isCompleted && (
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium px-2 py-1 rounded">
                          ⏰ ใกล้ครบกำหนด
                        </span>
                      )}
                      {isOverdue && (
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium px-2 py-1 rounded">
                          ⚠️ เลยกำหนดแล้ว
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      ฿{goal.targetAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ออมแล้ว ฿{goal.currentAmount.toLocaleString()}
                    </p>
                    {activeTab === 'active' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {daysLeft > 0 ? `เหลือ ${daysLeft} วัน` : isCompleted ? 'สำเร็จแล้ว!' : 'เลยกำหนดแล้ว'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">ความคืบหน้า</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-500' 
                          : progressPercentage > 75 
                            ? 'bg-blue-500' 
                            : 'bg-gray-400'
                      }`}
                      style={{width: `${Math.min(progressPercentage, 100)}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>฿0</span>
                    <span>เหลือ ฿{(goal.targetAmount - goal.currentAmount).toLocaleString()}</span>
                    <span>฿{goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Recent Deposits (for active goals only) */}
                {activeTab === 'active' && 'deposits' in goal && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      การฝากล่าสุด ({goal.deposits.length})
                    </h4>
                    <div className="space-y-2">
                      {goal.deposits.slice(-3).map((deposit, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {deposit.note}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(deposit.date).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            +฿{deposit.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  {activeTab === 'active' ? (
                    <>
                      <button 
                        onClick={() => openDepositModal(goal.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        โอนเงินเข้า
                      </button>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                        แก้ไข
                      </button>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                        ดูรายละเอียด
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        ตั้งเป้าหมายใหม่
                      </button>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                        ดูสรุป
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Savings Tips */}
        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 dark:text-green-400 text-xl">💡</span>
            <div>
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                เคล็ดลับการออมเงิน
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• ตั้งการโอนอัตโนมัติจากบัญชีเงินเดือนไปเป้าหมายการออม</li>
                <li>• แบ่งเป้าหมายใหญ่เป็นเป้าหมายเล็กๆ ที่ทำได้</li>
                <li>• ใช้กฎ "จ่ายตัวเองก่อน" - ออมก่อนใช้จ่าย</li>
                <li>• ตั้งแจ้งเตือนการฝากเงินเป็นประจำ</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateModal(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    ตั้งเป้าหมายการออมใหม่
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ชื่อเป้าหมาย
                      </label>
                      <input
                        type="text"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal(prev => ({...prev, name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="เช่น ซื้อ MacBook ใหม่"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        จำนวนเงินเป้าหมาย
                      </label>
                      <input
                        type="number"
                        value={newGoal.targetAmount}
                        onChange={(e) => setNewGoal(prev => ({...prev, targetAmount: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="65000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        วันที่เป้าหมาย
                      </label>
                      <input
                        type="date"
                        value={newGoal.targetDate}
                        onChange={(e) => setNewGoal(prev => ({...prev, targetDate: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        หมวดหมู่
                      </label>
                      <select
                        value={newGoal.category}
                        onChange={(e) => setNewGoal(prev => ({...prev, category: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        รายละเอียด
                      </label>
                      <textarea
                        value={newGoal.description}
                        onChange={(e) => setNewGoal(prev => ({...prev, description: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                        placeholder="อธิบายเป้าหมายนี้"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleCreateGoal}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gray-900 dark:bg-white text-base font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    ตั้งเป้าหมาย
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setShowDepositModal(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    โอนเงินเข้าเป้าหมาย
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        จำนวนเงิน
                      </label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="5000"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleDeposit}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    โอนเงิน
                  </button>
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    ยกเลิก
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