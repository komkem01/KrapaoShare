'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SharedGoalsPage() {
  const [activeTab, setActiveTab] = useState<'my-goals' | 'joined-goals'>('my-goals');

  // Mock data - ในอนาคตจะเชื่อมกับ API
  const mockMyGoals = [
    {
      id: 1,
      name: 'ทริปญี่ปุ่น 2026',
      targetAmount: 150000,
      currentAmount: 45000,
      targetDate: '2026-03-15',
      members: [
        { name: 'คุณ', amount: 25000 },
        { name: 'มิกิ', amount: 15000 },
        { name: 'โยชิ', amount: 5000 }
      ],
      createdBy: 'คุณ'
    },
    {
      id: 2,
      name: 'ซื้อรถร่วมกัน',
      targetAmount: 300000,
      currentAmount: 120000,
      targetDate: '2025-12-31',
      members: [
        { name: 'คุณ', amount: 60000 },
        { name: 'แอน', amount: 40000 },
        { name: 'บิว', amount: 20000 }
      ],
      createdBy: 'คุณ'
    }
  ];

  const mockJoinedGoals = [
    {
      id: 3,
      name: 'งานแต่งงานของแอน',
      targetAmount: 200000,
      currentAmount: 85000,
      targetDate: '2025-08-20',
      members: [
        { name: 'แอน', amount: 50000 },
        { name: 'คุณ', amount: 15000 },
        { name: 'มิกิ', amount: 10000 },
        { name: 'บิว', amount: 10000 }
      ],
      createdBy: 'แอน'
    }
  ];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    members: ['']
  });

  const handleCreateGoal = () => {
    // TODO: Implement create shared goal
    console.log('Creating shared goal:', newGoal);
    setShowCreateModal(false);
    setNewGoal({ name: '', targetAmount: '', targetDate: '', members: [''] });
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            + สร้างเป้าหมายใหม่
          </button>
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

              {/* Members */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  สมาชิก ({goal.members.length} คน)
                </h4>
                <div className="space-y-2">
                  {goal.members.map((member, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {member.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ฿{member.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  โอนเงินเข้า
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                  เชิญเพื่อน
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                  จัดการ
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    เป้าหมาย: {new Date(goal.targetDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded">
                  สร้างโดย {goal.createdBy}
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

              {/* Members */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  สมาชิก ({goal.members.length} คน)
                </h4>
                <div className="space-y-2">
                  {goal.members.map((member, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className={`text-sm font-medium ${member.name === 'คุณ' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {member.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ฿{member.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  โอนเงินเข้า
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateModal(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    สร้างเป้าหมายออมร่วมกัน
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ชื่อเป้าหมาย
                      </label>
                      <input
                        type="text"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal(prev => ({...prev, name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="เช่น ทริปญี่ปุ่น 2026"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        จำนวนเงินเป้าหมาย
                      </label>
                      <input
                        type="number"
                        value={newGoal.targetAmount}
                        onChange={(e) => setNewGoal(prev => ({...prev, targetAmount: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="150000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        วันที่เป้าหมาย
                      </label>
                      <input
                        type="date"
                        value={newGoal.targetDate}
                        onChange={(e) => setNewGoal(prev => ({...prev, targetDate: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        เชิญเพื่อน (อีเมล)
                      </label>
                      {newGoal.members.map((member, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="email"
                            value={member}
                            onChange={(e) => updateMember(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="friend@example.com"
                          />
                          {newGoal.members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              className="px-3 py-2 text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addMemberField}
                        className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        + เพิ่มเพื่อน
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleCreateGoal}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gray-900 dark:bg-white text-base font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    สร้างเป้าหมาย
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}