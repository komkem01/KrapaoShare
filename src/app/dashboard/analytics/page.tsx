'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useCategories } from '@/contexts/CategoryContext';
import type { Transaction } from '@/types/transaction';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { transactions, isLoading: transactionsLoading, refreshTransactions } = useTransactions();
  const { accounts, refreshAccounts } = useAccounts();
  const { categories: userCategories } = useCategories();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
    category: 'saving',
    deadline: ''
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        refreshTransactions(),
        refreshAccounts()
      ]);
    };
    loadData();
  }, [refreshTransactions, refreshAccounts]);

  // Analyze real transaction data
  const analyticsData = useMemo(() => {
    if (!transactions.length) return null;

    // Calculate monthly summary
    const monthlyGroups: Record<string, { income: number; expense: number; transfer: number }> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      const monthKey = date.toLocaleDateString('th-TH', { year: '2-digit', month: 'short' });
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { income: 0, expense: 0, transfer: 0 };
      }
      
      monthlyGroups[monthKey][transaction.type] += transaction.amount;
    });

    const monthlyData = Object.entries(monthlyGroups)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        savings: data.income - data.expense
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months

    // Category analysis for expenses only
    const categoryGroups: Record<string, number> = {};
    const allCategories = [...(userCategories.income || []), ...(userCategories.expense || [])];
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = allCategories.find(cat => cat.id === transaction.categoryId);
        const categoryName = category?.name || 'ไม่ระบุหมวดหมู่';
        categoryGroups[categoryName] = (categoryGroups[categoryName] || 0) + transaction.amount;
      });

    const totalExpense = Object.values(categoryGroups).reduce((sum, amount) => sum + amount, 0);
    
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-gray-500'];
    
    const categoryData = Object.entries(categoryGroups)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    // Summary statistics
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);

    return {
      monthlyData,
      categoryData,
      summary: {
        totalIncome,
        totalExpenses,
        totalBalance,
        netSavings: totalIncome - totalExpenses
      }
    };
  }, [transactions, accounts, userCategories]);

  // Fallback mock data when no real data is available
  const mockMonthlyData = [
    { month: 'ต.ค. 25', income: 25000, expense: 18500, savings: 6500 },
    { month: 'พ.ย. 25', income: 28000, expense: 22000, savings: 6000 },
    { month: 'ธ.ค. 25', income: 30000, expense: 25000, savings: 5000 },
    { month: 'ม.ค. 26', income: 27000, expense: 20000, savings: 7000 },
    { month: 'ก.พ. 26', income: 29000, expense: 23000, savings: 6000 },
    { month: 'มี.ค. 26', income: 31000, expense: 24500, savings: 6500 }
  ];

  const mockCategoryData = [
    { category: 'อาหาร', amount: 8500, percentage: 35, color: 'bg-red-500' },
    { category: 'ค่าเดินทาง', amount: 4200, percentage: 17, color: 'bg-blue-500' },
    { category: 'เสื้อผ้า', amount: 3800, percentage: 16, color: 'bg-green-500' },
    { category: 'ความบันเทิง', amount: 2500, percentage: 10, color: 'bg-yellow-500' },
    { category: 'สุขภาพ', amount: 2200, percentage: 9, color: 'bg-purple-500' },
    { category: 'อื่นๆ', amount: 3300, percentage: 13, color: 'bg-gray-500' }
  ];

  const mockWeeklySpending = [
    { day: 'จ', amount: 450 },
    { day: 'อ', amount: 320 },
    { day: 'พ', amount: 680 },
    { day: 'พฤ', amount: 280 },
    { day: 'ศ', amount: 520 },
    { day: 'ส', amount: 750 },
    { day: 'อา', amount: 620 }
  ];

  const mockGoalsProgress = [
    { name: 'MacBook ใหม่', current: 25000, target: 65000, percentage: 38 },
    { name: 'ทริปญี่ปุ่น', current: 8500, target: 45000, percentage: 19 },
    { name: 'กองทุนฉุกเฉิน', current: 15000, target: 30000, percentage: 50 }
  ];

  // Use real data if available, otherwise use mock data
  const currentData = analyticsData || {
    monthlyData: mockMonthlyData,
    categoryData: mockCategoryData,
    summary: {
      totalIncome: mockMonthlyData.reduce((sum, month) => sum + month.income, 0),
      totalExpenses: mockMonthlyData.reduce((sum, month) => sum + month.expense, 0),
      totalBalance: 25000,
      netSavings: mockMonthlyData.reduce((sum, month) => sum + month.savings, 0)
    }
  };

  const totalIncome = currentData.summary.totalIncome;
  const totalExpense = currentData.summary.totalExpenses;
  const totalSavings = currentData.summary.netSavings;
  const avgMonthlyExpense = currentData.monthlyData.length > 0 ? totalExpense / currentData.monthlyData.length : 0;
  const maxExpense = Math.max(...mockWeeklySpending.map(day => day.amount));

  // Functions
  const handleExportPDF = async () => {
    setIsExporting(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock PDF data
    const reportData = {
      period: selectedPeriod,
      totalIncome,
      totalExpense,
      totalSavings,
      categories: mockCategoryData,
      weeklySpending: mockWeeklySpending,
      goalsProgress: mockGoalsProgress,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
    setShowExportModal(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleViewLastYear = () => {
    // In a real app, this would fetch last year's data
    toast.info('ฟีเจอร์นี้จะแสดงข้อมูลปีก่อนหน้า กำลังพัฒนา...');
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target || !newGoal.deadline) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (parseFloat(newGoal.target) <= 0) {
      toast.info('เป้าหมายต้องมากกว่า 0');
      return;
    }

    setIsExporting(true);
    // Simulate API call to create goal
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsExporting(false);
    setShowGoalModal(false);
    setNewGoal({ name: '', target: '', category: 'saving', deadline: '' });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleGetAdvice = () => {
    setShowAdviceModal(true);
  };

  const generateAdvice = () => {
    const savingsRate = (totalSavings / totalIncome) * 100;
    const advice = [];
    
    if (savingsRate < 20) {
      advice.push('💡 ลองเพิ่มอัตราการออมให้ถึง 20% ของรายรับ');
    }
    
    const highestExpense = mockCategoryData.reduce((prev, current) => 
      prev.amount > current.amount ? prev : current
    );
    
    if (highestExpense.percentage > 40) {
      advice.push(`💡 การใช้จ่ายในหมวด "${highestExpense.category}" สูงเกินไป ลองลดลง 5-10%`);
    }
    
    const lastMonth = mockMonthlyData[mockMonthlyData.length - 1];
    if (lastMonth.expense > lastMonth.income * 0.8) {
      advice.push('💡 รายจ่ายสูงเกินไป ควรควบคุมให้ไม่เกิน 80% ของรายรับ');
    }
    
    advice.push('💡 ลองใช้กฎ 50/30/20: 50% ความจำเป็น, 30% ความต้องการ, 20% การออม');
    advice.push('💡 ตั้งเป้าหมายฉุกเฉินให้มีเงินออมพออยู่ได้ 3-6 เดือน');
    
    return advice;
  };

  // Calculate trend
  const lastThreeMonths = mockMonthlyData.slice(-3);
  const expenseTrend = lastThreeMonths[2].expense > lastThreeMonths[0].expense ? 'increasing' : 'decreasing';
  const savingsTrend = lastThreeMonths[2].savings > lastThreeMonths[0].savings ? 'increasing' : 'decreasing';

  return (
    <DashboardLayout>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">ดำเนินการสำเร็จ!</span>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              รายงานและวิเคราะห์
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              วิเคราะห์พฤติกรรมการใช้จ่ายและแนวโน้มทางการเงิน
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="flex space-x-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as 'week' | 'month' | 'year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period === 'week' ? 'สัปดาห์' : period === 'month' ? 'เดือน' : 'ปี'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รายรับรวม (6 เดือน)
                </p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  ฿{totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-xl">📈</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              เฉลี่ย ฿{Math.round(totalIncome / 6).toLocaleString()}/เดือน
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รายจ่ายรวม (6 เดือน)
                </p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  ฿{totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-xl">📉</span>
              </div>
            </div>
            <div className="mt-2 flex items-center space-x-1">
              <span className={`text-xs ${expenseTrend === 'increasing' ? 'text-red-500' : 'text-green-500'}`}>
                {expenseTrend === 'increasing' ? '↗️' : '↘️'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {expenseTrend === 'increasing' ? 'เพิ่มขึ้น' : 'ลดลง'}จากเดือนก่อน
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เงินออมรวม (6 เดือน)
                </p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  ฿{totalSavings.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-xl">💰</span>
              </div>
            </div>
            <div className="mt-2 flex items-center space-x-1">
              <span className={`text-xs ${savingsTrend === 'increasing' ? 'text-green-500' : 'text-red-500'}`}>
                {savingsTrend === 'increasing' ? '↗️' : '↘️'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((totalSavings / totalIncome) * 100)}% ของรายรับ
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  อัตราการออม
                </p>
                <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  {Math.round((totalSavings / totalIncome) * 100)}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 text-xl">🎯</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              เป้าหมาย: 20%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              แนวโน้มรายรับ-จ่าย (6 เดือนย้อนหลัง)
            </h3>
            <div className="space-y-4">
              {currentData.monthlyData.map((month, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{month.month}</span>
                    <div className="flex space-x-4">
                      <span className="text-green-600 dark:text-green-400">
                        +฿{month.income.toLocaleString()}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        -฿{month.expense.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{width: `${(month.income / 35000) * 100}%`}}
                      ></div>
                    </div>
                    <div 
                      className="absolute top-0 bg-red-500 h-2 rounded-full" 
                      style={{width: `${(month.expense / 35000) * 100}%`}}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    คงเหลือ: ฿{(month.income - month.expense).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              การใช้จ่ายตามหมวดหมู่ (เดือนนี้)
            </h3>
            <div className="space-y-3">
              {currentData.categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {category.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ฿{category.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-right">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">รวม</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ฿{mockCategoryData.reduce((sum, cat) => sum + cat.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Spending Pattern */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              รูปแบบการใช้จ่ายรายวัน (สัปดาห์นี้)
            </h3>
            <div className="space-y-3">
              {mockWeeklySpending.map((day, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[1.5rem]">
                    {day.day}
                  </span>
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          day.amount === maxExpense ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{width: `${(day.amount / maxExpense) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[4rem] text-right">
                    ฿{day.amount}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">เฉลี่ยต่อวัน</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ฿{Math.round(mockWeeklySpending.reduce((sum, day) => sum + day.amount, 0) / 7)}
                </span>
              </div>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              ความคืบหน้าเป้าหมายการออม
            </h3>
            <div className="space-y-4">
              {mockGoalsProgress.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {goal.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {goal.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.percentage >= 50 ? 'bg-green-500' : 
                        goal.percentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{width: `${goal.percentage}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>฿{goal.current.toLocaleString()}</span>
                    <span>฿{goal.target.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            คะแนนสุขภาพทางการเงิน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
                <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-8 border-green-500 border-t-transparent transform -rotate-90"
                     style={{borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent'}}>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">85</span>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">คะแนนรวม</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">ดีมาก</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">อัตราการออม</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">ดีเยี่ยม</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">การควบคุมงบประมาณ</span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">ปานกลาง</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">ความสม่ำเสมอ</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">ดี</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">คำแนะนำ</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• ลองตั้งงบประมาณในหมวด "อาหาร" ให้เข้มงวดขึ้น</li>
                <li>• เพิ่มเป้าหมายการออมเป็น 25% ของรายรับ</li>
                <li>• พิจารณาลงทุนเพิ่มเติม</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Export and Actions */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            ดำเนินการเพิ่มเติม
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>📊</span>
              <span className="font-medium">ส่งออกรายงาน PDF</span>
            </button>
            <button 
              onClick={handleViewLastYear}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>📈</span>
              <span className="font-medium">ดูแนวโน้มปีก่อน</span>
            </button>
            <button 
              onClick={() => setShowGoalModal(true)}
              className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span>🎯</span>
              <span className="font-medium">ตั้งเป้าหมายใหม่</span>
            </button>
            <button 
              onClick={handleGetAdvice}
              className="flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <span>💡</span>
              <span className="font-medium">คำแนะนำเพิ่มเติม</span>
            </button>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowExportModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">📊</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">ส่งออกรายงาน</h3>
                    </div>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        รายงานที่จะส่งออก
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• สรุปรายรับ-จ่าย ({selectedPeriod === 'month' ? 'รายเดือน' : selectedPeriod === 'week' ? 'รายสัปดาห์' : 'รายปี'})</li>
                        <li>• การใช้จ่ายตามหมวดหมู่</li>
                        <li>• ความคืบหน้าเป้าหมาย</li>
                        <li>• คะแนนสุขภาพทางการเงิน</li>
                        <li>• แนวโน้มและวิเคราะห์</li>
                      </ul>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        รายงานจะถูกส่งออกในรูปแบบ JSON สำหรับการประมวลผลเพิ่มเติม
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isExporting ? 'กำลังส่งออก...' : 'ส่งออกรายงาน'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowGoalModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🎯</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">ตั้งเป้าหมายใหม่</h3>
                    </div>
                    <button
                      onClick={() => setShowGoalModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อเป้าหมาย
                      </label>
                      <input
                        type="text"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="เช่น MacBook ใหม่"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        จำนวนเป้าหมาย (บาท)
                      </label>
                      <input
                        type="number"
                        value={newGoal.target}
                        onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        หมวดหมู่
                      </label>
                      <select
                        value={newGoal.category}
                        onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="saving">การออม</option>
                        <option value="travel">ท่องเที่ยว</option>
                        <option value="gadget">อุปกรณ์</option>
                        <option value="education">การศึกษา</option>
                        <option value="health">สุขภาพ</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        วันที่เป้าหมาย
                      </label>
                      <input
                        type="date"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowGoalModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleCreateGoal}
                      disabled={isExporting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isExporting ? 'กำลังสร้าง...' : 'สร้างเป้าหมาย'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advice Modal */}
        {showAdviceModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowAdviceModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">💡</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">คำแนะนำทางการเงิน</h3>
                    </div>
                    <button
                      onClick={() => setShowAdviceModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-orange-600 dark:text-orange-400 text-2xl">🧠</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        คำแนะนำเฉพาะสำหรับคุณ
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        จากการวิเคราะห์พฤติกรรมการใช้จ่ายของคุณ
                      </p>
                    </div>

                    <div className="space-y-3">
                      {generateAdvice().map((advice, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg border border-orange-200 dark:border-orange-700">
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            {advice}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        🎯 เป้าหมายสำหรับเดือนหน้า
                      </h5>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• ลดการใช้จ่ายในหมวด "อาหาร" ลง 10%</li>
                        <li>• เพิ่มการออมให้ได้ ฿{Math.round(totalIncome * 0.05 / mockMonthlyData.length)} เพิ่มเติม</li>
                        <li>• ติดตามรายจ่ายทุกวันเป็นเวลา 1 สัปดาห์</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <button
                    onClick={() => setShowAdviceModal(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all duration-200 font-medium"
                  >
                    เข้าใจแล้ว ขอบคุณ!
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