"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { transactionApi, importedTransactionApi } from '@/utils/apiClient';
import { normalizeListResponse, PaginatedPayload, PaginatedMeta } from '@/utils/apiResponse';
import { getStoredUser } from '@/utils/authStorage';
import type { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest, 
  TransactionFilter 
} from '@/types/transaction';

interface TransactionContextType {
  transactions: Transaction[];
  paginationMeta?: PaginatedMeta;
  isLoading: boolean;
  error: string | null;
  
  // Transaction operations
  refreshTransactions: () => Promise<void>;
  getTransaction: (id: string) => Promise<Transaction | null>;
  getTransactionsByUser: (userId: string, filters?: TransactionFilter) => Promise<Transaction[]>;
  getTransactionsByAccount: (accountId: string, filters?: TransactionFilter) => Promise<Transaction[]>;
  createTransaction: (data: CreateTransactionRequest) => Promise<Transaction>;
  updateTransaction: (id: string, data: UpdateTransactionRequest) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Imported transaction operations
  getImportedTransactions: (filters?: Record<string, unknown>) => Promise<unknown[]>;
  createImportedTransaction: (data: unknown) => Promise<unknown>;
  updateImportedTransaction: (id: string, data: unknown) => Promise<unknown>;
  deleteImportedTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginatedMeta | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type TransactionListPayload = Transaction[] | PaginatedPayload<Transaction> | undefined;

  const normalizeTransactions = useCallback((payload: TransactionListPayload) => {
    return normalizeListResponse<Transaction>(payload);
  }, []);

  const refreshTransactions = useCallback(async () => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id;
    
    if (!userId) {
      console.warn('No user ID available for fetching transactions');
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await transactionApi.list({ user_id: userId });
      console.log('Transactions API response:', response);

      const { items, meta } = normalizeTransactions(response as TransactionListPayload);
      setTransactions(items);
      setPaginationMeta(meta);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('ไม่สามารถโหลดข้อมูลรายการได้');
      setTransactions([]);
      setPaginationMeta(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTransaction = useCallback(async (id: string): Promise<Transaction | null> => {
    try {
      const transaction = await transactionApi.getById(id) as Transaction;
      return transaction;
    } catch (err) {
      console.error(`Failed to fetch transaction ${id}:`, err);
      setError('ไม่สามารถโหลดข้อมูลรายการได้');
      return null;
    }
  }, []);

  const getTransactionsByUser = useCallback(async (userId: string, filters?: TransactionFilter): Promise<Transaction[]> => {
    try {
      const payload = (await transactionApi.list({ user_id: userId, ...filters })) as TransactionListPayload;
      return normalizeTransactions(payload).items;
    } catch (err) {
      console.error(`Failed to fetch transactions for user ${userId}:`, err);
      setError('ไม่สามารถโหลดข้อมูลรายการได้');
      return [];
    }
  }, []);

  const getTransactionsByAccount = useCallback(async (accountId: string, filters?: TransactionFilter): Promise<Transaction[]> => {
    try {
      const payload = (await transactionApi.list({ account_id: accountId, ...filters })) as TransactionListPayload;
      return normalizeTransactions(payload).items;
    } catch (err) {
      console.error(`Failed to fetch transactions for account ${accountId}:`, err);
      setError('ไม่สามารถโหลดข้อมูลรายการได้');
      return [];
    }
  }, []);

  const createTransaction = useCallback(async (data: CreateTransactionRequest): Promise<Transaction> => {
    try {
      // Convert null values to undefined for API compatibility
      const apiData = {
        ...data,
        categoryId: data.categoryId || undefined,
        transactionTime: data.transactionTime || undefined,
        referenceNumber: data.referenceNumber || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
        receiptUrl: data.receiptUrl || undefined,
        recurringBillId: data.recurringBillId || undefined,
        transferToAccountId: data.transferToAccountId || undefined,
        billId: data.billId || undefined,
        sharedGoalId: data.sharedGoalId || undefined,
        budgetId: data.budgetId || undefined,
      };
      
      const transaction = await transactionApi.create(apiData) as Transaction;
      
      // Refresh transactions to get updated list
      await refreshTransactions();
      
      return transaction;
    } catch (err) {
      console.error('Failed to create transaction:', err);
      throw new Error('ไม่สามารถสร้างรายการได้');
    }
  }, [refreshTransactions]);

  const updateTransaction = useCallback(async (id: string, data: UpdateTransactionRequest): Promise<Transaction> => {
    try {
      // Convert null values to undefined for API compatibility
      const apiData = {
        ...data,
        categoryId: data.categoryId || undefined,
        transactionTime: data.transactionTime || undefined,
        referenceNumber: data.referenceNumber || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
        receiptUrl: data.receiptUrl || undefined,
        recurringBillId: data.recurringBillId || undefined,
        transferToAccountId: data.transferToAccountId || undefined,
        billId: data.billId || undefined,
        sharedGoalId: data.sharedGoalId || undefined,
        budgetId: data.budgetId || undefined,
      };
      
      const transaction = await transactionApi.update(id, apiData) as Transaction;
      
      // Update local state
      setTransactions(prev => prev.map(t => t.id === id ? transaction : t));
      
      return transaction;
    } catch (err) {
      console.error(`Failed to update transaction ${id}:`, err);
      throw new Error('ไม่สามารถอัปเดตรายการได้');
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      await transactionApi.delete(id);
      
      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(`Failed to delete transaction ${id}:`, err);
      throw new Error('ไม่สามารถลบรายการได้');
    }
  }, []);

  // Imported transaction operations
  const getImportedTransactions = useCallback(async (filters?: Record<string, unknown>) => {
    try {
      const transactions = await importedTransactionApi.list(filters);
      return Array.isArray(transactions) ? transactions : [];
    } catch (err) {
      console.error('Failed to fetch imported transactions:', err);
      setError('ไม่สามารถโหลดข้อมูลรายการนำเข้าได้');
      return [];
    }
  }, []);

  const createImportedTransaction = useCallback(async (data: unknown) => {
    try {
      const transaction = await importedTransactionApi.create(data);
      return transaction;
    } catch (err) {
      console.error('Failed to create imported transaction:', err);
      throw new Error('ไม่สามารถสร้างรายการนำเข้าได้');
    }
  }, []);

  const updateImportedTransaction = useCallback(async (id: string, data: unknown) => {
    try {
      const transaction = await importedTransactionApi.update(id, data);
      return transaction;
    } catch (err) {
      console.error(`Failed to update imported transaction ${id}:`, err);
      throw new Error('ไม่สามารถอัปเดตรายการนำเข้าได้');
    }
  }, []);

  const deleteImportedTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      await importedTransactionApi.delete(id);
    } catch (err) {
      console.error(`Failed to delete imported transaction ${id}:`, err);
      throw new Error('ไม่สามารถลบรายการนำเข้าได้');
    }
  }, []);

  const value: TransactionContextType = {
    transactions,
    paginationMeta,
    isLoading,
    error,
    refreshTransactions,
    getTransaction,
    getTransactionsByUser,
    getTransactionsByAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getImportedTransactions,
    createImportedTransaction,
    updateImportedTransaction,
    deleteImportedTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};