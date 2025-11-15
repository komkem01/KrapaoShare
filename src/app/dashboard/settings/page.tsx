'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Mock user data - ในอนาคตจะเชื่อมกับ API
  const [userData, setUserData] = useState({
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'somchai@example.com',
    phone: '081-234-5678',
    birthDate: '1990-05-15',
    address: '123 ถนนสุขุมวิท กรุงเทพมหานคร',
    occupation: 'นักพัฒนาซอฟต์แวร์',
    profileImage: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    budgetAlerts: true,
    goalReminders: true,
    billReminders: true,
    debtAlerts: true
  });

  const [appPreferences, setAppPreferences] = useState({
    theme: 'auto',
    language: 'th',
    currency: 'THB',
    dateFormat: 'dd/mm/yyyy',
    startOfWeek: 'monday'
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsEditing(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    setShowChangePasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleToggleTwoFactor = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTwoFactorEnabled(!twoFactorEnabled);
    setIsSaving(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleExportData = () => {
    // Simulate data export
    const data = {
      profile: userData,
      notifications: notificationSettings,
      preferences: appPreferences,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krapao-share-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearCache = async () => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะล้างข้อมูลแคช? การกระทำนี้จะลบข้อมูลที่เก็บไว้ชั่วคราว')) {
      setIsSaving(true);
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000));
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Clear localStorage
      localStorage.clear();
      setIsSaving(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setIsSaving(true);
    // Simulate account deletion
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    setShowDeleteModal(false);
    alert('บัญชีของคุณได้ถูกลบแล้ว');
    // In real app, redirect to login or home page
  };

  const handleRevokeSession = async (sessionIndex: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกเซสชันนี้?')) {
      setIsSaving(true);
      // Simulate session revocation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSaving(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleProfileImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUserData({ ...userData, profileImage: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const tabs = [
    { id: 'profile', name: 'ข้อมูลส่วนตัว', icon: '👤' },
    { id: 'security', name: 'ความปลอดภัย', icon: '🔒' },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: '🔔' },
    { id: 'preferences', name: 'การตั้งค่า', icon: '⚙️' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-white">
            ตั้งค่า
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการข้อมูลส่วนตัวและการตั้งค่าแอปพลิเคชัน
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              
              {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">บันทึกข้อมูลสำเร็จ!</span>
        </div>
      )}

      {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-light text-gray-900 dark:text-white">
                        ข้อมูลส่วนตัว
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        จัดการข้อมูลโปรไฟล์ของคุณ
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-sm font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-light bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 text-sm font-light border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          แก้ไข
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile Image */}
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {userData.profileImage ? (
                          <img 
                            src={userData.profileImage} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-gray-500 dark:text-gray-400">
                            {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      {isEditing && (
                        <button 
                          onClick={handleProfileImageUpload}
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center text-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                          title="เปลี่ยนรูปโปรไฟล์"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-light text-gray-900 dark:text-white">
                        {userData.firstName} {userData.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {userData.email}
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อ
                      </label>
                      <input
                        type="text"
                        value={userData.firstName}
                        onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                        นามสกุล
                      </label>
                      <input
                        type="text"
                        value={userData.lastName}
                        onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                        อีเมล
                      </label>
                      <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => setUserData({...userData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                        วันเกิด
                      </label>
                      <input
                        type="date"
                        value={userData.birthDate}
                        onChange={(e) => setUserData({...userData, birthDate: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                        อาชีพ
                      </label>
                      <input
                        type="text"
                        value={userData.occupation}
                        onChange={(e) => setUserData({...userData, occupation: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                        ที่อยู่
                      </label>
                      <textarea
                        value={userData.address}
                        onChange={(e) => setUserData({...userData, address: e.target.value})}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-light text-gray-900 dark:text-white">
                      ความปลอดภัย
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      จัดการรหัสผ่านและการตั้งค่าความปลอดภัย
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Change Password */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-base font-light text-gray-900 dark:text-white mb-4">
                        เปลี่ยนรหัสผ่าน
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            รหัสผ่านปัจจุบัน
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            รหัสผ่านใหม่
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            ยืนยันรหัสผ่านใหม่
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          />
                        </div>
                        <button 
                          onClick={() => setShowChangePasswordModal(true)}
                          className="px-4 py-2 text-sm font-light bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                          เปลี่ยนรหัสผ่าน
                        </button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-light text-gray-900 dark:text-white">
                            การยืนยันตัวตนแบบสองขั้นตอน
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            เพิ่มความปลอดภัยให้กับบัญชีของคุณ
                          </p>
                        </div>
                        <button 
                          onClick={handleToggleTwoFactor}
                          disabled={isSaving}
                          className={`px-4 py-2 text-sm font-light border rounded-lg transition-colors ${
                            twoFactorEnabled 
                              ? 'border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                              : 'border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          } disabled:opacity-50`}
                        >
                          {isSaving ? 'กำลังประมวลผล...' : twoFactorEnabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                      </div>
                    </div>

                    {/* Login History */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-base font-light text-gray-900 dark:text-white mb-4">
                        ประวัติการเข้าสู่ระบบ
                      </h3>
                      <div className="space-y-3">
                        {[
                          { device: 'Chrome บน Windows', location: 'กรุงเทพฯ, ไทย', time: '14 พ.ย. 2025, 14:30', current: true },
                          { device: 'Safari บน iPhone', location: 'กรุงเทพฯ, ไทย', time: '13 พ.ย. 2025, 09:15', current: false },
                          { device: 'Chrome บน Mac', location: 'กรุงเทพฯ, ไทย', time: '12 พ.ย. 2025, 18:45', current: false }
                        ].map((session, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <p className="text-sm font-light text-gray-900 dark:text-white">
                                {session.device}
                                {session.current && (
                                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                                    ปัจจุบัน
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {session.location} • {session.time}
                              </p>
                            </div>
                            {!session.current && (
                              <button 
                                onClick={() => handleRevokeSession(index)}
                                disabled={isSaving}
                                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-light disabled:opacity-50"
                              >
                                {isSaving ? 'กำลังยกเลิก...' : 'ยกเลิก'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-light text-gray-900 dark:text-white">
                      การแจ้งเตือน
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      จัดการการแจ้งเตือนและการติดต่อจากแอป
                    </p>
                  </div>

                  <div className="space-y-6">
                    {[
                      { key: 'emailNotifications', title: 'การแจ้งเตือนทางอีเมล', description: 'รับการแจ้งเตือนผ่านอีเมล' },
                      { key: 'pushNotifications', title: 'การแจ้งเตือนแบบ Push', description: 'รับการแจ้งเตือนบนอุปกรณ์' },
                      { key: 'budgetAlerts', title: 'แจ้งเตือนงบประมาณ', description: 'แจ้งเตือนเมื่องบประมาณใกล้หมด' },
                      { key: 'goalReminders', title: 'แจ้งเตือนเป้าหมาย', description: 'แจ้งเตือนความคืบหน้าเป้าหมาย' },
                      { key: 'billReminders', title: 'แจ้งเตือนบิล', description: 'แจ้งเตือนการชำระบิลที่ค้างชำระ' },
                      { key: 'debtAlerts', title: 'แจ้งเตือนหนี้สิน', description: 'แจ้งเตือนหนี้สินที่เกินกำหนด' }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <h3 className="text-sm font-light text-gray-900 dark:text-white">
                            {setting.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {setting.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              [setting.key]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-white"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-light text-gray-900 dark:text-white">
                      การตั้งค่าแอป
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ปรับแต่งการแสดงผลและการทำงานของแอป
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          ธีม
                        </label>
                        <select
                          value={appPreferences.theme}
                          onChange={(e) => setAppPreferences({...appPreferences, theme: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        >
                          <option value="auto">อัตโนมัติ</option>
                          <option value="light">สว่าง</option>
                          <option value="dark">มืด</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          ภาษา
                        </label>
                        <select
                          value={appPreferences.language}
                          onChange={(e) => setAppPreferences({...appPreferences, language: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        >
                          <option value="th">ไทย</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          สกุลเงิน
                        </label>
                        <select
                          value={appPreferences.currency}
                          onChange={(e) => setAppPreferences({...appPreferences, currency: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        >
                          <option value="THB">บาท (฿)</option>
                          <option value="USD">ดอลลาร์ ($)</option>
                          <option value="EUR">ยูโร (€)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          รูปแบบวันที่
                        </label>
                        <select
                          value={appPreferences.dateFormat}
                          onChange={(e) => setAppPreferences({...appPreferences, dateFormat: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        >
                          <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                          <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                          <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          วันแรกของสัปดาห์
                        </label>
                        <select
                          value={appPreferences.startOfWeek}
                          onChange={(e) => setAppPreferences({...appPreferences, startOfWeek: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        >
                          <option value="sunday">วันอาทิตย์</option>
                          <option value="monday">วันจันทร์</option>
                        </select>
                      </div>
                    </div>

                    {/* Data Management */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-base font-light text-gray-900 dark:text-white mb-4">
                        การจัดการข้อมูล
                      </h3>
                      <div className="space-y-3">
                      <button 
                        onClick={handleExportData}
                        className="w-full px-4 py-2 text-sm font-light border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        📤 ส่งออกข้อมูล
                      </button>
                      <button 
                        onClick={handleClearCache}
                        disabled={isSaving}
                        className="w-full px-4 py-2 text-sm font-light border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                      >
                        🗑️ {isSaving ? 'กำลังล้าง...' : 'ล้างข้อมูลแคช'}
                      </button>
                      <button 
                        onClick={handleDeleteAccount}
                        className="w-full px-4 py-2 text-sm font-light border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      >
                        ⚠️ ลบบัญชี
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowChangePasswordModal(false)}
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
                        <span className="text-white text-xl">🔒</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        เปลี่ยนรหัสผ่าน
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowChangePasswordModal(false)}
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
                        รหัสผ่านปัจจุบัน
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="กรอกรหัสผ่านปัจจุบัน"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รหัสผ่านใหม่
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="กรอกรหัสผ่านใหม่"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ยืนยันรหัสผ่านใหม่
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowChangePasswordModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDeleteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-red-200 dark:border-red-700">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">⚠️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ลบบัญชี
                      </h3>
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
                      <span className="text-red-600 dark:text-red-400 text-2xl">⚠️</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      คุณแน่ใจหรือไม่?
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      การลบบัญชีนี้จะไม่สามารถยกเลิกได้ ข้อมูลทั้งหมดของคุณจะถูกลบอย่างถาวร
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        • ข้อมูลส่วนตัวทั้งหมด<br />
                        • ประวัติการทำธุรกรรม<br />
                        • เป้าหมายการออมและงบประมาณ<br />
                        • การตั้งค่าและคำแนะนำ
                      </p>
                    </div>
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
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'กำลังลบ...' : 'ลบบัญชีถาวร'}
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