# Account API Integration Guide

## Overview
คู่มือการเชื่อมต่อ API สำหรับระบบจัดการบัญชี (Accounts) ใน KrapaoShare

## Context Setup

### AccountContext
ไฟล์: `src/contexts/AccountContext.tsx`

Context นี้จัดการ state และ API calls ทั้งหมดสำหรับ:
- **Accounts**: บัญชีส่วนตัวและบัญชีร่วม
- **Account Members**: สมาชิกในบัญชีร่วม
- **Account Transfers**: การโอนเงินระหว่างบัญชี

## API Endpoints

### Account Endpoints

#### 1. Get All Accounts
```typescript
GET /accounts/user/:userId
Response: Account[]
```

#### 2. Get Single Account
```typescript
GET /accounts/:id
Response: Account
```

#### 3. Get Account by Share Code
```typescript
GET /accounts/share/:shareCode
Response: Account
```

#### 4. Create Account
```typescript
POST /accounts
Request Body: {
  name: string;
  bank_name?: string | null;
  bank_number?: string | null;
  account_type?: 'personal' | 'shared' | 'business';
  color?: string | null;
  start_amount?: number;
  is_private?: boolean;
  is_active?: boolean;
}
Response: Account
```

#### 5. Update Account
```typescript
PATCH /accounts/:id
Request Body: UpdateAccountRequest
Response: Account
```

#### 6. Delete Account
```typescript
DELETE /accounts/:id
Response: void
```

#### 7. Update Balance
```typescript
PATCH /accounts/:id/balance
Request Body: {
  amount: number;
  operation: 'add' | 'subtract' | 'set';
  note?: string;
}
Response: Account
```

### Account Member Endpoints

#### 1. Get Members by Account
```typescript
GET /account-members/account/:accountId
Response: AccountMember[]
```

#### 2. Add Member
```typescript
POST /account-members
Request Body: {
  account_id: string;
  user_id: string;
  role: 'admin' | 'member';
  permissions: string[];
  can_deposit: boolean;
  can_withdraw: boolean;
}
Response: AccountMember
```

#### 3. Update Member
```typescript
PATCH /account-members/:id
Request Body: {
  permissions: string[];
  can_deposit: boolean;
  can_withdraw: boolean;
}
Response: AccountMember
```

#### 4. Remove Member
```typescript
DELETE /account-members/:id
Response: void
```

### Transfer Endpoints

#### 1. Create Transfer
```typescript
POST /account-transfers
Request Body: {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  note?: string;
}
Response: AccountTransfer
```

#### 2. Get Transfers
```typescript
GET /account-transfers?account_id=xxx
Response: AccountTransfer[]
```

## Usage Examples

### 1. ใช้งาน AccountContext ในคอมโพเนนต์

```typescript
'use client';

import { useEffect } from 'react';
import { useAccounts } from '@/contexts/AccountContext';

export default function AccountsPage() {
  const {
    accounts,
    members,
    isLoading,
    error,
    refreshAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountMembers,
  } = useAccounts();

  // Load accounts on mount
  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // Handle create account
  const handleCreateAccount = async () => {
    try {
      const newAccount = await createAccount({
        name: 'บัญชีออมทรัพย์',
        account_type: 'personal',
        start_amount: 10000,
        color: '#3B82F6',
      });
      console.log('Account created:', newAccount);
    } catch (err) {
      console.error('Failed to create account:', err);
    }
  };

  // Handle update account
  const handleUpdateAccount = async (id: string) => {
    try {
      const updated = await updateAccount(id, {
        name: 'บัญชีออมทรัพย์ใหม่',
        color: '#10B981',
      });
      console.log('Account updated:', updated);
    } catch (err) {
      console.error('Failed to update account:', err);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteAccount(id);
      console.log('Account deleted');
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      <div>
        {accounts.map(account => (
          <div key={account.id}>
            <h3>{account.name}</h3>
            <p>Balance: ฿{account.current_balance.toLocaleString()}</p>
            <p>Type: {account.account_type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. สร้างบัญชีใหม่

```typescript
const handleCreatePersonalAccount = async () => {
  const account = await createAccount({
    name: 'บัญชีออมทรัพย์หลัก',
    account_type: 'personal',
    bank_name: 'ธนาคารกสิกรไทย',
    bank_number: '123-4-56789-0',
    start_amount: 50000,
    color: '#10B981',
    is_private: false,
    is_active: true,
  });
};

const handleCreateSharedAccount = async () => {
  const account = await createAccount({
    name: 'ทริปญี่ปุ่น 2026',
    account_type: 'shared',
    start_amount: 0,
    color: '#8B5CF6',
    is_private: false,
    is_active: true,
  });
  
  // Share code will be generated automatically
  console.log('Share code:', account.share_code);
};
```

### 3. จัดการยอดเงิน

```typescript
// เพิ่มเงิน (ฝาก)
const handleDeposit = async (accountId: string, amount: number) => {
  await updateBalance(accountId, {
    amount: amount,
    operation: 'add',
    note: 'เงินเดือนเดือนพฤศจิกายน',
  });
};

// ลดเงิน (ถอน)
const handleWithdraw = async (accountId: string, amount: number) => {
  await updateBalance(accountId, {
    amount: amount,
    operation: 'subtract',
    note: 'ค่าอาหารและค่าใช้จ่าย',
  });
};

// ตั้งยอดเงินใหม่
const handleSetBalance = async (accountId: string, amount: number) => {
  await updateBalance(accountId, {
    amount: amount,
    operation: 'set',
    note: 'ปรับยอดเงินตามความเป็นจริง',
  });
};
```

### 4. โอนเงินระหว่างบัญชี

```typescript
const handleTransfer = async (
  fromAccountId: string,
  toAccountId: string,
  amount: number
) => {
  try {
    const transfer = await createTransfer({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: amount,
      note: 'โอนเงินเข้าบัญชีออม',
    });
    
    console.log('Transfer successful:', transfer);
    
    // Accounts will be refreshed automatically
  } catch (err) {
    console.error('Transfer failed:', err);
  }
};
```

### 5. จัดการสมาชิกในบัญชีร่วม

```typescript
// เพิ่มสมาชิกใหม่
const handleAddMember = async (accountId: string, userId: string) => {
  await addMember(accountId, userId, 'member', [
    'view',
    'deposit',
  ]);
};

// อัปเดตสิทธิ์สมาชิก
const handleUpdateMemberPermissions = async (memberId: string) => {
  await updateMember(memberId, [
    'view',
    'deposit',
    'withdraw',
  ]);
};

// ลบสมาชิก
const handleRemoveMember = async (memberId: string) => {
  await removeMember(memberId);
};

// ดูรายชื่อสมาชิก
const handleViewMembers = async (accountId: string) => {
  const accountMembers = await getAccountMembers(accountId);
  console.log('Members:', accountMembers);
};
```

### 6. เข้าร่วมบัญชีร่วมด้วย Share Code

```typescript
const handleJoinSharedAccount = async (shareCode: string) => {
  try {
    // 1. ค้นหาบัญชีจาก share code
    const account = await getAccountByShareCode(shareCode);
    
    if (!account) {
      alert('ไม่พบบัญชีที่ระบุ');
      return;
    }
    
    // 2. เพิ่มตัวเองเป็นสมาชิก (ต้องมี userId)
    const storedUser = getStoredUser();
    if (!storedUser?.id) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    
    await addMember(account.id, storedUser.id as string, 'member', [
      'view',
      'deposit',
    ]);
    
    alert('เข้าร่วมบัญชีสำเร็จ!');
    
    // 3. Refresh เพื่อโหลดบัญชีใหม่
    await refreshAccounts();
    
  } catch (err) {
    console.error('Failed to join account:', err);
    alert('ไม่สามารถเข้าร่วมบัญชีได้');
  }
};
```

## Data Types

### Account
```typescript
interface Account {
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
}
```

### AccountMember
```typescript
interface AccountMember {
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
```

### AccountTransfer
```typescript
interface AccountTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  note: string | null;
  transferred_by: string;
  created_at: string;
}
```

## Error Handling

Context จะจัดการ error โดยอัตโนมัติและเก็บไว้ใน `error` state:

```typescript
const { error } = useAccounts();

if (error) {
  return <div>Error: {error}</div>;
}
```

สำหรับ error ในแต่ละ function ให้ใช้ try-catch:

```typescript
try {
  await createAccount({ name: 'Test' });
} catch (err) {
  alert('ไม่สามารถสร้างบัญชีได้');
}
```

## Loading State

Context มี `isLoading` state สำหรับแสดงสถานะการโหลด:

```typescript
const { isLoading } = useAccounts();

if (isLoading) {
  return <div>Loading...</div>;
}
```

## Best Practices

1. **เรียก refreshAccounts() เมื่อ mount คอมโพเนนต์**
   ```typescript
   useEffect(() => {
     refreshAccounts();
   }, [refreshAccounts]);
   ```

2. **ตรวจสอบ error และ loading state เสมอ**
   ```typescript
   if (isLoading) return <LoadingSpinner />;
   if (error) return <ErrorMessage message={error} />;
   ```

3. **ใช้ try-catch สำหรับ async operations**
   ```typescript
   try {
     await createAccount(data);
     alert('สำเร็จ!');
   } catch (err) {
     alert('เกิดข้อผิดพลาด');
   }
   ```

4. **Refresh accounts หลังจากทำ transaction**
   ```typescript
   await createTransfer(data);
   await refreshAccounts(); // ยอดเงินจะอัปเดตอัตโนมัติ
   ```

## Integration Checklist

- [x] สร้าง AccountContext
- [x] เพิ่ม AccountProvider ใน layout
- [ ] อัปเดตหน้า Accounts ให้ใช้ real API แทน mock data
- [ ] เพิ่ม loading และ error handling
- [ ] ทดสอบการสร้าง/แก้ไข/ลบบัญชี
- [ ] ทดสอบการโอนเงินระหว่างบัญชี
- [ ] ทดสอบการจัดการสมาชิกในบัญชีร่วม
- [ ] ทดสอบการเข้าร่วมบัญชีด้วย share code

## Next Steps

1. อัปเดตหน้า `/dashboard/accounts` ให้ใช้ `useAccounts()` แทน mock data
2. อัปเดตหน้า `/dashboard/budgets` ให้ใช้ข้อมูลบัญชีจริง
3. เพิ่ม Bank Connection features (ถ้ามี backend พร้อม)
4. เพิ่ม real-time notification เมื่อมีการเปลี่ยนแปลงบัญชี
