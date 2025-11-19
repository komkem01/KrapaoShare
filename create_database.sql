-- KrapaoShare Database Creation Script
-- สคริปต์สำหรับสร้างฐานข้อมูล PostgreSQL

-- ===========================================
-- 1. CREATE DATABASE AND EXTENSIONS
-- ===========================================

-- CREATE DATABASE krapaoshare;
-- \c krapaoshare;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- 2. CREATE ENUM TYPES
-- ===========================================

CREATE TYPE user_role AS ENUM ('admin', 'member', 'owner');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE theme_type AS ENUM ('auto', 'dark', 'light');
CREATE TYPE time_format AS ENUM ('12h', '24h');
CREATE TYPE account_type AS ENUM ('personal', 'shared', 'business');
CREATE TYPE account_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE transfer_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE split_type AS ENUM ('equal', 'custom', 'percentage');
CREATE TYPE bill_status AS ENUM ('active', 'settled', 'cancelled');
CREATE TYPE bill_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly', 'custom');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE goal_type AS ENUM ('savings', 'purchase', 'debt_payoff');
CREATE TYPE shared_goal_type AS ENUM ('group_savings', 'group_purchase', 'event_fund');
CREATE TYPE shared_goal_member_role AS ENUM ('creator', 'admin', 'member');
CREATE TYPE debt_type AS ENUM ('personal', 'loan', 'bill_split', 'advance_payment', 'other');
CREATE TYPE debt_status AS ENUM ('active', 'partially_paid', 'fully_paid', 'forgiven');
CREATE TYPE notification_type AS ENUM ('transaction', 'bill', 'budget', 'goal', 'debt', 'reminder', 'system');
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE notification_frequency AS ENUM ('immediate', 'daily', 'weekly', 'never');
CREATE TYPE connection_type AS ENUM ('open_banking', 'api', 'scraping', 'manual');
CREATE TYPE sync_status AS ENUM ('active', 'inactive', 'error');
CREATE TYPE sync_frequency AS ENUM ('realtime', 'hourly', 'daily', 'weekly');
CREATE TYPE import_status AS ENUM ('pending', 'processed', 'duplicate', 'error');
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json');

-- ===========================================
-- 3. CREATE TABLES - PHASE 1: CORE TABLES
-- ===========================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    occupation VARCHAR(100),
    address TEXT,
    role user_role DEFAULT 'member',
    status user_status DEFAULT 'active',
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    device_info TEXT,
    ip_address INET,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Types
CREATE TABLE types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    icon VARCHAR(50),
    color VARCHAR(7),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- App settings
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type setting_type DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exchange rates
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(from_currency, to_currency, effective_date)
);

-- ===========================================
-- 4. CREATE TABLES - PHASE 2: CONFIGURATION
-- ===========================================

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme theme_type DEFAULT 'auto',
    language VARCHAR(5) DEFAULT 'th',
    currency VARCHAR(3) DEFAULT 'THB',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format time_format DEFAULT '24h',
    first_day_week VARCHAR(10) DEFAULT 'monday',
    push_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_id UUID NOT NULL REFERENCES types(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    icon VARCHAR(50),
    color VARCHAR(7),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Notification settings
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    frequency notification_frequency DEFAULT 'immediate',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, notification_type)
);

-- ===========================================
-- 5. CREATE TABLES - PHASE 3: ACCOUNTS
-- ===========================================

-- Accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    bank_number VARCHAR(50),
    account_type account_type DEFAULT 'personal',
    color VARCHAR(7),
    start_amount DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    share_code VARCHAR(20) UNIQUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Account members
CREATE TABLE account_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role account_member_role DEFAULT 'member',
    permissions JSONB,
    joined_at TIMESTAMP DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(account_id, user_id)
);

-- Account transfers
CREATE TABLE account_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    to_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    transfer_fee DECIMAL(15,2) DEFAULT 0,
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    status transfer_status DEFAULT 'completed',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- 6. CREATE TABLES - PHASE 4: RECURRING BILLS
-- ===========================================

-- Recurring bills
CREATE TABLE recurring_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    frequency bill_frequency NOT NULL,
    frequency_value INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_create_bill BOOLEAN DEFAULT FALSE,
    remind_days_before INTEGER DEFAULT 3,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- ===========================================
-- 7. CREATE TABLES - PHASE 5: BILLS
-- ===========================================

-- Bills
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    total_amount DECIMAL(15,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    split_type split_type DEFAULT 'equal',
    status bill_status DEFAULT 'active',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_bill_id UUID REFERENCES recurring_bills(id) ON DELETE SET NULL,
    receipt_url TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Bill participants
CREATE TABLE bill_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_owed DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    is_settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMP,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(bill_id, user_id)
);

-- ===========================================
-- 8. CREATE TABLES - PHASE 6: TRANSACTIONS
-- ===========================================

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_time TIME DEFAULT CURRENT_TIME,
    reference_number VARCHAR(100),
    location VARCHAR(200),
    notes TEXT,
    tags JSONB,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_bill_id UUID REFERENCES recurring_bills(id) ON DELETE SET NULL,
    
    -- Relations
    transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    shared_goal_id UUID, -- Will be added later
    budget_id UUID, -- Will be added later
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- ===========================================
-- 9. CREATE TABLES - PHASE 7: BUDGETS
-- ===========================================

-- Budgets
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    budget_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    period_type budget_period DEFAULT 'monthly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    budget_month INTEGER,
    budget_year INTEGER,
    alert_percentage DECIMAL(5,2) DEFAULT 80,
    is_active BOOLEAN DEFAULT TRUE,
    auto_rollover BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- ===========================================
-- 10. CREATE TABLES - PHASE 8: GOALS
-- ===========================================

-- Goals
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    target_date DATE,
    priority goal_priority DEFAULT 'medium',
    goal_type goal_type DEFAULT 'savings',
    auto_save_amount DECIMAL(15,2) DEFAULT 0,
    auto_save_frequency bill_frequency,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Shared goals
CREATE TABLE shared_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    target_date DATE,
    goal_type shared_goal_type DEFAULT 'group_savings',
    share_code VARCHAR(20) UNIQUE NOT NULL,
    auto_save BOOLEAN DEFAULT FALSE,
    minimum_contribution DECIMAL(15,2) DEFAULT 0,
    maximum_members INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Shared goal members
CREATE TABLE shared_goal_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shared_goal_id UUID NOT NULL REFERENCES shared_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contribution_amount DECIMAL(15,2) DEFAULT 0,
    target_contribution DECIMAL(15,2),
    role shared_goal_member_role DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(shared_goal_id, user_id)
);

-- Goal contributions
CREATE TABLE goal_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shared_goal_id UUID NOT NULL REFERENCES shared_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    contribution_date DATE NOT NULL,
    contribution_method VARCHAR(20) DEFAULT 'manual',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- 11. ADD FOREIGN KEYS TO TRANSACTIONS
-- ===========================================

-- Add missing foreign keys
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_shared_goal 
FOREIGN KEY (shared_goal_id) REFERENCES shared_goals(id) ON DELETE SET NULL;

ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_budget 
FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL;

-- ===========================================
-- 12. CREATE TABLES - PHASE 9: DEBTS
-- ===========================================

-- Debts
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creditor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    debtor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    debt_type debt_type DEFAULT 'personal',
    status debt_status DEFAULT 'active',
    due_date DATE,
    interest_rate DECIMAL(5,4) DEFAULT 0,
    payment_terms TEXT,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Debt payments
CREATE TABLE debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    payer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_id UUID UNIQUE REFERENCES transactions(id) ON DELETE SET NULL,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- 13. CREATE TABLES - PHASE 10: NOTIFICATIONS
-- ===========================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'normal',
    icon VARCHAR(50),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url TEXT,
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- ===========================================
-- 14. CREATE TABLES - PHASE 11: ANALYTICS
-- ===========================================

-- User analytics
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    total_income DECIMAL(15,2) DEFAULT 0,
    total_expense DECIMAL(15,2) DEFAULT 0,
    net_income DECIMAL(15,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    avg_transaction_amount DECIMAL(15,2) DEFAULT 0,
    top_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    top_category_amount DECIMAL(15,2) DEFAULT 0,
    savings_rate DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, year, month)
);

-- Category analytics
CREATE TABLE category_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    avg_amount DECIMAL(15,2) DEFAULT 0,
    budget_amount DECIMAL(15,2) DEFAULT 0,
    budget_utilization DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, category_id, year, month)
);

-- ===========================================
-- 15. CREATE TABLES - PHASE 12: AUDIT & INTEGRATIONS
-- ===========================================

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bank connections
CREATE TABLE bank_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    external_account_id VARCHAR(100) NOT NULL,
    connection_type connection_type DEFAULT 'manual',
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    last_sync_at TIMESTAMP,
    sync_status sync_status DEFAULT 'active',
    sync_frequency sync_frequency DEFAULT 'daily',
    auto_categorize BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Imported transactions
CREATE TABLE imported_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
    external_transaction_id VARCHAR(100) NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    raw_data JSONB NOT NULL,
    import_status import_status DEFAULT 'pending',
    match_confidence DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- 16. CREATE INDEXES
-- ===========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status_role ON users(status, role);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);

-- Categories indexes
CREATE INDEX idx_categories_user_type ON categories(user_id, type_id);
CREATE INDEX idx_categories_user_active ON categories(user_id, is_active);

-- Accounts indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_user_active ON accounts(user_id, is_active);
CREATE INDEX idx_accounts_share_code ON accounts(share_code);

-- Account members indexes
CREATE INDEX idx_account_members_account_id ON account_members(account_id);
CREATE INDEX idx_account_members_user_id ON account_members(user_id);

-- Transactions indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_bill_id ON transactions(bill_id);
CREATE INDEX idx_transactions_shared_goal_id ON transactions(shared_goal_id);

-- Account transfers indexes
CREATE INDEX idx_account_transfers_from ON account_transfers(from_account_id);
CREATE INDEX idx_account_transfers_to ON account_transfers(to_account_id);
CREATE INDEX idx_account_transfers_pair ON account_transfers(from_account_id, to_account_id);

-- Bills indexes
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_category_id ON bills(category_id);
CREATE INDEX idx_bills_user_status ON bills(user_id, status);
CREATE INDEX idx_bills_due_date ON bills(due_date) WHERE status = 'active';

-- Bill participants indexes
CREATE INDEX idx_bill_participants_bill_id ON bill_participants(bill_id);
CREATE INDEX idx_bill_participants_user_id ON bill_participants(user_id);
CREATE INDEX idx_bill_participants_user_settled ON bill_participants(user_id, is_settled);

-- Recurring bills indexes
CREATE INDEX idx_recurring_bills_user_id ON recurring_bills(user_id);
CREATE INDEX idx_recurring_bills_next_due ON recurring_bills(next_due_date);
CREATE INDEX idx_recurring_bills_user_active ON recurring_bills(user_id, is_active);

-- Budgets indexes
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, period_start, period_end);
CREATE INDEX idx_budgets_user_active ON budgets(user_id, is_active);

-- Goals indexes
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_category_id ON goals(category_id);
CREATE INDEX idx_goals_user_completed ON goals(user_id, is_completed);
CREATE INDEX idx_goals_target_date ON goals(target_date);

-- Shared goals indexes
CREATE INDEX idx_shared_goals_creator ON shared_goals(created_by_user_id);
CREATE INDEX idx_shared_goals_share_code ON shared_goals(share_code);
CREATE INDEX idx_shared_goals_active_target ON shared_goals(is_active, target_date);

-- Shared goal members indexes
CREATE INDEX idx_shared_goal_members_goal ON shared_goal_members(shared_goal_id);
CREATE INDEX idx_shared_goal_members_user ON shared_goal_members(user_id);

-- Goal contributions indexes
CREATE INDEX idx_goal_contributions_goal ON goal_contributions(shared_goal_id);
CREATE INDEX idx_goal_contributions_user ON goal_contributions(user_id);
CREATE INDEX idx_goal_contributions_goal_date ON goal_contributions(shared_goal_id, contribution_date);

-- Debts indexes
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_creditor ON debts(creditor_user_id);
CREATE INDEX idx_debts_debtor ON debts(debtor_user_id);
CREATE INDEX idx_debts_user_status ON debts(user_id, status);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_debts_bill_id ON debts(bill_id);

-- Debt payments indexes
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX idx_debt_payments_payer ON debt_payments(payer_user_id);
CREATE INDEX idx_debt_payments_date ON debt_payments(payment_date);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Analytics indexes
CREATE INDEX idx_user_analytics_user ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_period ON user_analytics(year, month);

CREATE INDEX idx_category_analytics_user ON category_analytics(user_id);
CREATE INDEX idx_category_analytics_category ON category_analytics(category_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Bank connections indexes
CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_account_id ON bank_connections(account_id);
CREATE INDEX idx_bank_connections_user_bank ON bank_connections(user_id, bank_name);

-- Imported transactions indexes
CREATE INDEX idx_imported_transactions_user_id ON imported_transactions(user_id);
CREATE INDEX idx_imported_transactions_bank ON imported_transactions(bank_connection_id);
CREATE INDEX idx_imported_transactions_external_id ON imported_transactions(external_transaction_id);
CREATE INDEX idx_imported_transactions_status ON imported_transactions(import_status);

-- Exchange rates indexes
CREATE INDEX idx_exchange_rates_date ON exchange_rates(effective_date DESC);

-- ===========================================
-- 17. CREATE TRIGGERS FOR UPDATED_AT
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_types_updated_at BEFORE UPDATE ON types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_members_updated_at BEFORE UPDATE ON account_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_transfers_updated_at BEFORE UPDATE ON account_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_bills_updated_at BEFORE UPDATE ON recurring_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bill_participants_updated_at BEFORE UPDATE ON bill_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_goals_updated_at BEFORE UPDATE ON shared_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_goal_members_updated_at BEFORE UPDATE ON shared_goal_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_contributions_updated_at BEFORE UPDATE ON goal_contributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debt_payments_updated_at BEFORE UPDATE ON debt_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_analytics_updated_at BEFORE UPDATE ON category_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_connections_updated_at BEFORE UPDATE ON bank_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_imported_transactions_updated_at BEFORE UPDATE ON imported_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 18. COMPLETED
-- ===========================================

-- All tables created successfully!
-- Remember to insert seed data for types and categories
-- Check DATABASE_IMPLEMENTATION_GUIDE.md for seed data examples