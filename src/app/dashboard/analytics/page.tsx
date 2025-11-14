'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data - ในอนาคตจะเชื่อมกับ API
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

  const totalIncome = mockMonthlyData.reduce((sum, month) => sum + month.income, 0);
  const totalExpense = mockMonthlyData.reduce((sum, month) => sum + month.expense, 0);
  const totalSavings = mockMonthlyData.reduce((sum, month) => sum + month.savings, 0);
  const avgMonthlyExpense = totalExpense / mockMonthlyData.length;
  const maxExpense = Math.max(...mockWeeklySpending.map(day => day.amount));

  // Calculate trend
  const lastThreeMonths = mockMonthlyData.slice(-3);
  const expenseTrend = lastThreeMonths[2].expense > lastThreeMonths[0].expense ? 'increasing' : 'decreasing';
  const savingsTrend = lastThreeMonths[2].savings > lastThreeMonths[0].savings ? 'increasing' : 'decreasing';

  return (
    <DashboardLayout>
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
              {mockMonthlyData.map((month, index) => (
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
              {mockCategoryData.map((category, index) => (
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
            <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              <span>📊</span>
              <span className="font-medium">ส่งออกรายงาน PDF</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
              <span>📈</span>
              <span className="font-medium">ดูแนวโน้มปีก่อน</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              <span>🎯</span>
              <span className="font-medium">ตั้งเป้าหมายใหม่</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors">
              <span>💡</span>
              <span className="font-medium">คำแนะนำเพิ่มเติม</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}