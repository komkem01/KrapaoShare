'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts, type Account } from '@/contexts/AccountContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getStoredUser } from '@/utils/authStorage';
import { accountTransactionApi } from '@/utils/apiClient';
import type { Transaction, TransactionType } from '@/types/transaction';

export default function TransactionsPage() {
  const router = useRouter();
  const { transactions, isLoading, error, refreshTransactions, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts, refreshAccounts, updateBalance } = useAccounts();
  const safeAccounts = (accounts ?? []).filter(
    (account): account is Account => Boolean(account && account.id)
  );

  useEffect(() => {
    if (accounts && accounts.some(account => !account || !account.id)) {
      console.warn('Detected invalid account entries from API response:', accounts);
    }
  }, [accounts]);

  const { categories: userCategories } = useCategories();
  const { addNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(5); // เริ่มต้นด้วย 5 รายการต่อหน้า
  const [isChangingPage, setIsChangingPage] = useState(false);

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
  const filteredTransactions = (transactions || []).filter(transaction => {
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
    const account = safeAccounts.find(acc => acc.id === accountId);
    return account?.name || 'ไม่ระบุบัญชี';
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return 'ไม่ระบุหมวดหมู่';
    // userCategories is CategoryState with income and expense arrays
    const allCategories = [...(userCategories?.income || []), ...(userCategories?.expense || [])];
    const category = allCategories?.find((cat: any) => cat.id === categoryId);
    return category?.name || 'ไม่ระบุหมวดหมู่';
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditDate(transaction.transactionDate.split('T')[0]); // Convert to YYYY-MM-DD format
    setShowEditModal(true);
  };

  const handleEditConfirm = async () => {
    if (!editingTransaction) return;
    
    setIsSubmitting(true);
    try {
      const oldAmount = editingTransaction.amount;
      const newAmount = parseFloat(editAmount);
      const amountDifference = newAmount - oldAmount;
      
      // Update transaction
      await updateTransaction(editingTransaction.id, {
        amount: newAmount,
        description: editDescription.trim(),
        transactionDate: editDate
      });

      // If amount changed, update account balance and account transaction
      if (amountDifference !== 0) {
        const operation = editingTransaction.type === 'expense' ? 
          (amountDifference > 0 ? 'subtract' : 'add') : 
          (amountDifference > 0 ? 'add' : 'subtract');
        
        await updateBalance(editingTransaction.accountId, {
          amount: Math.abs(amountDifference),
          operation,
          note: `แก้ไขรายการ: ${editDescription.trim()}`
        });

        // Find and update account transaction record
        try {
          const accountTransactions = await accountTransactionApi.list({
            account_id: editingTransaction.accountId,
            user_id: getStoredUser()?.id
          });
          
          // Find matching account transaction (same date, similar amount)
          const relatedAccountTransaction = Array.isArray(accountTransactions) ? 
            accountTransactions.find((at: any) => 
              Math.abs(at.amount - oldAmount) < 0.01 && 
              new Date(at.created_at).toDateString() === new Date(editingTransaction.transactionDate).toDateString()
            ) : null;

          if (relatedAccountTransaction) {
            await accountTransactionApi.update(relatedAccountTransaction.id, {
              amount: newAmount,
              note: `แก้ไข: ${editDescription.trim()}`
            });
          }
        } catch (error) {
          console.log('Could not update account transaction record:', error);
        }
      }
      
      await addNotification({
        title: 'แก้ไขรายการสำเร็จ',
        message: `แก้ไขรายการ "${editDescription}" เรียบร้อยแล้ว`,
        type: 'success',
        priority: 'normal'
      });
      
      setShowEditModal(false);
      setEditingTransaction(null);
      
      // Refresh data
      await refreshTransactions();
      await refreshAccounts();
    } catch (error) {
      console.error('Error updating transaction:', error);
      await addNotification({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถแก้ไขรายการได้ กรุณาลองใหม่อีกครั้ง',
        type: 'error',
        priority: 'high'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    
    setIsSubmitting(true);
    try {
      // Reverse the account balance change
      const operation = deletingTransaction.type === 'expense' ? 'add' : 'subtract';
      await updateBalance(deletingTransaction.accountId, {
        amount: deletingTransaction.amount,
        operation,
        note: `ลบรายการ: ${deletingTransaction.description}`
      });

      // Find and delete related account transaction record
      try {
        const accountTransactions = await accountTransactionApi.list({
          account_id: deletingTransaction.accountId,
          user_id: getStoredUser()?.id
        });
        
        // Find matching account transaction
        const relatedAccountTransaction = Array.isArray(accountTransactions) ? 
          accountTransactions.find((at: any) => 
            Math.abs(at.amount - deletingTransaction.amount) < 0.01 && 
            new Date(at.created_at).toDateString() === new Date(deletingTransaction.transactionDate).toDateString()
          ) : null;

        if (relatedAccountTransaction) {
          await accountTransactionApi.delete(relatedAccountTransaction.id);
        }
      } catch (error) {
        console.log('Could not delete account transaction record:', error);
      }

      // Delete the main transaction
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
    if (page === currentPage) return;
    
    setIsChangingPage(true);
    setCurrentPage(page);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setIsChangingPage(false);
    }, 150);
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
            { key: 'all', label: 'ทั้งหมด', count: (transactions || []).length },
            { key: 'income', label: 'รายรับ', count: (transactions || []).filter(t => t.type === 'income').length },
            { key: 'expense', label: 'รายจ่าย', count: (transactions || []).filter(t => t.type === 'expense').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as 'all' | 'income' | 'expense');
                setCurrentPage(1); // Reset to first page when changing tabs
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm relative">
          {/* Loading Overlay for Pagination */}
          {isChangingPage && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium">กำลังโหลด...</span>
              </div>
            </div>
          )}
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
                            onClick={() => handleEditClick(transaction)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="แก้ไขรายการ"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page Info */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    แสดง <span className="font-medium text-gray-900 dark:text-white">{startIndex + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredTransactions.length)}</span> จาก <span className="font-medium text-gray-900 dark:text-white">{filteredTransactions.length}</span> รายการ
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">
                    หน้า <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> จาก <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                  </span>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center space-x-1">
                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title="หน้าแรก"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M21 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Previous Page */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>ก่อนหน้า</span>
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const maxVisiblePages = 5;
                      const pages = [];
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      
                      // Adjust startPage if we're near the end
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }
                      
                      // Show first page and ellipsis if needed
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className="px-3 py-1 text-sm rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="px-2 py-1 text-sm text-gray-400">...</span>
                          );
                        }
                      }
                      
                      // Show visible page numbers
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              currentPage === i
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      // Show ellipsis and last page if needed
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="px-2 py-1 text-sm text-gray-400">...</span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className="px-3 py-1 text-sm rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </div>
                  
                  {/* Next Page */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1"
                  >
                    <span>ถัดไป</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title="หน้าสุดท้าย"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M3 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Items Per Page Selector */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">แสดงรายการต่อหน้า:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const newItemsPerPage = parseInt(e.target.value);
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1); // Reset to first page
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                {/* Quick Jump */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ไปหน้า:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const page = parseInt(e.currentTarget.value);
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                        }
                      }
                    }}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    placeholder={currentPage.toString()}
                  />
                  <span className="text-gray-600 dark:text-gray-400">/ {totalPages}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Transaction Modal */}
        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-xl">
              <div>
                <div className="text-blue-600 dark:text-blue-400 mb-4 text-center">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">แก้ไขรายการ</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      จำนวนเงิน (฿)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      รายละเอียด
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="รายละเอียดรายการ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      วันที่
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTransaction(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleEditConfirm}
                    disabled={isSubmitting || !editAmount || !editDescription.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      'บันทึกการแก้ไข'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingTransaction && (
          <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 border-2 border-red-200 dark:border-red-800 shadow-2xl">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 ">ยืนยันการลบ</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  คุณต้องการลบรายการ "{deletingTransaction.description}" หรือไม่?<br/>
                  การดำเนินการนี้จะส่งผลต่อยอดเงินในบัญชีของคุณ
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