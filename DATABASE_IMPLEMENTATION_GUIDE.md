# KrapaoShare Database Implementation Guide
## คู่มือการ Implement ฐานข้อมูลสำหรับทีม Backend

### 📋 ข้อมูลพื้นฐาน
- **ไฟล์ Schema**: `database_schema_complete.dbml`
- **รวมตาราง**: 24 ตาราง
- **Database Engine**: แนะนำ PostgreSQL (รองรับ UUID, JSON, และ Complex Queries)
- **ORM แนะนำ**: Prisma, TypeORM, หรือ Drizzle

---

## 🏗️ การติดตั้งและเตรียมความพร้อม

### 1. สร้างฐานข้อมูล
```sql
-- สร้าง Database
CREATE DATABASE krapaoshare;

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. ลำดับการสร้างตาราง (สำคัญ!)
เนื่องจากมี Foreign Keys เยอะ ต้องสร้างตามลำดับนี้:

#### Phase 1: Core Tables (ไม่มี dependencies)
1. `users`
2. `types` 
3. `app_settings`
4. `exchange_rates`

#### Phase 2: Configuration Tables
5. `user_sessions`
6. `system_settings`
7. `categories` (depends on: users, types)
8. `notification_settings`

#### Phase 3: Account & Transaction Tables
9. `accounts` (depends on: users)
10. `account_members` (depends on: accounts, users)
11. `account_transfers` (depends on: accounts)

#### Phase 4: Core Business Logic
12. `recurring_bills` (depends on: users, categories)
13. `bills` (depends on: users, categories, recurring_bills)
14. `bill_participants` (depends on: bills, users)
15. `transactions` (depends on: users, accounts, categories, recurring_bills, bills)

#### Phase 5: Goals & Budgets
16. `budgets` (depends on: users, categories)
17. `goals` (depends on: users, categories)
18. `shared_goals` (depends on: users, categories)
19. `shared_goal_members` (depends on: shared_goals, users)
20. `goal_contributions` (depends on: shared_goals, users, transactions)

#### Phase 6: Debt Management
21. `debts` (depends on: users, bills)
22. `debt_payments` (depends on: debts, users, transactions)

#### Phase 7: Analytics & Integrations
23. `notifications` (depends on: users)
24. `user_analytics` (depends on: users, categories)
25. `category_analytics` (depends on: users, categories)
26. `audit_logs` (depends on: users)
27. `bank_connections` (depends on: users, accounts)
28. `imported_transactions` (depends on: users, bank_connections, transactions)

---

## 🔧 การปรับแต่งสำคัญ

### 1. UUID Generation
```sql
-- ตัวอย่างสำหรับ PostgreSQL
ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
```

### 2. Enum Types
```sql
-- สร้าง Enum Types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE split_type AS ENUM ('equal', 'custom', 'percentage');
-- ... และอื่นๆ ตาม schema
```

### 3. Indexes สำคัญ
```sql
-- Performance critical indexes
CREATE INDEX CONCURRENTLY idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX CONCURRENTLY idx_bills_due_date ON bills(due_date) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

---

## 📊 ข้อมูลเริ่มต้น (Seed Data)

### 1. System Types
```sql
INSERT INTO types (id, name, icon, color, is_system) VALUES
  (uuid_generate_v4(), 'income', '💰', '#10B981', true),
  (uuid_generate_v4(), 'expense', '💸', '#EF4444', true);
```

### 2. Default Categories
```sql
-- รายรับ
INSERT INTO categories (id, type_id, user_id, name, icon, color, is_active) VALUES
  (uuid_generate_v4(), [income_type_id], NULL, 'เงินเดือน', '💰', '#10B981', true),
  (uuid_generate_v4(), [income_type_id], NULL, 'ธุรกิจ', '💼', '#3B82F6', true),
  (uuid_generate_v4(), [income_type_id], NULL, 'เงินลงทุน', '📈', '#8B5CF6', true),
  (uuid_generate_v4(), [income_type_id], NULL, 'อื่นๆ', '💵', '#06B6D4', true);

-- รายจ่าย  
INSERT INTO categories (id, type_id, user_id, name, icon, color, is_active) VALUES
  (uuid_generate_v4(), [expense_type_id], NULL, 'อาหาร', '🍽️', '#EF4444', true),
  (uuid_generate_v4(), [expense_type_id], NULL, 'ค่าเดินทาง', '🚗', '#F97316', true),
  (uuid_generate_v4(), [expense_type_id], NULL, 'ช้อปปิ้ง', '🛒', '#EC4899', true),
  (uuid_generate_v4(), [expense_type_id], NULL, 'บันเทิง', '🎬', '#8B5CF6', true),
  (uuid_generate_v4(), [expense_type_id], NULL, 'ค่าใช้จ่ายบ้าน', '🏠', '#06B6D4', true),
  (uuid_generate_v4(), [expense_type_id], NULL, 'สุขภาพ', '🏥', '#10B981', true),
  (uuid_generate_v4(), [expense_type_id], NULL, 'การศึกษา', '📚', '#3B82F6', true),
  (uuid_generate_v4(), [expense_type_id], NULL, 'อื่นๆ', '💳', '#6B7280', true);
```

---

## 🔐 Security Considerations

### 1. Sensitive Data
```sql
-- Encrypt sensitive fields
CREATE OR REPLACE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.access_token_encrypted = pgp_sym_encrypt(NEW.access_token_encrypted, 'your-secret-key');
  NEW.refresh_token_encrypted = pgp_sym_encrypt(NEW.refresh_token_encrypted, 'your-secret-key');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Row Level Security (RLS)
```sql
-- Enable RLS for sensitive tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Example policy
CREATE POLICY user_transactions_policy ON transactions
  FOR ALL TO authenticated_users
  USING (user_id = current_user_id());
```

---

## 📈 Performance Optimization

### 1. Partitioning (สำหรับข้อมูลขนาดใหญ่)
```sql
-- Partition transactions by date
CREATE TABLE transactions_2025 PARTITION OF transactions
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### 2. Materialized Views
```sql
-- สำหรับ Analytics
CREATE MATERIALIZED VIEW user_monthly_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', transaction_date) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
FROM transactions 
GROUP BY user_id, DATE_TRUNC('month', transaction_date);

-- สร้าง index
CREATE INDEX idx_user_monthly_summary ON user_monthly_summary(user_id, month);
```

---

## 📝 API Endpoints แนะนำ

### 1. Authentication
- `POST /auth/login`
- `POST /auth/register` 
- `POST /auth/refresh`
- `POST /auth/logout`

### 2. Transactions
- `GET /api/transactions` - ดูรายการ
- `POST /api/transactions` - เพิ่มรายการ
- `PUT /api/transactions/:id` - แก้ไข
- `DELETE /api/transactions/:id` - ลบ

### 3. Bills
- `GET /api/bills` - ดูบิลทั้งหมด
- `POST /api/bills` - สร้างบิลใหม่
- `POST /api/bills/:id/split` - แบ่งบิล
- `POST /api/bills/:id/settle` - จ่ายบิล

### 4. Budgets & Goals
- `GET /api/budgets` - ดูงบประมาณ
- `POST /api/budgets` - สร้างงบประมาณ
- `GET /api/goals` - ดูเป้าหมาย
- `POST /api/goals` - สร้างเป้าหมาย

---

## 🧪 Testing Strategy

### 1. Unit Tests
- ทดสอบ Business Logic แต่ละ function
- ทดสอบ Validation rules
- ทดสอบ Edge cases

### 2. Integration Tests  
- ทดสอบ API endpoints
- ทดสอบ Database operations
- ทดสอบ Authentication flow

### 3. Load Testing
- ทดสอบ concurrent users
- ทดสอบ large datasets
- ทดสอบ query performance

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] สร้างฐานข้อมูลตามลำดับที่กำหนด
- [ ] เพิ่มข้อมูลเริ่มต้น (seed data)
- [ ] ตั้งค่า indexes และ constraints
- [ ] ทดสอบ performance

### Production Setup
- [ ] ตั้งค่า connection pooling
- [ ] ตั้งค่า backup strategy
- [ ] ตั้งค่า monitoring และ alerting
- [ ] ตั้งค่า SSL/TLS connections

### Monitoring
- [ ] Query performance monitoring
- [ ] Database size monitoring  
- [ ] Connection count monitoring
- [ ] Error rate monitoring

---

## 📞 Support & Questions

หากมีคำถามเพิ่มเติมเกี่ยวกับการ implement:

1. **Database Schema**: ดูไฟล์ `database_schema_complete.dbml`
2. **Business Logic**: ตรวจสอบจาก TypeScript types ใน `src/types/index.ts`
3. **UI/UX Requirements**: ดูจากโครงสร้างหน้าเว็บใน `src/app/dashboard/`

---

**✅ Schema พร้อมส่งให้ Backend Team แล้ว!**

*อัพเดทล่าสุด: 16 พฤศจิกายน 2025*