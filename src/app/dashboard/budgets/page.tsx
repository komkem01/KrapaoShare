'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBudget, Budget as ApiBudget } from '@/contexts/BudgetContext';
import { toast } from 'sonner';

interface Budget {
  id: number;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  month: string;
  description: string;
  transactions?: Transaction[];
  isCompleted?: boolean;
}

interface Transaction {
  date: string;
  amount: number;
  description: string;
}

export default function BudgetsPage() {
  const router = useRouter();
  const {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudget();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedBudgetForExpense, setSelectedBudgetForExpense] = useState<Budget | null>(null);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    description: ''
  });

  // Load budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Transform API data to UI format
  const transformBudgetsToUI = (apiBudgets: ApiBudget[]): Budget[] => {
    return apiBudgets.map(budget => ({
      id: parseInt(budget.id),
      category: budget.name || 'ไม่มีหมวดหมู่',
      budgetAmount: budget.amount,
      spentAmount: 0, // TODO: Add spent amount tracking
      month: budget.period_start.substring(0, 7), // Extract YYYY-MM
      description: budget.description || '',
      transactions: [], // TODO: Add transaction integration if needed
      isCompleted: budget.status === 'completed',
    }));
  };

  const uiBudgets = transformBudgetsToUI(budgets);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentBudgets = uiBudgets.filter(budget => budget.month === currentMonth && !budget.isCompleted);
  const historyBudgets = uiBudgets.filter(budget => budget.month !== currentMonth || budget.isCompleted);
  
  const filteredBudgets = activeTab === 'current' ? currentBudgets : historyBudgets;

  const handleCreateBudget = async () => {
    if (!newBudget.category || !newBudget.amount) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const startDate = newBudget.month + '-01';
      const endDate = new Date(parseInt(newBudget.month.split('-')[0]), parseInt(newBudget.month.split('-')[1]), 0).toISOString().split('T')[0];

      await createBudget({
        name: newBudget.category,
        amount: parseFloat(newBudget.amount),
        period_start: startDate,
        period_end: endDate,
        description: newBudget.description,
        user_id: '', // Will be set by context
      });

      await fetchBudgets();
      setShowCreateModal(false);
      setNewBudget({
        category: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
        description: ''
      });
      toast.info('ตั้งงบประมาณใหม่เรียบร้อยแล้ว! 🎯');
    } catch (err) {
      toast.info('ไม่สามารถสร้างงบประมาณได้: ' + (err as Error).message);
    }
  };

  const handleAddExpense = (budget: Budget) => {
    setSelectedBudgetForExpense(budget);
    setShowExpenseModal(true);
  };

  const confirmAddExpense = () => {
    // TODO: Implement expense tracking with transaction API
    if (!selectedBudgetForExpense || !newExpense.amount || !newExpense.description) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // For now, just close the modal since we need transaction integration
    setShowExpenseModal(false);
    setSelectedBudgetForExpense(null);
    setNewExpense({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    toast.info('การบันทึกรายจ่ายจะเชื่อมต่อกับ Transaction API ในอนาคต');
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowEditModal(true);
  };

  const confirmEditBudget = async () => {
    if (!editingBudget) return;

    try {
      const startDate = editingBudget.month + '-01';
      const endDate = new Date(parseInt(editingBudget.month.split('-')[0]), parseInt(editingBudget.month.split('-')[1]), 0).toISOString().split('T')[0];

      await updateBudget(editingBudget.id.toString(), {
        name: editingBudget.category,
        amount: editingBudget.budgetAmount,
        period_start: startDate,
        period_end: endDate,
        description: editingBudget.description,
      });

      await fetchBudgets();
      setShowEditModal(false);
      setEditingBudget(null);
      toast.info('แก้ไขงบประมาณเรียบร้อยแล้ว! ✅');
    } catch (err) {
      toast.info('ไม่สามารถแก้ไขงบประมาณได้: ' + (err as Error).message);
    }
  };

  const handleReuseBudget = async (budget: Budget) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const startDate = currentMonth + '-01';
      const endDate = new Date(parseInt(currentMonth.split('-')[0]), parseInt(currentMonth.split('-')[1]), 0).toISOString().split('T')[0];

      await createBudget({
        name: budget.category,
        amount: budget.budgetAmount,
        period_start: startDate,
        period_end: endDate,
        description: budget.description,
        user_id: '', // Will be set by context
      });

      await fetchBudgets();
      toast.info('ใช้งบประมาณนี้อีกครั้งเรียบร้อยแล้ว! 🔄');
    } catch (err) {
      toast.info('ไม่สามารถสร้างงบประมาณซ้ำได้: ' + (err as Error).message);
    }
  };

  const handleViewDetails = (budgetId: number) => {
    router.push(`/dashboard/budgets/${budgetId}`);
  };

  const handleViewSummary = (budget: Budget) => {
    const overBudget = budget.spentAmount > budget.budgetAmount;
    const percentage = Math.round((budget.spentAmount / budget.budgetAmount) * 100);
    
    toast.info(`📊 สรุปงบประมาณ ${budget.category}
    
🎯 งบที่ตั้งไว้: ฿${budget.budgetAmount.toLocaleString()}
💰 ใช้จ่ายจริง: ฿${budget.spentAmount.toLocaleString()}
📈 เปอร์เซ็นต์: ${percentage}%
${overBudget ? '⚠️ เกินงบประมาณ!' : '✅ อยู่ในงบประมาณ'}
📅 เดือน: ${new Date(budget.month + '-01').toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}`);
  };

  const totalBudget = currentBudgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
  const totalSpent = currentBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
  const remainingBudget = totalBudget - totalSpent;

  const categories = ['อาหาร', 'ค่าเดินทาง', 'เสื้อผ้า', 'ความบันเทิง', 'สุขภาพ', 'การศึกษา', 'ของใช้ในบ้าน', 'อื่นๆ'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              จัดการงบประมาณ
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ตั้งงบประมาณและติดตามการใช้จ่ายรายเดือน
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            + ตั้งงบประมาณใหม่
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
                  งบรวม
                </p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  ฿{totalBudget.toLocaleString()}
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
                  ใช้ไปแล้ว
                </p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  ฿{totalSpent.toLocaleString()}
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
                  เหลือ
                </p>
                <p className={`text-2xl font-semibold ${
                  remainingBudget >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  ฿{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ใช้ไป
                </p>
                <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  {Math.round((totalSpent / totalBudget) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              งบประมาณปัจจุบัน ({currentBudgets.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              ประวัติ ({historyBudgets.length})
            </button>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">กำลังโหลดงบประมาณ...</p>
          </div>
        ) : (
          <>
            {/* Budgets List */}
            <div className="grid gap-6">
              {filteredBudgets.length > 0 ? (
                filteredBudgets.map((budget) => {
            const percentageUsed = (budget.spentAmount / budget.budgetAmount) * 100;
            const isOverBudget = budget.spentAmount > budget.budgetAmount;
            const isNearLimit = percentageUsed > 80 && !isOverBudget;
            
            return (
              <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {budget.category}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {budget.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>เดือน: {new Date(budget.month + '-01').toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</span>
                      {isOverBudget && (
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-medium">
                          เกินงบ!
                        </span>
                      )}
                      {isNearLimit && (
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
                          ใกล้เกินงบ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      ฿{budget.budgetAmount.toLocaleString()}
                    </p>
                    <p className={`text-sm ${
                      isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      ใช้ไป ฿{budget.spentAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">ความคืบหน้า</span>
                    <span className={`text-sm font-medium ${
                      isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {Math.round(percentageUsed)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isOverBudget 
                          ? 'bg-red-500' 
                          : isNearLimit 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`}
                      style={{width: `${Math.min(percentageUsed, 100)}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>฿0</span>
                    <span>เหลือ ฿{(budget.budgetAmount - budget.spentAmount).toLocaleString()}</span>
                    <span>฿{budget.budgetAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Recent Transactions (for current budgets only) */}
                {activeTab === 'current' && budget.transactions && budget.transactions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      รายการล่าสุด ({budget.transactions.length})
                    </h4>
                    <div className="space-y-2">
                      {budget.transactions.slice(0, 3).map((transaction, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(transaction.date).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            -฿{transaction.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {budget.transactions.length > 3 && (
                        <button 
                          onClick={() => handleViewDetails(budget.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          ดูทั้งหมด ({budget.transactions.length} รายการ)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  {activeTab === 'current' ? (
                    <>
                      <button 
                        onClick={() => handleAddExpense(budget)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        บันทึกรายจ่าย
                      </button>
                      <button 
                        onClick={() => handleEditBudget(budget)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        แก้ไขงบ
                      </button>
                      <button 
                        onClick={() => handleViewDetails(budget.id)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        ดูรายละเอียด
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleReuseBudget(budget)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ใช้งบนี้อีกครั้ง
                      </button>
                      <button 
                        onClick={() => handleViewSummary(budget)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        ดูสรุป
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {activeTab === 'current' ? 'ยังไม่มีงบประมาณในเดือนนี้' : 'ยังไม่มีประวัติงบประมาณ'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Budget Tips */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 dark:text-blue-400 text-xl">💡</span>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                เคล็ดลับการจัดงบประมาณ
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• ใช้กฎ 50/30/20: 50% ค่าใช้จ่ายจำเป็น, 30% ความต้องการ, 20% เงินออม</li>
                <li>• ตั้งแจ้งเตือนเมื่อใช้งบไปแล้ว 80%</li>
                <li>• ทบทวนและปรับงบประมาณทุกเดือน</li>
                <li>• เก็บเงินที่เหลือจากงบประมาณไว้เป็นเงินออม</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add Expense Modal */}
        {showExpenseModal && selectedBudgetForExpense && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowExpenseModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      บันทึกรายจ่าย - {selectedBudgetForExpense.category}
                    </h3>
                    <button
                      onClick={() => setShowExpenseModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-300">งบประมาณคงเหลือ:</span>
                        <span className={`font-semibold ${
                          (selectedBudgetForExpense.budgetAmount - selectedBudgetForExpense.spentAmount) > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          ฿{(selectedBudgetForExpense.budgetAmount - selectedBudgetForExpense.spentAmount).toLocaleString()}
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
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense(prev => ({...prev, amount: e.target.value}))}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="350.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        รายละเอียด *
                      </label>
                      <textarea
                        value={newExpense.description}
                        onChange={(e) => setNewExpense(prev => ({...prev, description: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                        placeholder="ข้าวผัดกะเพรา + น้ำ"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        วันที่
                      </label>
                      <input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense(prev => ({...prev, date: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={confirmAddExpense}
                    disabled={!newExpense.amount || !newExpense.description}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm transition-all"
                  >
                    💸 บันทึกรายจ่าย
                  </button>
                  <button
                    onClick={() => setShowExpenseModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Budget Modal */}
        {showEditModal && editingBudget && (
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
                      แก้ไขงบประมาณ
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
                        หมวดหมู่
                      </label>
                      <select
                        value={editingBudget.category}
                        onChange={(e) => setEditingBudget(prev => prev ? ({...prev, category: e.target.value}) : null)}
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
                        จำนวนเงินงบประมาณ
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">฿</span>
                        <input
                          type="number"
                          value={editingBudget.budgetAmount}
                          onChange={(e) => setEditingBudget(prev => prev ? ({...prev, budgetAmount: parseFloat(e.target.value) || 0}) : null)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        เดือน
                      </label>
                      <input
                        type="month"
                        value={editingBudget.month}
                        onChange={(e) => setEditingBudget(prev => prev ? ({...prev, month: e.target.value}) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        รายละเอียด
                      </label>
                      <textarea
                        value={editingBudget.description}
                        onChange={(e) => setEditingBudget(prev => prev ? ({...prev, description: e.target.value}) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={confirmEditBudget}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:w-auto sm:text-sm transition-all"
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

        {/* Create Budget Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowCreateModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      ตั้งงบประมาณใหม่
                    </h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        หมวดหมู่
                      </label>
                      <select
                        value={newBudget.category}
                        onChange={(e) => setNewBudget(prev => ({...prev, category: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">เลือกหมวดหมู่</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        จำนวนเงินงบประมาณ
                      </label>
                      <input
                        type="number"
                        value={newBudget.amount}
                        onChange={(e) => setNewBudget(prev => ({...prev, amount: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="6000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        เดือน
                      </label>
                      <input
                        type="month"
                        value={newBudget.month}
                        onChange={(e) => setNewBudget(prev => ({...prev, month: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        รายละเอียด
                      </label>
                      <textarea
                        value={newBudget.description}
                        onChange={(e) => setNewBudget(prev => ({...prev, description: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                        placeholder="อธิบายงบประมาณนี้"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleCreateBudget}
                    disabled={!newBudget.category || !newBudget.amount}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gray-900 dark:bg-white text-base font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm transition-all"
                  >
                    🎯 ตั้งงบประมาณ
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
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