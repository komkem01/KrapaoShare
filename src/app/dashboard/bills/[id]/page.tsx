'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Types
interface BillMember {
  name: string;
  amount: number;
  paid: boolean;
}

interface Bill {
  id: number;
  title: string;
  totalAmount: number;
  description: string;
  createdBy: string;
  createdAt: string;
  settledAt?: string;
  members: BillMember[];
  status: 'active' | 'settled';
}

interface EditingBill {
  id: number;
  title: string;
  totalAmount: string;
  description: string;
  members: string[];
}

interface PaymentHistoryItem {
  memberName: string;
  amount: number;
  paidAt: string;
}

// Mock data
const mockBills: Bill[] = [
  {
    id: 1,
    title: 'ค่าอาหารเที่ยงที่ MK',
    totalAmount: 1250,
    description: 'สุกี้ + เครื่องดื่ม',
    createdBy: 'คุณ',
    createdAt: '2025-11-14',
    members: [
      { name: 'คุณ', amount: 312.50, paid: true },
      { name: 'มิกิ', amount: 312.50, paid: true },
      { name: 'โยชิ', amount: 312.50, paid: false },
      { name: 'แอน', amount: 312.50, paid: false }
    ],
    status: 'active'
  },
  {
    id: 2,
    title: 'ค่าแท็กซี่กลับบ้าน',
    totalAmount: 280,
    description: 'จากสยามไปบางนา',
    createdBy: 'มิกิ',
    createdAt: '2025-11-13',
    members: [
      { name: 'คุณ', amount: 93.33, paid: false },
      { name: 'มิกิ', amount: 93.33, paid: true },
      { name: 'โยชิ', amount: 93.34, paid: false }
    ],
    status: 'active'
  },
  {
    id: 3,
    title: 'ซื้อของใช้ในหอ',
    totalAmount: 450,
    description: 'ผงซักฟอก + น้ำยาล้างจาน',
    createdBy: 'คุณ',
    createdAt: '2025-11-12',
    members: [
      { name: 'คุณ', amount: 150, paid: true },
      { name: 'มิกิ', amount: 150, paid: false },
      { name: 'โยชิ', amount: 150, paid: false }
    ],
    status: 'active'
  },
  {
    id: 4,
    title: 'ค่าหนังที่ SF',
    totalAmount: 680,
    description: 'Fast & Furious 11',
    createdBy: 'แอน',
    createdAt: '2025-11-10',
    settledAt: '2025-11-11',
    members: [
      { name: 'คุณ', amount: 170, paid: true },
      { name: 'มิกิ', amount: 170, paid: true },
      { name: 'โยชิ', amount: 170, paid: true },
      { name: 'แอน', amount: 170, paid: true }
    ],
    status: 'settled'
  }
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BillDetailPage({ params }: PageProps) {
  const router = useRouter();
  
  // States
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettleConfirmModal, setShowSettleConfirmModal] = useState(false);
  const [editingBill, setEditingBill] = useState<EditingBill | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<string>('');

  // Load bill data
  useEffect(() => {
    async function loadBillData() {
      try {
        const resolvedParams = await params;
        const billId = parseInt(resolvedParams.id);
        const foundBill = mockBills.find(b => b.id === billId);
        
        if (foundBill) {
          setBill(foundBill);
        } else {
          router.push('/dashboard/bills');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading bill data:', error);
        router.push('/dashboard/bills');
      }
    }

    loadBillData();
  }, [params, router]);

  // Payment handling
  const handlePaymentRequest = (memberName: string) => {
    setSelectedMemberForPayment(memberName);
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (!bill || !selectedMemberForPayment) return;

    const memberAmount = bill.members.find(m => m.name === selectedMemberForPayment)?.amount || 0;

    setBill(prev => {
      if (!prev) return null;
      
      const updatedBill = {
        ...prev,
        members: prev.members.map(member => 
          member.name === selectedMemberForPayment 
            ? { ...member, paid: true }
            : member
        )
      };

      // Check if all members paid
      const allPaid = updatedBill.members.every(m => m.paid);
      if (allPaid) {
        // Show settle confirmation after a delay
        setTimeout(() => {
          setShowSettleConfirmModal(true);
        }, 1000);
        
        return {
          ...updatedBill,
          status: 'settled' as const,
          settledAt: new Date().toISOString().split('T')[0]
        };
      }

      return updatedBill;
    });

    // Add to payment history
    setPaymentHistory(prev => [{
      memberName: selectedMemberForPayment,
      amount: memberAmount,
      paidAt: new Date().toLocaleString('th-TH')
    }, ...prev]);

    setShowPaymentModal(false);
    setSelectedMemberForPayment('');
  };

  // Reminder handling
  const handleReminder = () => {
    setShowReminderModal(true);
  };

  const sendReminder = () => {
    const unpaidMembers = bill?.members.filter(m => !m.paid && m.name !== 'คุณ');
    if (unpaidMembers && unpaidMembers.length > 0) {
      setShowReminderModal(false);
      alert('ส่งการแจ้งเตือนเรียบร้อยแล้ว! 📱');
    }
  };

  // Edit bill handling
  const handleEditBill = () => {
    if (!bill) return;
    
    setEditingBill({
      id: bill.id,
      title: bill.title,
      totalAmount: bill.totalAmount.toString(),
      description: bill.description,
      members: bill.members.filter(m => m.name !== 'คุณ').map(m => m.name)
    });
    setShowEditModal(true);
  };

  const handleUpdateBill = () => {
    if (!editingBill || !editingBill.title || !editingBill.totalAmount) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const validMembers = editingBill.members.filter(m => m.trim());
    const totalAmount = parseFloat(editingBill.totalAmount);
    const amountPerPerson = totalAmount / (validMembers.length + 1);

    setBill(prev => {
      if (!prev) return null;
      return {
        ...prev,
        title: editingBill.title,
        totalAmount: totalAmount,
        description: editingBill.description,
        members: [
          { name: 'คุณ', amount: amountPerPerson, paid: true },
          ...validMembers.map(member => ({ 
            name: member, 
            amount: amountPerPerson, 
            paid: prev.members.find(m => m.name === member)?.paid || false 
          }))
        ]
      };
    });

    setShowEditModal(false);
    setEditingBill(null);
    alert('แก้ไขบิลเรียบร้อยแล้ว! ✅');
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin mx-auto mb-6">
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                กำลังโหลดข้อมูลบิล...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                โปรดรอสักครู่ ✨
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!bill) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              ไม่พบบิลที่ต้องการ
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              บิลนี้อาจถูกลบแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง
            </p>
            <button
              onClick={() => router.push('/dashboard/bills')}
              className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>←</span>
                <span>กลับไปหน้าแยกบิล</span>
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate statistics
  const paidMembers = bill.members.filter(m => m.paid);
  const unpaidMembers = bill.members.filter(m => !m.paid);
  const completionPercentage = (paidMembers.length / bill.members.length) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100 dark:from-blue-900 opacity-20 rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-100 dark:from-indigo-900 opacity-15 rounded-full transform -translate-x-24 translate-y-24"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/dashboard/bills')}
                className="group flex items-center space-x-3 px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
                <span className="font-medium">กลับ</span>
              </button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                    {bill.title}
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 ml-5 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  <span>รายละเอียดการแยกบิล</span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  <span>{new Date(bill.createdAt).toLocaleDateString('th-TH')}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                bill.status === 'active'
                  ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/50'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200 dark:shadow-green-900/50'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  bill.status === 'active' ? 'bg-white animate-pulse' : 'bg-white'
                }`}></div>
                {bill.status === 'active' ? 'กำลังดำเนินการ' : 'เสร็จสิ้นแล้ว'}
              </div>
            </div>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📋</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ข้อมูลบิล
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ชื่อบิล</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bill.title}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">รายละเอียด</span>
                  <p className="text-gray-900 dark:text-white">{bill.description}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ยอดรวม</span>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    ฿{bill.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">สร้างโดย</span>
                  <p className="text-gray-900 dark:text-white">{bill.createdBy}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">วันที่สร้าง</span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(bill.createdAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
                {bill.status === 'settled' && bill.settledAt && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">วันที่จ่ายครบ</span>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(bill.settledAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  สถานะการจ่าย
                </h2>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">ความคืบหน้า</span>
                    <span className="text-gray-900 dark:text-white font-bold">
                      {paidMembers.length}/{bill.members.length} คน
                    </span>
                  </div>
                  <div className="relative w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-lg" 
                      style={{width: `${completionPercentage}%`}}
                    >
                      <div className="absolute inset-0 bg-white opacity-20 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center font-medium">
                    {completionPercentage.toFixed(0)}% เสร็จสิ้น
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-xl border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">จ่ายแล้ว</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {paidMembers.length}
                    </p>
                  </div>
                  <div className="text-center p-5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900 dark:to-pink-900 rounded-xl border border-red-200 dark:border-red-700 hover:shadow-lg transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">⏳</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">ยังไม่จ่าย</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {unpaidMembers.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">👥</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              รายชื่อสมาชิก
            </h2>
            <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">
              {bill.members.length} คน
            </span>
          </div>

            <div className="space-y-4">
            {bill.members.map((member, index) => (
              <div key={index} className={`group relative flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                member.paid 
                  ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900 dark:via-emerald-900 dark:to-green-900 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600' 
                  : 'bg-gradient-to-r from-red-50 via-pink-50 to-red-50 dark:from-red-900 dark:via-pink-900 dark:to-red-900 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600'
              }`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={`absolute inset-0 rounded-xl ${
                    member.paid 
                      ? 'bg-gradient-to-r from-green-400/10 to-emerald-400/10' 
                      : 'bg-gradient-to-r from-red-400/10 to-pink-400/10'
                  }`}></div>
                </div>
                
                <div className="relative flex items-center space-x-5">
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                    member.paid 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-red-500 to-pink-600'
                  }`}>
                    <span className="text-lg">
                      {member.paid ? '✓' : '⏳'}
                    </span>
                    {member.paid && (
                      <div className="absolute inset-0 bg-white opacity-20 rounded-xl animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`flex items-center space-x-3 mb-1 ${
                      member.name === 'คุณ' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      <span className="text-lg font-bold">{member.name}</span>
                      {member.name === 'คุณ' && (
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-800 dark:to-indigo-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold shadow-sm">
                          คุณ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg font-bold text-gray-900 dark:text-white shadow-sm">
                        ฿{member.amount.toLocaleString()}
                      </span>
                      {member.paid && (
                        <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                          • จ่ายแล้ว {new Date().toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>                <div className="relative flex items-center space-x-4">
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                    member.paid
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                  }`}>
                    {member.paid ? '✅ จ่ายแล้ว' : '⏳ รอจ่าย'}
                  </div>
                  
                  {bill.status === 'active' && !member.paid && (
                    <button
                      onClick={() => handlePaymentRequest(member.name)}
                      className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        member.name === 'คุณ'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-200 dark:shadow-green-900/50'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-blue-200 dark:shadow-blue-900/50'
                      }`}
                      title={member.name === 'คุณ' ? 'ยืนยันการจ่ายเงินของคุณ' : `ยืนยันการจ่ายเงินของ ${member.name}`}
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <span>{member.name === 'คุณ' ? '💳' : '✅'}</span>
                        <span>{member.name === 'คุณ' ? 'จ่าย' : 'จ่ายแล้ว'}</span>
                      </span>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {bill.status === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-100 dark:from-green-900 opacity-50 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-2xl">💰</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                    ที่คุณต้องจ่าย
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    ฿{(bill.members.find(m => m.name === 'คุณ' && !m.paid)?.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 dark:from-blue-900 opacity-50 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-2xl">💳</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                    ที่คุณจ่ายแล้ว
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ฿{(bill.members.find(m => m.name === 'คุณ' && m.paid)?.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-100 dark:from-red-900 opacity-50 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-2xl">⏰</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                    ที่เพื่อนค้างจ่าย
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    ฿{bill.members.filter(m => m.name !== 'คุณ' && !m.paid).reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions for Unpaid Members */}
        {bill.status === 'active' && unpaidMembers.length > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900 dark:via-amber-900 dark:to-yellow-900 border border-orange-200 dark:border-orange-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-200 dark:from-orange-800 opacity-30 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-200 dark:from-amber-800 opacity-20 rounded-full transform -translate-x-12 translate-y-12"></div>
            
            <div className="relative">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-white text-lg font-bold">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200">
                    สมาชิกที่ยังไม่จ่าย
                  </h3>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                    {unpaidMembers.length} คนยังไม่ได้จ่ายเงิน
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {unpaidMembers.map((member, index) => (
                  <div key={index} className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">⏳</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{member.name}</span>
                    </div>
                    <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm font-bold shadow-sm">
                      ฿{member.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">💡</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-1">
                      คำแนะนำสำหรับการใช้งาน
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      สมาชิกแต่ละคนสามารถกดปุ่ม <span className="font-semibold">"✅ จ่ายแล้ว"</span> เพื่อยืนยันการจ่ายเงินของตัวเองได้ 
                      หรือคุณสามารถช่วยยืนยันให้เพื่อนได้หากได้รับการยืนยันแล้ว
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleReminder}
                  className="group relative flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span className="text-lg">📱</span>
                    <span>แจ้งเตือนทุกคน</span>
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                </button>
                <button 
                  onClick={() => alert('คุณสามารถส่งลิงก์บิลนี้ให้เพื่อนเพื่อให้ดูรายละเอียดและยืนยันการจ่ายเงินได้ ✨ เพื่อนจะสามารถกดปุ่ม "✅ จ่ายแล้ว" เพื่อยืนยันการจ่ายเงินของตัวเองได้')}
                  className="group relative flex-1 bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 py-3 px-6 rounded-xl hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🔗</span>
                    <span>แชร์ลิงก์</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">⚡</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              การดำเนินการ
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bill.status === 'active' && (
              <button 
                onClick={handleReminder}
                className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white py-4 px-5 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="text-sm">แจ้งเตือนเพื่อน</div>
                </div>
              </button>
            )}
            {bill.status === 'active' && bill.createdBy === 'คุณ' && (
              <button 
                onClick={handleEditBill}
                className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="text-2xl mb-2">✏️</div>
                <div className="text-sm">แก้ไขบิล</div>
              </button>
            )}
            <button 
              onClick={() => router.push('/dashboard/bills')}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm">ดูบิลทั้งหมด</div>
            </button>
            <button 
              onClick={() => window.print()}
              className="group relative bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 px-5 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🖨️</div>
              <div className="text-sm">พิมพ์บิล</div>
            </button>
          </div>
        </div>

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📈</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ประวัติการจ่ายเงิน
              </h2>
              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                {paymentHistory.length} รายการ
              </span>
            </div>
            <div className="space-y-4">
              {paymentHistory.map((payment, index) => (
                <div key={index} className="group relative flex items-center justify-between p-5 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900 dark:via-emerald-900 dark:to-green-900 rounded-xl border border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-md">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-xl"></div>
                  </div>
                  
                  <div className="relative flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                        <span>{payment.memberName}</span>
                        <span className="text-green-600 dark:text-green-400 text-sm">จ่ายเงินแล้ว</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span>{payment.paidAt}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg">
                      ฿{payment.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminder Modal */}
        {showReminderModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowReminderModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      📱 แจ้งเตือนเพื่อน
                    </h3>
                    <button
                      onClick={() => setShowReminderModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {bill?.members.filter(m => !m.paid && m.name !== 'คุณ').length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-6xl mb-4">✅</div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          ทุกคนจ่ายครบแล้ว!
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          ไม่มีใครค้างจ่ายแล้ว บิลนี้เสร็จสิ้น
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-2">📱</div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            จะส่งการแจ้งเตือนให้สมาชิกที่ยังไม่จ่าย
                          </h4>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                            รายชื่อที่จะได้รับการแจ้งเตือน:
                          </h5>
                          <div className="space-y-2">
                            {bill?.members.filter(m => !m.paid && m.name !== 'คุณ').map((member, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {member.name}
                                  </span>
                                </div>
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  ฿{member.amount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                ยอดรวมที่ต้องแจ้งเตือน:
                              </span>
                              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                ฿{bill?.members.filter(m => !m.paid && m.name !== 'คุณ').reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <span className="text-blue-600 dark:text-blue-400 text-xl">💡</span>
                            </div>
                            <div className="ml-3">
                              <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                ข้อความที่จะส่ง:
                              </h5>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                "สวัสดี! แค่เตือนเรื่องบิล '{bill?.title}' ที่ยังค้างจ่ายอยู่ 
                                รบกวนจ่ายเมื่อสะดวกนะ ขอบคุณ! 😊"
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  {bill?.members.filter(m => !m.paid && m.name !== 'คุณ').length === 0 ? (
                    <button
                      onClick={() => setShowReminderModal(false)}
                      className="w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                    >
                      ✅ เข้าใจแล้ว
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={sendReminder}
                        className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 dark:bg-blue-500 text-base font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 sm:w-auto sm:text-sm transition-all"
                      >
                        📱 ส่งการแจ้งเตือน
                      </button>
                      <button
                        onClick={() => setShowReminderModal(false)}
                        className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                      >
                        ❌ ยกเลิก
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentModal && selectedMemberForPayment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowPaymentModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      💳 ยืนยันการจ่ายเงิน
                    </h3>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">💰</div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedMemberForPayment === 'คุณ' 
                        ? 'ยืนยันการจ่ายเงินของคุณ' 
                        : `ยืนยันการจ่ายเงินสำหรับ ${selectedMemberForPayment}`
                      }
                    </h4>
                    
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                          จำนวนเงินที่ต้องจ่าย
                        </p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                          ฿{(bill?.members.find(m => m.name === selectedMemberForPayment)?.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
                        </div>
                        <div className="ml-3 text-left">
                          <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            หมายเหตุ:
                          </h5>
                          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                            {selectedMemberForPayment === 'คุณ' 
                              ? 'การยืนยันนี้จะบันทึกว่าคุณได้จ่ายเงินส่วนของคุณแล้ว และจะอัปเดตสถานะของบิลโดยอัตโนมัติ'
                              : `การยืนยันนี้จะบันทึกว่า ${selectedMemberForPayment} ได้จ่ายเงินแล้ว และจะอัปเดตสถานะของบิลโดยอัตโนมัติ`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={confirmPayment}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 dark:bg-green-500 text-base font-medium text-white hover:bg-green-700 dark:hover:bg-green-600 sm:w-auto sm:text-sm transition-all"
                  >
                    {selectedMemberForPayment === 'คุณ' ? '💳 ยืนยันจ่ายแล้ว' : '✅ ยืนยันการจ่าย'}
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bill Settlement Confirmation Modal */}
        {showSettleConfirmModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowSettleConfirmModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4 animate-bounce">🎉</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      ยินดีด้วย! บิลเสร็จสิ้น
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      ทุกคนจ่ายเงินครบแล้ว บิล "{bill?.title}" เสร็จสิ้นเรียบร้อย!
                    </p>
                    
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400">ยอดรวม</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            ฿{bill?.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400">สมาชิก</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {bill?.members.length} คน
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          วันที่เสร็จสิ้น: {new Date().toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-yellow-600 dark:text-yellow-400 text-xl">🏆</span>
                        </div>
                        <div className="ml-3 text-left">
                          <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            ความสำเร็จใหม่ปลดล็อกแล้ว!
                          </h5>
                          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                            "Bill Settler" - จัดการบิลให้เสร็จสิ้นครบถ้วน
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={() => router.push('/dashboard/bills')}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 dark:bg-blue-500 text-base font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 sm:w-auto sm:text-sm transition-all"
                  >
                    📋 ดูบิลทั้งหมด
                  </button>
                  <button
                    onClick={() => setShowSettleConfirmModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ✅ เข้าใจแล้ว
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingBill && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowEditModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      แก้ไขบิล
                    </h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ชื่อบิล *
                      </label>
                      <input
                        type="text"
                        value={editingBill.title}
                        onChange={(e) => setEditingBill(prev => prev ? {...prev, title: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        จำนวนเงินรวม *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">฿</span>
                        <input
                          type="number"
                          value={editingBill.totalAmount}
                          onChange={(e) => setEditingBill(prev => prev ? {...prev, totalAmount: e.target.value} : null)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        รายละเอียด
                      </label>
                      <textarea
                        value={editingBill.description}
                        onChange={(e) => setEditingBill(prev => prev ? {...prev, description: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleUpdateBill}
                    disabled={!editingBill.title || !editingBill.totalAmount}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 dark:bg-blue-500 text-base font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm transition-all"
                  >
                    💾 บันทึกการแก้ไข
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
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
