# Frontend-Backend Integration Notes

## Overview
This document outlines the current state of frontend-backend integration for the KrapaoShare application and provides guidance for completing remaining integrations.

## ✅ Completed Integrations

### Core Infrastructure
- **API Client** (`src/utils/apiClient.ts`): Centralized API wrapper with authentication
- **Response Normalizer** (`src/utils/apiResponse.ts`): Handles paginated responses uniformly
- **Auth Storage** (`src/utils/authStorage.ts`): JWT token management

### Contexts (Fully Wired to Backend)
1. **TransactionContext** ✅
   - All CRUD operations using real API
   - Pagination metadata tracked
   - List methods normalized for paginated responses
   
2. **AccountContext** ✅
   - Account management via `/accounts` endpoints
   - Member management via `/account-members` endpoints
   - Transfer operations via `/account-transfers` endpoints
   - Pagination support added

3. **CategoryContext** ✅
   - Category CRUD via `/categories` endpoints
   - Type metadata resolution

4. **TypeContext** ✅
   - User-specific type management

5. **UserContext** ✅
   - User authentication and profile management
   - `/auth/*` and `/users/*` endpoints

6. **NotificationContext** ✅
   - Real-time notifications from `/notifications` endpoints
   - Development-only mock fallback (production surfaces errors properly)

### Pages (Fully Integrated)
- **Dashboard** (`/dashboard/page.tsx`) ✅
  - Removed hardcoded budget widgets
  - All stats calculated from real transaction/account data
  
- **Accounts** (`/dashboard/accounts/page.tsx`) ✅
  - Full account management with backend
  
- **Transactions** (`/dashboard/transactions/page.tsx`) ✅
  - Real transaction list with pagination
  
- **Add Transaction** (`/dashboard/add-transaction/page.tsx`) ✅
  - Creates real transactions via API

## ⚠️ Important Backend API Constraints

### No Dedicated Endpoints For:
The backend API **does NOT** have separate endpoints for:
- **Bills** - No `/bills` endpoint exists
- **Budgets** - No `/budgets` endpoint exists  
- **Goals** - No `/goals` endpoint exists
- **Debts** - No `/debts` endpoint exists
- **Shared Goals** - No `/shared-goals` endpoint exists

### How These Features Work:
These features are managed through **optional fields in transactions**:

```typescript
// Transaction model includes optional references:
{
  billId?: string;           // Links transaction to a bill
  budgetId?: string;         // Links transaction to a budget
  sharedGoalId?: string;     // Links transaction to shared goal
  recurringBillId?: string;  // Links to recurring bill pattern
}
```

### Filtering Transactions by Feature:
Use the `/transactions` endpoint with query parameters:

```typescript
// Get budget-related transactions
GET /transactions?budget_id=<uuid>&user_id=<uuid>

// Get bill-related transactions  
GET /transactions?bill_id=<uuid>&user_id=<uuid>

// Get goal-related transactions
GET /transactions?shared_goal_id=<uuid>&user_id=<uuid>
```

## 🔧 Pages Requiring Integration Work

### 1. Budgets Page (`/dashboard/budgets/page.tsx`)
**Current State:** Uses `mockCurrentBudgets` and `mockHistoryBudgets` arrays

**Integration Strategy:**
- Budgets should be **derived from transactions with `budgetId` field**
- Create a budget tracking mechanism:
  1. Store budget definitions (category, amount, period) in local state or separate service
  2. Filter transactions by `budgetId` to calculate spent amounts
  3. Group by month for historical view
  
**Example Implementation:**
```typescript
// Define budgets locally or in new context
const budgets = [
  { id: 'budget-1', category: 'อาหาร', amount: 6000, month: '2025-11' }
];

// Get transactions for this budget
const budgetTransactions = await transactionApi.list({
  user_id: userId,
  budget_id: 'budget-1',
  date_from: '2025-11-01',
  date_to: '2025-11-30'
});

// Calculate spent amount
const spent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
```

**Alternative:** Consider creating a backend endpoint for budgets in the future.

### 2. Bills Page (`/dashboard/bills/page.tsx`)
**Current State:** Uses `mockActiveBills` and `mockSettledBills` arrays

**Integration Strategy:**
- Bills don't have dedicated endpoints; they're managed through transactions
- Options:
  1. **Option A:** Create bill metadata in frontend state/localStorage and link to transactions via `billId`
  2. **Option B:** Request backend team to add `/bills` endpoints for proper bill splitting features
  3. **Option C:** Use transactions with special tags/categories for bill tracking

**Recommended Approach:**
Since bill splitting is a core feature, **recommend adding backend endpoints**:
```
POST   /bills              - Create bill with members
GET    /bills/:id          - Get bill details
PATCH  /bills/:id/settle   - Mark bill as settled
GET    /bills/user/:userId - Get user's bills
```

### 3. Goals Page (`/dashboard/goals/page.tsx`)
**Current State:** Uses `mockActiveGoals`, `mockCompletedGoals`, `mockAccounts` arrays

**Integration Strategy:**
- Similar to budgets, goals can be derived from transactions
- Create goal definitions locally and track progress via transactions with `sharedGoalId`
- Use account balances to track savings goals

**Example:**
```typescript
// Define goal
const goal = {
  id: 'goal-1',
  name: 'MacBook ใหม่',
  targetAmount: 60000,
  accountId: 'account-123'
};

// Get goal transactions
const goalTransactions = await transactionApi.list({
  shared_goal_id: 'goal-1'
});

// Calculate progress from linked account balance
const account = await accountApi.getById(goal.accountId);
const currentAmount = account.current_balance;
```

**Alternative:** Request backend endpoints for `/goals` if this becomes a primary feature.

### 4. Shared Goals Page (`/dashboard/shared-goals/page.tsx`)
**Current State:** Uses `mockMyGoals` and `mockJoinedGoals` arrays

**Integration Strategy:**
- This requires backend support for multi-user goal management
- Currently, transactions support `sharedGoalId` field
- **Recommended:** Add backend endpoints for proper shared goal management with permissions

**Needed Backend Endpoints:**
```
POST   /shared-goals                    - Create shared goal
GET    /shared-goals/:id                - Get goal details
GET    /shared-goals/user/:userId       - Get user's goals
POST   /shared-goals/:id/members        - Add member to goal
POST   /shared-goals/:id/contributions  - Add contribution
```

### 5. Debts Page (`/dashboard/debts/page.tsx`)
**Current State:** Check if it uses mock data (not reviewed in detail)

**Integration Strategy:**
- Similar to bills - likely needs backend support
- Can temporarily track via transactions with special tags

### 6. Analytics Page (`/dashboard/analytics/page.tsx`)
**Current State:** Likely uses transaction data

**Integration Strategy:**
- Should work with existing TransactionContext
- Calculate statistics from real transaction data
- Use category grouping for expense breakdowns

## 🎯 Recommended Next Steps

### Immediate Actions:
1. **Remove All Mock Data** from remaining pages (budgets, bills, goals, shared-goals, debts)
2. **Add "Coming Soon" or "Beta" notices** on features without full backend support
3. **Use Transaction-Based Tracking** for budgets and personal goals as temporary solution

### Short-Term (Frontend Only):
1. Create lightweight local state management for budgets (using transactions)
2. Implement goal tracking using account balances and transactions
3. Add proper error messages when backend features are unavailable

### Long-Term (Requires Backend):
1. **Bills Feature:** Add `/bills` endpoints with split calculation
2. **Shared Goals:** Add `/shared-goals` endpoints with member management
3. **Budgets:** Add `/budgets` endpoints for better budget tracking
4. **Debts:** Add `/debts` endpoints for debt management
5. **Analytics:** Add `/analytics` endpoints for pre-calculated statistics

## 📝 Environment Configuration

### Development Mode:
- NotificationContext falls back to mock data on API errors
- Helpful for frontend development without backend

### Production Mode:
- All mock data disabled
- API errors surfaced properly to users
- No silent fallbacks

## 🔍 Testing Guidelines

### Before Deploying:
1. Verify all contexts load real data from backend
2. Check that errors display properly (no silent failures)
3. Test pagination on all list views
4. Verify JWT token refresh works correctly
5. Test all CRUD operations on transactions/accounts

### API Health Check:
```bash
# Verify backend is running
curl http://localhost:8080/api/v1/healthz

# Test authentication
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## 📚 Additional Resources

- **API Documentation:** `/docs/api_doc.md`
- **Database Schema:** `/database_schema_complete.dbml`
- **Implementation Guide:** `/DATABASE_IMPLEMENTATION_GUIDE.md`
- **API Client:** `/src/utils/apiClient.ts`
- **Response Normalizer:** `/src/utils/apiResponse.ts`

## ✉️ Questions?

For backend API changes or new endpoint requests, contact the backend team with specific requirements from this document.
