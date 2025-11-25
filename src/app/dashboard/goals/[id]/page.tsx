'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from '@/utils/toast';
import { useGoal } from '@/contexts/GoalContext';
import { useUser } from '@/contexts/UserContext';
import { useAccounts } from '@/contexts/AccountContext';
import type { Goal } from '@/contexts/GoalContext';
import { goalDepositApi } from '@/utils/apiClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface GoalDeposit {
  id: string;
  goalId: string;
  userId: string;
  transactionId: string;
  fromAccountId: string;
  amount: number;
  depositDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function GoalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useUser();
  const { goals, updateGoal, getGoalById, fetchGoals, deleteGoal } = useGoal();
  const { accounts } = useAccounts();
  
  // States
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [deposits, setDeposits] = useState<GoalDeposit[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    goalType: 'savings' as 'savings' | 'purchase' | 'debt_payoff'
  });

  // Load goal data and deposits
  useEffect(() => {
    async function loadGoalData() {
      try {
        const resolvedParams = await params;
        const goalId = resolvedParams.id;
        const foundGoal = getGoalById(goalId);
        
        if (foundGoal) {
          setGoal(foundGoal);
          setEditForm({
            name: foundGoal.name,
            targetAmount: foundGoal.targetAmount.toString(),
            targetDate: foundGoal.targetDate || '',
            description: foundGoal.description || '',
            priority: foundGoal.priority,
            goalType: foundGoal.goalType
          });

          // Load deposits for this goal
          await loadDeposits(goalId);
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

    if (goals.length > 0) {
      loadGoalData();
    }
  }, [params, router, goals, getGoalById]);

  // Load accounts on mount
  useEffect(() => {
    if (user?.id && accounts.length === 0) {
      // Accounts will be loaded by AccountContext automatically
    }
  }, [user?.id, accounts.length]);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id.toString());
    }
  }, [accounts, selectedAccountId]);

  // Load deposits function
  const loadDeposits = async (goalId: string) => {
    if (!user?.id) return;
    
    setDepositsLoading(true);
    try {
      const response = await goalDepositApi.list({
        goal_id: goalId,
        user_id: user.id
      }) as { items?: GoalDeposit[] };
      
      if (response.items) {
        setDeposits(response.items);
      }
    } catch (error) {
      console.error('Error loading deposits:', error);
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายการฝากเงินได้');
    } finally {
      setDepositsLoading(false);
    }
  };

  // Add deposit
  const handleAddDeposit = async () => {
    if (!goal || !depositAmount || !selectedAccountId || !user?.id) {
      toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกบัญชีและกรอกจำนวนเงิน');
      return;
    }

    const amount = parseFloat(depositAmount);
    
    // Validate amount
    if (amount <= 0) {
      toast.warning('จำนวนเงินไม่ถูกต้อง', 'กรุณากรอกจำนวนเงินที่มากกว่า 0');
      return;
    }

    // Check account balance
    const selectedAccount = accounts.find((acc: any) => acc.id.toString() === selectedAccountId);
    if (selectedAccount && selectedAccount.current_balance < amount) {
      toast.error('ยอดเงินไม่เพียงพอ', `บัญชีมียอดคงเหลือ ฿${selectedAccount.current_balance.toLocaleString()}`);
      return;
    }

    try {
      // Create deposit via API
      await goalDepositApi.create({
        goalId: goal.id,
        userId: user.id,
        fromAccountId: selectedAccountId,
        amount: amount,
        notes: depositNote || undefined
      });

      // Refresh data
      await Promise.all([
        fetchGoals(),
        loadDeposits(goal.id)
      ]);

      // Update local goal state
      const updatedGoal = getGoalById(goal.id);
      if (updatedGoal) {
        setGoal(updatedGoal);
        
        // Check if goal is completed
        if (updatedGoal.isCompleted && !goal.isCompleted) {
          setTimeout(() => toast.success('🎉 ยินดีด้วย!', 'คุณบรรลุเป้าหมายแล้ว!'), 500);
        }
      }
      
      setShowDepositModal(false);
      setDepositAmount('');
      setDepositNote('');
      toast.success('โอนเงินสำเร็จ! 💰', `โอนเงิน ฿${amount.toLocaleString()} เข้าเป้าหมายเรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error adding deposit:', error);
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโอนเงินได้');
    }
  };

  // Edit goal
  const handleUpdateGoal = async () => {
    if (!goal || !editForm.name || !editForm.targetAmount || !editForm.targetDate) {
      toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await updateGoal(goal.id, {
        name: editForm.name,
        targetAmount: parseFloat(editForm.targetAmount),
        targetDate: editForm.targetDate,
        description: editForm.description || undefined,
        priority: editForm.priority,
        goalType: editForm.goalType
      });

      setGoal({
        ...goal,
        name: editForm.name,
        targetAmount: parseFloat(editForm.targetAmount),
        targetDate: editForm.targetDate,
        description: editForm.description,
        priority: editForm.priority,
        goalType: editForm.goalType
      });

      setShowEditModal(false);
      toast.success('แก้ไขเป้าหมายสำเร็จ! ✅', `แก้ไขเป้าหมาย "${editForm.name}" เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขเป้าหมายได้');
    }
  };

  // Delete goal - Show confirmation modal
  const handleDeleteGoal = () => {
    if (!goal) return;
    setShowDeleteModal(true);
  };

  // Confirm delete goal
  const confirmDeleteGoal = async () => {
    if (!goal) return;

    try {
      setShowDeleteModal(false);
      await deleteGoal(goal.id);
      toast.success('ลบเป้าหมายสำเร็จ! 🗑️', `ลบเป้าหมาย "${goal.name}" และคืนเงิน ฿${goal.currentAmount.toLocaleString()} เรียบร้อยแล้ว`);
      
      // Redirect to goals page after short delay
      setTimeout(() => {
        router.push('/dashboard/goals');
      }, 1500);
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถลบเป้าหมายได้');
    }
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
  const daysLeft = goal.targetDate ? Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isCompleted = goal.isCompleted || progressPercentage >= 100;
  const isNearDeadline = daysLeft <= 30 && daysLeft > 0;
  const isOverdue = daysLeft < 0 && !isCompleted;
  
  // Goal type display mapping
  const goalTypeMap: Record<string, string> = {
    'savings': 'ออมเงิน',
    'purchase': 'ซื้อของ',
    'debt_payoff': 'ชำระหนี้'
  };
  
  // Priority display mapping
  const priorityMap: Record<string, string> = {
    'low': 'ต่ำ',
    'medium': 'ปานกลาง',
    'high': 'สูง',
    'critical': 'สูงมาก'
  };

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
                    {goalTypeMap[goal.goalType] || goal.goalType}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    goal.priority === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                    goal.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                    goal.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                    'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}>
                    {priorityMap[goal.priority] || goal.priority}
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
                  <span>สร้างเมื่อ {new Date(goal.createdAt).toLocaleDateString('th-TH')}</span>
                  {goal.targetDate && (
                    <>
                      <span>•</span>
                      <span>เป้าหมาย {new Date(goal.targetDate).toLocaleDateString('th-TH')}</span>
                    </>
                  )}
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">ความสำคัญ:</span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{priorityMap[goal.priority]}</p>
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
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">ความคืบหน้า</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{Math.round(progressPercentage)}%</p>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <button 
              onClick={handleDeleteGoal}
              className="group relative bg-white dark:bg-gray-700 border-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 py-4 px-5 rounded-xl hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🗑️</div>
              <div className="text-sm">ลบเป้าหมาย</div>
            </button>
          </div>
        </div>

        {/* Deposit History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📜</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ประวัติการฝากเงิน
              </h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ทั้งหมด {deposits.length} รายการ
            </span>
          </div>

          {depositsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">กำลังโหลดรายการ...</p>
              </div>
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💰</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">ยังไม่มีรายการฝากเงิน</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">เริ่มฝากเงินเพื่อบรรลุเป้าหมายของคุณ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((deposit) => {
                const account = accounts.find((acc: any) => acc.id.toString() === deposit.fromAccountId);
                return (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">💵</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ฝากเงิน ฿{deposit.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          จาก {account?.name || 'บัญชีที่ถูกลบ'}
                          {deposit.notes && ` • ${deposit.notes}`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(deposit.depositDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        สำเร็จ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                        เลือกบัญชี *
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">เลือกบัญชี</option>
                        {accounts.map((account: any) => (
                          <option key={account.id} value={account.id.toString()}>
                            {account.name} - ฿{account.current_balance.toLocaleString()}
                          </option>
                        ))}
                      </select>
                      {accounts.length === 0 && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          ⚠️ ไม่มีบัญชี กรุณาสร้างบัญชีก่อน
                        </p>
                      )}
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
                    disabled={!depositAmount || !selectedAccountId || accounts.length === 0}
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
                        ประเภทเป้าหมาย
                      </label>
                      <select
                        value={editForm.goalType}
                        onChange={(e) => setEditForm(prev => ({...prev, goalType: e.target.value as 'savings' | 'purchase' | 'debt_payoff'}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="savings">ออมเงิน</option>
                        <option value="purchase">ซื้อของ</option>
                        <option value="debt_payoff">ชำระหนี้</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ความสำคัญ
                      </label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm(prev => ({...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical'}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="low">ต่ำ</option>
                        <option value="medium">ปานกลาง</option>
                        <option value="high">สูง</option>
                        <option value="critical">สูงมาก</option>
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && goal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDeleteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              {/* Center modal vertically */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal */}
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🗑️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ยืนยันการลบเป้าหมาย
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    {/* Warning message */}
                    <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          คุณกำลังจะลบเป้าหมายนี้
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          การกระทำนี้ไม่สามารถยกเลิกได้
                        </p>
                      </div>
                    </div>

                    {/* Goal details */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">เป้าหมาย:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{goal.name}</span>
                      </div>
                      
                      {goal.currentAmount > 0 && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            <div className="flex-shrink-0">
                              <span className="text-2xl">💰</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                ระบบจะคืนเงินอัตโนมัติ
                              </p>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                จำนวน <span className="font-bold text-lg">฿{goal.currentAmount.toLocaleString()}</span>
                              </p>
                              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                เงินจะถูกโอนกลับไปยังบัญชีที่ฝากเข้ามา
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirmation text */}
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        กรุณายืนยันว่าคุณต้องการลบเป้าหมายนี้
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full sm:w-auto inline-flex justify-center items-center space-x-2 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-medium shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>ยกเลิก</span>
                  </button>
                  <button
                    onClick={confirmDeleteGoal}
                    className="w-full sm:w-auto inline-flex justify-center items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>ลบเป้าหมาย</span>
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
