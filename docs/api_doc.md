# KrapaoShare Service API Documentation

Base URL: `http://localhost:8080/api/v1`

## Response Format

All API responses follow this standard format:

### Success Response (2xx)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [
      /* array of items */
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "offset": 0,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "firstName": "string (required, max 100)",
  "lastName": "string (required, max 100)",
  "email": "string (required, email format)",
  "password": "string (required, min 6 chars)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ",
  "data": {
    "id": "uuid",
    "email": "string",
    "firstname": "string",
    "lastname": "string",
    "phone": "string",
    "birth_date": "YYYY-MM-DD or null",
    "occupation": "string",
    "address": "string",
    "role": "member",
    "status": "active",
    "avatar_url": "string",
    "timezone": "Asia/Bangkok",
    "created_at": "2025-11-24T10:30:00Z",
    "updated_at": "2025-11-24T10:30:00Z"
  }
}
```

### POST /auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "string (required, email format)",
  "password": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "data": {
    "accessToken": "jwt_token_string",
    "refreshToken": "refresh_token_string",
    "expiresAt": "2025-11-25T10:30:00Z",
    "user": {
      "id": "uuid",
      "email": "string",
      "firstname": "string",
      "lastname": "string",
      "phone": "string",
      "birth_date": "YYYY-MM-DD or null",
      "occupation": "string",
      "address": "string",
      "role": "member",
      "status": "active",
      "avatar_url": "string",
      "timezone": "Asia/Bangkok",
      "created_at": "2025-11-24T10:30:00Z",
      "updated_at": "2025-11-24T10:30:00Z"
    }
  }
}
```

### POST /auth/google

Google Sign-In with ID token.

**Request Body:**

```json
{
  "idToken": "string (required, Google ID token)"
}
```

**Response (200):** Same as login response.

### GET /auth/google/login

Redirect to Google OAuth login page.

**Response:** HTTP 307 redirect to Google OAuth URL.

### GET /auth/google/callback

Handle Google OAuth callback.

**Query Parameters:**

- `code`: Authorization code from Google
- `state`: State parameter (optional)

**Response (200):** Same as login response.

### GET /auth/me

Get current user information from JWT token.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "ดึงข้อมูลผู้ใช้สำเร็จ",
  "data": {
    "id": "uuid",
    "email": "string",
    "firstname": "string",
    "lastname": "string",
    "phone": "string",
    "birth_date": "YYYY-MM-DD or null",
    "occupation": "string",
    "address": "string",
    "role": "member",
    "status": "active",
    "avatar_url": "string",
    "timezone": "Asia/Bangkok",
    "created_at": "2025-11-24T10:30:00Z",
    "updated_at": "2025-11-24T10:30:00Z"
  }
}
```

### POST /auth/change-password

Change user password.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "currentPassword": "string (required, min 6 chars)",
  "newPassword": "string (required, min 6 chars)",
  "confirmPassword": "string (required, min 6 chars, must match newPassword)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "เปลี่ยนรหัสผ่านสำเร็จ",
  "data": {
    /* user object same as /auth/me */
  }
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "รีเฟรชโทเค็นสำเร็จ",
  "data": {
    "accessToken": "jwt_token_string",
    "refreshToken": "new_refresh_token_string",
    "expiresAt": "2025-11-25T10:30:00Z",
    "user": {
      /* user object same as login */
    }
  }
}
```

### POST /auth/logout

Logout and invalidate refresh token.

**Request Body:**

```json
{
  "refreshToken": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "ออกจากระบบสำเร็จ",
  "data": {
    "success": true
  }
}
```

---

## User Management Endpoints

### GET /users

List all users with pagination.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "ดึงรายชื่อผู้ใช้สำเร็จ",
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "string",
        "firstname": "string",
        "lastname": "string",
        "phone": "string",
        "birth_date": "YYYY-MM-DD or null",
        "occupation": "string",
        "address": "string",
        "role": "member|admin|owner",
        "status": "active|inactive|suspended",
        "avatar_url": "string",
        "timezone": "string",
        "created_at": "2025-11-24T10:30:00Z",
        "updated_at": "2025-11-24T10:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "offset": 0,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### POST /users

Create a new user (admin function).

**Request Body:**

```json
{
  "firstName": "string (required, max 100)",
  "lastName": "string (required, max 100)",
  "email": "string (required, email format)",
  "password": "string (required, min 6 chars)"
}
```

**Response (201):** Same structure as user registration.

### GET /users/:id

Get user by ID.

**Path Parameters:**

- `id`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "ดึงข้อมูลผู้ใช้สำเร็จ",
  "data": {
    /* user object same as /users list item */
  }
}
```

### PATCH /users/:id

Update user information.

**Path Parameters:**

- `id`: User UUID

**Request Body:**

```json
{
  "firstName": "string (required, max 100)",
  "lastName": "string (required, max 100)",
  "email": "string (required, email format)",
  "phone": "string (optional)",
  "birthDate": "YYYY-MM-DD (optional)",
  "occupation": "string (optional)",
  "address": "string (optional)",
  "role": "admin|member|owner (optional)",
  "status": "active|inactive|suspended (optional)",
  "avatarUrl": "string (optional)",
  "timezone": "string (optional)",
  "password": "string (optional, min 6 chars)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "อัปเดตผู้ใช้งานสำเร็จ",
  "data": {
    /* updated user object */
  }
}
```

### DELETE /users/:id

Soft delete a user.

**Path Parameters:**

- `id`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "ลบผู้ใช้งานสำเร็จ",
  "data": null
}
```

---

## Account Management Endpoints

### GET /accounts

List accounts with filtering and pagination.

**Query Parameters:**

- `user_id`: Filter by user UUID
- `account_type`: Filter by type (personal|shared|business)
- `is_active`: Filter by active status (true|false)
- `is_private`: Filter by private status (true|false)
- `search`: Search in account names
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "Accounts retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "string",
        "bank_name": "string or null",
        "bank_number": "string or null",
        "account_type": "personal|shared|business",
        "color": "string or null",
        "start_amount": 0.0,
        "current_balance": 1500.5,
        "is_private": false,
        "is_active": true,
        "share_code": "string or null",
        "created_at": "2025-11-24T10:30:00Z",
        "updated_at": "2025-11-24T10:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "offset": 0,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### POST /accounts

Create a new account.

**Request Body:**

```json
{
  "user_id": "uuid (required)",
  "name": "string (required, max 100)",
  "bank_name": "string (optional, max 100)",
  "bank_number": "string (optional, max 50)",
  "account_type": "personal|shared|business (optional, default: personal)",
  "color": "string (optional, max 7, hex color)",
  "start_amount": 0.0,
  "is_private": false,
  "is_active": true
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "bank_name": "string or null",
    "bank_number": "string or null",
    "account_type": "personal|shared|business",
    "color": "string or null",
    "start_amount": 0.0,
    "current_balance": 0.0,
    "is_private": false,
    "is_active": true,
    "share_code": "string or null (generated for shared accounts)",
    "created_at": "2025-11-24T10:30:00Z",
    "updated_at": "2025-11-24T10:30:00Z"
  }
}
```

### GET /accounts/:id

Get account by ID.

**Path Parameters:**

- `id`: Account UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Account retrieved successfully",
  "data": {
    /* account object same as POST response */
  }
}
```

### PATCH /accounts/:id

Update account information.

**Path Parameters:**

- `id`: Account UUID

**Request Body:**

```json
{
  "name": "string (optional, max 100)",
  "bank_name": "string (optional, max 100)",
  "bank_number": "string (optional, max 50)",
  "account_type": "personal|shared|business (optional)",
  "color": "string (optional, max 7)",
  "start_amount": "number (optional, min 0)",
  "current_balance": "number (optional, min 0)",
  "is_private": "boolean (optional)",
  "is_active": "boolean (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Account updated successfully",
  "data": {
    /* updated account object */
  }
}
```

### DELETE /accounts/:id

Soft delete an account.

**Path Parameters:**

- `id`: Account UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": null
}
```

### GET /accounts/user/:userId

Get all accounts for a specific user.

**Path Parameters:**

- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Accounts retrieved successfully",
  "data": [
    {
      /* account object same as GET /accounts/:id */
    }
  ]
}
```

### GET /accounts/share/:shareCode

Get account by share code (for shared accounts).

**Path Parameters:**

- `shareCode`: Share code string

**Response (200):**

```json
{
  "success": true,
  "message": "Account retrieved successfully",
  "data": {
    /* account object same as GET /accounts/:id */
  }
}
```

### PATCH /accounts/:id/balance

Update account balance.

**Path Parameters:**

- `id`: Account UUID

**Request Body:**

```json
{
  "operation": "set|add|subtract (default: set)",
  "balance": "number (required for 'set' operation)",
  "amount": "number (required for 'add'/'subtract' operations, must be > 0)"
}
```

**Examples:**

```json
// Set balance to specific amount
{
  "operation": "set",
  "balance": 1500.50
}

// Add amount to current balance
{
  "operation": "add",
  "amount": 100.00
}

// Subtract amount from current balance
{
  "operation": "subtract",
  "amount": 50.00
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Account balance updated successfully",
  "data": null
}
```

---

## Transaction Endpoints

### GET /transactions

List transactions with filtering and pagination.

**Query Parameters:**

- `user_id`: Filter by user UUID
- `account_id`: Filter by account UUID
- `category_id`: Filter by category UUID
- `type`: Filter by type (income|expense|transfer)
- `is_recurring`: Filter by recurring status (true|false)
- `date_from`: Filter from date (YYYY-MM-DD)
- `date_to`: Filter to date (YYYY-MM-DD)
- `min_amount`: Filter by minimum amount
- `max_amount`: Filter by maximum amount
- `bill_id`: Filter by bill UUID
- `shared_goal_id`: Filter by shared goal UUID
- `budget_id`: Filter by budget UUID
- `search`: Search in description, notes, reference number
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "accountId": "uuid",
        "categoryId": "uuid or null",
        "type": "income|expense|transfer",
        "amount": 100.5,
        "description": "string",
        "transactionDate": "2025-11-24T00:00:00Z",
        "transactionTime": "2025-11-24T11:17:27Z or null",
        "referenceNumber": "string or null",
        "location": "string or null",
        "notes": "string or null",
        "tags": ["tag1", "tag2"],
        "receiptUrl": "string or null",
        "isRecurring": false,
        "recurringBillId": "uuid or null",
        "transferToAccountId": "uuid or null",
        "billId": "uuid or null",
        "sharedGoalId": "uuid or null",
        "budgetId": "uuid or null",
        "createdAt": "2025-11-24T10:30:00Z",
        "updatedAt": "2025-11-24T10:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "offset": 0,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### POST /transactions

Create a new transaction.

**Request Body:**

```json
{
  "userId": "uuid (required)",
  "accountId": "uuid (required)",
  "categoryId": "uuid (optional)",
  "type": "income|expense|transfer (required)",
  "amount": 100.5,
  "description": "string (required, max 1000)",
  "transactionDate": "2025-11-24 (required, YYYY-MM-DD format)",
  "transactionTime": "11:17:27 (optional, HH:MM:SS format)",
  "referenceNumber": "string (optional, max 100)",
  "location": "string (optional, max 200)",
  "notes": "string (optional, max 2000)",
  "tags": ["tag1", "tag2"],
  "receiptUrl": "string (optional, max 500)",
  "isRecurring": false,
  "recurringBillId": "uuid (optional)",
  "transferToAccountId": "uuid (optional)",
  "billId": "uuid (optional)",
  "sharedGoalId": "uuid (optional)",
  "budgetId": "uuid (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "accountId": "uuid",
    "categoryId": "uuid or null",
    "type": "expense",
    "amount": 100.5,
    "description": "ทดสอบ",
    "transactionDate": "2025-11-24T00:00:00Z",
    "transactionTime": "2025-11-24T11:17:27Z",
    "referenceNumber": null,
    "location": null,
    "notes": null,
    "tags": [],
    "receiptUrl": null,
    "isRecurring": false,
    "recurringBillId": null,
    "transferToAccountId": null,
    "billId": null,
    "sharedGoalId": null,
    "budgetId": null,
    "createdAt": "2025-11-24T10:30:00Z",
    "updatedAt": "2025-11-24T10:30:00Z"
  }
}
```

### GET /transactions/:id

Get transaction by ID.

**Path Parameters:**

- `id`: Transaction UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Transaction retrieved successfully",
  "data": {
    /* transaction object same as POST response */
  }
}
```

### PATCH /transactions/:id

Update transaction.

**Path Parameters:**

- `id`: Transaction UUID

**Request Body:**

```json
{
  "accountId": "uuid (optional)",
  "categoryId": "uuid (optional)",
  "type": "income|expense|transfer (optional)",
  "amount": "number (optional, > 0)",
  "description": "string (optional, max 1000)",
  "transactionDate": "YYYY-MM-DD (optional)",
  "transactionTime": "HH:MM:SS (optional)",
  "referenceNumber": "string (optional, max 100)",
  "location": "string (optional, max 200)",
  "notes": "string (optional, max 2000)",
  "tags": ["tag1", "tag2"],
  "receiptUrl": "string (optional, max 500)",
  "isRecurring": "boolean (optional)",
  "recurringBillId": "uuid (optional)",
  "transferToAccountId": "uuid (optional)",
  "billId": "uuid (optional)",
  "sharedGoalId": "uuid (optional)",
  "budgetId": "uuid (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    /* updated transaction object */
  }
}
```

### DELETE /transactions/:id

Soft delete a transaction.

**Path Parameters:**

- `id`: Transaction UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": null
}
```

### GET /transactions/user/:userId

Get all transactions for a specific user.

**Path Parameters:**

- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      /* transaction object same as GET /transactions/:id */
    }
  ]
}
```

### GET /transactions/account/:accountId

Get all transactions for a specific account.

**Path Parameters:**

- `accountId`: Account UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      /* transaction object same as GET /transactions/:id */
    }
  ]
}
```

---

## Account Member Endpoints

### GET /account-members

List account members with filtering and pagination.

**Query Parameters:**

- `account_id`: Filter by account UUID
- `user_id`: Filter by user UUID
- `role`: Filter by role (owner|admin|member|viewer)
- `invited_by`: Filter by inviter UUID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "Account members retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "account_id": "uuid",
        "user_id": "uuid",
        "role": "owner|admin|member|viewer",
        "permissions": {
          "read": true,
          "write": false,
          "delete": false
        },
        "joined_at": "2025-11-24T10:30:00Z",
        "invited_by": "uuid or null",
        "created_at": "2025-11-24T10:30:00Z",
        "updated_at": "2025-11-24T10:30:00Z",
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "account_name": "My Shared Account"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "offset": 0,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### POST /account-members

Add a new member to an account.

**Request Body:**

```json
{
  "account_id": "uuid (required)",
  "user_id": "uuid (optional, use either user_id OR user_email)",
  "user_email": "email@example.com (optional, use either user_id OR user_email)",
  "role": "owner|admin|member|viewer (optional, default: member)",
  "permissions": {
    "read": true,
    "write": false,
    "delete": false
  },
  "invited_by": "uuid (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Account member created successfully",
  "data": {
    "id": "uuid",
    "account_id": "uuid",
    "user_id": "uuid",
    "role": "member",
    "permissions": {
      "read": true,
      "write": false,
      "delete": false
    },
    "joined_at": "2025-11-24T10:30:00Z",
    "invited_by": "uuid or null",
    "created_at": "2025-11-24T10:30:00Z",
    "updated_at": "2025-11-24T10:30:00Z",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "account_name": "My Shared Account"
  }
}
```

### GET /account-members/:id

Get account member by ID.

**Path Parameters:**

- `id`: Account member UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Account member retrieved successfully",
  "data": {
    /* account member object same as POST response */
  }
}
```

### PATCH /account-members/:id

Update account member.

**Path Parameters:**

- `id`: Account member UUID

**Request Body:**

```json
{
  "role": "owner|admin|member|viewer (optional)",
  "permissions": {
    "read": true,
    "write": true,
    "delete": false
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Account member updated successfully",
  "data": {
    /* updated account member object */
  }
}
```

### DELETE /account-members/:id

Remove account member.

**Path Parameters:**

- `id`: Account member UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Account member deleted successfully",
  "data": null
}
```

### GET /account-members/account/:accountId

Get all members for a specific account.

**Path Parameters:**

- `accountId`: Account UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Account members retrieved successfully",
  "data": [
    {
      /* account member object same as GET /account-members/:id */
    }
  ]
}
```

### GET /account-members/user/:userId

Get all account memberships for a specific user.

**Path Parameters:**

- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "User memberships retrieved successfully",
  "data": [
    {
      /* account member object same as GET /account-members/:id */
    }
  ]
}
```

### GET /account-members/account/:accountId/user/:userId

Get specific membership between account and user.

**Path Parameters:**

- `accountId`: Account UUID
- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Membership retrieved successfully",
  "data": {
    /* account member object same as GET /account-members/:id */
  }
}
```

---

## Account Transfer Endpoints

### GET /account-transfers

List account transfers with filtering and pagination.

**Query Parameters:**

- `from_account_id`: Filter by source account UUID
- `to_account_id`: Filter by destination account UUID
- `status`: Filter by status (pending|completed|failed|cancelled)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "Account transfers retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "from_account_id": "uuid",
        "to_account_id": "uuid",
        "amount": 500.0,
        "description": "Transfer description",
        "transfer_fee": 0.0,
        "exchange_rate": 1.0,
        "status": "completed",
        "created_at": "2025-11-24T10:30:00Z",
        "updated_at": "2025-11-24T10:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "offset": 0,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### POST /account-transfers

Create a new account transfer.

**Request Body:**

```json
{
  "from_account_id": "uuid (required)",
  "to_account_id": "uuid (required)",
  "amount": 500.0,
  "description": "string (optional, max 500)",
  "transfer_fee": 0.0,
  "exchange_rate": 1.0
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Account transfer created successfully",
  "data": {
    "id": "uuid",
    "from_account_id": "uuid",
    "to_account_id": "uuid",
    "amount": 500.0,
    "description": "Transfer description",
    "transfer_fee": 0.0,
    "exchange_rate": 1.0,
    "status": "completed",
    "created_at": "2025-11-24T10:30:00Z",
    "updated_at": "2025-11-24T10:30:00Z"
  }
}
```

### GET /account-transfers/:id

Get account transfer by ID.

**Path Parameters:**

- `id`: Account transfer UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Account transfer retrieved successfully",
  "data": {
    /* account transfer object same as POST response */
  }
}
```

### PATCH /account-transfers/:id

Update account transfer.

**Path Parameters:**

- `id`: Account transfer UUID

**Request Body:**

```json
{
  "description": "string (optional, max 500)",
  "transfer_fee": "number (optional, min 0)",
  "exchange_rate": "number (optional, > 0)",
  "status": "pending|completed|failed|cancelled (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Account transfer updated successfully",
  "data": {
    /* updated account transfer object */
  }
}
```

### DELETE /account-transfers/:id

Delete account transfer.

**Path Parameters:**

- `id`: Account transfer UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Account transfer deleted successfully",
  "data": null
}
```

---

## Category Endpoints

### GET /categories

List categories with filtering and pagination.

**Query Parameters:**

- `user_id`: Filter by user UUID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "Food & Dining",
        "icon": "🍽️",
        "color": "#FF6B6B",
        "type": "expense",
        "is_active": true,
        "created_at": "2025-11-24T10:30:00Z",
        "updated_at": "2025-11-24T10:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "offset": 0,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

### POST /categories

Create a new category.

**Request Body:**

```json
{
  "user_id": "uuid (required)",
  "name": "string (required, max 100)",
  "icon": "string (optional, emoji or icon)",
  "color": "string (optional, hex color)",
  "type": "income|expense (required)",
  "is_active": true
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Food & Dining",
    "icon": "🍽️",
    "color": "#FF6B6B",
    "type": "expense",
    "is_active": true,
    "created_at": "2025-11-24T10:30:00Z",
    "updated_at": "2025-11-24T10:30:00Z"
  }
}
```

### GET /categories/user/:userId

Get all categories for a specific user.

**Path Parameters:**

- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      /* category object same as GET /categories/:id */
    }
  ]
}
```

### GET /categories/:id

Get category by ID.

**Path Parameters:**

- `id`: Category UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    /* category object same as POST response */
  }
}
```

### PATCH /categories/:id

Update category.

**Path Parameters:**

- `id`: Category UUID

**Request Body:**

```json
{
  "name": "string (optional, max 100)",
  "icon": "string (optional)",
  "color": "string (optional, hex color)",
  "type": "income|expense (optional)",
  "is_active": "boolean (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    /* updated category object */
  }
}
```

### DELETE /categories/:id

Delete category.

**Path Parameters:**

- `id`: Category UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null
}
```

---

## Notification Endpoints

### GET /notifications

List notifications with filtering and pagination.

**Query Parameters:**

- `user_id`: Filter by user UUID
- `type`: Filter by type (info|warning|error|success)
- `priority`: Filter by priority (low|normal|high|urgent)
- `is_read`: Filter by read status (true|false)
- `search`: Search in title and message
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "title": "New Transaction",
        "message": "You have received a new transaction",
        "type": "info",
        "priority": "normal",
        "icon": "💰",
        "data": {
          "transaction_id": "uuid",
          "amount": 100.5
        },
        "is_read": false,
        "read_at": null,
        "action_url": "/transactions/uuid",
        "expires_at": "2025-12-24T10:30:00Z",
        "created_at": "2025-11-24T10:30:00Z",
        "updated_at": "2025-11-24T10:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "offset": 0,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### POST /notifications

Create a new notification.

**Request Body:**

```json
{
  "user_id": "uuid (required)",
  "title": "string (required)",
  "message": "string (required)",
  "type": "info|warning|error|success (required)",
  "priority": "low|normal|high|urgent (optional, default: normal)",
  "icon": "string (optional, emoji or icon)",
  "data": {
    "key": "value"
  },
  "action_url": "string (optional, URL)",
  "expires_at": "2025-12-24T10:30:00Z (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "New Transaction",
    "message": "You have received a new transaction",
    "type": "info",
    "priority": "normal",
    "icon": "💰",
    "data": {
      "transaction_id": "uuid",
      "amount": 100.5
    },
    "is_read": false,
    "read_at": null,
    "action_url": "/transactions/uuid",
    "expires_at": "2025-12-24T10:30:00Z",
    "created_at": "2025-11-24T10:30:00Z",
    "updated_at": "2025-11-24T10:30:00Z"
  }
}
```

### GET /notifications/:id

Get notification by ID.

**Path Parameters:**

- `id`: Notification UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Notification retrieved successfully",
  "data": {
    /* notification object same as POST response */
  }
}
```

### PATCH /notifications/:id

Update notification.

**Path Parameters:**

- `id`: Notification UUID

**Request Body:**

```json
{
  "title": "string (optional)",
  "message": "string (optional)",
  "type": "info|warning|error|success (optional)",
  "priority": "low|normal|high|urgent (optional)",
  "icon": "string (optional)",
  "data": {
    "key": "value"
  },
  "action_url": "string (optional)",
  "expires_at": "2025-12-24T10:30:00Z (optional)",
  "is_read": "boolean (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Notification updated successfully",
  "data": {
    /* updated notification object */
  }
}
```

### DELETE /notifications/:id

Delete notification.

**Path Parameters:**

- `id`: Notification UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": null
}
```

### GET /notifications/user/:userId

Get all notifications for a specific user.

**Path Parameters:**

- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      /* notification object same as GET /notifications/:id */
    }
  ]
}
```

### GET /notifications/user/:userId/unread

Get unread notifications for a specific user.

**Path Parameters:**

- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Unread notifications retrieved successfully",
  "data": [
    {
      /* notification object same as GET /notifications/:id with is_read: false */
    }
  ]
}
```

### POST /notifications/:id/read

Mark notification as read.

**Path Parameters:**

- `id`: Notification UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    /* updated notification object with is_read: true, read_at: timestamp */
  }
}
```

### POST /notifications/:id/unread

Mark notification as unread.

**Path Parameters:**

- `id`: Notification UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Notification marked as unread",
  "data": {
    /* updated notification object with is_read: false, read_at: null */
  }
}
```

### POST /notifications/user/:userId/read-all

Mark all notifications as read for a user.

**Path Parameters:**

- `userId`: User UUID

**Response (200):**

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": null
}
```

---

## Health Check Endpoints

### GET /healthz

Service health check.

**Response (200):**

```json
{
  "status": "OK",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

### GET /readyz

Service readiness check.

**Response (200):**

```json
{
  "status": "Ready",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

### GET /ping

Simple ping endpoint.

**Response (200):**

```
pong
```

---

## Error Codes

| HTTP Status | Description                             |
| ----------- | --------------------------------------- |
| 200         | OK - Request successful                 |
| 201         | Created - Resource created successfully |
| 400         | Bad Request - Invalid request data      |
| 401         | Unauthorized - Authentication required  |
| 403         | Forbidden - Insufficient permissions    |
| 404         | Not Found - Resource not found          |
| 409         | Conflict - Resource already exists      |
| 422         | Unprocessable Entity - Validation error |
| 500         | Internal Server Error - Server error    |

## Common Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid request payload",
  "error": "Validation failed for field 'email': must be a valid email address"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "โทเค็นไม่ถูกต้อง"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Data Types Reference

### UUID Format

All UUIDs are in standard UUID v4 format:

```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

### Date/Time Formats

- **Date Only**: `YYYY-MM-DD` (e.g., "2025-11-24")
- **Time Only**: `HH:MM:SS` (e.g., "11:17:27")
- **DateTime (ISO 8601)**: `YYYY-MM-DDTHH:MM:SSZ` (e.g., "2025-11-24T11:17:27Z")

### Enum Values

**Account Types:**

- `personal` - Personal account
- `shared` - Shared account with multiple members
- `business` - Business account

**Transaction Types:**

- `income` - Money coming in
- `expense` - Money going out
- `transfer` - Money transfer between accounts

**User Roles:**

- `member` - Regular user
- `admin` - Administrator with elevated permissions
- `owner` - Owner with full permissions

**Account Member Roles:**

- `owner` - Account owner with full control
- `admin` - Administrator with management permissions
- `member` - Regular member with limited permissions
- `viewer` - Read-only access

**User Status:**

- `active` - Active user account
- `inactive` - Temporarily disabled account
- `suspended` - Suspended account

**Transfer Status:**

- `pending` - Transfer in progress
- `completed` - Transfer completed successfully
- `failed` - Transfer failed
- `cancelled` - Transfer was cancelled

**Notification Types:**

- `info` - Informational notification
- `warning` - Warning notification
- `error` - Error notification
- `success` - Success notification

**Notification Priorities:**

- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent priority

---

_Documentation generated for KrapaoShare Service API v1.0_
_Last updated: November 24, 2025_
