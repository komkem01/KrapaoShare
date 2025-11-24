'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBill, Bill as ApiBill, BillParticipant } from '@/contexts/BillContext';
import { toast } from 'sonner';

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
  members: BillMember[];
  status: 'active' | 'settled';
  settledAt?: string;
}

interface EditingBill {
  id: number;
  title: string;
  totalAmount: string;
  description: string;
  members: string[];
  splitType: 'equal' | 'custom';
}

export default function BillsPage() {
  const router = useRouter();
  const {
    bills,
    participants,
    loading,
    error,
    fetchBills,
    createBill,
    updateBill,
    deleteBill,
    addParticipant,
    updateParticipant,
    fetchParticipants,
  } = useBill();

  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingBill, setEditingBill] = useState<EditingBill | null>(null);
  const [newBill, setNewBill] = useState({
    title: '',
    totalAmount: '',
    description: '',
    members: [''],
    splitType: 'equal' as 'equal' | 'custom',
    memberAmounts: {} as { [key: string]: number }
  });

  const itemsPerPage = 4;
  
  // Load bills on mount
  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Transform API data to match UI format
  interface UIBillMember {
    name: string;
    amount: number;
    paid: boolean;
    participantId?: string;
  }

  interface UIBill {
    id: number;
    title: string;
    totalAmount: number;
    description: string;
    createdBy: string;
    createdAt: string;
    members: UIBillMember[];
    status: 'active' | 'settled';
    settledAt?: string;
  }

  const transformBillsToUI = (apiBills: ApiBill[], apiParticipants: BillParticipant[]): UIBill[] => {
    return apiBills.map(bill => {
      const billParticipants = apiParticipants.filter(p => p.bill_id === bill.id);
      
      return {
        id: parseInt(bill.id),
        title: bill.title,
        totalAmount: bill.total_amount,
        description: bill.description || '',
        createdBy: 'คุณ', // Since it's user's bill
        createdAt: bill.created_at.split('T')[0],
        members: billParticipants.map(p => ({
          name: p.user_name || p.user_email || 'สมาชิก',
          amount: p.amount,
          paid: p.is_paid,
          participantId: p.id,
        })),
        status: bill.status === 'settled' ? 'settled' : 'active',
        settledAt: bill.settled_at?.split('T')[0],
      };
    });
  };

  const uiBills = transformBillsToUI(bills, participants);
  const activeBills = uiBills.filter(bill => bill.status === 'active');
  const settledBills = uiBills.filter(bill => bill.status === 'settled');

  // TODO: ✅ Backend API Ready!
  // Backend now has /bills and /bill-participants endpoints - integrate with real API:
  //   GET    /bills                           - List bills
  //   POST   /bills                           - Create bill
  //   GET    /bills/:id                       - Get bill details
  //   PATCH  /bills/:id                       - Update bill
  //   DELETE /bills/:id                       - Delete bill
  //   GET    /bill-participants               - List participants
  //   POST   /bill-participants               - Add participant
  //   GET    /bill-participants/bill/:billId  - Get bill participants
  //   GET    /bill-participants/user/:userId  - Get user's bills
  //   PATCH  /bill-participants/:id           - Update participant (mark paid)
  //
  // See src/utils/apiClient.ts for implementation

  const filteredBills = activeTab === 'active' ? activeBills : settledBills;
  
  // Pagination logic
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBills = filteredBills.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateBill = async () => {
    if (!newBill.title || !newBill.totalAmount || newBill.members.filter(m => m.trim()).length === 0) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const validMembers = newBill.members.filter(m => m.trim());
    const totalAmount = parseFloat(newBill.totalAmount);

    try {
      // Create the bill first
      const createdBill = await createBill({
        title: newBill.title,
        total_amount: totalAmount,
        description: newBill.description,
        bill_date: new Date().toISOString(),
        user_id: '', // Will be set by context
      });

      // Then add participants
      if (newBill.splitType === 'equal') {
        // Equal split
        const amountPerPerson = totalAmount / (validMembers.length + 1); // +1 for current user
        
        // Add participants for each member
        for (const member of validMembers) {
          await addParticipant({
            bill_id: createdBill.id,
            user_id: member, // In a real app, this would be the user ID
            amount: amountPerPerson,
          });
        }
      } else {
        // Custom split
        const memberAmountsSum = Object.values(newBill.memberAmounts).reduce((sum, amount) => sum + amount, 0);
        if (Math.abs(memberAmountsSum - totalAmount) > 0.01) {
          toast.info(`ยอดรวมไม่ตรงกัน! ยอดที่กรอก: ฿${memberAmountsSum.toLocaleString()} ยอดรวมที่ระบุ: ฿${totalAmount.toLocaleString()}`);
          return;
        }

        // Add participants with custom amounts
        for (const [memberName, amount] of Object.entries(newBill.memberAmounts)) {
          if (memberName !== 'คุณ') { // Skip current user
            await addParticipant({
              bill_id: createdBill.id,
              user_id: memberName, // In a real app, this would be the user ID
              amount: amount,
            });
          }
        }
      }

      // Refresh data
      await fetchBills();
      await fetchParticipants();

      setShowCreateModal(false);
      setNewBill({
        title: '',
        totalAmount: '',
        description: '',
        members: [''],
        splitType: 'equal',
        memberAmounts: {}
      });
      setCurrentPage(1);
    } catch (err) {
      toast.info('ไม่สามารถสร้างบิลได้: ' + (err as Error).message);
    }
  };

  const addMemberField = () => {
    setNewBill(prev => ({
      ...prev,
      members: [...prev.members, '']
    }));
  };

  const updateMember = (index: number, value: string) => {
    setNewBill(prev => {
      const oldName = prev.members[index];
      const newMembers = prev.members.map((member, i) => i === index ? value : member);
      
      // Update memberAmounts if we have custom splitting
      if (prev.splitType === 'custom') {
        const newMemberAmounts = { ...prev.memberAmounts };
        if (oldName && oldName !== value) {
          // Remove old name and add new name with same amount or 0
          const amount = newMemberAmounts[oldName] || 0;
          delete newMemberAmounts[oldName];
          if (value.trim()) {
            newMemberAmounts[value] = amount;
          }
        }
        return {
          ...prev,
          members: newMembers,
          memberAmounts: newMemberAmounts
        };
      }
      
      return {
        ...prev,
        members: newMembers
      };
    });
  };

  const removeMember = (index: number) => {
    setNewBill(prev => {
      const memberToRemove = prev.members[index];
      const newMemberAmounts = { ...prev.memberAmounts };
      if (memberToRemove) {
        delete newMemberAmounts[memberToRemove];
      }
      
      return {
        ...prev,
        members: prev.members.filter((_, i) => i !== index),
        memberAmounts: newMemberAmounts
      };
    });
  };

  const updateMemberAmount = (memberName: string, amount: number) => {
    setNewBill(prev => ({
      ...prev,
      memberAmounts: {
        ...prev.memberAmounts,
        [memberName]: amount
      }
    }));
  };

  const handlePayment = async (billId: number, memberName: string) => {
    try {
      // Find the participant to update
      const bill = uiBills.find(b => b.id === billId);
      if (!bill) return;
      
      const member = bill.members.find(m => m.name === memberName);
      if (!member?.participantId) return;

      // Update participant payment status
      await updateParticipant(member.participantId, {
        is_paid: true,
        paid_at: new Date().toISOString(),
      });

      // Check if all participants are paid
      const allPaid = bill.members.every(m => 
        m.name === memberName ? true : m.paid
      );

      if (allPaid) {
        // Update bill status to settled
        await updateBill(billId.toString(), {
          status: 'settled',
          settled_at: new Date().toISOString(),
        });
      }

      // Refresh data
      await fetchBills();
      await fetchParticipants();
    } catch (err) {
      toast.info('ไม่สามารถอัปเดตการจ่ายเงินได้: ' + (err as Error).message);
    }
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill({
      id: bill.id,
      title: bill.title,
      totalAmount: bill.totalAmount.toString(),
      description: bill.description,
      members: bill.members.filter((m: BillMember) => m.name !== 'คุณ').map((m: BillMember) => m.name),
      splitType: 'equal' as const
    });
    setShowEditModal(true);
  };

  const handleReminder = (billId: number) => {
    toast.info(`แจ้งเตือนเพื่อนสำหรับบิล ID: ${billId}`);
  };

  const handleUpdateBill = async () => {
    if (!editingBill || !editingBill.title || !editingBill.totalAmount) {
      toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      // Update the bill
      await updateBill(editingBill.id.toString(), {
        title: editingBill.title,
        total_amount: parseFloat(editingBill.totalAmount),
        description: editingBill.description,
      });

      // Refresh data
      await fetchBills();
      await fetchParticipants();

      setShowEditModal(false);
      setEditingBill(null);
    } catch (err) {
      toast.info('ไม่สามารถอัปเดตบิลได้: ' + (err as Error).message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              แยกบิล
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการและแบ่งค่าใช้จ่ายร่วมกันกับเพื่อน
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            + สร้างบิลใหม่
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  บิลที่ยังไม่จ่าย
                </p>
                <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                  {activeBills.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-xl">💸</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ที่ต้องจ่าย
                </p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  ฿{activeBills.reduce((sum, bill) => 
                    sum + (bill.members.find(m => m.name === 'คุณ' && !m.paid)?.amount || 0), 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ที่ต้องได้รับ
                </p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  ฿{activeBills.reduce((sum, bill) => 
                    bill.createdBy === 'คุณ' ? sum + bill.members.filter(m => m.name !== 'คุณ' && !m.paid).reduce((s, m) => s + m.amount, 0) : sum, 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('active');
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              บิลที่ยังไม่จ่าย ({activeBills.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('settled');
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settled'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              บิลที่จ่ายแล้ว ({settledBills.length})
            </button>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">กำลังโหลดบิล...</p>
          </div>
        ) : (
          <>
            {/* Bills List */}
            <div className="grid gap-6">
              {paginatedBills.length > 0 ? (
            paginatedBills.map((bill) => (
            <div key={bill.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {bill.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {bill.description}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>สร้างโดย {bill.createdBy}</span>
                    <span>•</span>
                    <span>{new Date(bill.createdAt).toLocaleDateString('th-TH')}</span>
                    {bill.status === 'settled' && 'settledAt' in bill && (
                      <>
                        <span>•</span>
                        <span>จ่ายแล้ว {bill.settledAt ? new Date(bill.settledAt).toLocaleDateString('th-TH') : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    ฿{bill.totalAmount.toLocaleString()}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bill.status === 'active'
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}>
                    {bill.status === 'active' ? 'ยังไม่จ่าย' : 'จ่ายแล้ว'}
                  </span>
                </div>
              </div>

              {/* Members List */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  การแบ่งจ่าย ({bill.members.length} คน)
                </h4>
                <div className="space-y-2">
                  {bill.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          member.paid 
                            ? 'bg-green-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          member.name === 'คุณ' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {member.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          member.paid
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }`}>
                          {member.paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ฿{member.amount.toLocaleString()}
                        </span>
                        {bill.status === 'active' && member.name === 'คุณ' && !member.paid && (
                          <button
                            onClick={() => handlePayment(bill.id, member.name)}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                          >
                            จ่าย
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {bill.status === 'active' && (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleReminder(bill.id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    แจ้งเตือนเพื่อน
                  </button>
                  <button 
                    onClick={() => handleEditBill(bill)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    แก้ไข
                  </button>
                  <button 
                    onClick={() => router.push(`/dashboard/bills/${bill.id}`)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              )}
            </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'active' ? 'ไม่มีบิลที่ยังไม่จ่าย' : 'ไม่มีบิลที่จ่ายแล้ว'}
              </p>
            </div>
          )}
        </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  แสดง {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBills.length)} จาก {filteredBills.length} รายการ
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    ก่อนหน้า
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === page
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Bill Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowCreateModal(false)}
              >
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      สร้างบิลใหม่
                    </h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
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
                        value={newBill.title}
                        onChange={(e) => setNewBill(prev => ({...prev, title: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="เช่น ค่าอาหารเที่ยง"
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
                          value={newBill.totalAmount}
                          onChange={(e) => setNewBill(prev => ({...prev, totalAmount: e.target.value}))}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="1250.00"
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
                        value={newBill.description}
                        onChange={(e) => setNewBill(prev => ({...prev, description: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                        placeholder="สุกี้ + เครื่องดื่ม"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        วิธีแบ่งจ่าย
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setNewBill(prev => ({...prev, splitType: 'equal', memberAmounts: {}}))}
                          className={`flex-1 py-2 px-4 rounded-lg border ${
                            newBill.splitType === 'equal'
                              ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          แบ่งเท่าๆ กัน
                        </button>
                        <button
                          onClick={() => {
                            setNewBill(prev => {
                              const validMembers = prev.members.filter(m => m.trim());
                              const totalAmount = parseFloat(prev.totalAmount) || 0;
                              const amountPerPerson = totalAmount / (validMembers.length + 1);
                              
                              // Initialize memberAmounts with equal split
                              const initialAmounts: { [key: string]: number } = {};
                              initialAmounts['คุณ'] = amountPerPerson;
                              validMembers.forEach(member => {
                                initialAmounts[member] = amountPerPerson;
                              });
                              
                              return {
                                ...prev,
                                splitType: 'custom',
                                memberAmounts: initialAmounts
                              };
                            });
                          }}
                          className={`flex-1 py-2 px-4 rounded-lg border ${
                            newBill.splitType === 'custom'
                              ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          กำหนดเอง
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        เพิ่มสมาชิก *
                      </label>
                      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <span className="text-sm text-blue-700 dark:text-blue-300">👤 คุณ (ผู้สร้างบิล)</span>
                      </div>
                      {newBill.members.map((member, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            value={member}
                            onChange={(e) => updateMember(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="ชื่อเพื่อน"
                          />
                          {newBill.members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              className="px-3 py-2 text-red-600 hover:text-red-800 rounded transition-colors"
                              title="ลบสมาชิก"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addMemberField}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                      >
                        + เพิ่มสมาชิก
                      </button>
                    </div>

                    {/* Custom Amount Section */}
                    {newBill.splitType === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          กำหนดจำนวนเงินแต่ละคน
                        </label>
                        
                        {/* คุณ */}
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">👤 คุณ</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-blue-600 dark:text-blue-400">฿</span>
                              <input
                                type="number"
                                value={newBill.memberAmounts['คุณ'] || 0}
                                onChange={(e) => updateMemberAmount('คุณ', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-blue-300 dark:border-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-blue-800 dark:text-blue-100 text-sm"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>

                        {/* เพื่อนๆ */}
                        {newBill.members.filter(m => m.trim()).map((member, index) => (
                          <div key={index} className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">👤 {member}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">฿</span>
                                <input
                                  type="number"
                                  value={newBill.memberAmounts[member] || 0}
                                  onChange={(e) => updateMemberAmount(member, parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 text-sm"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* แสดงยอดรวม */}
                        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-lg border border-indigo-200 dark:border-indigo-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              ยอดรวมที่กรอก:
                            </span>
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const validMembers = newBill.members.filter(m => m.trim());
                                const totalCustomAmount = (newBill.memberAmounts['คุณ'] || 0) +
                                  validMembers.reduce((sum, member) => sum + (newBill.memberAmounts[member] || 0), 0);
                                const targetTotal = parseFloat(newBill.totalAmount) || 0;
                                const isCorrect = Math.abs(totalCustomAmount - targetTotal) < 0.01 && targetTotal > 0;
                                
                                return (
                                  <>
                                    <span className={`text-sm font-bold ${
                                      isCorrect 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      ฿{totalCustomAmount.toLocaleString()}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      / ฿{targetTotal.toLocaleString()}
                                    </span>
                                    {isCorrect ? (
                                      <span className="text-green-600 dark:text-green-400 text-sm">✅</span>
                                    ) : (
                                      <span className="text-red-600 dark:text-red-400 text-sm">❌</span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          {(() => {
                            const validMembers = newBill.members.filter(m => m.trim());
                            const totalCustomAmount = (newBill.memberAmounts['คุณ'] || 0) +
                              validMembers.reduce((sum, member) => sum + (newBill.memberAmounts[member] || 0), 0);
                            const targetTotal = parseFloat(newBill.totalAmount) || 0;
                            const isCorrect = Math.abs(totalCustomAmount - targetTotal) < 0.01 && targetTotal > 0;
                            
                            if (!isCorrect && targetTotal > 0) {
                              const difference = targetTotal - totalCustomAmount;
                              return (
                                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                  {difference > 0 
                                    ? `ยังขาดอีก ฿${difference.toLocaleString()}` 
                                    : `เกินไป ฿${Math.abs(difference).toLocaleString()}`
                                  }
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleCreateBill}
                    disabled={(() => {
                      // Basic validation
                      if (!newBill.title || !newBill.totalAmount || newBill.members.filter(m => m.trim()).length === 0) {
                        return true;
                      }
                      
                      // Custom split validation
                      if (newBill.splitType === 'custom') {
                        const validMembers = newBill.members.filter(m => m.trim());
                        const totalCustomAmount = (newBill.memberAmounts['คุณ'] || 0) +
                          validMembers.reduce((sum, member) => sum + (newBill.memberAmounts[member] || 0), 0);
                        const targetTotal = parseFloat(newBill.totalAmount) || 0;
                        return Math.abs(totalCustomAmount - targetTotal) > 0.01;
                      }
                      
                      return false;
                    })()}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gray-900 dark:bg-white text-base font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm transition-all"
                  >
                    📋 สร้างบิล
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:w-auto sm:text-sm transition-all"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bill Modal */}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingBill((prev: EditingBill | null) => prev ? ({...prev, title: e.target.value}) : null)}
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
                          onChange={(e) => setEditingBill((prev: EditingBill | null) => prev ? ({...prev, totalAmount: e.target.value}) : null)}
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
                        onChange={(e) => setEditingBill((prev: EditingBill | null) => prev ? ({...prev, description: e.target.value}) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        สมาชิก
                      </label>
                      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <span className="text-sm text-blue-700 dark:text-blue-300">👤 คุณ (ผู้สร้างบิล)</span>
                      </div>
                      {editingBill.members.map((member: string, index: number) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            value={member}
                            onChange={(e) => {
                              const newMembers = [...editingBill.members];
                              newMembers[index] = e.target.value;
                              setEditingBill((prev: EditingBill | null) => prev ? ({...prev, members: newMembers}) : null);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="ชื่อเพื่อน"
                          />
                          {editingBill.members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newMembers = editingBill.members.filter((_: any, i: number) => i !== index);
                                setEditingBill((prev: EditingBill | null) => prev ? ({...prev, members: newMembers}) : null);
                              }}
                              className="px-3 py-2 text-red-600 hover:text-red-800 rounded transition-colors"
                              title="ลบสมาชิก"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))}
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