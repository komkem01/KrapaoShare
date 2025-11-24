'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useUser } from '@/contexts/UserContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Transaction } from '@/types/transaction';

export default function DashboardPage() {
  const { user } = useUser();
  const { transactions, isLoading: transactionsLoading, refreshTransactions } = useTransactions();
  const { accounts, isLoading: accountsLoading, refreshAccounts } = useAccounts();
  const { notifications, unreadCount } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          refreshTransactions(),
          refreshAccounts()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshTransactions, refreshAccounts]);

  // Calculate financial summary
  const financialSummary = {
    totalBalance: accounts.reduce((sum, account) => sum + account.current_balance, 0),
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingNotifications: unreadCount
  };

  // Get recent transactions (last 4)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return '💰';
      case 'expense':
        return '💳';
      case 'transfer':
        return '🔄';
      default:
        return '📄';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      case 'transfer':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (isLoading || transactionsLoading || accountsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
            สวัสดี! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            วันนี้เป็นอย่างไรบ้าง มาดูภาพรวมการเงินของคุณกัน
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ยอดคงเหลือรวม</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(financialSummary.totalBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">รายรับทั้งหมด</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  +{formatCurrency(financialSummary.totalIncome)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">รายจ่ายทั้งหมด</p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  -{formatCurrency(financialSummary.totalExpense)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-xl">📉</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">การแจ้งเตือน</p>
                <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                  {financialSummary.pendingNotifications} รายการ
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-xl">🔔</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            การดำเนินการด่วน
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/transactions" className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-2xl">💸</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">เพิ่มรายจ่าย</span>
            </Link>
            <Link href="/dashboard/transactions" className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-2xl">💵</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">เพิ่มรายรับ</span>
            </Link>
            <Link href="/dashboard/bills" className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-2xl">🧾</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">แบ่งบิล</span>
            </Link>
            <Link href="/dashboard/goals" className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-2xl">🎯</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">ตั้งเป้าหมาย</span>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                รายการล่าสุด
              </h3>
              <Link href="/dashboard/transactions" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">ยังไม่มีรายการ</p>
                  <Link 
                    href="/dashboard/add-transaction"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-2 inline-block"
                  >
                    เพิ่มรายการแรก
                  </Link>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : transaction.type === 'expense'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        <span className="text-lg">
                          {getTransactionIcon(transaction.type)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.transactionDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Budget Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                การใช้จ่ายเดือนนี้
              </h3>
              <Link href="/dashboard/budgets" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                จัดการงบประมาณ →
              </Link>
            </div>
            <div className="space-y-4">
              {transactions.filter(t => t.type === 'expense').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">ยังไม่มีข้อมูลการใช้จ่าย</p>
                  <Link 
                    href="/dashboard/budgets"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    ตั้งงบประมาณ
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">รายจ่ายทั้งหมด</span>
                    <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(financialSummary.totalExpense)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">รายการทั้งหมด</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {transactions.filter(t => t.type === 'expense').length} รายการ
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link 
                      href="/dashboard/analytics"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      ดูสถิติการใช้จ่าย →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}