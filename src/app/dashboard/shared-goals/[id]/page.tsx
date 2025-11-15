'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Member {
  name: string;
  amount: number;
  target: number;
  joinDate: string;
  email?: string;
}

interface Activity {
  date: string;
  member: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'join' | 'leave';
  note?: string;
}

interface SharedGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description: string;
  category: string;
  createdDate: string;
  members: Member[];
  recentActivity: Activity[];
  createdBy: string;
  isPublic: boolean;
  autoSave: boolean;
  monthlyTarget: number;
  groupCode: string;
}

export default function SharedGoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = parseInt(params.id as string);

  const [goal, setGoal] = useState<SharedGoal | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activity' | 'settings'>('overview');

  // Mock data - ในอนาคตจะเชื่อมกับ API
  const mockGoalsData: { [key: number]: SharedGoal } = {
    1: {
      id: 1,
      name: 'ทริปญี่ปุ่น 2026',
      targetAmount: 150000,
      currentAmount: 45000,
      targetDate: '2026-03-15',
      description: 'ทริปเที่ยวญี่ปุ่น 10 วัน ช่วงซากุระบาน รวมตั๋วเครื่องบิน ที่พัก และค่าใช้จ่ายต่างๆ',
      category: 'ท่องเที่ยว',
      createdDate: '2025-10-01',
      groupCode: 'JAPAN2026',
      members: [
        { name: 'คุณ', amount: 25000, target: 50000, joinDate: '2025-10-01', email: 'you@example.com' },
        { name: 'มิกิ', amount: 15000, target: 50000, joinDate: '2025-10-05', email: 'miki@example.com' },
        { name: 'โยชิ', amount: 5000, target: 50000, joinDate: '2025-10-10', email: 'yoshi@example.com' }
      ],
      recentActivity: [
        { date: '2025-11-10', member: 'มิกิ', amount: 5000, type: 'deposit', note: 'เงินโบนัสเดือนนี้' },
        { date: '2025-11-08', member: 'คุณ', amount: 10000, type: 'deposit', note: 'เงินเดือนส่วนหนึ่ง' },
        { date: '2025-11-05', member: 'โยชิ', amount: 5000, type: 'deposit', note: 'เก็บจากการทำงานพิเศษ' },
        { date: '2025-10-20', member: 'คุณ', amount: 15000, type: 'deposit', note: 'เงินออมเดือนก่อน' },
        { date: '2025-10-10', member: 'โยชิ', amount: 0, type: 'join', note: 'เข้าร่วมกลุ่ม' }
      ],
      createdBy: 'คุณ',
      isPublic: false,
      autoSave: true,
      monthlyTarget: 15000
    },
    2: {
      id: 2,
      name: 'ซื้อรถร่วมกัน',
      targetAmount: 300000,
      currentAmount: 120000,
      targetDate: '2025-12-31',
      description: 'รถยนต์มือสองสำหรับใช้ร่วมกัน Toyota Vios 2020',
      category: 'รถยนต์',
      createdDate: '2025-09-01',
      groupCode: 'CAR2025X',
      members: [
        { name: 'คุณ', amount: 60000, target: 100000, joinDate: '2025-09-01', email: 'you@example.com' },
        { name: 'แอน', amount: 40000, target: 100000, joinDate: '2025-09-15', email: 'ann@example.com' },
        { name: 'บิว', amount: 20000, target: 100000, joinDate: '2025-10-01', email: 'bew@example.com' }
      ],
      recentActivity: [
        { date: '2025-11-12', member: 'บิว', amount: 20000, type: 'deposit', note: 'เงินจากการขายของเก่า' },
        { date: '2025-11-01', member: 'คุณ', amount: 30000, type: 'deposit', note: 'เงินโบนัสประจำปี' },
        { date: '2025-10-15', member: 'แอน', amount: 40000, type: 'deposit', note: 'เงินจากการลงทุน' },
        { date: '2025-10-01', member: 'บิว', amount: 0, type: 'join', note: 'เข้าร่วมกลุ่ม' }
      ],
      createdBy: 'คุณ',
      isPublic: false,
      autoSave: false,
      monthlyTarget: 25000
    }
  };

  useEffect(() => {
    const goalData = mockGoalsData[goalId];
    if (goalData) {
      setGoal(goalData);
    }
  }, [goalId]);

  const handleDeposit = () => {
    if (!depositAmount || !goal) return;

    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    // อัพเดทยอดเงินของสมาชิก "คุณ"
    const updatedMembers = goal.members.map(member => 
      member.name === 'คุณ' 
        ? { ...member, amount: member.amount + amount }
        : member
    );

    // เพิ่มกิจกรรมใหม่
    const newActivity: Activity = {
      date: new Date().toISOString().split('T')[0],
      member: 'คุณ',
      amount: amount,
      type: 'deposit',
      note: depositNote || 'ฝากเงินเข้าเป้าหมาย'
    };

    setGoal(prev => prev ? {
      ...prev,
      currentAmount: prev.currentAmount + amount,
      members: updatedMembers,
      recentActivity: [newActivity, ...prev.recentActivity]
    } : null);

    // รีเซ็ตฟอร์ม
    setDepositAmount('');
    setDepositNote('');
    setShowDepositModal(false);
  };

  const handleShowGroupCode = () => {
    // แสดงรหัสกลุ่มให้ผู้ใช้แชร์
    console.log('Showing group code for goal:', goal?.id, 'Code:', goal?.groupCode);
    setShowInviteModal(false);
  };

  const copyGroupCode = async (code: string) => {
    if (isCopying) return; // ป้องกันการคลิกซ้ำ
    
    setIsCopying(true);
    
    try {
      // ลองใช้ Clipboard API ก่อน
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // ใช้วิธีสำรองสำหรับเบราว์เซอร์เก่า
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
          // แสดง prompt ให้ผู้ใช้คัดลอกเอง
          const userCode = prompt('คัดลอกรหัสนี้:', code);
          if (userCode !== null) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      // แสดง prompt ให้ผู้ใช้คัดลอกเอง
      const userCode = prompt('คัดลอกรหัสนี้:', code);
      if (userCode !== null) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const handleLeaveGroup = () => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะออกจากกลุ่มนี้?')) {
      router.push('/dashboard/shared-goals');
    }
  };



  if (!goal) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              ไม่พบเป้าหมายนี้
            </h2>
            <button 
              onClick={() => router.push('/dashboard/shared-goals')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              กลับไปหน้าเป้าหมายออมร่วมกัน
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const monthlyRequired = (goal.targetAmount - goal.currentAmount) / Math.max(1, Math.ceil(daysLeft / 30));

  return (
    <DashboardLayout>
      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">คัดลอกรหัสแล้ว!</span>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/shared-goals')}
              className="group flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              title="กลับไปหน้าเป้าหมายออมร่วมกัน"
            >
              <span className="text-lg group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
              <span className="text-sm font-medium hidden sm:block">กลับ</span>
            </button>
            <div>
              <h1 className="text-2xl font-light text-gray-900 dark:text-white">
                {goal.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {goal.description}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              💰 ฝากเงิน
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              � แชร์รหัส
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Progress */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ความคืบหน้าเป้าหมาย
                </h3>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>฿{goal.currentAmount.toLocaleString()}</span>
                  <span>฿{goal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500" 
                    style={{width: `${Math.min(progressPercentage, 100)}%`}}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {daysLeft > 0 ? daysLeft : 0}
                  </div>
                  <div className="text-xs text-blue-800 dark:text-blue-300">
                    วันที่เหลือ
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    ฿{Math.round(monthlyRequired).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-800 dark:text-green-300">
                    ต้องออมต่อเดือน
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {goal.members.length}
                  </div>
                  <div className="text-xs text-purple-800 dark:text-purple-300">
                    สมาชิก
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  หมวดหมู่
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {goal.category}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เป้าหมายวันที่
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(goal.targetDate).toLocaleDateString('th-TH')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  สร้างโดย
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {goal.createdBy}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ออโต้เซฟ
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {goal.autoSave ? '✅ เปิด' : '❌ ปิด'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'ภาพรวม' },
              { key: 'members', label: 'สมาชิก' },
              { key: 'activity', label: 'กิจกรรม' },
              { key: 'settings', label: 'การตั้งค่า' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ความคืบหน้าของสมาชิก
                </h3>
                <div className="space-y-4">
                  {goal.members.map((member, index) => {
                    const memberProgress = (member.amount / member.target) * 100;
                    return (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${member.name === 'คุณ' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {member.name}
                            </span>
                            {member.name === goal.createdBy && (
                              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                                ผู้สร้าง
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              ฿{member.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              / ฿{member.target.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              memberProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{width: `${Math.min(memberProgress, 100)}%`}}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>เข้าร่วม: {new Date(member.joinDate).toLocaleDateString('th-TH')}</span>
                          <span>{Math.round(memberProgress)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  กิจกรรมล่าสุด
                </h3>
                <div className="space-y-3">
                  {goal.recentActivity.slice(0, 6).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {activity.type === 'deposit' ? '💰' : 
                           activity.type === 'join' ? '👋' : 
                           activity.type === 'leave' ? '👋' : '💸'}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {activity.member}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.type === 'deposit' ? 'ฝากเงิน' :
                             activity.type === 'join' ? 'เข้าร่วมกลุ่ม' :
                             activity.type === 'leave' ? 'ออกจากกลุ่ม' : 'ถอนเงิน'}
                            {activity.note && ` - ${activity.note}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.type === 'deposit' && (
                          <div className="text-green-600 dark:text-green-400 font-medium">
                            +฿{activity.amount.toLocaleString()}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.date).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  สมาชิกทั้งหมด ({goal.members.length} คน)
                </h3>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  + เชิญเพื่อน
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goal.members.map((member, index) => {
                  const memberProgress = (member.amount / member.target) * 100;
                  return (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className={`font-medium ${member.name === 'คุณ' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                            {member.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            เข้าร่วมเมื่อ: {new Date(member.joinDate).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          {member.name === goal.createdBy && (
                            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                              ผู้สร้าง
                            </span>
                          )}
                          {member.name === 'คุณ' && (
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                              คุณ
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">ยอดปัจจุบัน</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ฿{member.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">เป้าหมาย</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ฿{member.target.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              memberProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{width: `${Math.min(memberProgress, 100)}%`}}
                          ></div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(memberProgress)}% ของเป้าหมาย
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                ประวัติกิจกรรมทั้งหมด
              </h3>
              <div className="space-y-4">
                {goal.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">
                        {activity.type === 'deposit' ? '💰' : 
                         activity.type === 'join' ? '👋' : 
                         activity.type === 'leave' ? '👋' : '💸'}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {activity.member}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.type === 'deposit' ? 'ฝากเงินเข้าเป้าหมาย' :
                             activity.type === 'join' ? 'เข้าร่วมเป้าหมายออมร่วมกัน' :
                             activity.type === 'leave' ? 'ออกจากเป้าหมายออมร่วมกัน' : 'ถอนเงินจากเป้าหมาย'}
                          </p>
                          {activity.note && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              หมายเหตุ: {activity.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {activity.type === 'deposit' && (
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              +฿{activity.amount.toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                การตั้งค่าเป้าหมาย
              </h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    ข้อมูลเป้าหมาย
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-yellow-700 dark:text-yellow-300">รหัสกลุ่ม:</span>
                      <span className="ml-2 text-yellow-900 dark:text-yellow-100 font-mono font-bold">
                        {goal.groupCode}
                      </span>
                      <button
                        onClick={() => copyGroupCode(goal.groupCode)}
                        disabled={isCopying}
                        className="ml-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 disabled:text-yellow-400 disabled:cursor-not-allowed"
                        title={isCopying ? "กำลังคัดลอก..." : copySuccess ? "คัดลอกแล้ว!" : "คัดลอกรหัส"}
                      >
                        {isCopying ? "⏳" : copySuccess ? "✅" : "📋"}
                      </button>
                    </div>
                    <div>
                      <span className="text-yellow-700 dark:text-yellow-300">สร้างเมื่อ:</span>
                      <span className="ml-2 text-yellow-900 dark:text-yellow-100">
                        {new Date(goal.createdDate).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <div>
                      <span className="text-yellow-700 dark:text-yellow-300">เป้าหมายต่อเดือน:</span>
                      <span className="ml-2 text-yellow-900 dark:text-yellow-100">
                        ฿{goal.monthlyTarget.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-yellow-700 dark:text-yellow-300">ประเภท:</span>
                      <span className="ml-2 text-yellow-900 dark:text-yellow-100">
                        {goal.isPublic ? 'สาธารณะ' : 'ส่วนตัว'}
                      </span>
                    </div>
                    <div>
                      <span className="text-yellow-700 dark:text-yellow-300">ออโต้เซฟ:</span>
                      <span className="ml-2 text-yellow-900 dark:text-yellow-100">
                        {goal.autoSave ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>
                </div>

                {goal.createdBy === 'คุณ' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      การจัดการเป้าหมาย (เฉพาะผู้สร้าง)
                    </h4>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        แก้ไขเป้าหมาย
                      </button>
                      <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                        เปลี่ยนการตั้งค่า
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        ลบเป้าหมาย
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    การดำเนินการ
                  </h4>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleLeaveGroup}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ออกจากกลุ่ม
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      รายงานปัญหา
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDepositModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">💰</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ฝากเงินเข้าเป้าหมาย
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowDepositModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  {/* Goal Info */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🎯</span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">
                          {goal.name}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          เหลืออีก ฿{(goal.targetAmount - goal.currentAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>จำนวนเงิน *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">฿</span>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-lg placeholder-gray-400 font-semibold"
                          placeholder="5,000"
                          min="0"
                          step="100"
                          autoFocus
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setDepositAmount('1000')}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositAmount('5000')}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿5,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositAmount('10000')}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿10,000
                        </button>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>หมายเหตุ</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={depositNote}
                          onChange={(e) => setDepositNote(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="เช่น เงินเดือนเดือนนี้"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowDepositModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>💰</span>
                        <span>ฝากเงิน</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Group Code Modal */}
        {showInviteModal && goal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowInviteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">�</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        แชร์รหัสกลุ่ม
                      </h3>
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
                  <div className="space-y-6">
                    {/* Goal Info */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        {goal.name}
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p><strong>เป้าหมาย:</strong> ฿{goal.targetAmount.toLocaleString()}</p>
                        <p><strong>วันที่:</strong> {new Date(goal.targetDate).toLocaleDateString('th-TH')}</p>
                        <p><strong>สมาชิก:</strong> {goal.members.length} คน</p>
                      </div>
                    </div>

                    {/* Group Code */}
                    <div className="text-center">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        รหัสกลุ่ม
                      </label>
                      <div className="relative">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl">
                          <div className="text-3xl font-bold text-white tracking-widest font-mono">
                            {goal.groupCode}
                          </div>
                        </div>
                        <button
                          onClick={() => copyGroupCode(goal.groupCode)}
                          disabled={isCopying}
                          className="absolute top-2 right-2 w-8 h-8 bg-white/20 hover:bg-white/30 disabled:bg-white/10 rounded-lg flex items-center justify-center text-white transition-colors duration-200 disabled:cursor-not-allowed"
                          title={isCopying ? "กำลังคัดลอก..." : copySuccess ? "คัดลอกแล้ว!" : "คัดลอกรหัส"}
                        >
                          {isCopying ? "⏳" : copySuccess ? "✅" : "📋"}
                        </button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        วิธีการใช้งาน
                      </h4>
                      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                        <li>แชร์รหัสนี้ให้กับเพื่อนที่ต้องการเชิญ</li>
                        <li>ให้เพื่อนกดปุ่ม "เข้าร่วมกลุ่ม" ในหน้าหลัก</li>
                        <li>กรอกรหัสนี้ลงในช่องที่กำหนด</li>
                        <li>เพื่อนจะเข้าร่วมกลุ่มสำเร็จ</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ปิด
                    </button>
                    <button
                      onClick={() => copyGroupCode(goal.groupCode)}
                      disabled={isCopying}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>{isCopying ? "⏳" : copySuccess ? "✅" : "📋"}</span>
                        <span>{isCopying ? "กำลังคัดลอก..." : copySuccess ? "คัดลอกแล้ว!" : "คัดลอกรหัส"}</span>
                      </span>
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
