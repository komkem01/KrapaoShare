"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiClient } from '@/utils/apiClient';
import { getStoredUser } from '@/utils/authStorage';

// API Response Types based on Go backend
export interface Account {
  id: string;
  user_id: string;
  name: string;
  bank_name: string | null;
  bank_number: string | null;
  account_type: 'personal' | 'shared' | 'business';
  color: string | null;
  start_amount: number;
  current_balance: number;
  is_private: boolean;
  is_active: boolean;
  share_code: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  can_deposit: boolean;
  can_withdraw: boolean;
  joined_at: string;
  invited_by: string | null;
}

export interface AccountTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  note: string | null;
  transferred_by: string;
  created_at: string;
}

export interface CreateAccountRequest {
  user_id: string;
  name: string;
  bank_name?: string | null;
  bank_number?: string | null;
  account_type?: 'personal' | 'shared' | 'business';
  color?: string | null;
  start_amount?: number;
  is_private?: boolean;
  is_active?: boolean;
}

export type CreateAccountInput = Omit<CreateAccountRequest, 'user_id'>;

export interface UpdateAccountRequest {
  name?: string;
  bank_name?: string | null;
  bank_number?: string | null;
  account_type?: 'personal' | 'shared' | 'business';
  color?: string | null;
  start_amount?: number;
  current_balance?: number;
  is_private?: boolean;
  is_active?: boolean;
}

export interface UpdateBalanceRequest {
  amount: number;
  operation: 'add' | 'subtract' | 'set';
  note?: string;
}

export interface CreateTransferRequest {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  note?: string;
}

interface AccountContextType {
  accounts: Account[];
  members: Record<string, AccountMember[]>;
  isLoading: boolean;
  error: string | null;
  
  // Account operations
  refreshAccounts: () => Promise<void>;
  getAccount: (id: string) => Promise<Account | null>;
  getAccountsByUser: (userId: string) => Promise<Account[]>;
  getAccountByShareCode: (shareCode: string) => Promise<Account | null>;
  createAccount: (data: CreateAccountInput) => Promise<Account>;
  updateAccount: (id: string, data: UpdateAccountRequest) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  updateBalance: (id: string, data: UpdateBalanceRequest) => Promise<Account>;
  
  // Member operations
  getAccountMembers: (accountId: string) => Promise<AccountMember[]>;
  addMember: (accountId: string, userId: string, role: 'admin' | 'member', permissions: string[]) => Promise<AccountMember>;
  updateMember: (memberId: string, permissions: string[]) => Promise<AccountMember>;
  removeMember: (memberId: string) => Promise<void>;
  
  // Transfer operations
  createTransfer: (data: CreateTransferRequest) => Promise<AccountTransfer>;
  getTransfers: (accountId?: string) => Promise<AccountTransfer[]>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};

interface AccountProviderProps {
  children: ReactNode;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Record<string, AccountMember[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id as string | undefined;
    
    if (!userId) {
      console.warn('No user ID available for fetching accounts');
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      setAccounts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Account[]>(`/accounts/user/${userId}`);
      console.log('Accounts API response:', response);

      const accountsData = (Array.isArray(response) ? response : [])
        .filter((account): account is Account => Boolean(account && account.id));
      setAccounts(accountsData);

      // Fetch members for shared accounts
      for (const account of accountsData) {
        if (account.account_type === 'shared') {
          try {
            const accountMembers = await apiClient.get<AccountMember[]>(`/account-members/account/${account.id}`);
            setMembers(prev => ({
              ...prev,
              [account.id]: Array.isArray(accountMembers) ? accountMembers : []
            }));
          } catch (err) {
            console.error(`Failed to fetch members for account ${account.id}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('ไม่สามารถโหลดข้อมูลบัญชีได้');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccount = useCallback(async (id: string): Promise<Account | null> => {
    try {
      const account = await apiClient.get<Account>(`/accounts/${id}`);
      return account;
    } catch (err) {
      console.error(`Failed to fetch account ${id}:`, err);
      setError('ไม่สามารถโหลดข้อมูลบัญชีได้');
      return null;
    }
  }, []);

  const getAccountsByUser = useCallback(async (userId: string): Promise<Account[]> => {
    try {
      const accounts = await apiClient.get<Account[]>(`/accounts/user/${userId}`);
      return Array.isArray(accounts) ? accounts : [];
    } catch (err) {
      console.error(`Failed to fetch accounts for user ${userId}:`, err);
      setError('ไม่สามารถโหลดข้อมูลบัญชีได้');
      return [];
    }
  }, []);

  const getAccountByShareCode = useCallback(async (shareCode: string): Promise<Account | null> => {
    try {
      const account = await apiClient.get<Account>(`/accounts/share/${shareCode}`);
      return account;
    } catch (err) {
      console.error(`Failed to fetch account with share code ${shareCode}:`, err);
      setError('ไม่พบบัญชีที่ระบุ หรือรหัสไม่ถูกต้อง');
      return null;
    }
  }, []);

  const createAccount = useCallback(async (data: CreateAccountInput): Promise<Account> => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id as string | undefined;
    
    if (!userId) {
      throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
    }

    try {
      const payload: CreateAccountRequest = {
        user_id: userId,
        name: data.name,
        bank_name: data.bank_name || null,
        bank_number: data.bank_number || null,
        account_type: data.account_type || 'personal',
        color: data.color || '#3B82F6',
        start_amount: data.start_amount || 0,
        is_private: data.is_private ?? false,
        is_active: data.is_active ?? true,
      };

      const account = await apiClient.post<Account>('/accounts', payload);
      setAccounts(prev => [...prev, account]);
      return account;
    } catch (err) {
      console.error('Failed to create account:', err);
      throw new Error('ไม่สามารถสร้างบัญชีได้');
    }
  }, []);

  const updateAccount = useCallback(async (id: string, data: UpdateAccountRequest): Promise<Account> => {
    try {
      const account = await apiClient.patch<Account>(`/accounts/${id}`, data);
      setAccounts(prev => prev.map(acc => acc.id === id ? account : acc));
      return account;
    } catch (err) {
      console.error(`Failed to update account ${id}:`, err);
      throw new Error('ไม่สามารถอัปเดตบัญชีได้');
    }
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/accounts/${id}`);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      
      // Remove members data for this account
      setMembers(prev => {
        const newMembers = { ...prev };
        delete newMembers[id];
        return newMembers;
      });
    } catch (err) {
      console.error(`Failed to delete account ${id}:`, err);
      throw new Error('ไม่สามารถลบบัญชีได้');
    }
  }, []);

  const updateBalance = useCallback(async (id: string, data: UpdateBalanceRequest): Promise<Account> => {
    try {
      const account = await apiClient.patch<Account>(`/accounts/${id}/balance`, data);
      setAccounts(prev =>
        prev
          .filter((acc): acc is Account => Boolean(acc && acc.id))
          .map(acc => acc.id === id ? account : acc)
      );
      return account;
    } catch (err) {
      console.error(`Failed to update balance for account ${id}:`, err);
      throw new Error('ไม่สามารถอัปเดตยอดเงินได้');
    }
  }, []);

  const getAccountMembers = useCallback(async (accountId: string): Promise<AccountMember[]> => {
    try {
      const accountMembers = await apiClient.get<AccountMember[]>(`/account-members/account/${accountId}`);
      const membersList = Array.isArray(accountMembers) ? accountMembers : [];
      
      setMembers(prev => ({
        ...prev,
        [accountId]: membersList
      }));
      
      return membersList;
    } catch (err) {
      console.error(`Failed to fetch members for account ${accountId}:`, err);
      setError('ไม่สามารถโหลดข้อมูลสมาชิกได้');
      return [];
    }
  }, []);

  const addMember = useCallback(async (
    accountId: string,
    userId: string,
    role: 'admin' | 'member',
    permissions: string[]
  ): Promise<AccountMember> => {
    try {
      const payload = {
        account_id: accountId,
        user_id: userId,
        role,
        permissions,
        can_deposit: permissions.includes('deposit'),
        can_withdraw: permissions.includes('withdraw'),
      };

      const member = await apiClient.post<AccountMember>('/account-members', payload);
      
      setMembers(prev => ({
        ...prev,
        [accountId]: [...(prev[accountId] || []), member]
      }));

      return member;
    } catch (err) {
      console.error('Failed to add member:', err);
      throw new Error('ไม่สามารถเพิ่มสมาชิกได้');
    }
  }, []);

  const updateMember = useCallback(async (
    memberId: string,
    permissions: string[]
  ): Promise<AccountMember> => {
    try {
      const payload = {
        permissions,
        can_deposit: permissions.includes('deposit'),
        can_withdraw: permissions.includes('withdraw'),
      };

      const member = await apiClient.patch<AccountMember>(`/account-members/${memberId}`, payload);
      
      // Update members in state
      setMembers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(accountId => {
          updated[accountId] = updated[accountId].map(m => 
            m.id === memberId ? member : m
          );
        });
        return updated;
      });

      return member;
    } catch (err) {
      console.error(`Failed to update member ${memberId}:`, err);
      throw new Error('ไม่สามารถอัปเดตสมาชิกได้');
    }
  }, []);

  const removeMember = useCallback(async (memberId: string): Promise<void> => {
    try {
      await apiClient.delete(`/account-members/${memberId}`);
      
      // Remove member from state
      setMembers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(accountId => {
          updated[accountId] = updated[accountId].filter(m => m.id !== memberId);
        });
        return updated;
      });
    } catch (err) {
      console.error(`Failed to remove member ${memberId}:`, err);
      throw new Error('ไม่สามารถลบสมาชิกได้');
    }
  }, []);

  const createTransfer = useCallback(async (data: CreateTransferRequest): Promise<AccountTransfer> => {
    try {
      const transfer = await apiClient.post<AccountTransfer>('/account-transfers', data);
      
      // Refresh accounts to get updated balances
      await refreshAccounts();
      
      return transfer;
    } catch (err) {
      console.error('Failed to create transfer:', err);
      throw new Error('ไม่สามารถโอนเงินได้');
    }
  }, [refreshAccounts]);

  const getTransfers = useCallback(async (accountId?: string): Promise<AccountTransfer[]> => {
    try {
      const endpoint = accountId 
        ? `/account-transfers?account_id=${accountId}`
        : '/account-transfers';
      
      const transfers = await apiClient.get<AccountTransfer[]>(endpoint);
      return Array.isArray(transfers) ? transfers : [];
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
      setError('ไม่สามารถโหลดประวัติการโอนได้');
      return [];
    }
  }, []);

  const value: AccountContextType = {
    accounts,
    members,
    isLoading,
    error,
    refreshAccounts,
    getAccount,
    getAccountsByUser,
    getAccountByShareCode,
    createAccount,
    updateAccount,
    deleteAccount,
    updateBalance,
    getAccountMembers,
    addMember,
    updateMember,
    removeMember,
    createTransfer,
    getTransfers,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};
