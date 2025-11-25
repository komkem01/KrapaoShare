'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBudget } from '@/contexts/BudgetContext';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { budgetApi, transactionApi, accountApi } from '@/utils/apiClient';

// Types
interface Transaction {
  id?: string;
  date: string;
  amount: number;
  description: string;
  categoryId?: string;
  category?: string;
  budgetId?: string;
  transactionDate?: string;
  userId?: string;
  accountId?: string;
  type?: string;
}

interface Budget {
  id: string | number;
  category: string;
  categoryId?: string;
  budgetAmount: number;
  spentAmount: number;
  month: string;
  description?: string;
  name?: string;
  periodStart?: string;
  periodEnd?: string;
  periodType?: string;
  budgetMonth?: number;
  budgetYear?: number;
  alertPercentage?: number;
  isActive?: boolean;
  autoRollover?: boolean;
  transactions: Transaction[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BudgetDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { budgets, fetchBudgets, updateBudget } = useBudget();
  const { user } = useUser();
  
  // States
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: ''
  });
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterByDate, setFilterByDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Load budget data
  useEffect(() => {
    async function loadBudgetData() {
      try {
        const resolvedParams = await params;
        const budgetIdStr = resolvedParams.id;
        
        console.log('🔍 [Detail Page] Loading budget with ID:', budgetIdStr);
        console.log('🔍 [Detail Page] Current budgets length:', budgets.length);
        
        // Always fetch budgets to ensure we have latest data
        console.log('📥 [Detail Page] Calling fetchBudgets...');
        await fetchBudgets();
        
        setLoading(false);
      } catch (error) {
        console.error('❌ [Detail Page] Error loading budget data:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        router.push('/dashboard/budgets');
      }
    }

    loadBudgetData();
  }, [params, router, fetchBudgets]);

  // Separate effect to handle budget finding after budgets are loaded
  useEffect(() => {
    async function findAndLoadBudget() {
      if (budgets.length === 0 || loading) return;
      
      try {
        const resolvedParams = await params;
        const budgetIdStr = resolvedParams.id;
        
        console.log('🔍 [Detail Page] Looking for budget ID:', budgetIdStr);
        console.log('🔍 [Detail Page] Budgets available:', budgets.length);
        console.log('🔍 [Detail Page] Budget list:', budgets.map((b: any) => ({ id: b.id, category: b.category, type: typeof b.id })));
        
        // Find budget from loaded data - ID is UUID string
        const foundBudget = budgets.find((b: any) => {
          const match = String(b.id) === budgetIdStr;
          console.log(`🔍 [Detail Page] Comparing ${b.id} (${typeof b.id}) with ${budgetIdStr} (${typeof budgetIdStr}): ${match}`);
          return match;
        });
        
        if (!foundBudget) {
          console.log('❌ [Detail Page] Budget not found!');
          console.log('❌ [Detail Page] Available budgets:', budgets.map((b: any) => ({ id: b.id, category: b.category, type: typeof b.id })));
          toast.error('ไม่พบงบประมาณที่ต้องการ');
          router.push('/dashboard/budgets');
          return;
        }

        console.log('✅ [Detail Page] Found budget:', foundBudget);
        
        // Fetch transactions for this budget
        await loadTransactions(budgetIdStr, foundBudget);
      } catch (error) {
        console.error('Error finding budget:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        router.push('/dashboard/budgets');
      }
    }

    findAndLoadBudget();
  }, [budgets, loading, params, router]);

  // Load transactions for budget
  const loadTransactions = async (budgetId: string | number, budgetData: any) => {
    try {
      // Use periodStart and periodEnd from backend if available, otherwise use month
      let dateFrom: string;
      let dateTo: string;
      
      if (budgetData.periodStart && budgetData.periodEnd) {
        dateFrom = new Date(budgetData.periodStart).toISOString().split('T')[0];
        dateTo = new Date(budgetData.periodEnd).toISOString().split('T')[0];
      } else if (budgetData.month) {
        // Parse month to get correct date range
        const monthDate = new Date(budgetData.month + '-01');
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth(); // 0-based month
        
        // Get first day of month
        const firstDay = new Date(year, month, 1);
        dateFrom = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get last day of month
        const lastDay = new Date(year, month + 1, 0); // Day 0 of next month = last day of current month
        dateTo = lastDay.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else {
        // Fallback to current month
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        dateFrom = firstDay.toISOString().split('T')[0];
        dateTo = lastDay.toISOString().split('T')[0];
      }
      
      console.log('📋 [Detail Page] Loading transactions for budget:', budgetId);
      console.log('📋 [Detail Page] Budget data:', budgetData);
      console.log('📋 [Detail Page] Date range:', dateFrom, 'to', dateTo);
      console.log('📋 [Detail Page] Category ID:', budgetData.categoryId);

      // Temporary: Call API directly without auth for testing
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/transactions?category_id=${budgetData.categoryId}&date_from=${dateFrom}&date_to=${dateTo}&type=expense&limit=1000`;
      console.log('🌐 [Detail Page] Direct Transaction API call to:', apiUrl);
      
      const transactionResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!transactionResponse.ok) {
        throw new Error(`Transaction API error: ${transactionResponse.status}`);
      }
      
      const response = await transactionResponse.json();
      console.log('📥 [Detail Page] Transaction API Response:', response);
      
      const transactions = Array.isArray(response) ? response : (response?.data?.items || response?.items || []);
      
      console.log('📋 [Detail Page] Parsed transactions:', transactions);
      console.log('📋 [Detail Page] Transaction count:', transactions.length);
      
      // Calculate spent amount from actual transactions
      const spentAmount = transactions.reduce((total: number, transaction: any) => {
        return total + (transaction.amount || 0);
      }, 0);

      console.log('💰 [Detail Page] Calculated spent amount:', spentAmount);

      const finalBudget = {
        ...budgetData,
        transactions: transactions.map((transaction: any) => ({
          id: transaction.id,
          date: transaction.transactionDate || transaction.date,
          amount: transaction.amount,
          description: transaction.description,
          categoryId: transaction.categoryId,
          category: transaction.categoryName || budgetData.category,
          budgetId: String(budgetId),
          transactionDate: transaction.transactionDate,
          userId: transaction.userId,
          accountId: transaction.accountId,
          type: transaction.type
        })),
        spentAmount
      };
      
      console.log('✅ [Detail Page] Setting final budget:', finalBudget);
      setBudget(finalBudget);
    } catch (error) {
      console.error('Error loading transactions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Set budget without transactions if API fails
      const fallbackBudget = {
        ...budgetData,
        transactions: [],
        spentAmount: budgetData.spentAmount || 0
      };
      
      console.log('⚠️ [Detail Page] Setting fallback budget:', fallbackBudget);
      setBudget(fallbackBudget);
    }
  };  // Add expense
  const handleAddExpense = async () => {
    if (!budget || !newExpense.amount || !newExpense.description) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const expenseAmount = parseFloat(newExpense.amount);
      
      // Create transaction via API
      const transactionData = {
        userId: user?.id || '',
        accountId: newExpense.accountId,
        categoryId: budget.categoryId || '',
        type: 'expense' as const,
        amount: expenseAmount,
        description: newExpense.description,
        transactionDate: newExpense.date,
        budgetId: String(budget.id)
      };

      console.log('Creating transaction with data:', transactionData);

      await transactionApi.create(transactionData);

        // Reload transactions
        await loadTransactions(String(budget.id), budget);      setShowAddExpenseModal(false);
      setNewExpense({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        accountId: ''
      });
      toast.success('บันทึกรายจ่ายเรียบร้อยแล้ว! 💸');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกรายจ่าย');
    }
  };

  // Open add expense modal and load accounts
  const handleOpenAddExpenseModal = async () => {
    // Load user accounts for selection with fresh balance data
    if (user?.id) {
      try {
        console.log('🏦 Loading accounts for user:', user.id);
        const accounts = await accountApi.getByUser(user.id);
        console.log('🏦 Raw accounts response:', accounts);
        
        const accountList = Array.isArray(accounts) ? accounts : (accounts as any)?.items || [];
        console.log('🏦 Processed account list:', accountList);
        
        setUserAccounts(accountList);
        
        // Set first account as default if available
        if (accountList.length > 0) {
          setNewExpense(prev => ({...prev, accountId: accountList[0].id}));
        }
        
        toast.success(`โหลดบัญชี ${accountList.length} รายการแล้ว`);
      } catch (error) {
        console.error('Error loading accounts:', error);
        toast.error('ไม่สามารถโหลดรายการบัญชีได้: ' + (error as Error).message);
      }
    } else {
      toast.error('ไม่พบข้อมูลผู้ใช้');
    }
    setShowAddExpenseModal(true);
  };

  // Edit budget
  const handleEditBudget = () => {
    setShowEditModal(true);
  };

  const confirmEditBudget = async () => {
    if (!budget) {
      toast.error('ไม่พบข้อมูลงบประมาณ');
      return;
    }

    try {
      console.log('💾 Starting budget update for ID:', budget.id);
      console.log('💾 Current budget data:', budget);

      // Convert month (YYYY-MM) to period_start and period_end in YYYY-MM-DD format
      const monthDate = budget.month ? new Date(budget.month + '-01') : new Date();
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      // Format: YYYY-MM-DD (not ISO string with time)
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const periodStart = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
      const periodEnd = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

      // Transform to backend format with correct field names
      const updatedBudgetData = {
        categoryId: budget.categoryId?.toString() || '',
        name: budget.name || budget.category || '',
        budgetAmount: budget.budgetAmount,
        periodStart: periodStart,
        periodEnd: periodEnd,
        description: budget.description || '',
        // Keep other fields from original budget
        budgetMonth: budget.budgetMonth || month + 1,
        budgetYear: budget.budgetYear || year,
        alertPercentage: budget.alertPercentage || 80,
        periodType: budget.periodType || 'monthly',
        isActive: budget.isActive !== undefined ? budget.isActive : true,
        autoRollover: budget.autoRollover || false
      };

      console.log('💾 Update data being sent:', updatedBudgetData);

      await updateBudget(String(budget.id), updatedBudgetData);
      
      // Refresh budget data after update
      await fetchBudgets();
      
      setShowEditModal(false);
      toast.success('แก้ไขงบประมาณเรียบร้อยแล้ว! ✅');
    } catch (error) {
      console.error('Error updating budget:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error('เกิดข้อผิดพลาดในการแก้ไขงบประมาณ: ' + (error as Error).message);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!budget) return;
    
    const transactionToDelete = budget.transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    if (confirm(`ต้องการลบรายการ "${transactionToDelete.description}" หรือไม่?`)) {
      try {
        await transactionApi.delete(transactionId);
        
        // Reload transactions
        await loadTransactions(String(budget.id), budget);
        
        toast.success('ลบรายการเรียบร้อยแล้ว! 🗑️');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('เกิดข้อผิดพลาดในการลบรายการ');
      }
    }
  };

  // Sort and filter transactions
  const getSortedAndFilteredTransactions = () => {
    if (!budget) return [];
    
    let filteredTransactions = budget.transactions;
    
    // Filter by date if specified
    if (filterByDate) {
      filteredTransactions = budget.transactions.filter(t => t.date.includes(filterByDate));
    }
    
    // Sort transactions
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedTransactions.slice(startIndex, endIndex);
  };

  // Get total count for pagination
  const getTotalTransactionCount = () => {
    if (!budget) return 0;
    
    let filteredTransactions = budget.transactions;
    
    if (filterByDate) {
      filteredTransactions = budget.transactions.filter(t => t.date.includes(filterByDate));
    }
    
    return filteredTransactions.length;
  };

  const totalPages = Math.ceil(getTotalTransactionCount() / pageSize);

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
                กำลังโหลดข้อมูลงบประมาณ...
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
  if (!budget) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              ไม่พบงบประมาณที่ต้องการ
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              งบประมาณนี้อาจถูกลบแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง
            </p>
            <button
              onClick={() => router.push('/dashboard/budgets')}
              className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>←</span>
                <span>กลับไปหน้างบประมาณ</span>
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate statistics
  const remainingBudget = budget.budgetAmount - budget.spentAmount;
  const percentageUsed = (budget.spentAmount / budget.budgetAmount) * 100;
  const isOverBudget = budget.spentAmount > budget.budgetAmount;
  const isNearLimit = percentageUsed > 80 && !isOverBudget;
  const sortedTransactions = getSortedAndFilteredTransactions();
  const averageExpense = budget.transactions.length > 0 ? budget.spentAmount / budget.transactions.length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100 dark:from-blue-900 opacity-20 rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-100 dark:from-indigo-900 opacity-15 rounded-full transform -translate-x-24 translate-y-24"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/dashboard/budgets')}
                className="group flex items-center space-x-3 px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
                <span className="font-medium">กลับ</span>
              </button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {budget.category}
                  </h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    isOverBudget
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : isNearLimit
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}>
                    {isOverBudget ? '⚠️ เกินงบ' : isNearLimit ? '⚡ ใกล้เกิน' : '✅ ปกติ'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 ml-1 flex items-center space-x-2">
                  <span>{budget.description}</span>
                  <span>•</span>
                  <span>{new Date(budget.month + '-01').toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ข้อมูลงบประมาณ
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">งบประมาณที่ตั้งไว้:</span>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">฿{budget.budgetAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">ใช้จ่ายไปแล้ว:</span>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">฿{budget.spentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">คงเหลือ:</span>
                  <p className={`text-lg font-semibold ${
                    remainingBudget >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    ฿{remainingBudget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">ค่าใช้จ่ายเฉลี่ย:</span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">฿{averageExpense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  สถิติการใช้จ่าย
                </h2>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">ความคืบหน้า</span>
                    <span className={`text-sm font-bold ${
                      isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {Math.min(percentageUsed, 100).toFixed(2)}% ใช้ไป
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${
                        isOverBudget 
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : isNearLimit 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                            : 'bg-gradient-to-r from-green-400 to-green-600'
                      }`}
                      style={{width: `${Math.min(percentageUsed, 100)}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>฿0</span>
                    <span>฿{budget.budgetAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-xl">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">รายการทั้งหมด</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{budget.transactions.length}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-xl">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">วันนี้</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {budget.transactions.filter(t => t.date === new Date().toISOString().split('T')[0]).length}
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
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">⚡</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              การดำเนินการ
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={handleOpenAddExpenseModal}
              className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white py-4 px-5 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-2xl mb-2">💸</div>
                <div className="text-sm">บันทึกรายจ่าย</div>
              </div>
            </button>
            <button 
              onClick={handleEditBudget}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">✏️</div>
              <div className="text-sm">แก้ไขงบ</div>
            </button>
            <button 
              onClick={() => router.push('/dashboard/budgets')}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm">ดูงบทั้งหมด</div>
            </button>
            <button 
              onClick={() => window.print()}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🖨️</div>
              <div className="text-sm">พิมพ์รายงาน</div>
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📝</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                รายการใช้จ่าย
              </h2>
              <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">
                {sortedTransactions.length} รายการ
              </span>
            </div>
            
            {/* Filters and Sort */}
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={filterByDate}
                onChange={(e) => {
                  setFilterByDate(e.target.value);
                  setCurrentPage(1); // Reset to first page
                }}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                placeholder="กรองตามวันที่"
              />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [('date' | 'amount'), ('asc' | 'desc')];
                  setSortBy(field);
                  setSortOrder(order);
                  setCurrentPage(1); // Reset to first page
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
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((transaction, index) => (
                <div key={transaction.id || index} className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] hover:-translate-y-1">
                  {/* Gradient background overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/50 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Icon with animation */}
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-red-500 via-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                            <span className="text-white text-xl">💸</span>
                          </div>
                          {/* Pulse effect */}
                          <div className="absolute inset-0 w-14 h-14 bg-red-400 rounded-2xl opacity-0 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-4">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                                {transaction.description}
                              </h3>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span>📅</span>
                                  <span className="font-medium">
                                    {new Date(transaction.date).toLocaleDateString('th-TH', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span>🏷️</span>
                                  <span className="font-medium">{transaction.category}</span>
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
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400 group-hover:text-red-500 transition-colors duration-300">
                              -฿{transaction.amount.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            {transaction.amount > 1000 ? 'รายการใหญ่' : transaction.amount > 500 ? 'รายการกลาง' : 'รายการเล็ก'}
                          </p>
                        </div>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id!)}
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
                  <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full opacity-50 animate-pulse"></div>
                  <div className="absolute inset-2 w-28 h-28 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full opacity-60 animate-pulse delay-150"></div>
                  
                  {/* Main icon */}
                  <div className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <div className="relative">
                      <span className="text-6xl animate-bounce">📝</span>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✨</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {filterByDate ? '🔍 ไม่พบรายการ' : '🎯 เริ่มต้นการบันทึก'}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {filterByDate 
                      ? 'ไม่พบรายการใช้จ่ายในวันที่ที่เลือก ลองเปลี่ยนวันที่หรือล้างตัวกรองดู' 
                      : 'บันทึกรายจ่ายของคุณเพื่อติดตามงบประมาณให้ได้ผลที่ดี'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                    {filterByDate ? (
                      <>
                        <button
                          onClick={() => {
                            setFilterByDate('');
                            setCurrentPage(1);
                          }}
                          className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <span className="relative z-10 flex items-center space-x-2">
                            <span>🗑️</span>
                            <span>ล้างตัวกรอง</span>
                          </span>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                        </button>
                        <button
                          onClick={handleOpenAddExpenseModal}
                          className="group relative bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <span className="flex items-center space-x-2">
                            <span>💸</span>
                            <span>เพิ่มรายจ่าย</span>
                          </span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleOpenAddExpenseModal}
                        className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <span className="relative z-10 flex items-center space-x-3">
                          <span className="text-xl">💸</span>
                          <span>เริ่มบันทึกรายจ่าย</span>
                        </span>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                แสดง {Math.min((currentPage - 1) * pageSize + 1, getTotalTransactionCount())}-{Math.min(currentPage * pageSize, getTotalTransactionCount())} จาก {getTotalTransactionCount()} รายการ
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ก่อนหน้า
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(1, currentPage - 2);
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowAddExpenseModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      บันทึกรายจ่าย - {budget.category}
                    </h3>
                    <button
                      onClick={() => setShowAddExpenseModal(false)}
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
                          remainingBudget > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          ฿{remainingBudget.toLocaleString()}
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
                        บัญชี
                      </label>
                      <select
                        value={newExpense.accountId}
                        onChange={(e) => setNewExpense(prev => ({...prev, accountId: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">เลือกบัญชี</option>
                        {userAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} - ฿{(account.current_balance || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
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
                    onClick={handleAddExpense}
                    disabled={!newExpense.amount || !newExpense.description || !newExpense.accountId}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm transition-all"
                  >
                    💸 บันทึกรายจ่าย
                  </button>
                  <button
                    onClick={() => setShowAddExpenseModal(false)}
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
                      <input
                        type="text"
                        value={budget.category}
                        onChange={(e) => setBudget(prev => prev ? ({...prev, category: e.target.value}) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                          value={budget.budgetAmount}
                          onChange={(e) => setBudget(prev => prev ? ({...prev, budgetAmount: parseFloat(e.target.value) || 0}) : null)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        รายละเอียด
                      </label>
                      <textarea
                        value={budget.description}
                        onChange={(e) => setBudget(prev => prev ? ({...prev, description: e.target.value}) : null)}
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
      </div>
    </DashboardLayout>
  );
}
