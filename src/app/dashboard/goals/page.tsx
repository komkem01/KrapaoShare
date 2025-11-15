'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Types
interface Deposit {
  date: string;
  amount: number;
  note: string;
}

interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  description: string;
  category: string;
  createdDate: string;
  deposits: Deposit[];
  completedDate?: string;
}

export default function GoalsPage() {
  const router = useRouter();
  
  // States
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    category: 'ทั่วไป'
  });

  const [goals, setGoals] = useState<Goal[]>([]);

  // Mock data - ในอนาคตจะเชื่อมกับ API
  const mockActiveGoals: Goal[] = [
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

  const mockCompletedGoals: Goal[] = [
    {
      id: 4,
      name: 'iPhone 15 Pro',
      currentAmount: 42000,
      targetAmount: 42000,
      targetDate: '2025-10-15',
      completedDate: '2025-10-10',
      description: 'อัพเกรดโทรศัพท์ใหม่',
      category: 'เทคโนโลยี',
      createdDate: '2025-06-01',
      deposits: [
        { date: '2025-06-01', amount: 20000, note: 'เงินเดือน' },
        { date: '2025-07-01', amount: 22000, note: 'เงินเดือน + โบนัส' }
      ]
    }
  ];

  // Initialize goals
  useEffect(() => {
    setGoals([...mockActiveGoals, ...mockCompletedGoals]);
  }, []);

  // Calculate stats from current goals
  const activeGoals = goals.filter(goal => !goal.completedDate);
  const completedGoals = goals.filter(goal => goal.completedDate);
  
  const filteredGoals = activeTab === 'active' ? activeGoals : completedGoals;

  const handleCreateGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const goal: Goal = {
      id: Math.max(...goals.map(g => g.id), 0) + 1,
      name: newGoal.name,
      currentAmount: 0,
      targetAmount: parseFloat(newGoal.targetAmount),
      targetDate: newGoal.targetDate,
      description: newGoal.description,
      category: newGoal.category,
      createdDate: new Date().toISOString().split('T')[0],
      deposits: []
    };

    setGoals(prev => [...prev, goal]);
    setShowCreateModal(false);
    setNewGoal({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
      category: 'ทั่วไป'
    });
    alert('สร้างเป้าหมายใหม่สำเร็จ! 🎯');
  };

  const handleDeposit = () => {
    if (!selectedGoal || !depositAmount) {
      alert('กรุณากรอกจำนวนเงิน');
      return;
    }

    const amount = parseFloat(depositAmount);
    const deposit: Deposit = {
      date: new Date().toISOString().split('T')[0],
      amount,
      note: depositNote || 'โอนเงินเข้าเป้าหมาย'
    };

    setGoals(prev => prev.map(goal => {
      if (goal.id === selectedGoal.id) {
        const newCurrentAmount = goal.currentAmount + amount;
        const updatedGoal = {
          ...goal,
          currentAmount: newCurrentAmount,
          deposits: [deposit, ...goal.deposits]
        };
        
        // Check if goal is completed
        if (newCurrentAmount >= goal.targetAmount && !goal.completedDate) {
          updatedGoal.completedDate = new Date().toISOString().split('T')[0];
          setTimeout(() => alert('🎉 ยินดีด้วย! คุณบรรลุเป้าหมายแล้ว!'), 500);
        }
        
        return updatedGoal;
      }
      return goal;
    }));

    setShowDepositModal(false);
    setDepositAmount('');
    setDepositNote('');
    setSelectedGoal(null);
    alert('โอนเงินเข้าเป้าหมายสำเร็จ! 💰');
  };

  const openDepositModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDepositModal(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate,
      description: goal.description,
      category: goal.category
    });
    setShowEditModal(true);
  };

  const handleUpdateGoal = () => {
    if (!selectedGoal || !newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setGoals(prev => prev.map(goal => {
      if (goal.id === selectedGoal.id) {
        return {
          ...goal,
          name: newGoal.name,
          targetAmount: parseFloat(newGoal.targetAmount),
          targetDate: newGoal.targetDate,
          description: newGoal.description,
          category: newGoal.category
        };
      }
      return goal;
    }));

    setShowEditModal(false);
    setSelectedGoal(null);
    setNewGoal({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
      category: 'ทั่วไป'
    });
    alert('แก้ไขเป้าหมายสำเร็จ! ✅');
  };

  const handleViewDetails = (goalId: number) => {
    router.push(`/dashboard/goals/${goalId}`);
  };

  const handleCreateNewGoalFromCompleted = (completedGoal: Goal) => {
    setNewGoal({
      name: `${completedGoal.name} (รอบใหม่)`,
      targetAmount: completedGoal.targetAmount.toString(),
      targetDate: '',
      description: completedGoal.description,
      category: completedGoal.category
    });
    setShowCreateModal(true);
  };

  const categories = ['ทั่วไป', 'เทคโนโลยี', 'ท่องเที่ยว', 'การเงิน', 'สุขภาพ', 'การศึกษา', 'บ้านและที่อยู่', 'รถยนต์'];

  const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

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
                  {activeGoals.length}
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
              กำลังดำเนินการ ({activeGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              สำเร็จแล้ว ({completedGoals.length})
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
                            สำเร็จ: {goal.completedDate ? new Date(goal.completedDate).toLocaleDateString('th-TH') : ''}
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
                        onClick={() => openDepositModal(goal)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        โอนเงินเข้า
                      </button>
                      <button 
                        onClick={() => handleEditGoal(goal)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        แก้ไข
                      </button>
                      <button 
                        onClick={() => handleViewDetails(goal.id)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        ดูรายละเอียด
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleCreateNewGoalFromCompleted(goal)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        ตั้งเป้าหมายใหม่
                      </button>
                      <button 
                        onClick={() => handleViewDetails(goal.id)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
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
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowCreateModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🎯</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ตั้งเป้าหมายการออมใหม่
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>ชื่อเป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newGoal.name}
                          onChange={(e) => setNewGoal(prev => ({...prev, name: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="เช่น ซื้อ MacBook ใหม่"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>จำนวนเงินเป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base font-medium">฿</span>
                        <input
                          type="number"
                          value={newGoal.targetAmount}
                          onChange={(e) => setNewGoal(prev => ({...prev, targetAmount: e.target.value}))}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="65,000"
                          min="0"
                          step="1000"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>วันที่เป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={newGoal.targetDate}
                          onChange={(e) => setNewGoal(prev => ({...prev, targetDate: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>หมวดหมู่</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.category}
                          onChange={(e) => setNewGoal(prev => ({...prev, category: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none cursor-pointer"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        <span>รายละเอียด</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={newGoal.description}
                          onChange={(e) => setNewGoal(prev => ({...prev, description: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400 resize-none"
                          rows={4}
                          placeholder="อธิบายเป้าหมายนี้..."
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="group relative overflow-hidden px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 font-semibold"
                  >
                    <div className="absolute inset-0 bg-gray-100 dark:bg-gray-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    <span className="relative flex items-center justify-center space-x-2">
                      <span>❌</span>
                      <span>ยกเลิก</span>
                    </span>
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    disabled={!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate}
                    className="group relative overflow-hidden px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center space-x-2">
                      <span>🎯</span>
                      <span>ตั้งเป้าหมาย</span>
                    </span>
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
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDepositModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">💰</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ฝากเงินเข้าเป้าหมาย
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowDepositModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  {selectedGoal && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-700">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">🎯</span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-200">
                            {selectedGoal.name}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            เหลืออีก ฿{(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>จำนวนเงิน *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">฿</span>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-lg placeholder-gray-400 font-semibold"
                          placeholder="5,000"
                          min="0"
                          step="100"
                          autoFocus
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setDepositAmount('1000')}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositAmount('5000')}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿5,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositAmount('10000')}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿10,000
                        </button>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>หมายเหตุ</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={depositNote}
                          onChange={(e) => setDepositNote(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="เช่น เงินเดือนเดือนนี้"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowDepositModal(false);
                        setDepositAmount('');
                        setDepositNote('');
                        setSelectedGoal(null);
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>💰</span>
                        <span>ฝากเงิน</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Goal Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowEditModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">✏️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        แก้ไขเป้าหมายการออม
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>ชื่อเป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newGoal.name}
                          onChange={(e) => setNewGoal(prev => ({...prev, name: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="เช่น ซื้อ MacBook ใหม่"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>จำนวนเงินเป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">฿</span>
                        <input
                          type="number"
                          value={newGoal.targetAmount}
                          onChange={(e) => setNewGoal(prev => ({...prev, targetAmount: e.target.value}))}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="65,000"
                          min="0"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>วันที่เป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={newGoal.targetDate}
                          onChange={(e) => setNewGoal(prev => ({...prev, targetDate: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>หมวดหมู่</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.category}
                          onChange={(e) => setNewGoal(prev => ({...prev, category: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none bg-white"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        <span>รายละเอียด</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={newGoal.description}
                          onChange={(e) => setNewGoal(prev => ({...prev, description: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400 resize-none"
                          rows={4}
                          placeholder="อธิบายเป้าหมายนี้เพิ่มเติม..."
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedGoal(null);
                        setNewGoal({
                          name: '',
                          targetAmount: '',
                          targetDate: '',
                          description: '',
                          category: 'ทั่วไป'
                        });
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleUpdateGoal}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>✏️</span>
                        <span>บันทึกการแก้ไข</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}