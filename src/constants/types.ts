/**
 * Transaction Type Constants
 * 
 * These UUIDs are deterministic and match the backend's UUID generation:
 * - Income: uuid.NewSHA1(uuid.NameSpaceOID, []byte("income"))
 * - Expense: uuid.NewSHA1(uuid.NameSpaceOID, []byte("expense"))
 */

export const TRANSACTION_TYPES = {
  INCOME: {
    id: '6f2a57a1-2978-5c0c-b454-19cf8c13933c', // SHA1 UUID for "income"
    name: 'รายรับ',
    icon: '💰',
    color: '#22c55e',
    type: 'income' as const,
  },
  EXPENSE: {
    id: 'c3e2030d-bc61-57a5-9bdf-5b891e9a939c', // SHA1 UUID for "expense"
    name: 'รายจ่าย',
    icon: '💳',
    color: '#ef4444',
    type: 'expense' as const,
  },
} as const;

export type TransactionType = typeof TRANSACTION_TYPES.INCOME | typeof TRANSACTION_TYPES.EXPENSE;
