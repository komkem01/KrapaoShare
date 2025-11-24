// Transaction types matching the Go backend structure

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string;
  transactionTime?: string | null;
  referenceNumber?: string | null;
  location?: string | null;
  notes?: string | null;
  tags?: string[];
  receiptUrl?: string | null;
  isRecurring: boolean;
  recurringBillId?: string | null;
  transferToAccountId?: string | null;
  billId?: string | null;
  sharedGoalId?: string | null;
  budgetId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateTransactionRequest {
  userId: string;
  accountId: string;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string; // Format: YYYY-MM-DD
  transactionTime?: string | null; // Format: HH:MM:SS
  referenceNumber?: string | null;
  location?: string | null;
  notes?: string | null;
  tags?: string[];
  receiptUrl?: string | null;
  isRecurring?: boolean;
  recurringBillId?: string | null;
  transferToAccountId?: string | null;
  billId?: string | null;
  sharedGoalId?: string | null;
  budgetId?: string | null;
}

export interface UpdateTransactionRequest {
  accountId?: string;
  categoryId?: string | null;
  type?: TransactionType;
  amount?: number;
  description?: string;
  transactionDate?: string;
  transactionTime?: string | null;
  referenceNumber?: string | null;
  location?: string | null;
  notes?: string | null;
  tags?: string[];
  receiptUrl?: string | null;
  isRecurring?: boolean;
  recurringBillId?: string | null;
  transferToAccountId?: string | null;
  billId?: string | null;
  sharedGoalId?: string | null;
  budgetId?: string | null;
}

export interface TransactionFilter {
  user_id?: string;
  account_id?: string;
  category_id?: string;
  type?: TransactionType;
  is_recurring?: boolean;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  bill_id?: string;
  shared_goal_id?: string;
  budget_id?: string;
  search?: string;
}