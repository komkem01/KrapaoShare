'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

// Types
interface Transaction {
  id?: number;
  date: string;
  amount: number;
  description: string;
  category?: string;
}

interface Budget {
  id: number;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  month: string;
  description: string;
  transactions: Transaction[];
}

// Mock data
const mockBudgets: Budget[] = [
  {
    id: 1,
    category: 'อาหาร',
    budgetAmount: 6000,
    spentAmount: 2350,
    month: '2025-11',
    description: 'ค่าอาหารรายเดือน',
    transactions: [
      { id: 1, date: '2025-11-14', amount: 350, description: 'ข้าวผัดกะเพรา + น้ำ', category: 'อาหาร' },
      { id: 2, date: '2025-11-13', amount: 250, description: 'ก๋วยเตี๋ยว + กาแฟ', category: 'อาหาร' },
      { id: 3, date: '2025-11-12', amount: 180, description: 'ข้าวมันไก่', category: 'อาหาร' },
      { id: 4, date: '2025-11-11', amount: 420, description: 'ชาบู + เครื่องดื่ม (4 คน)', category: 'อาหาร' },
      { id: 5, date: '2025-11-10', amount: 85, description: 'กาแฟเช้า', category: 'อาหาร' },
      { id: 6, date: '2025-11-09', amount: 290, description: 'ข้าวแกงกับเพื่อน', category: 'อาหาร' },
      { id: 7, date: '2025-11-08', amount: 150, description: 'ข้าวเหนียวมะม่วง', category: 'อาหาร' },
      { id: 8, date: '2025-11-07', amount: 625, description: 'บุฟเฟ่ต์ BBQ', category: 'อาหาร' }
    ]
  },
  {
    id: 2,
    category: 'ค่าเดินทาง',
    budgetAmount: 1500,
    spentAmount: 1200,
    month: '2025-11',
    description: 'รถเมล์ แท็กซี่ Grab',
    transactions: [
      { id: 9, date: '2025-11-14', amount: 60, description: 'รถเมล์ไป-กลับ', category: 'ค่าเดินทาง' },
      { id: 10, date: '2025-11-13', amount: 280, description: 'แท็กซี่กลับบ้าน', category: 'ค่าเดินทาง' },
      { id: 11, date: '2025-11-12', amount: 45, description: 'รถเมล์ไปมหาลัย', category: 'ค่าเดินทาง' },
      { id: 12, date: '2025-11-11', amount: 350, description: 'Grab ไปงานเลี้ยง', category: 'ค่าเดินทาง' },
      { id: 13, date: '2025-11-10', amount: 120, description: 'รถไฟฟ้า BTS', category: 'ค่าเดินทาง' },
      { id: 14, date: '2025-11-09', amount: 180, description: 'แท็กซี่ไปห้าง', category: 'ค่าเดินทาง' },
      { id: 15, date: '2025-11-08', amount: 165, description: 'Grab Food + ค่าส่ง', category: 'ค่าเดินทาง' }
    ]
  },
  {
    id: 3,
    category: 'เสื้อผ้า',
    budgetAmount: 2000,
    spentAmount: 850,
    month: '2025-11',
    description: 'เสื้อผ้าและของใช้ส่วนตัว',
    transactions: [
      { id: 16, date: '2025-11-12', amount: 850, description: 'เสื้อผ้า Uniqlo', category: 'เสื้อผ้า' }
    ]
  },
  {
    id: 4,
    category: 'ความบันเทิง',
    budgetAmount: 1000,
    spentAmount: 170,
    month: '2025-11',
    description: 'หนัง คอนเสิร์ต เกม',
    transactions: [
      { id: 17, date: '2025-11-10', amount: 170, description: 'ค่าหนังที่ SF', category: 'ความบันเทิง' }
    ]
  }
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BudgetDetailPage({ params }: PageProps) {
  const router = useRouter();
  
  // States
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterByDate, setFilterByDate] = useState('');

  // Load budget data
  useEffect(() => {
    async function loadBudgetData() {
      try {
        const resolvedParams = await params;
        const budgetId = parseInt(resolvedParams.id);
        const foundBudget = mockBudgets.find(b => b.id === budgetId);
        
        if (foundBudget) {
          setBudget(foundBudget);
        } else {
          router.push('/dashboard/budgets');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading budget data:', error);
        router.push('/dashboard/budgets');
      }
    }

    loadBudgetData();
  }, [params, router]);

  // Add expense
  const handleAddExpense = () => {
    if (!budget || !newExpense.amount || !newExpense.description) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const expenseAmount = parseFloat(newExpense.amount);
    const newTransaction: Transaction = {
      id: Math.max(...(budget.transactions.map(t => t.id || 0))) + 1,
      date: newExpense.date,
      amount: expenseAmount,
      description: newExpense.description,
      category: budget.category
    };

    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        spentAmount: prev.spentAmount + expenseAmount,
        transactions: [newTransaction, ...prev.transactions]
      };
    });

    setShowAddExpenseModal(false);
    setNewExpense({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    toast.info('บันทึกรายจ่ายเรียบร้อยแล้ว! 💸');
  };

  // Edit budget
  const handleEditBudget = () => {
    setShowEditModal(true);
  };

  const confirmEditBudget = () => {
    if (!budget) return;
    setShowEditModal(false);
    toast.info('แก้ไขงบประมาณเรียบร้อยแล้ว! ✅');
  };

  // Delete transaction
  const handleDeleteTransaction = (transactionId: number) => {
    if (!budget) return;
    
    const transactionToDelete = budget.transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    if (confirm(`ต้องการลบรายการ "${transactionToDelete.description}" หรือไม่?`)) {
      setBudget(prev => {
        if (!prev) return null;
        return {
          ...prev,
          spentAmount: prev.spentAmount - transactionToDelete.amount,
          transactions: prev.transactions.filter(t => t.id !== transactionId)
        };
      });
      toast.info('ลบรายการเรียบร้อยแล้ว! 🗑️');
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
    return [...filteredTransactions].sort((a, b) => {
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
                      {Math.round(percentageUsed)}%
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
              onClick={() => setShowAddExpenseModal(true)}
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
                onChange={(e) => setFilterByDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                placeholder="กรองตามวันที่"
              />
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
                          onClick={() => setFilterByDate('')}
                          className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <span className="relative z-10 flex items-center space-x-2">
                            <span>🗑️</span>
                            <span>ล้างตัวกรอง</span>
                          </span>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                        </button>
                        <button
                          onClick={() => setShowAddExpenseModal(true)}
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
                        onClick={() => setShowAddExpenseModal(true)}
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
                    disabled={!newExpense.amount || !newExpense.description}
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
