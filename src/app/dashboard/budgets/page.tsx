'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBudget, Budget as ApiBudget } from '@/contexts/BudgetContext';
import { transactionApi, accountApi } from '@/utils/apiClient';
import { useUser } from '@/contexts/UserContext';
import { useCategories, Category } from '@/contexts/CategoryContext';
import CategorySelector from '@/components/ui/CategorySelector';
import { toast } from 'sonner';

interface Budget {
  id: string;
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
  const { user } = useUser();
  const { categories: categoriesData } = useCategories();
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
  const [uiBudgets, setUiBudgets] = useState<Budget[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: ''
  });
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [newBudget, setNewBudget] = useState({
    name: '', // ชื่องบประมาณ
    category: '',
    categoryId: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    description: ''
  });
  const [editingBudgetCategoryId, setEditingBudgetCategoryId] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Load budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Transform budgets when data changes
  useEffect(() => {
    const loadBudgetsWithSpent = async () => {
      if (budgets.length === 0) {
        setUiBudgets([]);
        setBudgetLoading(false);
        return;
      }
      
      setBudgetLoading(true);
      try {
        const transformedBudgets = await transformBudgetsToUI(budgets);
        setUiBudgets(transformedBudgets);
      } catch (error) {
        console.error('Error transforming budgets:', error);
        setUiBudgets([]);
      } finally {
        setBudgetLoading(false);
      }
    };

    loadBudgetsWithSpent();
  }, [budgets, user?.id]);

  // Transform API data to UI format with spent amount calculation
  const transformBudgetsToUI = async (apiBudgets: ApiBudget[]): Promise<Budget[]> => {
    const budgetsWithSpent = await Promise.all(
      apiBudgets.map(async (budget) => {
        let spentAmount = 0;
        try {
          // ดึง transactions ที่เกี่ยวข้องกับหมวดหมู่นี้ในช่วงเวลาของงบประมาณ
          const transactionResponse = await transactionApi.list({
            user_id: user?.id,
            category_id: budget.categoryId, // ใช้ categoryId ตาม backend response
            date_from: budget.periodStart?.split('T')[0] || budget.month + '-01', // แปลง ISO date เป็น YYYY-MM-DD
            date_to: budget.periodEnd?.split('T')[0] || budget.month + '-31',     // แปลง ISO date เป็น YYYY-MM-DD
            type: 'expense' // เฉพาะรายจ่าย
          });
          
          // คำนวณยอดใช้จ่าย
          const transactions = Array.isArray(transactionResponse) 
            ? transactionResponse 
            : (transactionResponse as any)?.items || [];
          spentAmount = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        } catch (error) {
          console.error(`Error fetching transactions for budget ${budget.id}:`, error);
        }

        return {
          id: budget.id,
          category: budget.name || 'ไม่มีหมวดหมู่',
          budgetAmount: budget.budgetAmount,
          spentAmount,
          month: budget.periodStart?.substring(0, 7) || new Date().toISOString().substring(0, 7), // Extract YYYY-MM
          description: budget.description || '',
          transactions: [], // จะโหลดแยกในหน้ารายละเอียด
          isCompleted: budget.status === 'completed',
        };
      })
    );
    return budgetsWithSpent;
  };

  // Calculate filtered budgets
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentBudgets = uiBudgets.filter(budget => budget.month === currentMonth && !budget.isCompleted);
  const historyBudgets = uiBudgets.filter(budget => budget.month !== currentMonth || budget.isCompleted);
  
  const allFilteredBudgets = activeTab === 'current' ? currentBudgets : historyBudgets;
  
  // Pagination calculations
  const totalPages = Math.ceil(allFilteredBudgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredBudgets = allFilteredBudgets.slice(startIndex, endIndex);
  
  // Reset to first page when changing tabs
  const handleTabChange = (tab: 'current' | 'history') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleCreateBudget = async () => {
    if (!newBudget.name || !newBudget.category || !newBudget.amount) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน (ชื่องบ, หมวดหมู่, และจำนวนเงิน)');
      return;
    }

    try {
      const startDate = newBudget.month + '-01';
      const endDate = new Date(parseInt(newBudget.month.split('-')[0]), parseInt(newBudget.month.split('-')[1]), 0).toISOString().split('T')[0];

      await createBudget({
        name: newBudget.name, // ใช้ชื่องบประมาณที่ user กรอก
        category_id: newBudget.categoryId || undefined, // ใช้ category_id หากมี
        amount: parseFloat(newBudget.amount),
        period_start: startDate,
        period_end: endDate,
        description: newBudget.description,
        budget_month: parseInt(newBudget.month.split('-')[1]), // เดือน (1-12)
        budget_year: parseInt(newBudget.month.split('-')[0]),  // ปี
        alert_percentage: 80.0, // แจ้งเตือนเมื่อใช้ไป 80%
        is_active: true,
        auto_rollover: false,
        period_type: 'monthly', // หรือ 'custom'
        user_id: '', // Will be set by context
      } as any); // ไม่ให้ TypeScript check

      await fetchBudgets();
      setShowCreateModal(false);
      setNewBudget({
        name: '',
        category: '',
        categoryId: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
        description: ''
      });
      toast.info('ตั้งงบประมาณใหม่เรียบร้อยแล้ว! 🎯');
    } catch (err) {
      toast.info('ไม่สามารถสร้างงบประมาณได้: ' + (err as Error).message);
    }
  };

  const handleAddExpense = async (budget: Budget) => {
    setSelectedBudgetForExpense(budget);
    
    // Load user accounts for selection
    if (user?.id) {
      try {
        const accounts = await accountApi.getByUser(user.id);
        const accountList = Array.isArray(accounts) ? accounts : (accounts as any)?.items || [];
        setUserAccounts(accountList);
        
        // Set first account as default if available
        if (accountList.length > 0) {
          setNewExpense(prev => ({...prev, accountId: accountList[0].id}));
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        toast.error('ไม่สามารถโหลดรายการบัญชีได้');
      }
    }
    
    setShowExpenseModal(true);
  };

  const confirmAddExpense = async () => {
    if (!selectedBudgetForExpense || !newExpense.amount || !newExpense.description || !newExpense.accountId || !user?.id) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน (รวมทั้งเลือกบัญชี)');
      return;
    }

    try {

      // หา category_id จากชื่อหมวดหมู่
      const category = categoriesData.expense.find(cat => cat.name === selectedBudgetForExpense.category);
      
      // สร้าง transaction พร้อม budgetId เพื่อระบุว่ามาจาก budget ไหน
      await transactionApi.create({
        userId: user.id,
        accountId: newExpense.accountId, // ใช้บัญชีที่ user เลือก
        categoryId: category?.id, // ใช้ category_id
        budgetId: selectedBudgetForExpense.id, // ส่ง budgetId ไปด้วยเพื่อให้หลังบ้านรู้ว่ามาจาก budget ไหน
        type: 'expense',
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        transactionDate: newExpense.date,
        tags: [],
        isRecurring: false,
      });

      // รีเฟรชข้อมูล
      await fetchBudgets();
      
      setShowExpenseModal(false);
      setSelectedBudgetForExpense(null);
      setNewExpense({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        accountId: ''
      });
      toast.info('บันทึกรายจ่ายเรียบร้อยแล้ว! 💸');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.info('ไม่สามารถบันทึกรายจ่ายได้: ' + (error as Error).message);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    // หา category_id จากชื่อหมวดหมู่ (ถ้าไม่มีจาก API)
    const category = categoriesData.expense.find(cat => cat.name === budget.category);
    setEditingBudgetCategoryId(category?.id || '');
    setShowEditModal(true);
  };

  const confirmEditBudget = async () => {
    if (!editingBudget) return;

    try {
      const startDate = editingBudget.month + '-01';
      const endDate = new Date(parseInt(editingBudget.month.split('-')[0]), parseInt(editingBudget.month.split('-')[1]), 0).toISOString().split('T')[0];

      await updateBudget(editingBudget.id, {
        name: editingBudget.category,
        category_id: editingBudgetCategoryId || undefined,
        amount: editingBudget.budgetAmount,
        period_start: startDate,
        period_end: endDate,
        description: editingBudget.description,
        budget_month: parseInt(editingBudget.month.split('-')[1]),
        budget_year: parseInt(editingBudget.month.split('-')[0]),
      } as any); // ไม่ให้ TypeScript check

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
        budgetAmount: budget.budgetAmount,
        periodStart: startDate,
        periodEnd: endDate,
        description: budget.description,
        userId: '', // Will be set by context
        spentAmount: 0,
        periodType: 'monthly',
        alertPercentage: 80,
        isActive: true,
        autoRollover: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);

      await fetchBudgets();
      toast.info('ใช้งบประมาณนี้อีกครั้งเรียบร้อยแล้ว! 🔄');
    } catch (err) {
      toast.info('ไม่สามารถสร้างงบประมาณซ้ำได้: ' + (err as Error).message);
    }
  };

  const handleViewDetails = (budgetId: string) => {
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

  const handleDeleteBudget = (budget: Budget) => {
    setBudgetToDelete(budget);
    setShowDeleteModal(true);
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;

    try {
      // ก่อนลบ budget ต้องลบ transactions ที่เกี่ยวข้องก่อน
      console.log('🔍 Finding transactions for budget:', budgetToDelete.id);
      
      // ดึง transactions ที่เกี่ยวข้องกับ budget นี้
      const transactionsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/transactions?budget_id=${budgetToDelete.id}`;
      const transactionsResponse = await fetch(transactionsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        const relatedTransactions = transactionsData?.data?.items || transactionsData?.items || [];
        
        console.log('📋 Found related transactions:', relatedTransactions.length);
        
        // ลบ transactions ทีละรายการ (จะมีการคืนเงินอัตโนมัติ)
        for (const transaction of relatedTransactions) {
          const deleteTransactionUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/transactions/${transaction.id}`;
          console.log(`🗑️ Deleting transaction: ${transaction.id}`);
          
          const deleteResponse = await fetch(deleteTransactionUrl, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!deleteResponse.ok) {
            console.warn(`Failed to delete transaction ${transaction.id}:`, deleteResponse.status);
          }
        }
        
        if (relatedTransactions.length > 0) {
          toast.info(`💰 คืนเงินจำนวน ${relatedTransactions.length} รายการเข้าบัญชีแล้ว`);
        }
      }
      
      // ลบ budget
      const budgetUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/budgets/${budgetToDelete.id}`;
      console.log('🗑️ Direct Delete Budget API call to:', budgetUrl);
      
      const response = await fetch(budgetUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`ลบงบประมาณไม่สำเร็จ (HTTP ${response.status})`);
      }
      
      // Close modal and refresh budgets list
      setShowDeleteModal(false);
      setBudgetToDelete(null);
      await fetchBudgets();
      toast.success(`🗑️ ลบงบประมาณ "${budgetToDelete.category}" และคืนเงินเรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Delete budget error:', err);
      toast.error('❌ ไม่สามารถลบงบประมาณได้: ' + (err as Error).message);
    }
  };

  const totalBudget = currentBudgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
  const totalSpent = currentBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
  const remainingBudget = totalBudget - totalSpent;

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
                  คิดเป็นเปอร์เซ็นต์
                </p>
                <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('current')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              งบประมาณปัจจุบัน ({currentBudgets.length})
            </button>
            <button
              onClick={() => handleTabChange('history')}
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
        {(loading || budgetLoading) ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">กำลังโหลดงบประมาณ...</p>
          </div>
        ) : (
          <>
            {/* Budgets List */}
            <div className="grid gap-6">
              {filteredBudgets.length > 0 ? (
                <>
                {/* Summary info */}
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {activeTab === 'current' ? 'งบประมาณปัจจุบัน' : 'ประวัติงบประมาณ'}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        หน้า {currentPage} จาก {totalPages}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        รวม {allFilteredBudgets.length} งบประมาณ
                      </span>
                    </div>
                  </div>
                </div>
                
                {filteredBudgets.map((budget) => {
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
                      <button 
                        onClick={() => handleDeleteBudget(budget)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors text-sm font-medium"
                        title="ลบงบประมาณ"
                      >
                        🗑️ลบ
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
                      <button 
                        onClick={() => handleDeleteBudget(budget)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors text-sm font-medium"
                        title="ลบงบประมาณ"
                      >
                        🗑️ลบ
                      </button>
                    </>
                  )}
                    </div>
                  </div>
                );
                })}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {activeTab === 'current' ? 'ยังไม่มีงบประมาณในเดือนนี้' : 'ยังไม่มีประวัติงบประมาณ'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {allFilteredBudgets.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0">
                {/* Items per page selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">แสดง</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">รายการ</span>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  แสดง {startIndex + 1}-{Math.min(endIndex, allFilteredBudgets.length)} จาก {allFilteredBudgets.length} รายการ
                </div>

                {/* Pagination controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    «
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm border rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
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
                        เลือกบัญชี *
                      </label>
                      <select
                        value={newExpense.accountId}
                        onChange={(e) => setNewExpense(prev => ({...prev, accountId: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">เลือกบัญชีที่จะหักเงิน</option>
                        {userAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} - ฿{account.current_balance?.toLocaleString() || '0'}
                          </option>
                        ))}
                      </select>
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
                      <CategorySelector
                        type="expense"
                        selectedCategoryId={editingBudgetCategoryId}
                        onSelect={(category: Category) => {
                          setEditingBudget(prev => prev ? ({
                            ...prev,
                            category: category.name
                          }) : null);
                          setEditingBudgetCategoryId(category.id);
                        }}
                        placeholder="เลือกหมวดหมู่รายจ่าย"
                        className="w-full"
                      />
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
                        ชื่องบประมาณ *
                      </label>
                      <input
                        type="text"
                        value={newBudget.name}
                        onChange={(e) => setNewBudget(prev => ({...prev, name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="เช่น งบค่าอาหารเดือนนี้"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        หมวดหมู่ *
                      </label>
                      <CategorySelector
                        type="expense"
                        selectedCategoryId={newBudget.categoryId}
                        onSelect={(category: Category) => {
                          setNewBudget(prev => ({
                            ...prev,
                            category: category.name,
                            categoryId: category.id
                          }));
                        }}
                        placeholder="เลือกหมวดหมู่รายจ่าย"
                        className="w-full"
                      />
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
                    disabled={!newBudget.name || !newBudget.category || !newBudget.amount}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && budgetToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDeleteModal(false)}
              >
                <div className="absolute inset-0 bg-black/50"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                      <span className="text-red-600 dark:text-red-400 text-3xl">🗑️</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      ยืนยันการลบงบประมาณ
                    </h3>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {budgetToDelete.category}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        งบประมาณ: ฿{budgetToDelete.budgetAmount.toLocaleString()}
                      </p>
                      {budgetToDelete.spentAmount > 0 && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                          ใช้จ่ายไปแล้ว: ฿{budgetToDelete.spentAmount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      คุณต้องการลบงบประมาณนี้ใช่หรือไม่?
                    </p>
                    
                    {budgetToDelete.spentAmount > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-4">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          ⚠️ งบประมาณนี้มีประวัติการใช้จ่าย หากลบแล้วข้อมูลจะหายไป
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-6">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        ❌ การลบนี้ไม่สามารถกู้คืนได้
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
                  <button
                    onClick={confirmDeleteBudget}
                    className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 transition-all"
                  >
                    🗑️ ลบงบประมาณ
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