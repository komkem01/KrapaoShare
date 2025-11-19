// User types
export interface User {
  user_id: string;
  firstname: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Transaction types
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  transaction_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  bill_split_id?: string; // เชื่อมโยงกับ BillSplit ถ้ามี
  shared_goal_id?: string; // เชื่อมโยงกับ SharedGoal ถ้ามี
  created_at: string;
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

// Form types
export interface AddTransactionForm {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
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