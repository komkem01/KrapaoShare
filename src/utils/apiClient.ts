"use client";

import { getStoredTokens } from "./authStorage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

type RequestConfig = RequestInit & {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data: T;
};

const buildUrl = (endpoint: string) => {
  if (endpoint.startsWith("http")) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function unwrapResponse<T>(payload: unknown): T {
  if (isJsonObject(payload) && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestConfig = {}
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const url = buildUrl(endpoint);
  const config: RequestInit = {
    ...rest,
    headers: {
      ...headers,
    },
  };

  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;

  if (!isFormData) {
    (config.headers as HeadersInit) = {
      "Content-Type": "application/json",
      ...config.headers,
    };
  }

  if (!skipAuth) {
    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      throw new ApiError("ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่", 401);
    }

    (config.headers as HeadersInit) = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type") ?? "";
  const expectsBody = response.status !== 204 && response.status !== 205;
  const isJson = expectsBody && contentType.includes("application/json");
  const data = expectsBody
    ? isJson
      ? await response.json().catch(() => null)
      : await response.text()
    : null;

  if (!response.ok) {
    const message =
      (isJson && isJsonObject(data) &&
        (data.message as string | undefined || data.error as string | undefined)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  if (!expectsBody) {
    return undefined as T;
  }

  return unwrapResponse<T>(data);
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }),
  delete: <T = unknown>(endpoint: string, options?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

// Helper function to build query parameters
const buildQueryParams = (filters?: Record<string, unknown>): string => {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

// Authentication API functions
export const authApi = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => apiClient.post('/auth/register', data, { skipAuth: true }),
  
  login: (data: {
    email: string;
    password: string;
  }) => apiClient.post('/auth/login', data, { skipAuth: true }),
  
  googleLogin: (data: { idToken: string }) => 
    apiClient.post('/auth/google', data, { skipAuth: true }),
  
  getGoogleLoginUrl: () => 
    apiClient.get('/auth/google/login', { skipAuth: true }),
  
  me: () => apiClient.get('/auth/me'),
  
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => apiClient.post('/auth/change-password', data),
  
  refresh: (data: { refreshToken: string }) =>
    apiClient.post('/auth/refresh', data, { skipAuth: true }),
  
  logout: (data: { refreshToken: string }) =>
    apiClient.post('/auth/logout', data),
};

// User Management API functions
export const userApi = {
  list: (filters?: { page?: number; limit?: number }) =>
    apiClient.get(`/users${buildQueryParams(filters)}`),
  
  create: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => apiClient.post('/users', data),
  
  getById: (id: string) => apiClient.get(`/users/${id}`),
  
  update: (id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    occupation?: string;
    address?: string;
    role?: 'admin' | 'member' | 'owner';
    status?: 'active' | 'inactive' | 'suspended';
    avatarUrl?: string;
    timezone?: string;
    password?: string;
  }) => apiClient.patch(`/users/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

// Account API functions
export const accountApi = {
  list: (filters?: {
    user_id?: string;
    account_type?: 'personal' | 'shared' | 'business';
    is_active?: boolean;
    is_private?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/accounts${buildQueryParams(filters)}`),
  
  create: (data: {
    user_id: string;
    name: string;
    bank_name?: string;
    bank_number?: string;
    account_type?: 'personal' | 'shared' | 'business';
    color?: string;
    start_amount?: number;
    is_private?: boolean;
    is_active?: boolean;
  }) => apiClient.post('/accounts', data),
  
  getById: (id: string) => apiClient.get(`/accounts/${id}`),
  
  update: (id: string, data: {
    name?: string;
    bank_name?: string;
    bank_number?: string;
    account_type?: 'personal' | 'shared' | 'business';
    color?: string;
    start_amount?: number;
    current_balance?: number;
    is_private?: boolean;
    is_active?: boolean;
  }) => apiClient.patch(`/accounts/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/accounts/${id}`),
  
  getByUser: (userId: string) => apiClient.get(`/accounts/user/${userId}`),
  
  getByShareCode: (shareCode: string) => apiClient.get(`/accounts/share/${shareCode}`),
  
  updateBalance: (id: string, data: {
    operation?: 'set' | 'add' | 'subtract';
    balance?: number;
    amount?: number;
  }) => apiClient.patch(`/accounts/${id}/balance`, data),
};

// Transaction API functions
export const transactionApi = {
  list: (filters?: {
    user_id?: string;
    account_id?: string;
    category_id?: string;
    type?: 'income' | 'expense' | 'transfer';
    is_recurring?: boolean;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
    bill_id?: string;
    shared_goal_id?: string;
    budget_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/transactions${buildQueryParams(filters)}`),
  
  create: (data: {
    userId: string;
    accountId: string;
    categoryId?: string;
    type: 'income' | 'expense' | 'transfer';
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
  }) => apiClient.post('/transactions', data),
  
  getById: (id: string) => apiClient.get(`/transactions/${id}`),
  
  update: (id: string, data: {
    accountId?: string;
    categoryId?: string;
    type?: 'income' | 'expense' | 'transfer';
    amount?: number;
    description?: string;
    transactionDate?: string;
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
  }) => apiClient.patch(`/transactions/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
  
  getByUser: (userId: string) => apiClient.get(`/transactions/user/${userId}`),
  
  getByAccount: (accountId: string) => apiClient.get(`/transactions/account/${accountId}`),
};

// Account Member API functions
export const accountMemberApi = {
  list: (filters?: {
    account_id?: string;
    user_id?: string;
    role?: 'owner' | 'admin' | 'member' | 'viewer';
    invited_by?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/account-members${buildQueryParams(filters)}`),
  
  create: (data: {
    account_id: string;
    user_id?: string;
    user_email?: string;
    role?: 'owner' | 'admin' | 'member' | 'viewer';
    permissions?: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
    invited_by?: string;
  }) => apiClient.post('/account-members', data),
  
  getById: (id: string) => apiClient.get(`/account-members/${id}`),
  
  update: (id: string, data: {
    role?: 'owner' | 'admin' | 'member' | 'viewer';
    permissions?: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
  }) => apiClient.patch(`/account-members/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/account-members/${id}`),
  
  getByAccount: (accountId: string) => apiClient.get(`/account-members/account/${accountId}`),
  
  getByUser: (userId: string) => apiClient.get(`/account-members/user/${userId}`),
  
  getAccountUserMembership: (accountId: string, userId: string) =>
    apiClient.get(`/account-members/account/${accountId}/user/${userId}`),
};

// Account Transfer API functions
export const accountTransferApi = {
  list: (filters?: {
    from_account_id?: string;
    to_account_id?: string;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    page?: number;
    limit?: number;
  }) => apiClient.get(`/account-transfers${buildQueryParams(filters)}`),
  
  create: (data: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description?: string;
    transfer_fee?: number;
    exchange_rate?: number;
  }) => apiClient.post('/account-transfers', data),
  
  getById: (id: string) => apiClient.get(`/account-transfers/${id}`),
  
  update: (id: string, data: {
    description?: string;
    transfer_fee?: number;
    exchange_rate?: number;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  }) => apiClient.patch(`/account-transfers/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/account-transfers/${id}`),
};

// Category API functions
export const categoryApi = {
  list: (filters?: {
    user_id?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/categories${buildQueryParams(filters)}`),
  
  create: (data: {
    user_id: string;
    name: string;
    icon?: string;
    color?: string;
    type: 'income' | 'expense';
    is_active?: boolean;
  }) => apiClient.post('/categories', data),
  
  getById: (id: string) => apiClient.get(`/categories/${id}`),
  
  update: (id: string, data: {
    name?: string;
    icon?: string;
    color?: string;
    type?: 'income' | 'expense';
    is_active?: boolean;
  }) => apiClient.patch(`/categories/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
  
  getByUser: (userId: string) => apiClient.get(`/categories/user/${userId}`),
};

// Notification API functions
export const notificationApi = {
  list: (filters?: {
    user_id?: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    is_read?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/notifications${buildQueryParams(filters)}`),
  
  create: (data: {
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    icon?: string;
    data?: Record<string, unknown>;
    action_url?: string;
    expires_at?: string;
  }) => apiClient.post('/notifications', data),
  
  getById: (id: string) => apiClient.get(`/notifications/${id}`),
  
  update: (id: string, data: {
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    icon?: string;
    data?: Record<string, unknown>;
    action_url?: string;
    expires_at?: string;
    is_read?: boolean;
  }) => apiClient.patch(`/notifications/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/notifications/${id}`),
  
  getByUser: (userId: string) => apiClient.get(`/notifications/user/${userId}`),
  
  getUnreadByUser: (userId: string) => apiClient.get(`/notifications/user/${userId}/unread`),
  
  markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
  
  markAsUnread: (id: string) => apiClient.post(`/notifications/${id}/unread`),
  
  markAllAsRead: (userId: string) => apiClient.post(`/notifications/user/${userId}/read-all`),
};

// Imported Transaction API functions (placeholder for future use)
export const importedTransactionApi = {
  list: (filters?: Record<string, unknown>) => 
    apiClient.get(`/imported-transactions${buildQueryParams(filters)}`),
  create: (data: unknown) => apiClient.post('/imported-transactions', data),
  getById: (id: string) => apiClient.get(`/imported-transactions/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/imported-transactions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/imported-transactions/${id}`),
};

// Budget API functions
export const budgetApi = {
  list: (filters?: {
    user_id?: string;
    category_id?: string;
    period_start?: string;
    period_end?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/budgets${buildQueryParams(filters)}`),
  
  create: (data: {
    user_id: string;
    category_id?: string;
    name: string;
    amount: number;
    period_start: string;
    period_end: string;
    description?: string;
    alert_threshold?: number;
  }) => apiClient.post('/budgets', data),
  
  getById: (id: string) => apiClient.get(`/budgets/${id}`),
  
  update: (id: string, data: {
    category_id?: string;
    name?: string;
    amount?: number;
    period_start?: string;
    period_end?: string;
    description?: string;
    alert_threshold?: number;
    status?: string;
  }) => apiClient.patch(`/budgets/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/budgets/${id}`),
};

// Bill API functions
export const billApi = {
  list: (filters?: {
    user_id?: string;
    status?: 'pending' | 'settled' | 'cancelled';
    created_by?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/bills${buildQueryParams(filters)}`),
  
  create: (data: {
    user_id: string;
    title: string;
    total_amount: number;
    description?: string;
    bill_date?: string;
    due_date?: string;
  }) => apiClient.post('/bills', data),
  
  getById: (id: string) => apiClient.get(`/bills/${id}`),
  
  update: (id: string, data: {
    title?: string;
    total_amount?: number;
    description?: string;
    bill_date?: string;
    due_date?: string;
    status?: 'pending' | 'settled' | 'cancelled';
    settled_at?: string;
  }) => apiClient.patch(`/bills/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/bills/${id}`),
};

// Bill Participant API functions
export const billParticipantApi = {
  list: (filters?: {
    bill_id?: string;
    user_id?: string;
    is_paid?: boolean;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/bill-participants${buildQueryParams(filters)}`),
  
  create: (data: {
    bill_id: string;
    user_id: string;
    amount: number;
    is_paid?: boolean;
    paid_at?: string;
  }) => apiClient.post('/bill-participants', data),
  
  getById: (id: string) => apiClient.get(`/bill-participants/${id}`),
  
  update: (id: string, data: {
    amount?: number;
    is_paid?: boolean;
    paid_at?: string;
  }) => apiClient.patch(`/bill-participants/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/bill-participants/${id}`),
  
  getByBill: (billId: string) => apiClient.get(`/bill-participants/bill/${billId}`),
  
  getByUser: (userId: string) => apiClient.get(`/bill-participants/user/${userId}`),
};

// Goal API functions
export const goalApi = {
  list: (filters?: {
    user_id?: string;
    status?: 'active' | 'completed' | 'cancelled';
    page?: number;
    limit?: number;
  }) => apiClient.get(`/goals${buildQueryParams(filters)}`),
  
  create: (data: {
    user_id: string;
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    description?: string;
    category?: string;
  }) => apiClient.post('/goals', data),
  
  getById: (id: string) => apiClient.get(`/goals/${id}`),
  
  update: (id: string, data: {
    name?: string;
    target_amount?: number;
    current_amount?: number;
    target_date?: string;
    description?: string;
    category?: string;
    status?: 'active' | 'completed' | 'cancelled';
  }) => apiClient.patch(`/goals/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/goals/${id}`),
};

// Goal Contribution API functions
export const goalContributionApi = {
  list: (filters?: {
    goal_id?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/goal-contributions${buildQueryParams(filters)}`),
  
  create: (data: {
    goal_id: string;
    user_id: string;
    amount: number;
    contribution_date?: string;
    notes?: string;
  }) => apiClient.post('/goal-contributions', data),
  
  getById: (id: string) => apiClient.get(`/goal-contributions/${id}`),
  
  update: (id: string, data: {
    amount?: number;
    contribution_date?: string;
    notes?: string;
  }) => apiClient.patch(`/goal-contributions/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/goal-contributions/${id}`),
  
  getByGoal: (goalId: string) => apiClient.get(`/goal-contributions/goal/${goalId}`),
  
  getByUser: (userId: string) => apiClient.get(`/goal-contributions/user/${userId}`),
};

// Shared Goal API functions
export const sharedGoalApi = {
  list: (filters?: {
    created_by?: string;
    status?: 'active' | 'completed' | 'cancelled';
    page?: number;
    limit?: number;
  }) => apiClient.get(`/shared-goals${buildQueryParams(filters)}`),
  
  create: (data: {
    created_by: string;
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    description?: string;
    category?: string;
    share_code?: string;
  }) => apiClient.post('/shared-goals', data),
  
  getById: (id: string) => apiClient.get(`/shared-goals/${id}`),
  
  update: (id: string, data: {
    name?: string;
    target_amount?: number;
    current_amount?: number;
    target_date?: string;
    description?: string;
    category?: string;
    status?: 'active' | 'completed' | 'cancelled';
  }) => apiClient.patch(`/shared-goals/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/shared-goals/${id}`),
};

// Shared Goal Member API functions
export const sharedGoalMemberApi = {
  list: (filters?: {
    shared_goal_id?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/shared-goal-members${buildQueryParams(filters)}`),
  
  create: (data: {
    shared_goal_id: string;
    user_id: string;
    contribution_amount?: number;
    role?: 'owner' | 'member';
  }) => apiClient.post('/shared-goal-members', data),
  
  getById: (id: string) => apiClient.get(`/shared-goal-members/${id}`),
  
  update: (id: string, data: {
    contribution_amount?: number;
    role?: 'owner' | 'member';
  }) => apiClient.patch(`/shared-goal-members/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/shared-goal-members/${id}`),
  
  getByGoal: (goalId: string) => apiClient.get(`/shared-goal-members/goal/${goalId}`),
  
  getByUser: (userId: string) => apiClient.get(`/shared-goal-members/user/${userId}`),
  
  getGoalUserMembership: (goalId: string, userId: string) =>
    apiClient.get(`/shared-goal-members/goal/${goalId}/user/${userId}`),
};

// Debt API functions
export const debtApi = {
  list: (filters?: {
    creditor_id?: string;
    debtor_id?: string;
    status?: 'pending' | 'settled' | 'cancelled';
    page?: number;
    limit?: number;
  }) => apiClient.get(`/debts${buildQueryParams(filters)}`),
  
  create: (data: {
    creditor_id: string;
    debtor_id: string;
    amount: number;
    description?: string;
    due_date?: string;
    interest_rate?: number;
  }) => apiClient.post('/debts', data),
  
  getById: (id: string) => apiClient.get(`/debts/${id}`),
  
  update: (id: string, data: {
    amount?: number;
    description?: string;
    due_date?: string;
    interest_rate?: number;
    status?: 'pending' | 'settled' | 'cancelled';
  }) => apiClient.patch(`/debts/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/debts/${id}`),
  
  getByCreditor: (userId: string) => apiClient.get(`/debts/creditor/${userId}`),
  
  getByDebtor: (userId: string) => apiClient.get(`/debts/debtor/${userId}`),
};

// Debt Payment API functions
export const debtPaymentApi = {
  list: (filters?: {
    debt_id?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/debt-payments${buildQueryParams(filters)}`),
  
  create: (data: {
    debt_id: string;
    amount: number;
    payment_date?: string;
    notes?: string;
  }) => apiClient.post('/debt-payments', data),
  
  getById: (id: string) => apiClient.get(`/debt-payments/${id}`),
  
  update: (id: string, data: {
    amount?: number;
    payment_date?: string;
    notes?: string;
  }) => apiClient.patch(`/debt-payments/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/debt-payments/${id}`),
  
  getByDebt: (debtId: string) => apiClient.get(`/debt-payments/debt/${debtId}`),
  
  getByUser: (userId: string) => apiClient.get(`/debt-payments/user/${userId}`),
};

// Recurring Bill API functions
export const recurringBillApi = {
  list: (filters?: {
    user_id?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/recurring-bills${buildQueryParams(filters)}`),
  
  create: (data: {
    user_id: string;
    name: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    end_date?: string;
    description?: string;
    category_id?: string;
  }) => apiClient.post('/recurring-bills', data),
  
  getById: (id: string) => apiClient.get(`/recurring-bills/${id}`),
  
  update: (id: string, data: {
    name?: string;
    amount?: number;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date?: string;
    end_date?: string;
    description?: string;
    category_id?: string;
    is_active?: boolean;
  }) => apiClient.patch(`/recurring-bills/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/recurring-bills/${id}`),
};

// Health Check API functions
export const healthApi = {
  health: () => apiClient.get('/healthz', { skipAuth: true }),
  ready: () => apiClient.get('/readyz', { skipAuth: true }),
  ping: () => apiClient.get('/ping', { skipAuth: true }),
};

export { API_BASE_URL };
