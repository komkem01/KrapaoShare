'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccountSelector, { Account } from '@/components/ui/AccountSelector';
import CategorySelector, { useCategorySelector } from '@/components/ui/CategorySelector';
import { useNotifications, createNotification } from '@/contexts/NotificationContext';

export default function AddTransactionPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ใช้ CategorySelector hooks แยกตามประเภท
  const expenseCategory = useCategorySelector('expense');
  const incomeCategory = useCategorySelector('income');

  // ดึงข้อมูลบัญชีจำลอง (ในอนาคตจะเชื่อมกับ API)
  const mockAccounts: Account[] = [
    { id: 1, name: 'บัญชีออมทรัพย์ SCB', type: 'personal', balance: 25000, bank: 'ธนาคารไทยพาณิชย์', accountNumber: 'xxx-x-x1234-x' },
    { id: 2, name: 'บัญชีกระแสรายวัน BBL', type: 'personal', balance: 8500, bank: 'ธนาคารกรุงเทพ', accountNumber: 'xxx-x-x5678-x' },
    { id: 3, name: 'กลุ่มเพื่อนบ้าน - ค่าส่วนกลาง', type: 'shared', balance: 12000, bank: 'กลุ่ม', accountNumber: 'shared-001' }
  ];

  const selectedAccount = mockAccounts.find(acc => acc.id === selectedAccountId);
  const currentCategory = activeTab === 'expense' ? expenseCategory : incomeCategory;

  const handleSubmit = async () => {
    // Validation
    if (!selectedAccountId) {
      addNotification(createNotification.error('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกบัญชีที่จะทำรายการ', 'transaction'));
      return;
    }

    if (!currentCategory.selectedCategory) {
      addNotification(createNotification.error('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกหมวดหมู่', 'transaction'));
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      addNotification(createNotification.error('จำนวนเงินไม่ถูกต้อง', 'กรุณากรอกจำนวนเงินที่ถูกต้อง', 'transaction'));
      return;
    }

    if (!description.trim()) {
      addNotification(createNotification.error('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกรายละเอียด', 'transaction'));
      return;
    }

    // ตรวจสอบยอดเงินสำหรับรายจ่าย
    if (activeTab === 'expense' && selectedAccount && selectedAccount.balance < parseFloat(amount)) {
      addNotification(createNotification.error('ยอดเงินไม่เพียงพอ', 'ยอดเงินในบัญชีไม่เพียงพอสำหรับรายการนี้', 'transaction'));
      return;
    }

    setIsSubmitting(true);

    try {
      // จำลองการบันทึกข้อมูล (ในอนาคตจะเรียก API จริง)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const transactionData = {
        id: Date.now(), // ใช้ timestamp เป็น ID ชั่วคราว
        type: activeTab,
        accountId: selectedAccountId,
        categoryId: currentCategory.selectedCategory?.id,
        category: currentCategory.selectedCategory?.name || '',
        amount: parseFloat(amount),
        description,
        date,
        time: new Date().toLocaleTimeString('th-TH', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };

      // บันทึกลง localStorage
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const updatedTransactions = [transactionData, ...existingTransactions];
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      console.log('Transaction saved:', transactionData);

      // รีเซ็ตฟอร์ม
      setAmount('');
      setDescription('');
      currentCategory.reset();
      setDate(new Date().toISOString().split('T')[0]);

      // แสดงการแจ้งเตือนสำเร็จ
      addNotification(
        createNotification.success(
          'บันทึกสำเร็จ',
          `บันทึก${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'} ${parseFloat(amount).toLocaleString()} บาท`,
          'transaction'
        )
      );

      // กลับไปหน้า Transactions
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 1000);

    } catch (error) {
      console.error('Error saving transaction:', error);
      addNotification(createNotification.error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกรายการได้ กรุณาลองใหม่อีกครั้ง', 'transaction'));
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
              <AccountSelector
                accounts={mockAccounts}
                selectedAccountId={selectedAccountId}
                onSelect={(account) => setSelectedAccountId(account.id)}
                placeholder="เลือกบัญชีที่ต้องการทำรายการ"
              />
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
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                isSubmitting
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
                  <p className="text-sm opacity-90">{selectedAccount.bank}</p>
                  <div className="pt-3 border-t border-white/20">
                    <p className="text-xs opacity-75 mb-1">ยอดคงเหลือ</p>
                    <p className="text-2xl font-bold">฿{selectedAccount.balance.toLocaleString()}</p>
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
                        ฿{(selectedAccount.balance - parseFloat(amount)).toLocaleString()}
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
