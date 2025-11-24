import { useState, useCallback } from 'react';
import { useTransactions } from '@/contexts/TransactionContext';
import type { Transaction, TransactionFilter } from '@/types/transaction';

export interface UseTransactionFiltersOptions {
  initialFilters?: TransactionFilter;
  autoFetch?: boolean;
}

export const useTransactionFilters = ({
  initialFilters = {},
  autoFetch = true,
}: UseTransactionFiltersOptions = {}) => {
  const { getTransactionsByUser, getTransactionsByAccount } = useTransactions();
  
  const [filters, setFilters] = useState<TransactionFilter>(initialFilters);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionsByUser = useCallback(async (userId: string, customFilters?: TransactionFilter) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filterToUse = customFilters || filters;
      const result = await getTransactionsByUser(userId, filterToUse);
      setTransactions(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filters, getTransactionsByUser]);

  const fetchTransactionsByAccount = useCallback(async (accountId: string, customFilters?: TransactionFilter) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filterToUse = customFilters || filters;
      const result = await getTransactionsByAccount(accountId, filterToUse);
      setTransactions(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filters, getTransactionsByAccount]);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  return {
    // State
    filters,
    transactions,
    isLoading,
    error,
    
    // Actions
    updateFilters,
    resetFilters,
    clearTransactions,
    fetchTransactionsByUser,
    fetchTransactionsByAccount,
    
    // Computed
    hasTransactions: transactions.length > 0,
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    expenseAmount: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    incomeAmount: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
  };
};

// Hook for transaction statistics
export const useTransactionStats = (transactions: Transaction[]) => {
  return {
    total: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    
    // By type
    expenses: transactions.filter(t => t.type === 'expense'),
    income: transactions.filter(t => t.type === 'income'),
    transfers: transactions.filter(t => t.type === 'transfer'),
    
    // Amounts by type
    expenseAmount: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    incomeAmount: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    transferAmount: transactions.filter(t => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0),
    
    // By date ranges
    today: transactions.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.transactionDate.startsWith(today);
    }),
    
    thisWeek: transactions.filter(t => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(t.transactionDate) >= weekAgo;
    }),
    
    thisMonth: transactions.filter(t => {
      const now = new Date();
      const transactionDate = new Date(t.transactionDate);
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    }),
    
    // Recurring transactions
    recurring: transactions.filter(t => t.isRecurring),
    nonRecurring: transactions.filter(t => !t.isRecurring),
  };
};