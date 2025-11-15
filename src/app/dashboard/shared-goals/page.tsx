'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SharedGoalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my-goals' | 'joined-goals'>('my-goals');

  // ฟังก์ชันสร้างรหัสกลุ่ม
  const generateGroupCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Mock data - ในอนาคตจะเชื่อมกับ API
  const mockMyGoals = [
    {
      id: 1,
      name: 'ทริปญี่ปุ่น 2026',
      targetAmount: 150000,
      currentAmount: 45000,
      targetDate: '2026-03-15',
      description: 'ทริปเที่ยวญี่ปุ่น 10 วัน ช่วงซากุระบาน',
      category: 'ท่องเที่ยว',
      createdDate: '2025-10-01',
      groupCode: 'JAPAN2026',
      members: [
        { name: 'คุณ', amount: 25000, target: 50000, joinDate: '2025-10-01' },
        { name: 'มิกิ', amount: 15000, target: 50000, joinDate: '2025-10-05' },
        { name: 'โยชิ', amount: 5000, target: 50000, joinDate: '2025-10-10' }
      ],
      recentActivity: [
        { date: '2025-11-10', member: 'มิกิ', amount: 5000, type: 'deposit' },
        { date: '2025-11-08', member: 'คุณ', amount: 10000, type: 'deposit' },
        { date: '2025-11-05', member: 'โยศิ', amount: 5000, type: 'deposit' }
      ],
      createdBy: 'คุณ',
      isPublic: false,
      autoSave: true,
      monthlyTarget: 15000
    },
    {
      id: 2,
      name: 'ซื้อรถร่วมกัน',
      targetAmount: 300000,
      currentAmount: 120000,
      targetDate: '2025-12-31',
      description: 'รถยนต์มือสองสำหรับใช้ร่วมกัน',
      category: 'รถยนต์',
      createdDate: '2025-09-01',
      groupCode: 'CAR2025X',
      members: [
        { name: 'คุณ', amount: 60000, target: 100000, joinDate: '2025-09-01' },
        { name: 'แอน', amount: 40000, target: 100000, joinDate: '2025-09-15' },
        { name: 'บิว', amount: 20000, target: 100000, joinDate: '2025-10-01' }
      ],
      recentActivity: [
        { date: '2025-11-12', member: 'บิว', amount: 20000, type: 'deposit' },
        { date: '2025-11-01', member: 'คุณ', amount: 30000, type: 'deposit' },
        { date: '2025-10-15', member: 'แอน', amount: 40000, type: 'deposit' }
      ],
      createdBy: 'คุณ',
      isPublic: false,
      autoSave: false,
      monthlyTarget: 25000
    }
  ];

  const mockJoinedGoals = [
    {
      id: 3,
      name: 'งานแต่งงานของแอน',
      targetAmount: 200000,
      currentAmount: 85000,
      targetDate: '2025-08-20',
      description: 'งานแต่งงานแอนกับเจมส์ที่รีสอร์ทเขาใหญ่',
      category: 'งานรื่นเริง',
      createdDate: '2025-06-01',
      groupCode: 'WEDDING1',
      members: [
        { name: 'แอน', amount: 50000, target: 80000, joinDate: '2025-06-01' },
        { name: 'คุณ', amount: 15000, target: 40000, joinDate: '2025-06-15' },
        { name: 'มิกิ', amount: 10000, target: 40000, joinDate: '2025-06-20' },
        { name: 'บิว', amount: 10000, target: 40000, joinDate: '2025-07-01' }
      ],
      recentActivity: [
        { date: '2025-11-05', member: 'แอน', amount: 15000, type: 'deposit' },
        { date: '2025-10-20', member: 'คุณ', amount: 15000, type: 'deposit' },
        { date: '2025-10-15', member: 'มิกิ', amount: 10000, type: 'deposit' }
      ],
      createdBy: 'แอน',
      isPublic: true,
      autoSave: true,
      monthlyTarget: 20000
    },
    {
      id: 4,
      name: 'ปาร์ตี้รับปริญญาร่วม',
      targetAmount: 50000,
      currentAmount: 32000,
      targetDate: '2026-05-15',
      description: 'ปาร์ตี้ฉลองรับปริญญาของกลุ่มเพื่อน',
      category: 'งานรื่นเริง',
      createdDate: '2025-08-01',
      groupCode: 'GRAD2026',
      members: [
        { name: 'นิค', amount: 15000, target: 12500, joinDate: '2025-08-01' },
        { name: 'คุณ', amount: 8000, target: 12500, joinDate: '2025-08-15' },
        { name: 'เจน', amount: 9000, target: 12500, joinDate: '2025-09-01' },
        { name: 'ปีเตอร์', amount: 0, target: 12500, joinDate: '2025-09-15' }
      ],
      recentActivity: [
        { date: '2025-11-01', member: 'เจน', amount: 4000, type: 'deposit' },
        { date: '2025-10-25', member: 'คุณ', amount: 8000, type: 'deposit' },
        { date: '2025-10-10', member: 'นิค', amount: 15000, type: 'deposit' }
      ],
      createdBy: 'นิค',
      isPublic: false,
      autoSave: false,
      monthlyTarget: 5000
    }
  ];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    category: 'ทั่วไป',
    members: ['']
  });

  const categories = [
    'ทั่วไป', 'ท่องเที่ยว', 'รถยนต์', 'บ้าน', 'การศึกษา', 
    'งานรื่นเริง', 'เทคโนโลยี', 'สุขภาพ', 'ธุรกิจ', 'อื่นๆ'
  ];

  const handleCreateGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) return;

    const goalWithCode = {
      ...newGoal,
      groupCode: generateGroupCode()
    };

    // TODO: ส่งข้อมูลไป API
    console.log('Creating shared goal:', goalWithCode);
    
    // รีเซ็ตฟอร์ม
    setShowCreateModal(false);
    setNewGoal({ 
      name: '', 
      targetAmount: '', 
      targetDate: '', 
      description: '',
      category: 'ทั่วไป',
      members: [''] 
    });
  };

  const handleDeposit = () => {
    if (!depositAmount || !selectedGoal) return;

    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    // TODO: ส่งข้อมูลไป API
    console.log('Depositing to goal:', selectedGoal.id, 'Amount:', amount, 'Note:', depositNote);
    
    // รีเซ็ตฟอร์ม
    setDepositAmount('');
    setDepositNote('');
    setShowDepositModal(false);
    setSelectedGoal(null);
  };

  const handleShowGroupCode = () => {
    if (!selectedGoal) return;
    
    // แสดงรหัสกลุ่มให้ผู้ใช้แชร์
    console.log('Showing group code for goal:', selectedGoal.id, 'Code:', selectedGoal.groupCode);
    
    setShowInviteModal(false);
    setSelectedGoal(null);
  };

  const handleJoinGroup = () => {
    if (!joinGroupCode.trim()) return;

    // ค้นหากลุ่มจากรหัส
    const allGoals = [...mockMyGoals, ...mockJoinedGoals];
    const foundGoal = allGoals.find(goal => goal.groupCode === joinGroupCode.toUpperCase());
    
    if (foundGoal) {
      // TODO: เพิ่มผู้ใช้เข้ากลุ่ม
      console.log('Joining group:', foundGoal.id, 'Code:', joinGroupCode);
      alert(`เข้าร่วมกลุ่ม "${foundGoal.name}" สำเร็จ!`);
    } else {
      alert('ไม่พบกลุ่มที่ตรงกับรหัสนี้');
    }
    
    // รีเซ็ตฟอร์ม
    setJoinGroupCode('');
    setShowJoinModal(false);
  };

  const copyGroupCode = async (code: string) => {
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
          prompt('คัดลอกรหัสนี้:', code);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      // แสดง prompt ให้ผู้ใช้คัดลอกเอง
      prompt('คัดลอกรหัสนี้:', code);
    }
  };

  const handleViewDetails = (goalId: number) => {
    router.push(`/dashboard/shared-goals/${goalId}`);
  };

  const handleLeaveGroup = (goalId: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะออกจากกลุ่มนี้?')) {
      // TODO: ส่งข้อมูลไป API
      console.log('Leaving group:', goalId);
    }
  };

  const handleManageGoal = (goal: any) => {
    setSelectedGoal(goal);
    // TODO: เปิด modal จัดการเป้าหมาย
    console.log('Managing goal:', goal.id);
  };

  const openDepositModal = (goal: any) => {
    setSelectedGoal(goal);
    setShowDepositModal(true);
  };

  const openInviteModal = (goal: any) => {
    setSelectedGoal(goal);
    setShowInviteModal(true);
  };

  const addMemberField = () => {
    setNewGoal(prev => ({
      ...prev,
      members: [...prev.members, '']
    }));
  };

  const updateMember = (index: number, value: string) => {
    setNewGoal(prev => ({
      ...prev,
      members: prev.members.map((member, i) => i === index ? value : member)
    }));
  };

  const removeMember = (index: number) => {
    setNewGoal(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };



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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              เป้าหมายออมร่วมกัน
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ออมเงินร่วมกันกับเพื่อนและครอบครัวเพื่อเป้าหมายใหญ่
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔑 เข้าร่วมกลุ่ม
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
            >
              + สร้างเป้าหมายใหม่
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-goals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-goals'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              เป้าหมายของฉัน ({mockMyGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('joined-goals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'joined-goals'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              เป้าหมายที่เข้าร่วม ({mockJoinedGoals.length})
            </button>
          </nav>
        </div>

        {/* Goals List */}
        <div className="grid gap-6">
          {activeTab === 'my-goals' && mockMyGoals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {goal.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    เป้าหมาย: {new Date(goal.targetDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                  สร้างโดยคุณ
                </span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ความคืบหน้า</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ฿{goal.currentAmount.toLocaleString()} / ฿{goal.targetAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{width: `${(goal.currentAmount / goal.targetAmount) * 100}%`}}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% เสร็จสิ้น
                </p>
              </div>

              {/* Members with Individual Progress */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  สมาชิก ({goal.members.length} คน)
                </h4>
                <div className="space-y-3">
                  {goal.members.map((member, index) => {
                    const memberProgress = (member.amount / member.target) * 100;
                    return (
                      <div key={index} className="py-3 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${member.name === 'คุณ' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {member.name}
                            </span>
                            {member.name === goal.createdBy && (
                              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                                ผู้สร้าง
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              ฿{member.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              / ฿{member.target.toLocaleString()}
                            </span>
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
              {goal.recentActivity && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    กิจกรรมล่าสุด
                  </h4>
                  <div className="space-y-2">
                    {goal.recentActivity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 dark:text-green-400">💰</span>
                          <span className="text-gray-900 dark:text-white">
                            {activity.member}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            ฝากเงิน
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 dark:text-green-400 font-medium">
                            +฿{activity.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goal Details */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-800 dark:text-blue-200 font-medium">หมวดหมู่:</span>
                    <span className="text-blue-900 dark:text-blue-100 ml-2">{goal.category}</span>
                  </div>
                  <div>
                    <span className="text-blue-800 dark:text-blue-200 font-medium">เป้าหมายต่อเดือน:</span>
                    <span className="text-blue-900 dark:text-blue-100 ml-2">฿{goal.monthlyTarget.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-800 dark:text-blue-200 font-medium">สร้างเมื่อ:</span>
                    <span className="text-blue-900 dark:text-blue-100 ml-2">{new Date(goal.createdDate).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div>
                    <span className="text-blue-800 dark:text-blue-200 font-medium">ออโต้เซฟ:</span>
                    <span className="text-blue-900 dark:text-blue-100 ml-2">{goal.autoSave ? '✅ เปิด' : '❌ ปิด'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button 
                  onClick={() => openDepositModal(goal)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  💰 โอนเงินเข้า
                </button>
                <button 
                  onClick={() => openInviteModal(goal)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  � แชร์รหัส
                </button>
                <button 
                  onClick={() => handleViewDetails(goal.id)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  📊 ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'joined-goals' && mockJoinedGoals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {goal.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {goal.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    เป้าหมาย: {new Date(goal.targetDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded block mb-2">
                    สร้างโดย {goal.createdBy}
                  </span>
                  {goal.isPublic && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                      🌐 สาธารณะ
                    </span>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ความคืบหน้า</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ฿{goal.currentAmount.toLocaleString()} / ฿{goal.targetAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{width: `${(goal.currentAmount / goal.targetAmount) * 100}%`}}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% เสร็จสิ้น
                </p>
              </div>

              {/* Members with Individual Progress */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  สมาชิก ({goal.members.length} คน)
                </h4>
                <div className="space-y-3">
                  {goal.members.map((member, index) => {
                    const memberProgress = (member.amount / member.target) * 100;
                    return (
                      <div key={index} className="py-3 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${member.name === 'คุณ' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {member.name}
                            </span>
                            {member.name === goal.createdBy && (
                              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                                ผู้สร้าง
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              ฿{member.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              / ฿{member.target.toLocaleString()}
                            </span>
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
              {goal.recentActivity && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    กิจกรรมล่าสุด
                  </h4>
                  <div className="space-y-2">
                    {goal.recentActivity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 dark:text-green-400">💰</span>
                          <span className="text-gray-900 dark:text-white">
                            {activity.member}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            ฝากเงิน
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 dark:text-green-400 font-medium">
                            +฿{activity.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button 
                  onClick={() => openDepositModal(goal)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  💰 โอนเงินเข้า
                </button>
                <button 
                  onClick={() => handleLeaveGroup(goal.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  🚪 ออกจากกลุ่ม
                </button>
                <button 
                  onClick={() => handleViewDetails(goal.id)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  📊 ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Goal Modal */}
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
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">👥</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        สร้างเป้าหมายออมร่วมกัน
                      </h3>
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
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>ชื่อเป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newGoal.name}
                          onChange={(e) => setNewGoal(prev => ({...prev, name: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="เช่น ทริปญี่ปุ่น 2026"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>จำนวนเงินเป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">฿</span>
                        <input
                          type="number"
                          value={newGoal.targetAmount}
                          onChange={(e) => setNewGoal(prev => ({...prev, targetAmount: e.target.value}))}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="150,000"
                          min="0"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>วันที่เป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={newGoal.targetDate}
                          onChange={(e) => setNewGoal(prev => ({...prev, targetDate: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>หมวดหมู่</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.category}
                          onChange={(e) => setNewGoal(prev => ({...prev, category: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none bg-white"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        <span>รายละเอียด</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={newGoal.description}
                          onChange={(e) => setNewGoal(prev => ({...prev, description: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400 resize-none"
                          rows={3}
                          placeholder="อธิบายเป้าหมายนี้เพิ่มเติม..."
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                        <span>เชิญเพื่อน (อีเมล)</span>
                      </label>
                      {newGoal.members.map((member, index) => (
                        <div key={index} className="flex space-x-2 mb-3">
                          <div className="flex-1 group">
                            <div className="relative">
                              <input
                                type="email"
                                value={member}
                                onChange={(e) => updateMember(index, e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                                placeholder="friend@example.com"
                              />
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                            </div>
                          </div>
                          {newGoal.members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              className="px-3 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addMemberField}
                        className="text-sm text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 font-medium"
                      >
                        + เพิ่มเพื่อน
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleCreateGoal}
                      disabled={!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>👥</span>
                        <span>สร้างเป้าหมาย</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDepositModal && selectedGoal && (
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
                          {selectedGoal.name}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          เหลืออีก ฿{(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()}
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
        {showInviteModal && selectedGoal && (
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
                        {selectedGoal.name}
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p><strong>เป้าหมาย:</strong> ฿{selectedGoal.targetAmount.toLocaleString()}</p>
                        <p><strong>วันที่:</strong> {new Date(selectedGoal.targetDate).toLocaleDateString('th-TH')}</p>
                        <p><strong>สมาชิก:</strong> {selectedGoal.members.length} คน</p>
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
                            {selectedGoal.groupCode}
                          </div>
                        </div>
                        <button
                          onClick={() => copyGroupCode(selectedGoal.groupCode)}
                          className="absolute top-2 right-2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                          title="คัดลอกรหัส"
                        >
                          📋
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
                      onClick={() => copyGroupCode(selectedGoal.groupCode)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>📋</span>
                        <span>คัดลอกรหัส</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
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
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🔑</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        เข้าร่วมกลุ่ม
                      </h3>
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
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>รหัสกลุ่ม *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={joinGroupCode}
                          onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
                          className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-lg placeholder-gray-400 font-mono tracking-widest text-center"
                          placeholder="XXXXXXXX"
                          maxLength={8}
                          autoFocus
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        💡 วิธีการเข้าร่วม
                      </h4>
                      <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <p>• ขอรหัสกลุ่มจากเพื่อนที่สร้างเป้าหมาย</p>
                        <p>• กรอกรหัส 8 หลักในช่องด้านบน</p>
                        <p>• กดปุ่ม "เข้าร่วมกลุ่ม" เพื่อเสร็จสิ้น</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowJoinModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleJoinGroup}
                      disabled={!joinGroupCode.trim() || joinGroupCode.length !== 8}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>�</span>
                        <span>เข้าร่วมกลุ่ม</span>
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