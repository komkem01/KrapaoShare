'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from '@/utils/toast';

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

// Mock data
const mockGoals: Goal[] = [
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
  },
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GoalDetailPage({ params }: PageProps) {
  const router = useRouter();
  
  // States
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [editForm, setEditForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    category: 'ทั่วไป'
  });

  // Load goal data
  useEffect(() => {
    async function loadGoalData() {
      try {
        const resolvedParams = await params;
        const goalId = parseInt(resolvedParams.id);
        const foundGoal = mockGoals.find(g => g.id === goalId);
        
        if (foundGoal) {
          setGoal(foundGoal);
          setEditForm({
            name: foundGoal.name,
            targetAmount: foundGoal.targetAmount.toString(),
            targetDate: foundGoal.targetDate,
            description: foundGoal.description,
            category: foundGoal.category
          });
        } else {
          router.push('/dashboard/goals');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading goal data:', error);
        router.push('/dashboard/goals');
      }
    }

    loadGoalData();
  }, [params, router]);

  // Add deposit
  const handleAddDeposit = () => {
    if (!goal || !depositAmount) {
      toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกจำนวนเงิน');
      return;
    }

    const amount = parseFloat(depositAmount);
    const deposit: Deposit = {
      date: new Date().toISOString().split('T')[0],
      amount,
      note: depositNote || 'โอนเงินเข้าเป้าหมาย'
    };

    const newCurrentAmount = goal.currentAmount + amount;
    const updatedGoal = {
      ...goal,
      currentAmount: newCurrentAmount,
      deposits: [deposit, ...goal.deposits]
    };

    // Check if goal is completed
    if (newCurrentAmount >= goal.targetAmount && !goal.completedDate) {
      updatedGoal.completedDate = new Date().toISOString().split('T')[0];
      setTimeout(() => toast.success('🎉 ยินดีด้วย!', 'คุณบรรลุเป้าหมายแล้ว!'), 500);
    }

    setGoal(updatedGoal);
    setShowDepositModal(false);
    setDepositAmount('');
    setDepositNote('');
    toast.success('โอนเงินสำเร็จ! 💰', `โอนเงิน ฿${amount.toLocaleString()} เข้าเป้าหมายเรียบร้อยแล้ว`);
  };

  // Edit goal
  const handleUpdateGoal = () => {
    if (!goal || !editForm.name || !editForm.targetAmount || !editForm.targetDate) {
      toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const updatedGoal = {
      ...goal,
      name: editForm.name,
      targetAmount: parseFloat(editForm.targetAmount),
      targetDate: editForm.targetDate,
      description: editForm.description,
      category: editForm.category
    };

    setGoal(updatedGoal);
    setShowEditModal(false);
    toast.success('แก้ไขเป้าหมายสำเร็จ! ✅', `แก้ไขเป้าหมาย "${editForm.name}" เรียบร้อยแล้ว`);
  };

  // Delete deposit
  const handleDeleteDeposit = (depositIndex: number) => {
    if (!goal) return;
    
    const depositToDelete = goal.deposits[depositIndex];
    if (!depositToDelete) return;

    if (confirm(`ต้องการลบรายการฝาก "${depositToDelete.note}" หรือไม่?`)) {
      const updatedGoal = {
        ...goal,
        currentAmount: goal.currentAmount - depositToDelete.amount,
        deposits: goal.deposits.filter((_, index) => index !== depositIndex),
        completedDate: undefined // Remove completion if deleting brings amount below target
      };

      setGoal(updatedGoal);
      toast.info('ลบรายการฝากเรียบร้อยแล้ว! 🗑️');
    }
  };

  // Get sorted deposits
  const getSortedDeposits = () => {
    if (!goal) return [];
    
    return [...goal.deposits].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin mx-auto mb-6">
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                กำลังโหลดข้อมูลเป้าหมาย...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                โปรดรอสักครู่ ✨
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!goal) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              ไม่พบเป้าหมายที่ต้องการ
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              เป้าหมายนี้อาจถูกลบแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง
            </p>
            <button
              onClick={() => router.push('/dashboard/goals')}
              className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>←</span>
                <span>กลับไปหน้าเป้าหมาย</span>
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate statistics
  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isCompleted = progressPercentage >= 100;
  const isNearDeadline = daysLeft <= 30 && daysLeft > 0;
  const isOverdue = daysLeft < 0 && !isCompleted;
  const sortedDeposits = getSortedDeposits();
  const averageDeposit = goal.deposits.length > 0 ? goal.currentAmount / goal.deposits.length : 0;
  const categories = ['ทั่วไป', 'เทคโนโลยี', 'ท่องเที่ยว', 'การเงิน', 'สุขภาพ', 'การศึกษา', 'บ้านและที่อยู่', 'รถยนต์'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-100 dark:from-green-900 opacity-20 rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100 dark:from-blue-900 opacity-15 rounded-full transform -translate-x-24 translate-y-24"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/dashboard/goals')}
                className="group flex items-center space-x-3 px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
                <span className="font-medium">กลับ</span>
              </button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {goal.name}
                  </h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {goal.category}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    isCompleted
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : isOverdue
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : isNearDeadline
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {isCompleted ? '✅ สำเร็จ' : isOverdue ? '⚠️ เลยกำหนด' : isNearDeadline ? '⏰ ใกล้ครบ' : '🎯 กำลังดำเนินการ'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 ml-1 flex items-center space-x-2">
                  <span>{goal.description}</span>
                  <span>•</span>
                  <span>สร้างเมื่อ {new Date(goal.createdDate).toLocaleDateString('th-TH')}</span>
                  <span>•</span>
                  <span>เป้าหมาย {new Date(goal.targetDate).toLocaleDateString('th-TH')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ข้อมูลเป้าหมาย
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">เป้าหมาย:</span>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">฿{goal.targetAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">ออมไปแล้ว:</span>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">฿{goal.currentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">เหลืออีก:</span>
                  <p className={`text-lg font-semibold ${
                    remainingAmount <= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    ฿{Math.max(remainingAmount, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">เฉลี่ยต่อครั้ง:</span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">฿{averageDeposit.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ความคืบหน้า
                </h2>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">ความคืบหน้า</span>
                    <span className={`text-sm font-bold ${
                      isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : progressPercentage > 75 
                            ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                            : progressPercentage > 50
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-r from-gray-400 to-gray-600'
                      }`}
                      style={{width: `${Math.min(progressPercentage, 100)}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>฿0</span>
                    <span>฿{goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-xl">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">รายการฝาก</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{goal.deposits.length}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-xl">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">เหลือวัน</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {daysLeft > 0 ? daysLeft : isCompleted ? '✅' : '⚠️'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">⚡</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              การดำเนินการ
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {!isCompleted && (
              <button 
                onClick={() => setShowDepositModal(true)}
                className="group relative bg-gradient-to-br from-green-500 to-emerald-600 text-white py-4 px-5 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="text-sm">ฝากเงิน</div>
                </div>
              </button>
            )}
            <button 
              onClick={() => setShowEditModal(true)}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">✏️</div>
              <div className="text-sm">แก้ไข</div>
            </button>
            <button 
              onClick={() => router.push('/dashboard/goals')}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm">ดูทั้งหมด</div>
            </button>
            <button 
              onClick={() => window.print()}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🖨️</div>
              <div className="text-sm">พิมพ์</div>
            </button>
          </div>
        </div>

        {/* Deposits History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">💳</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ประวัติการฝาก
              </h2>
              <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold">
                {sortedDeposits.length} รายการ
              </span>
            </div>
            
            {/* Sort controls */}
            <div className="flex items-center space-x-3">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [('date' | 'amount'), ('asc' | 'desc')];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="date-desc">วันที่ (ใหม่ → เก่า)</option>
                <option value="date-asc">วันที่ (เก่า → ใหม่)</option>
                <option value="amount-desc">จำนวน (มาก → น้อย)</option>
                <option value="amount-asc">จำนวน (น้อย → มาก)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {sortedDeposits.length > 0 ? (
              sortedDeposits.map((deposit, index) => (
                <div key={index} className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] hover:-translate-y-1">
                  {/* Gradient background overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 via-transparent to-emerald-50/50 dark:from-green-900/10 dark:via-transparent dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Icon with animation */}
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                            <span className="text-white text-xl">💰</span>
                          </div>
                          {/* Pulse effect */}
                          <div className="absolute inset-0 w-14 h-14 bg-green-400 rounded-2xl opacity-0 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-4">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300 line-clamp-2">
                                {deposit.note}
                              </h3>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span>📅</span>
                                  <span className="font-medium">
                                    {new Date(deposit.date).toLocaleDateString('th-TH', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Amount and actions */}
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:text-green-500 transition-colors duration-300">
                              +฿{deposit.amount.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            {deposit.amount > 10000 ? 'ฝากใหญ่' : deposit.amount > 5000 ? 'ฝากกลาง' : 'ฝากเล็ก'}
                          </p>
                        </div>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteDeposit(index)}
                          className="opacity-0 group-hover:opacity-100 p-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
                          title="ลบรายการ"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom shadow effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="relative mx-auto mb-8">
                  {/* Animated background circles */}
                  <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full opacity-50 animate-pulse"></div>
                  <div className="absolute inset-2 w-28 h-28 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full opacity-60 animate-pulse delay-150"></div>
                  
                  {/* Main icon */}
                  <div className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <div className="relative">
                      <span className="text-6xl animate-bounce">💰</span>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✨</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    🎯 เริ่มต้นการฝาก
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    ยังไม่มีประวัติการฝากเงิน เริ่มฝากเงินเพื่อให้บรรลุเป้าหมายของคุณ
                  </p>
                  
                  <div className="pt-4">
                    <button
                      onClick={() => setShowDepositModal(true)}
                      className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <span className="relative z-10 flex items-center space-x-3">
                        <span className="text-xl">💰</span>
                        <span>เริ่มฝากเงิน</span>
                      </span>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDepositModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      ฝากเงินเข้าเป้าหมาย
                    </h3>
                    <button
                      onClick={() => setShowDepositModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700 dark:text-green-300">เหลืออีก:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ฿{remainingAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        จำนวนเงิน *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">฿</span>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="5000"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        หมายเหตุ
                      </label>
                      <input
                        type="text"
                        value={depositNote}
                        onChange={(e) => setDepositNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="เงินเดือนเดือนนี้"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleAddDeposit}
                    disabled={!depositAmount}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm transition-all"
                  >
                    💰 ฝากเงิน
                  </button>
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
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
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      แก้ไขเป้าหมาย
                    </h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ชื่อเป้าหมาย
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        จำนวนเงินเป้าหมาย
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">฿</span>
                        <input
                          type="number"
                          value={editForm.targetAmount}
                          onChange={(e) => setEditForm(prev => ({...prev, targetAmount: e.target.value}))}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        วันที่เป้าหมาย
                      </label>
                      <input
                        type="date"
                        value={editForm.targetDate}
                        onChange={(e) => setEditForm(prev => ({...prev, targetDate: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        หมวดหมู่
                      </label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm(prev => ({...prev, category: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleUpdateGoal}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:w-auto sm:text-sm transition-all"
                  >
                    💾 บันทึกการแก้ไข
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
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
