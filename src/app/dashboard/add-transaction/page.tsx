'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CategorySelector, { useCategorySelector } from '@/components/ui/CategorySelector';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAccounts, type Account } from '@/contexts/AccountContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { getStoredUser } from '@/utils/authStorage';
import { accountTransactionApi } from '@/utils/apiClient';
import type { CreateTransactionRequest } from '@/types/transaction';

export default function AddTransactionPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { accounts, refreshAccounts, updateBalance, isLoading: accountsLoading } = useAccounts();
  const { createTransaction } = useTransactions();
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ใช้ CategorySelector hooks แยกตามประเภท
  const expenseCategory = useCategorySelector('expense');
  const incomeCategory = useCategorySelector('income');

  // Load accounts on mount
  useEffect(() => {
    console.log('Loading accounts...');
    refreshAccounts().catch(err => {
      console.error('Failed to refresh accounts:', err);
    });
  }, [refreshAccounts]);

  // Debug logging
  useEffect(() => {
    console.log('Accounts state:', accounts);
    console.log('Accounts loading:', accountsLoading);
  }, [accounts, accountsLoading]);

  const safeAccounts = (accounts ?? []).filter(
    (account): account is Account => Boolean(account && account.id)
  );

  useEffect(() => {
    if (accounts && accounts.some(account => !account || !account.id)) {
      console.warn('Detected invalid account entries from API response:', accounts);
    }
  }, [accounts]);

  const selectedAccount = safeAccounts.find(acc => acc.id === selectedAccountId);
  const currentCategory = activeTab === 'expense' ? expenseCategory : incomeCategory;

  const handleSubmit = async () => {
    // ตรวจสอบว่าข้อมูลบัญชีโหลดเสร็จแล้ว
    if (accountsLoading || !accounts) {
      await addNotification({
        title: 'กำลังโหลดข้อมูล',
        message: 'กรุณารอสักครู่ ระบบกำลังโหลดข้อมูลบัญชี',
        type: 'warning',
        priority: 'normal'
      });
      return;
    }

    // Validation
    if (!selectedAccountId) {
      await addNotification({
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาเลือกบัญชีที่จะทำรายการ',
        type: 'error',
        priority: 'high'
      });
      return;
    }

    if (!currentCategory.selectedCategory) {
      await addNotification({
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาเลือกหมวดหมู่',
        type: 'error',
        priority: 'high'
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      await addNotification({
        title: 'จำนวนเงินไม่ถูกต้อง',
        message: 'กรุณากรอกจำนวนเงินที่ถูกต้อง',
        type: 'error',
        priority: 'high'
      });
      return;
    }

    if (!description.trim()) {
      await addNotification({
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกรายละเอียด',
        type: 'error',
        priority: 'high'
      });
      return;
    }

    // ตรวจสอบยอดเงินสำหรับรายจ่าย (ใช้ข้อมูลล่าสุด)
  const latestAccount = safeAccounts.find(acc => acc.id === selectedAccountId);
    if (activeTab === 'expense' && latestAccount && latestAccount.current_balance < parseFloat(amount)) {
      await addNotification({
        title: 'ยอดเงินไม่เพียงพอ',
        message: 'ยอดเงินในบัญชีไม่เพียงพอสำหรับรายการนี้',
        type: 'error',
        priority: 'high'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const storedUser = getStoredUser();
      if (!storedUser?.id) {
        throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      }

      const transactionPayload: CreateTransactionRequest = {
        userId: storedUser.id,
        accountId: selectedAccountId,
        categoryId: currentCategory.selectedCategory?.id || null,
        type: activeTab,
        amount: parseFloat(amount),
        description: description.trim(),
        transactionDate: date,
        transactionTime: new Date().toTimeString().split(' ')[0], // HH:MM:SS format
        isRecurring: false,
      };

      const result = await createTransaction(transactionPayload);
      console.log('Transaction created:', result);

      // Create account transaction record and update balance
      if (selectedAccountId) {
        // Create account transaction record first
        await accountTransactionApi.create({
          user_id: storedUser.id,
          account_id: selectedAccountId,
          transaction_type: activeTab === 'expense' ? 'withdraw' : 'deposit',
          amount: parseFloat(amount),
          note: `${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}: ${description.trim()}`,
          category_id: currentCategory.selectedCategory?.id
        });

        // Then update account balance
        await updateBalance(selectedAccountId, {
          amount: parseFloat(amount),
          operation: activeTab === 'expense' ? 'subtract' : 'add',
          note: `${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}: ${description.trim()}`
        });
      }

      // Refresh accounts to update balances after transaction
      await refreshAccounts();

      // รีเซ็ตฟอร์ม
      setAmount('');
      setDescription('');
      currentCategory.reset();
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedAccountId(null);

      // แสดงการแจ้งเตือนสำเร็จ
      await addNotification({
        title: 'บันทึกสำเร็จ',
        message: `บันทึก${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'} ${parseFloat(amount).toLocaleString()} บาท`,
        type: 'success',
        priority: 'normal',
        action_url: '/dashboard/transactions'
      });

      // กลับไปหน้า Transactions
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 1000);

    } catch (error) {
      console.error('Error saving transaction:', error);
      await addNotification({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกรายการได้ กรุณาลองใหม่อีกครั้ง',
        type: 'error',
        priority: 'high'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">บันทึกรายรับ-รายจ่าย</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">เพิ่มรายการเงินเข้าหรือออก</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/transactions')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← กลับ
          </button>
        </div>

        {/* Type Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'expense'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg mr-2">💸</span>
            รายจ่าย
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'income'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg mr-2">💰</span>
            รายรับ
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-6">
            {/* Account Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                เลือกบัญชี <span className="text-red-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  กำลังโหลดบัญชี...
                </div>
              ) : safeAccounts.length === 0 ? (
                <div className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  ไม่พบบัญชี กรุณาเพิ่มบัญชีก่อนทำรายการ
                </div>
              ) : (
                <select
                  value={selectedAccountId || ''}
                  onChange={(e) => setSelectedAccountId(e.target.value || null)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">เลือกบัญชีที่ต้องการทำรายการ</option>
                  {safeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (฿{account.current_balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <CategorySelector
                type={activeTab}
                selectedCategoryId={currentCategory.selectedCategoryId}
                onSelect={currentCategory.handleSelect}
                placeholder={`เลือกหมวดหมู่${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}`}
              />
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                จำนวนเงิน <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">฿</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                รายละเอียด <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วันที่
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || accountsLoading || safeAccounts.length === 0}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                isSubmitting || accountsLoading || safeAccounts.length === 0
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : activeTab === 'expense'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </span>
              ) : accountsLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังโหลด...
                </span>
              ) : (
                `บันทึก${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}`
              )}
            </button>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Selected Account Info */}
            {selectedAccount && (
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-sm font-medium opacity-90 mb-2">บัญชีที่เลือก</h3>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{selectedAccount.name}</p>
                  <p className="text-sm opacity-90">{selectedAccount.bank_name || 'ไม่ระบุธนาคาร'}</p>
                  <div className="pt-3 border-t border-white/20">
                    <p className="text-xs opacity-75 mb-1">ยอดคงเหลือ</p>
                    <p className="text-2xl font-bold">฿{selectedAccount.current_balance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Summary */}
            {amount && parseFloat(amount) > 0 && (
              <div className={`rounded-xl p-6 shadow-lg ${
                activeTab === 'expense'
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : 'bg-gradient-to-br from-green-500 to-green-600'
              } text-white`}>
                <h3 className="text-sm font-medium opacity-90 mb-2">สรุปรายการ</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="opacity-90">ประเภท</span>
                    <span className="font-medium">{activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}</span>
                  </div>
                  {currentCategory.selectedCategory && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">หมวดหมู่</span>
                      <span className="font-medium">{currentCategory.selectedCategory.name}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-white/20">
                    <p className="text-xs opacity-75 mb-1">จำนวนเงิน</p>
                    <p className="text-3xl font-bold">฿{parseFloat(amount).toLocaleString()}</p>
                  </div>
                  {selectedAccount && activeTab === 'expense' && (
                    <div className="pt-3 border-t border-white/20">
                      <p className="text-xs opacity-75 mb-1">ยอดคงเหลือหลังหัก</p>
                      <p className="text-xl font-bold">
                        ฿{(selectedAccount.current_balance - parseFloat(amount)).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">💡 เคล็ดลับ</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• เลือกบัญชีที่ต้องการทำรายการ</li>
                <li>• เลือกหมวดหมู่ที่เหมาะสม</li>
                <li>• ใส่จำนวนเงินและรายละเอียด</li>
                <li>• ตรวจสอบข้อมูลก่อนบันทึก</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
