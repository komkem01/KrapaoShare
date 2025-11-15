'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccountSelector from '@/components/ui/AccountSelector';

interface Account {
  id: number;
  name: string;
  type: 'personal' | 'shared';
  balance: number;
  color: string;
  bankName?: string;
  isDefault: boolean;
}

interface Transaction {
  id: number;
  accountId: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
}

export default function AddTransactionPage() {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1); // Default account
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Mock accounts data
  const mockAccounts: Account[] = [
    {
      id: 1,
      name: 'บัญชีออมทรัพย์หลัก',
      type: 'personal',
      balance: 45800,
      color: '#10B981',
      bankName: 'ธนาคารกสิกรไทย',
      isDefault: true
    },
    {
      id: 2,
      name: 'บัญชีกระแสรายวัน',
      type: 'personal',
      balance: 12500,
      color: '#3B82F6',
      bankName: 'ธนาคารกรุงเทพ',
      isDefault: false
    },
    {
      id: 3,
      name: 'ทริปญี่ปุ่น 2026',
      type: 'shared',
      balance: 45000,
      color: '#8B5CF6',
      isDefault: false
    },
    {
      id: 4,
      name: 'ซื้อรถร่วมกัน',
      type: 'shared',
      balance: 120000,
      color: '#F59E0B',
      isDefault: false
    }
  ];

  const expenseCategories = [
    'อาหาร', 'ค่าเดินทาง', 'เสื้อผ้า', 'ความบันเทิง', 'สุขภาพ', 
    'บ้าน', 'การศึกษา', 'ช้อปปิ้ง', 'ค่าใช้จ่ายประจำ', 'อื่นๆ'
  ];

  const incomeCategories = [
    'เงินเดือน', 'โบนัส', 'ธุรกิจส่วนตัว', 'การลงทุน', 'ค่าจ้างพิเศษ',
    'ของขวัญ', 'เงินปันผล', 'การขาย', 'รายได้อื่นๆ'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId || !amount || !description || !category) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (parseFloat(amount) <= 0) {
      alert('จำนวนเงินต้องมากกว่า 0');
      return;
    }

    const selectedAccount = mockAccounts.find(acc => acc.id === selectedAccountId);
    if (activeTab === 'expense' && selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      alert('ยอดเงินในบัญชีไม่เพียงพอ');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset form
    setAmount('');
    setDescription('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    
    setIsLoading(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const selectedAccount = mockAccounts.find(acc => acc.id === selectedAccountId);

  return (
    <DashboardLayout>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">บันทึกรายการสำเร็จ!</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-white">
            บันทึกรายการ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            เพิ่มรายรับหรือรายจ่ายเข้าบัญชีของคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              {/* Transaction Type Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('expense')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'expense'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  💸 รายจ่าย
                </button>
                <button
                  onClick={() => setActiveTab('income')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'income'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  💰 รายรับ
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Selector */}
                <AccountSelector
                  accounts={mockAccounts}
                  selectedAccountId={selectedAccountId}
                  onAccountChange={setSelectedAccountId}
                  required={true}
                  showBalance={true}
                />

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    จำนวนเงิน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">฿</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                        activeTab === 'expense' 
                          ? 'border-red-200 dark:border-red-700 focus:ring-red-500' 
                          : 'border-green-200 dark:border-green-700 focus:ring-green-500'
                      }`}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  {activeTab === 'expense' && selectedAccount && parseFloat(amount) > selectedAccount.balance && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      ยอดเงินในบัญชีไม่เพียงพอ (คงเหลือ ฿{selectedAccount.balance.toLocaleString()})
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    รายละเอียด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                    placeholder={activeTab === 'expense' ? 'เช่น ค่าอาหารเที่ยง' : 'เช่น เงินเดือนเดือนนี้'}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {(activeTab === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    วันที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-xl text-white font-medium transition-all duration-200 disabled:cursor-not-allowed ${
                    activeTab === 'expense'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500'
                  }`}
                >
                  {isLoading ? 'กำลังบันทึก...' : `บันทึก${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}`}
                </button>
              </form>
            </div>
          </div>

          {/* Summary & Preview */}
          <div className="space-y-6">
            {/* Account Summary */}
            {selectedAccount && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ข้อมูลบัญชีที่เลือก
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: selectedAccount.color }}
                    ></div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedAccount.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedAccount.type === 'personal' ? 'บัญชีส่วนตัว' : 'บัญชีร่วม'}
                        {selectedAccount.bankName && ` • ${selectedAccount.bankName}`}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      ยอดคงเหลือปัจจุบัน
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ฿{selectedAccount.balance.toLocaleString()}
                    </div>
                  </div>

                  {amount && parseFloat(amount) > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                        ยอดคงเหลือหลังทำรายการ
                      </div>
                      <div className={`text-xl font-bold ${
                        activeTab === 'expense'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        ฿{(
                          activeTab === 'expense' 
                            ? selectedAccount.balance - parseFloat(amount)
                            : selectedAccount.balance + parseFloat(amount)
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Preview */}
            {amount && description && category && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ตัวอย่างรายการ
                </h3>
                
                <div className={`p-4 rounded-lg border-l-4 ${
                  activeTab === 'expense'
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-500'
                    : 'bg-green-50 dark:bg-green-900/30 border-green-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {description}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {category} • {new Date(date).toLocaleDateString('th-TH')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        บัญชี: {selectedAccount?.name}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      activeTab === 'expense'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {activeTab === 'expense' ? '-' : '+'}฿{parseFloat(amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                💡 เคล็ดลับ
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• เลือกบัญชีที่ถูกต้องก่อนบันทึกรายการ</li>
                <li>• กรอกรายละเอียดให้ชัดเจนเพื่อง่ายต่อการติดตาม</li>
                <li>• เลือกหมวดหมู่ที่เหมาะสมเพื่อการวิเคราะห์</li>
                <li>• ตรวจสอบยอดเงินคงเหลือก่อนทำรายการ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}