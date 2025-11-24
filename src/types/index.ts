// User types - สอดคล้องกับ API Response
export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  birth_date?: string;
  occupation?: string;
  address?: string;
  role: 'member' | 'admin' | 'owner';
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Transaction types - สอดคล้องกับ API Response
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string;
  transactionTime?: string;
  referenceNumber?: string;
  location?: string;
  notes?: string;
  tags: string[];
  receiptUrl?: string;
  isRecurring: boolean;
  recurringBillId?: string;
  transferToAccountId?: string;
  billId?: string;
  sharedGoalId?: string;
  budgetId?: string;
  createdAt: string;
  updatedAt: string;
}

// Bill Splitting types
export type SplitType = 'equal' | 'unequal' | 'percentage';

export interface BillParticipant {
  user_id: string;
  amount_owed: number;
  is_settled: boolean;
  settled_at?: string;
}

export interface BillSplit {
  bill_id: string;
  total_amount: number;
  description: string;
  date: string;
  payer_user_id: string; // คนที่จ่ายเงินไปก่อน
  split_type: SplitType;
  participants: BillParticipant[];
  is_fully_settled: boolean;
  created_at: string;
  updated_at: string;
}

// Budget types
export interface Budget {
  budget_id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number; // 1-12
  year: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

// Savings Goal types
export interface SavingsGoal {
  goal_id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Shared Goal types
export interface SharedGoalMember {
  user_id: string;
  amount_contributed: number;
  joined_at: string;
}

export interface SharedGoal {
  shared_goal_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  created_by_user_id: string;
  members: SharedGoalMember[];
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Recurring Bill types
export type BillFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringBill {
  recurring_bill_id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  due_date: string; // วันที่ต้องจ่าย
  frequency: BillFrequency;
  is_active: boolean;
  last_generated_date?: string;
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface IncomeVsExpense {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface DebtSummary {
  // หนี้ที่คนอื่นติดเรา
  owed_to_me: {
    user_id: string;
    user_name: string;
    total_amount: number;
    bills: {
      bill_id: string;
      description: string;
      amount: number;
      date: string;
    }[];
  }[];
  
  // หนี้ที่เราติดคนอื่น
  i_owe: {
    user_id: string;
    user_name: string;
    total_amount: number;
    bills: {
      bill_id: string;
      description: string;
      amount: number;
      date: string;
    }[];
  }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types - ปรับให้สอดคล้องกับ API
export interface AddTransactionForm {
  userId: string;
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string;
  transactionTime?: string;
  referenceNumber?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringBillId?: string;
  transferToAccountId?: string;
  billId?: string;
  sharedGoalId?: string;
  budgetId?: string;
}

// Account Form types
export interface CreateAccountForm {
  user_id: string;
  name: string;
  bank_name?: string;
  bank_number?: string;
  account_type?: 'personal' | 'shared' | 'business';
  color?: string;
  start_amount?: number;
  is_private?: boolean;
  is_active?: boolean;
}

// Category Form types
export interface CreateCategoryForm {
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense';
  is_active?: boolean;
}

// Notification Form types
export interface CreateNotificationForm {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  icon?: string;
  data?: Record<string, unknown>;
  action_url?: string;
  expires_at?: string;
}

export interface CreateBillSplitForm {
  total_amount: number;
  description: string;
  payer_user_id: string;
  participant_user_ids: string[];
  split_type: SplitType;
  amounts_list?: number[]; // สำหรับ unequal split
  date: string;
}

export interface CreateBudgetForm {
  category: string;
  amount: number;
  month: number;
  year: number;
}

export interface CreateSavingsGoalForm {
  goal_name: string;
  target_amount: number;
  target_date: string;
}

export interface CreateSharedGoalForm {
  goal_name: string;
  target_amount: number;
  target_date: string;
  member_user_ids: string[];
}

// Account types - เพิ่มเติมจาก API
export interface Account {
  id: string;
  user_id: string;
  name: string;
  bank_name?: string;
  bank_number?: string;
  account_type: 'personal' | 'shared' | 'business';
  color?: string;
  start_amount: number;
  current_balance: number;
  is_private: boolean;
  is_active: boolean;
  share_code?: string;
  created_at: string;
  updated_at: string;
}

// Account Member types
export interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  joined_at: string;
  invited_by?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  account_name?: string;
}

// Account Transfer types
export interface AccountTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  transfer_fee: number;
  exchange_rate: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Category types - สอดคล้องกับ API
export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Notification types - สอดคล้องกับ API
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  icon?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Types management
export interface Type {
  id: string | number;
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypeFormData {
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active?: boolean;
}