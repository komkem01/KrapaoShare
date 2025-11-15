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
  const mockAccounts = [
    { id: 1, name: 'บัญชีออมทรัพย์ SCB', type: 'personal' as const, balance: 25000, bank: 'ธนาคารไทยพาณิชย์', accountNumber: 'xxx-x-x1234-x' },
    { id: 2, name: 'บัญชีกระแสรายวัน BBL', type: 'personal' as const, balance: 8500, bank: 'ธนาคารกรุงเทพ', accountNumber: 'xxx-x-x5678-x' },
    { id: 3, name: 'กลุ่มเพื่อนบ้าน - ค่าส่วนกลาง', type: 'shared' as const, balance: 12000, bank: 'กลุ่ม', accountNumber: 'shared-001' }
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
        type: activeTab,
        accountId: selectedAccountId,
        categoryId: currentCategory.selectedCategory?.id,
        category: currentCategory.selectedCategory,
        amount: parseFloat(amount),
        description: description.trim(),
        date,
        timestamp: new Date().toISOString()
      };

      console.log('Transaction saved:', transactionData);

      addNotification(createNotification.success(
        'บันทึกสำเร็จ',
        `บันทึก${activeTab === 'income' ? 'รายรับ' : 'รายจ่าย'}จำนวน ฿${parseFloat(amount).toLocaleString()} เรียบร้อยแล้ว`,
        'transaction'
      ));

      // Reset form
      setSelectedAccountId(null);
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      expenseCategory.reset();
      incomeCategory.reset();

      // กลับไปหน้าหลัก
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Error saving transaction:', error);
      addNotification(createNotification.error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'transaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-light text-gray-900 dark:text-white">
            บันทึกรายการ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            เพิ่มรายรับหรือรายจ่ายใหม่
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                activeTab === 'expense'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b-2 border-red-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">📉</span>
                <span>รายจ่าย</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                activeTab === 'income'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-b-2 border-green-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">📈</span>
                <span>รายรับ</span>
              </div>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                เลือกบัญชี *
              </label>
              <AccountSelector
                accounts={mockAccounts}
                selectedAccountId={selectedAccountId}
                onSelect={(account: Account) => setSelectedAccountId(account.id)}
                placeholder="เลือกบัญชีที่จะทำรายการ"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                หมวดหมู่ *
              </label>
              <CategorySelector
                type={activeTab}
                selectedCategoryId={currentCategory.selectedCategoryId}
                onSelect={currentCategory.handleSelect}
                placeholder={`เลือกหมวดหมู่${activeTab === 'income' ? 'รายรับ' : 'รายจ่าย'}`}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                จำนวนเงิน *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  ฿
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {selectedAccount && activeTab === 'expense' && amount && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ยอดคงเหลือหลังทำรายการ: 
                  </span>
                  <span className={`font-medium ml-1 ${
                    selectedAccount.balance - parseFloat(amount || '0') < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    ฿{(selectedAccount.balance - parseFloat(amount || '0')).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                รายละเอียด *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
                placeholder="กรอกรายละเอียดการทำรายการ..."
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วันที่
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Preview Card */}
            {(selectedAccountId && currentCategory.selectedCategory && amount && description) && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ตัวอย่างรายการ</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span 
                      className="text-xl p-2 rounded-lg"
                      style={{ backgroundColor: `${currentCategory.selectedCategory.color}20` }}
                    >
                      {currentCategory.selectedCategory.icon}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentCategory.selectedCategory.name} • {selectedAccount?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      activeTab === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {activeTab === 'income' ? '+' : '-'}฿{parseFloat(amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(date).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedAccountId || !currentCategory.selectedCategory || !amount || !description.trim()}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  activeTab === 'income'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                }`}
              >
                {isSubmitting ? 'กำลังบันทึก...' : `บันทึก${activeTab === 'income' ? 'รายรับ' : 'รายจ่าย'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}