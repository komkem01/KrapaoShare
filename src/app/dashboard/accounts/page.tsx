'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Account {
  id: number;
  name: string;
  type: 'personal' | 'shared';
  balance: number;
  currency: string;
  bankName?: string;
  accountNumber?: string;
  color: string;
  isDefault: boolean;
  createdDate: string;
  lastTransaction?: string;
  // For shared accounts
  ownerId?: string;
  members?: AccountMember[];
  connectedGoals?: number[];
  permissions?: 'view' | 'deposit' | 'withdraw' | 'admin';
}

interface AccountMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinDate: string;
  permissions: string[];
}

interface Transaction {
  id: number;
  accountId: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  category: string;
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'shared' | 'history'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'personal' as 'personal' | 'shared',
    balance: '',
    bankName: '',
    accountNumber: '',
    color: '#3B82F6'
  });

  const [joinCode, setJoinCode] = useState('');
  const [transferData, setTransferData] = useState({
    fromAccountId: 0,
    toAccountId: 0,
    amount: '',
    note: ''
  });

  const [inviteData, setInviteData] = useState({
    accountId: 0,
    email: '',
    role: 'member' as 'admin' | 'member',
    permissions: [] as string[]
  });

  // Mock data
  const mockAccounts: Account[] = [
    {
      id: 1,
      name: 'บัญชีออมทรัพย์หลัก',
      type: 'personal',
      balance: 45800,
      currency: 'THB',
      bankName: 'ธนาคารกสิกรไทย',
      accountNumber: '123-4-56789-0',
      color: '#10B981',
      isDefault: true,
      createdDate: '2025-01-15',
      lastTransaction: '2025-11-15'
    },
    {
      id: 2,
      name: 'บัญชีกระแสรายวัน',
      type: 'personal',
      balance: 12500,
      currency: 'THB',
      bankName: 'ธนาคารกรุงเทพ',
      accountNumber: '987-6-54321-0',
      color: '#3B82F6',
      isDefault: false,
      createdDate: '2025-02-20',
      lastTransaction: '2025-11-14'
    },
    {
      id: 3,
      name: 'ทริปญี่ปุ่น 2026',
      type: 'shared',
      balance: 45000,
      currency: 'THB',
      color: '#8B5CF6',
      isDefault: false,
      createdDate: '2025-10-01',
      lastTransaction: '2025-11-10',
      ownerId: 'user123',
      members: [
        { id: 'user123', name: 'คุณ', email: 'you@example.com', role: 'owner', joinDate: '2025-10-01', permissions: ['admin', 'withdraw', 'deposit', 'invite'] },
        { id: 'user456', name: 'มิกิ', email: 'miki@example.com', role: 'member', joinDate: '2025-10-05', permissions: ['deposit', 'view'] },
        { id: 'user789', name: 'โยชิ', email: 'yoshi@example.com', role: 'member', joinDate: '2025-10-10', permissions: ['deposit', 'view'] }
      ],
      connectedGoals: [1],
      permissions: 'admin'
    },
    {
      id: 4,
      name: 'ซื้อรถร่วมกัน',
      type: 'shared',
      balance: 120000,
      currency: 'THB',
      color: '#F59E0B',
      isDefault: false,
      createdDate: '2025-09-01',
      lastTransaction: '2025-11-12',
      ownerId: 'user123',
      members: [
        { id: 'user123', name: 'คุณ', email: 'you@example.com', role: 'owner', joinDate: '2025-09-01', permissions: ['admin', 'withdraw', 'deposit', 'invite'] },
        { id: 'user111', name: 'แอน', email: 'ann@example.com', role: 'admin', joinDate: '2025-09-15', permissions: ['deposit', 'view', 'invite'] },
        { id: 'user222', name: 'บิว', email: 'bew@example.com', role: 'member', joinDate: '2025-10-01', permissions: ['deposit', 'view'] }
      ],
      connectedGoals: [2],
      permissions: 'admin'
    }
  ];

  const mockTransactions: Transaction[] = [
    { id: 1, accountId: 1, type: 'income', amount: 25000, description: 'เงินเดือน', date: '2025-11-15', category: 'เงินเดือน' },
    { id: 2, accountId: 1, type: 'expense', amount: 850, description: 'ค่าอาหารเที่ยง', date: '2025-11-15', category: 'อาหาร' },
    { id: 3, accountId: 3, type: 'income', amount: 5000, description: 'ฝากเงินจากมิกิ', date: '2025-11-10', category: 'เงินฝาก' },
    { id: 4, accountId: 2, type: 'expense', amount: 320, description: 'ค่าแท็กซี่', date: '2025-11-14', category: 'ค่าเดินทาง' },
    { id: 5, accountId: 4, type: 'income', amount: 20000, description: 'เงินจากบิว', date: '2025-11-12', category: 'เงินฝาก' }
  ];

  const personalAccounts = mockAccounts.filter(acc => acc.type === 'personal');
  const sharedAccounts = mockAccounts.filter(acc => acc.type === 'shared');
  const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const personalBalance = personalAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const sharedBalance = sharedAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleCreateAccount = async () => {
    if (!newAccount.name || !newAccount.balance) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setShowCreateModal(false);
    setNewAccount({ name: '', type: 'personal', balance: '', bankName: '', accountNumber: '', color: '#3B82F6' });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleJoinSharedAccount = async () => {
    if (!joinCode) {
      alert('กรุณากรอกรหัสบัญชี');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setShowJoinModal(false);
    setJoinCode('');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleTransfer = async () => {
    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (transferData.fromAccountId === transferData.toAccountId) {
      alert('ไม่สามารถโอนเงินภายในบัญชีเดียวกันได้');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowTransferModal(false);
    setTransferData({ fromAccountId: 0, toAccountId: 0, amount: '', note: '' });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowEditModal(true);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !editingAccount.name) {
      alert('กรุณากรอกชื่อบัญชี');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setShowEditModal(false);
    setEditingAccount(null);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleDeleteAccount = (account: Account) => {
    setDeletingAccount(account);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!deletingAccount) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setShowDeleteModal(false);
    setDeletingAccount(null);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const generateAccountCode = (accountId: number): string => {
    return `ACC${accountId.toString().padStart(3, '0')}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const copyAccountCode = async (code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'ภาพรวม', icon: '📊' },
    { id: 'personal', name: 'บัญชีส่วนตัว', icon: '👤' },
    { id: 'shared', name: 'บัญชีร่วม', icon: '👥' },
    { id: 'history', name: 'ประวัติรายการ', icon: '📜' }
  ];

  return (
    <DashboardLayout>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">ดำเนินการสำเร็จ!</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              จัดการบัญชี
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการบัญชีส่วนตัวและบัญชีร่วมของคุณ
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              👥 เข้าร่วมบัญชี
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              + สร้างบัญชี
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              💸 โอนเงิน
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ยอดรวมทั้งหมด
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ฿{totalBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl">
                <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              จาก {mockAccounts.length} บัญชี
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  บัญชีส่วนตัว
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ฿{personalBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl">
                <span className="text-blue-600 dark:text-blue-400 text-xl">👤</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {personalAccounts.length} บัญชี
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  บัญชีร่วม
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ฿{sharedBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-xl">
                <span className="text-purple-600 dark:text-purple-400 text-xl">👥</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {sharedAccounts.length} บัญชี
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รายการล่าสุด
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {mockTransactions.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-xl">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📝</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              7 วันที่ผ่านมา
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  การดำเนินการด่วน
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-2xl">➕</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">สร้างบัญชีใหม่</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">บัญชีส่วนตัวหรือร่วม</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-2xl">🤝</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">เข้าร่วมบัญชี</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ใช้รหัสบัญชี</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-2xl">💸</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">โอนเงิน</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ระหว่างบัญชี</div>
                    </div>
                  </button>
                  
                  <button className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600">
                    <span className="text-2xl">📊</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">รายงาน</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">สรุปรายเดือน</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* All Accounts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  บัญชีทั้งหมด
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockAccounts.map((account) => (
                    <div key={account.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: account.color }}
                          ></div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {account.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {account.type === 'personal' ? 'บัญชีส่วนตัว' : 'บัญชีร่วม'}
                              {account.isDefault && ' • ค่าเริ่มต้น'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              ฿{account.balance.toLocaleString()}
                            </div>
                            {account.type === 'shared' && account.members && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {account.members.length} สมาชิก
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditAccount(account)}
                              className="p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="แก้ไขบัญชี"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account)}
                              className="p-1 text-red-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="ลบบัญชี"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {account.bankName && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {account.bankName} • {account.accountNumber}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>สร้างเมื่อ: {new Date(account.createdDate).toLocaleDateString('th-TH')}</span>
                        {account.lastTransaction && (
                          <span>รายการล่าสุด: {new Date(account.lastTransaction).toLocaleDateString('th-TH')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  บัญชีส่วนตัว ({personalAccounts.length} บัญชี)
                </h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + เพิ่มบัญชี
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {personalAccounts.map((account) => (
                  <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: account.color }}
                        ></div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {account.name}
                          </h4>
                          {account.isDefault && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                              บัญชีหลัก
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="p-2 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="แก้ไขบัญชี"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account)}
                          className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="ลบบัญชี"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      ฿{account.balance.toLocaleString()}
                    </div>

                    {account.bankName && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {account.bankName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {account.accountNumber}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 py-2 px-4 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-sm font-medium">
                        💰 ฝากเงิน
                      </button>
                      <button className="flex-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 py-2 px-4 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium">
                        💸 ถอนเงิน
                      </button>
                      <button
                        onClick={() => setShowTransferModal(true)}
                        className="flex-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 py-2 px-4 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                      >
                        🔄 โอน
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>สร้างเมื่อ: {new Date(account.createdDate).toLocaleDateString('th-TH')}</span>
                        {account.lastTransaction && (
                          <span>อัพเดท: {new Date(account.lastTransaction).toLocaleDateString('th-TH')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shared' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  บัญชีร่วม ({sharedAccounts.length} บัญชี)
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    👥 เข้าร่วม
                  </button>
                  <button
                    onClick={() => {
                      setNewAccount({...newAccount, type: 'shared'});
                      setShowCreateModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + สร้างใหม่
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {sharedAccounts.map((account) => (
                  <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: account.color }}
                        >
                          👥
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {account.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {account.members?.length} สมาชิก • รหัส: {generateAccountCode(account.id)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyAccountCode(generateAccountCode(account.id))}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="คัดลอกรหัสบัญชี"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => {
                            setInviteData({...inviteData, accountId: account.id});
                            setShowInviteModal(true);
                          }}
                          className="p-2 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="เชิญสมาชิก"
                        >
                          ➕
                        </button>
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="p-2 text-green-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                          title="แก้ไขบัญชี"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account)}
                          className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="ลบบัญชี"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Balance */}
                      <div className="lg:col-span-1">
                        <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            ฿{account.balance.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            ยอดคงเหลือ
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <button className="w-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 py-2 px-4 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-sm font-medium">
                            💰 ฝากเงิน
                          </button>
                          {(account.permissions === 'admin' || account.permissions === 'withdraw') && (
                            <button className="w-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 py-2 px-4 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium">
                              💸 ถอนเงิน
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Members */}
                      <div className="lg:col-span-2">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                          สมาชิก ({account.members?.length} คน)
                        </h5>
                        <div className="space-y-2">
                          {account.members?.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {member.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {member.name}
                                    {member.role === 'owner' && (
                                      <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                                        เจ้าของ
                                      </span>
                                    )}
                                    {member.role === 'admin' && (
                                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                                        แอดมิน
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  เข้าร่วม: {new Date(member.joinDate).toLocaleDateString('th-TH')}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  สิทธิ์: {member.permissions.join(', ')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {account.connectedGoals && account.connectedGoals.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">เชื่อมต่อกับเป้าหมาย:</span>
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                            {account.connectedGoals.length} เป้าหมาย
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ประวัติรายการทั้งหมด
                </h3>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="all">บัญชีทั้งหมด</option>
                    {mockAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                  <select className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="all">ทุกประเภท</option>
                    <option value="income">รายรับ</option>
                    <option value="expense">รายจ่าย</option>
                    <option value="transfer">โอนเงิน</option>
                  </select>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          วันที่
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          บัญชี
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          รายการ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          หมวดหมู่
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          จำนวนเงิน
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {mockTransactions.map((transaction) => {
                        const account = mockAccounts.find(acc => acc.id === transaction.accountId);
                        return (
                          <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {new Date(transaction.date).toLocaleDateString('th-TH')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: account?.color }}
                                ></div>
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {account?.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                                {transaction.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <span className={`font-medium ${
                                transaction.type === 'income' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}฿{transaction.amount.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Account Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowCreateModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🏦</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">สร้างบัญชีใหม่</h3>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-6">
                    {/* Account Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        ประเภทบัญชี
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setNewAccount({...newAccount, type: 'personal'})}
                          className={`p-4 border-2 rounded-xl transition-all ${
                            newAccount.type === 'personal'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <span className="text-2xl mb-2 block">👤</span>
                            <div className="font-medium text-gray-900 dark:text-white">บัญชีส่วนตัว</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">เฉพาะคุณ</div>
                          </div>
                        </button>
                        <button
                          onClick={() => setNewAccount({...newAccount, type: 'shared'})}
                          className={`p-4 border-2 rounded-xl transition-all ${
                            newAccount.type === 'shared'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <span className="text-2xl mb-2 block">👥</span>
                            <div className="font-medium text-gray-900 dark:text-white">บัญชีร่วม</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">หลายคน</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Account Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อบัญชี *
                      </label>
                      <input
                        type="text"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder={newAccount.type === 'personal' ? 'เช่น บัญชีออมทรัพย์หลัก' : 'เช่น ทริปญี่ปุ่น 2026'}
                      />
                    </div>

                    {/* Initial Balance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ยอดเงินเริ่มต้น *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">฿</span>
                        <input
                          type="number"
                          value={newAccount.balance}
                          onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        สีประจำบัญชี
                      </label>
                      <div className="flex space-x-2">
                        {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewAccount({...newAccount, color})}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newAccount.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bank Details (Personal Only) */}
                    {newAccount.type === 'personal' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ธนาคาร (ไม่บังคับ)
                          </label>
                          <select
                            value={newAccount.bankName}
                            onChange={(e) => setNewAccount({...newAccount, bankName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">เลือกธนาคาร</option>
                            <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                            <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                            <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                            <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                            <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                            <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            เลขที่บัญชี (ไม่บังคับ)
                          </label>
                          <input
                            type="text"
                            value={newAccount.accountNumber}
                            onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="123-4-56789-0"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleCreateAccount}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Shared Account Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowJoinModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">👥</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">เข้าร่วมบัญชีร่วม</h3>
                    </div>
                    <button
                      onClick={() => setShowJoinModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-blue-600 dark:text-blue-400 text-2xl">👥</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        เข้าร่วมบัญชีร่วม
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        กรอกรหัสบัญชีที่ได้รับจากเจ้าของบัญชี
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รหัสบัญชี
                      </label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-center font-mono text-lg tracking-widest"
                        placeholder="ACC001ABCD"
                        maxLength={10}
                      />
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        วิธีการใช้งาน
                      </h5>
                      <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                        <li>ขอรหัสบัญชีจากเจ้าของบัญชี</li>
                        <li>กรอกรหัสในช่องด้านบน</li>
                        <li>คลิก "เข้าร่วมบัญชี"</li>
                        <li>รอการอนุมัติจากเจ้าของบัญชี</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowJoinModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleJoinSharedAccount}
                      disabled={isLoading || !joinCode}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'กำลังเข้าร่วม...' : 'เข้าร่วมบัญชี'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowTransferModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">💸</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">โอนเงินระหว่างบัญชี</h3>
                    </div>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        จากบัญชี
                      </label>
                      <select
                        value={transferData.fromAccountId}
                        onChange={(e) => setTransferData({...transferData, fromAccountId: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={0}>เลือกบัญชีต้นทาง</option>
                        {mockAccounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.name} - ฿{account.balance.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400">↓</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ไปยังบัญชี
                      </label>
                      <select
                        value={transferData.toAccountId}
                        onChange={(e) => setTransferData({...transferData, toAccountId: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={0}>เลือกบัญชีปลายทาง</option>
                        {mockAccounts.filter(acc => acc.id !== transferData.fromAccountId).map(account => (
                          <option key={account.id} value={account.id}>
                            {account.name} - ฿{account.balance.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        จำนวนเงิน
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">฿</span>
                        <input
                          type="number"
                          value={transferData.amount}
                          onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        หมายเหตุ (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        value={transferData.note}
                        onChange={(e) => setTransferData({...transferData, note: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="เช่น เงินสำหรับค่าใช้จ่าย"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleTransfer}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'กำลังโอน...' : 'โอนเงิน'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditModal && editingAccount && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowEditModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">✏️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">แก้ไขบัญชี</h3>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-6">
                    {/* Account Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อบัญชี *
                      </label>
                      <input
                        type="text"
                        value={editingAccount.name}
                        onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="ชื่อบัญชี"
                      />
                    </div>

                    {/* Current Balance (Read Only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ยอดเงินปัจจุบัน
                      </label>
                      <div className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        ฿{editingAccount.balance.toLocaleString()}
                      </div>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        สีประจำบัญชี
                      </label>
                      <div className="flex space-x-2">
                        {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditingAccount({...editingAccount, color})}
                            className={`w-8 h-8 rounded-full border-2 ${
                              editingAccount.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bank Details (Personal Only) */}
                    {editingAccount.type === 'personal' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ธนาคาร
                          </label>
                          <select
                            value={editingAccount.bankName || ''}
                            onChange={(e) => setEditingAccount({...editingAccount, bankName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">เลือกธนาคาร</option>
                            <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                            <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                            <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                            <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                            <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                            <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            เลขที่บัญชี
                          </label>
                          <input
                            type="text"
                            value={editingAccount.accountNumber || ''}
                            onChange={(e) => setEditingAccount({...editingAccount, accountNumber: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                            placeholder="123-4-56789-0"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleUpdateAccount}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingAccount && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDeleteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">⚠️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">ยืนยันการลบบัญชี</h3>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-red-600 dark:text-red-400 text-2xl">🗑️</span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      คุณต้องการลบบัญชี "{deletingAccount.name}" หรือไม่?
                    </h4>
                    
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                        คำเตือน: การดำเนินการนี้ไม่สามารถยกเลิกได้
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-300 text-left list-disc list-inside space-y-1">
                        <li>ข้อมูลบัญชีจะถูกลบถาวร</li>
                        <li>ประวัติรายการทั้งหมดจะหายไป</li>
                        <li>ยอดเงินคงเหลือ: ฿{deletingAccount.balance.toLocaleString()}</li>
                        {deletingAccount.type === 'shared' && deletingAccount.members && (
                          <li>สมาชิกทั้งหมด ({deletingAccount.members.length} คน) จะไม่สามารถเข้าถึงบัญชีได้</li>
                        )}
                      </ul>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      หากคุณแน่ใจ กรุณาคลิก "ลบบัญชี" เพื่อดำเนินการต่อ
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={confirmDeleteAccount}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'กำลังลบ...' : '🗑️ ลบบัญชี'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowInviteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="relative bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">✉️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">เชิญสมาชิกใหม่</h3>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        อีเมลของสมาชิกใหม่
                      </label>
                      <input
                        type="email"
                        value={inviteData.email}
                        onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="example@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        บทบาท
                      </label>
                      <select
                        value={inviteData.role}
                        onChange={(e) => setInviteData({...inviteData, role: e.target.value as 'admin' | 'member'})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="member">สมาชิกทั่วไป</option>
                        <option value="admin">ผู้ดูแล</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        สิทธิ์การเข้าถึง
                      </label>
                      <div className="space-y-2">
                        {['view', 'deposit', 'withdraw', 'invite'].map((permission) => (
                          <label key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={inviteData.permissions.includes(permission)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setInviteData({
                                    ...inviteData,
                                    permissions: [...inviteData.permissions, permission]
                                  });
                                } else {
                                  setInviteData({
                                    ...inviteData,
                                    permissions: inviteData.permissions.filter(p => p !== permission)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {permission === 'view' && 'ดูยอดเงิน'}
                              {permission === 'deposit' && 'ฝากเงิน'}
                              {permission === 'withdraw' && 'ถอนเงิน'}
                              {permission === 'invite' && 'เชิญสมาชิก'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'กำลังส่งคำเชิญ...' : 'ส่งคำเชิญ'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}