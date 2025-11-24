'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getStoredUser } from '@/utils/authStorage';
import type { Transaction, TransactionType } from '@/types/transaction';

export default function TransactionsPage() {
  const router = useRouter();
  const { transactions, isLoading, error, refreshTransactions, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts, refreshAccounts } = useAccounts();
  const { categories: userCategories } = useCategories();
  const { addNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

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

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    return transaction.type === activeTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'ไม่ระบุบัญชี';
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return 'ไม่ระบุหมวดหมู่';
    // userCategories is CategoryState with income and expense arrays
    const allCategories = [...(userCategories.income || []), ...(userCategories.expense || [])];
    const category = allCategories.find((cat: any) => cat.id === categoryId);
    return category?.name || 'ไม่ระบุหมวดหมู่';
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    
    setIsSubmitting(true);
    try {
      await deleteTransaction(deletingTransaction.id);
      
      await addNotification({
        title: 'ลบรายการสำเร็จ',
        message: `ลบรายการ "${deletingTransaction.description}" เรียบร้อยแล้ว`,
        type: 'success',
        priority: 'normal'
      });
      
      setShowDeleteModal(false);
      setDeletingTransaction(null);
      
      // Refresh data
      await refreshTransactions();
      await refreshAccounts();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      await addNotification({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง',
        type: 'error',
        priority: 'high'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getTransactionIcon = (type: TransactionType) => {
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

  const getTransactionTypeText = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return 'รายรับ';
      case 'expense':
        return 'รายจ่าย';
      case 'transfer':
        return 'โอนเงิน';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: TransactionType) => {
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => refreshTransactions()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">รายการเงิน</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">ดูและจัดการรายการรับจ่ายทั้งหมด</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/add-transaction')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            เพิ่มรายการ
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {[
            { key: 'all', label: 'ทั้งหมด', count: transactions.length },
            { key: 'income', label: 'รายรับ', count: transactions.filter(t => t.type === 'income').length },
            { key: 'expense', label: 'รายจ่าย', count: transactions.filter(t => t.type === 'expense').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as 'all' | 'income' | 'expense');
                setCurrentPage(1);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">ยังไม่มีรายการ</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'all' ? 'ยังไม่มีรายการเงินใดๆ' : 
                 activeTab === 'income' ? 'ยังไม่มีรายการรับเงิน' : 
                 'ยังไม่มีรายการจ่ายเงิน'}
              </p>
              <button
                onClick={() => router.push('/dashboard/add-transaction')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                เพิ่มรายการแรก
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {transaction.description}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span>{getTransactionTypeText(transaction.type)}</span>
                            <span>•</span>
                            <span>{getCategoryName(transaction.categoryId)}</span>
                            <span>•</span>
                            <span>{getAccountName(transaction.accountId)}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.transactionDate)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'expense' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/dashboard/transactions/${transaction.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(transaction)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="ลบรายการ"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} จาก {filteredTransactions.length} รายการ
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">ยืนยันการลบ</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  คุณต้องการลบรายการ "{deletingTransaction.description}" หรือไม่?<br/>
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingTransaction(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      'ลบรายการ'
                    )}
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