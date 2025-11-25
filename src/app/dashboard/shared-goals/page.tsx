'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { sharedGoalApi, sharedGoalMemberApi, goalContributionApi, accountApi, userApi, accountTransactionApi } from '@/utils/apiClient';
import { useUser } from '@/contexts/UserContext';

interface Member {
  id: string;
  name: string;
  amount: number;
  target: number;
  joinDate: string;
  userId: string;
}

interface Activity {
  id: string;
  date: string;
  member: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'join' | 'leave';
  note?: string;
}

interface SharedGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description: string;
  category: string;
  createdDate: string;
  groupCode: string;
  members: Member[];
  recentActivity: Activity[];
  createdBy: string;
  createdById: string;
  isPublic: boolean;
  autoSave: boolean;
  monthlyTarget: number;
  status: 'active' | 'completed' | 'cancelled';
}

export default function SharedGoalsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'my-goals' | 'joined-goals'>('my-goals');
  const [myGoals, setMyGoals] = useState<SharedGoal[]>([]);
  const [joinedGoals, setJoinedGoals] = useState<SharedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedAccounts, setSharedAccounts] = useState<any[]>([]);

  // Load data from API
  useEffect(() => {
    if (!user?.id) return;
    
    const loadSharedGoals = async () => {
      try {
        setLoading(true);
        
        // Fetch all shared goals and members
        const [goalsResponse, membersResponse] = await Promise.all([
          sharedGoalApi.list({ status: 'active' }),
          sharedGoalMemberApi.getByUser(user.id)
        ]);

        console.log('Goals Response:', goalsResponse);
        console.log('Members Response:', membersResponse);

        // Handle response structure - API returns { items, meta } or direct array
        const allGoals = (goalsResponse as any)?.items || (goalsResponse as any)?.data || (goalsResponse as any[]) || [];
        const userMemberships = (membersResponse as any)?.items || (membersResponse as any)?.data || (membersResponse as any[]) || [];

        console.log('All Goals:', allGoals);
        console.log('User Memberships:', userMemberships);

        // Separate goals into "my goals" (created by me) and "joined goals"
        const myGoalsList: SharedGoal[] = [];
        const joinedGoalsList: SharedGoal[] = [];

        for (const goal of allGoals) {
          // Get creator info
          let creatorName = 'Unknown';
          try {
            if (goal.createdByUserId || goal.created_by_user_id) {
              const creatorResponse = await userApi.getById(goal.createdByUserId || goal.created_by_user_id) as any;
              // API returns { code, message, data: {...} }, apiClient unwraps to just data
              const creator = creatorResponse?.data || creatorResponse;
              
              if (creator && (creator.firstName || creator.first_name)) {
                creatorName = `${creator.firstName || creator.first_name || ''} ${creator.lastName || creator.last_name || ''}`.trim();
              }
            }
          } catch (error) {
            console.error('Error loading creator info for goal', goal.name, ':', error);
          }

          // Get members for this goal
          const goalMembersResponse = await sharedGoalMemberApi.getByGoal(goal.id) as any;
          const goalMembers = goalMembersResponse?.items || goalMembersResponse?.data || goalMembersResponse || [];
          
          // Get contributions for this goal
          let contributions: any[] = [];
          try {
            const contribResponse = await goalContributionApi.getByGoal(goal.id) as any;
            contributions = contribResponse?.items || contribResponse?.data || contribResponse || [];
          } catch (error) {
            console.error('Error loading contributions:', error);
          }

          // Transform members data - use user info from JOIN
          const members: Member[] = goalMembers.map((member: any) => {
            let memberName = 'Unknown';
            
            // Backend now includes user info via JOIN
            if (member.user) {
              memberName = `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown';
            }
            
            return {
              id: member.id,
              name: memberName,
              userId: member.userId || member.user_id,
              amount: member.contributionAmount || member.contribution_amount || 0,
              target: (goal.targetAmount || goal.target_amount) / (goalMembers.length || 1),
              joinDate: member.joinedAt || member.joined_at || member.createdAt || member.created_at
            };
          });

          // Transform contributions to activities - use member names we already fetched
          const activities: Activity[] = contributions.map((contrib: any) => {
            const contribUserId = contrib.userId || contrib.user_id;
            const memberInfo = members.find(m => m.userId === contribUserId);
            const memberName = memberInfo?.name || 
              `${contrib.user?.firstName || contrib.user?.first_name || ''} ${contrib.user?.lastName || contrib.user?.last_name || ''}`.trim() || 
              'Unknown';
            
            return {
              id: contrib.id,
              date: contrib.contributionDate || contrib.contribution_date || contrib.createdAt || contrib.created_at,
              member: memberName,
              amount: contrib.amount,
              type: 'deposit' as const,
              note: contrib.notes
            };
          });

          const transformedGoal: SharedGoal = {
            id: goal.id,
            name: goal.name,
            targetAmount: goal.targetAmount || goal.target_amount,
            currentAmount: goal.currentAmount || goal.current_amount || 0,
            targetDate: goal.targetDate || goal.target_date || '',
            description: goal.description || '',
            category: goal.category || 'ทั่วไป',
            createdDate: goal.createdAt || goal.created_at,
            groupCode: goal.shareCode || goal.share_code || '',
            members,
            recentActivity: activities.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
            createdBy: creatorName,
            createdById: goal.createdByUserId || goal.created_by_user_id || goal.created_by,
            isPublic: false,
            autoSave: goal.autoSave || goal.auto_save || false,
            monthlyTarget: 0,
            status: goal.status || (goal.isActive || goal.is_active ? 'active' : 'cancelled')
          };

          // Add to appropriate list - check if created by current user
          console.log('Checking goal:', goal.name, {
            goalId: goal.id,
            createdByUserId: goal.createdByUserId,
            created_by_user_id: goal.created_by_user_id,
            created_by: goal.created_by,
            currentUserId: user.id,
            isCreator: goal.createdByUserId === user.id || goal.created_by_user_id === user.id || goal.created_by === user.id,
            hasMembership: userMemberships.some((m: any) => 
              (m.sharedGoalId === goal.id || m.shared_goal_id === goal.id)
            )
          });

          if (goal.createdByUserId === user.id || goal.created_by_user_id === user.id || goal.created_by === user.id) {
            console.log('Adding to MY GOALS:', goal.name);
            myGoalsList.push(transformedGoal);
          } else if (userMemberships.some((m: any) => 
            (m.sharedGoalId === goal.id || m.shared_goal_id === goal.id)
          )) {
            console.log('Adding to JOINED GOALS:', goal.name);
            joinedGoalsList.push(transformedGoal);
          } else {
            console.log('Goal NOT added to any list:', goal.name);
          }
        }

        setMyGoals(myGoalsList);
        setJoinedGoals(joinedGoalsList);
      } catch (error: any) {
        console.error('Error loading shared goals:', error);
        toast.error('ไม่สามารถโหลดข้อมูลเป้าหมายได้');
      } finally {
        setLoading(false);
      }
    };

    loadSharedGoals();
  }, [user?.id]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [depositFromAccountId, setDepositFromAccountId] = useState('');
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    category: 'ทั่วไป',
    accountId: '',
    members: ['']
  });

  const categories = [
    'ทั่วไป', 'ท่องเที่ยว', 'ยานพาหนะ', 'บ้าน', 'การศึกษา', 
    'งานรื่นเริง', 'เทคโนโลยี', 'สุขภาพ', 'ธุรกิจ', 'อื่นๆ'
  ];

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate || !user?.id) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      // Create shared goal (shareCode will be generated by backend)
      const createdGoal = await sharedGoalApi.create({
        createdByUserId: user.id,
        accountId: newGoal.accountId || undefined,
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        targetDate: newGoal.targetDate ? new Date(newGoal.targetDate).toISOString() : undefined,
        description: newGoal.description || undefined,
        categoryId: undefined, // TODO: Map category name to categoryId
      }) as any;

      // Add creator as first member with admin role
      await sharedGoalMemberApi.create({
        sharedGoalId: createdGoal.id,
        userId: user.id,
        role: 'admin',
      });

      toast.success('สร้างเป้าหมายสำเร็จ!');
      
      // รีเซ็ตฟอร์ม
      setShowCreateModal(false);
      setNewGoal({ 
        name: '', 
        targetAmount: '', 
        targetDate: '', 
        description: '',
        category: 'ทั่วไป',
        accountId: '',
        members: [''] 
      });

      // Reload data
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error(error.message || 'ไม่สามารถสร้างเป้าหมายได้');
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !selectedGoal || !user?.id || !depositFromAccountId) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (amount <= 0) {
      toast.error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    try {
      // 1. Create account transaction (withdraw from source account)
      await accountTransactionApi.create({
        user_id: user.id,
        account_id: depositFromAccountId,
        transaction_type: 'withdraw',
        amount: amount,
        note: `ฝากเงินเข้าเป้าหมายร่วม: ${selectedGoal.name}${depositNote ? ' - ' + depositNote : ''}`,
        // category_id: undefined, // Optional: จะต้องมี category สำหรับ "เป้าหมายออม"
      });

      // 2. Create contribution
      await goalContributionApi.create({
        sharedGoalId: selectedGoal.id,
        userId: user.id,
        amount: amount,
        contributionDate: new Date().toISOString(),
        contributionMethod: 'manual',
        notes: depositNote
      });

      // 3. Update shared goal current amount
      await sharedGoalApi.update(selectedGoal.id, {
        currentAmount: selectedGoal.currentAmount + amount
      });

      // 4. Update member contribution
      const membership = await sharedGoalMemberApi.getGoalUserMembership(selectedGoal.id, user.id) as any;
      if (membership?.id) {
        await sharedGoalMemberApi.update(membership.id, {
          contributionAmount: (membership.contribution_amount || 0) + amount
        });
      }

      toast.success(`ฝากเงิน ฿${amount.toLocaleString()} สำเร็จ!`);
      
      // รีเซ็ตฟอร์ม
      setDepositAmount('');
      setDepositNote('');
      setDepositFromAccountId('');
      setShowDepositModal(false);
      setSelectedGoal(null);

      // Reload data
      window.location.reload();
    } catch (error: any) {
      console.error('Error depositing:', error);
      toast.error(error.message || 'ไม่สามารถฝากเงินได้');
    }
  };

  const handleShowGroupCode = () => {
    if (!selectedGoal) return;
    
    // แสดงรหัสกลุ่มให้ผู้ใช้แชร์
    console.log('Showing group code for goal:', selectedGoal.id, 'Code:', selectedGoal.groupCode);
    
    setShowInviteModal(false);
    setSelectedGoal(null);
  };

  const handleJoinGroup = async () => {
    if (!joinGroupCode.trim() || !user?.id) return;

    try {
      // ค้นหากลุ่มจากรหัส - ต้องเรียก API เพื่อหากลุ่มจากรหัส
      const allGoalsData = await sharedGoalApi.list() as any[];
      const foundGoal = allGoalsData.find((g: any) => g.share_code === joinGroupCode.toUpperCase());
      
      if (foundGoal) {
        // เพิ่มตัวเองเข้ากลุ่ม
        await sharedGoalMemberApi.create({
          sharedGoalId: foundGoal.id,
          userId: user.id,
        });
        
        toast.success(`เข้าร่วมกลุ่ม "${foundGoal.name}" สำเร็จ!`);
        
        // Reload data
        window.location.reload();
      } else {
        toast.error('ไม่พบกลุ่มที่ตรงกับรหัสนี้');
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'ไม่สามารถเข้าร่วมกลุ่มได้');
    } finally {
      setJoinGroupCode('');
      setShowJoinModal(false);
    }
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

  const handleViewDetails = (goalId: string) => {
    router.push(`/dashboard/shared-goals/${goalId}`);
  };

  const handleLeaveGroup = async (goalId: string) => {
    if (!user?.id) return;
    
    if (confirm('คุณแน่ใจหรือไม่ที่จะออกจากกลุ่มนี้?')) {
      try {
        // Find membership and delete
        const membership = await sharedGoalMemberApi.getGoalUserMembership(goalId, user.id) as any;
        if (membership?.id) {
          await sharedGoalMemberApi.delete(membership.id);
          toast.success('ออกจากกลุ่มสำเร็จ');
          
          // Reload data
          window.location.reload();
        }
      } catch (error: any) {
        console.error('Error leaving group:', error);
        toast.error(error.message || 'ไม่สามารถออกจากกลุ่มได้');
      }
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setIsDeleting(true);
    try {
      await sharedGoalApi.delete(goalId);
      toast.success('ลบเป้าหมายสำเร็จ');
      
      setShowDeleteModal(false);
      setSelectedGoal(null);
      
      // Reload data
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast.error(error.message || 'ไม่สามารถลบเป้าหมายได้');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (goal: SharedGoal) => {
    setSelectedGoal(goal);
    setShowDeleteModal(true);
  };

  const handleManageGoal = (goal: any) => {
    setSelectedGoal(goal);
    // TODO: เปิด modal จัดการเป้าหมาย
    console.log('Managing goal:', goal.id);
  };

  const openDepositModal = async (goal: any) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setDepositNote('');
    setDepositFromAccountId('');
    setUserAccounts([]);
    
    // Load user accounts (all types)
    if (user?.id) {
      try {
        setLoadingAccounts(true);
        const accountsResponse = await accountApi.list({ 
          user_id: user.id,
          is_active: true 
        }) as any;
        
        console.log('Deposit - Accounts Response:', accountsResponse);
        
        // Handle different response formats
        const accountsList = accountsResponse?.data || accountsResponse || [];
        console.log('Deposit - Accounts List:', accountsList);
        
        setUserAccounts(Array.isArray(accountsList) ? accountsList : []);
      } catch (error) {
        console.error('Error loading accounts:', error);
        toast.error('ไม่สามารถโหลดบัญชีได้');
      } finally {
        setLoadingAccounts(false);
      }
    }
    
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

  // Load shared accounts when opening create modal
  const openCreateModal = async () => {
    if (!user?.id) return;
    
    // Reset state ก่อนเปิด modal
    setSharedAccounts([]);
    setNewGoal({ 
      name: '', 
      targetAmount: '', 
      targetDate: '', 
      description: '',
      category: 'ทั่วไป',
      accountId: '',
      members: [''] 
    });
    
    try {
      setLoadingAccounts(true);
      setShowCreateModal(true); // เปิด modal พร้อมกับเริ่มโหลด
      
      const accountsResponse = await accountApi.list({ 
        user_id: user.id, 
        account_type: 'shared', 
        is_active: true 
      }) as any;
      
      const accountsList = accountsResponse.data || [];
      console.log('API Response:', accountsResponse);
      console.log('Accounts data:', accountsList);
      console.log('Setting shared accounts:', accountsList.length);
      setSharedAccounts(accountsList);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('ไม่สามารถโหลดบัญชีร่วมได้');
      setSharedAccounts([]); // Set ว่างถ้า error
    } finally {
      setLoadingAccounts(false);
    }
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
              onClick={openCreateModal}
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
              เป้าหมายของฉัน ({myGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('joined-goals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'joined-goals'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              เป้าหมายที่เข้าร่วม ({joinedGoals.length})
            </button>
          </nav>
        </div>

        {/* Goals List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              {activeTab === 'my-goals' && myGoals.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    ยังไม่มีเป้าหมายออมร่วมกัน
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    สร้างเป้าหมายแรกของคุณเพื่อเริ่มออมเงินร่วมกับเพื่อน
                  </p>
                  <button
                    onClick={openCreateModal}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                  >
                    + สร้างเป้าหมายใหม่
                  </button>
                </div>
              )}

              {activeTab === 'joined-goals' && joinedGoals.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    ยังไม่ได้เข้าร่วมกลุ่มใด
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    ขอรหัสกลุ่มจากเพื่อนเพื่อเข้าร่วมออมเงินด้วยกัน
                  </p>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    🔑 เข้าร่วมกลุ่ม
                  </button>
                </div>
              )}

          {activeTab === 'my-goals' && myGoals.map((goal) => (
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
                <div className="text-right">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded block mb-1">
                    สร้างโดยคุณ
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({goal.createdBy})
                  </span>
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
                  แชร์รหัส
                </button>
                <button 
                  onClick={() => handleViewDetails(goal.id)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  ดูรายละเอียด
                </button>
                <button 
                  onClick={() => openDeleteModal(goal)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  title="ลบเป้าหมาย"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'joined-goals' && joinedGoals.map((goal) => (
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
            </>
          )}
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
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                        <span>บัญชีร่วมสำหรับฝากเงิน (ไม่บังคับ)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.accountId}
                          onChange={(e) => setNewGoal(prev => ({...prev, accountId: e.target.value}))}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none bg-white"
                          disabled={loadingAccounts}
                        >
                          <option value="">{loadingAccounts ? 'กำลังโหลด...' : 'ไม่เลือก (เพิ่มทีหลังได้)'}</option>
                          {!loadingAccounts && sharedAccounts.map((account: any) => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.bank_name || 'ไม่ระบุธนาคาร'}) - ฿{account.current_balance?.toLocaleString() || '0'}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                      {!loadingAccounts && sharedAccounts.length === 0 && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          ℹ️ คุณยังไม่มีบัญชีร่วม สามารถสร้างเป้าหมายก่อนแล้วค่อยเพิ่มบัญชีทีหลังได้
                        </p>
                      )}
                      {loadingAccounts && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          ⏳ กำลังโหลดบัญชีร่วม...
                        </p>
                      )}
                      {!loadingAccounts && sharedAccounts.length > 0 && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                          ✅ พบ {sharedAccounts.length} บัญชีร่วม
                        </p>
                      )}
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>โอนจากบัญชี *</span>
                      </label>
                      
                      {loadingAccounts ? (
                        <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-2"></div>
                          <span className="text-sm">กำลังโหลดบัญชี...</span>
                        </div>
                      ) : userAccounts.length === 0 ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            ⚠️ คุณยังไม่มีบัญชี กรุณาสร้างบัญชีก่อน
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={depositFromAccountId}
                            onChange={(e) => setDepositFromAccountId(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none cursor-pointer"
                          >
                            <option value="">เลือกบัญชีที่ต้องการ</option>
                            {userAccounts.map((account: any) => {
                              const accountType = account.account_type === 'shared' ? '👥' : '💰';
                              const balance = (account.current_balance || account.start_amount || 0).toLocaleString();
                              const bankInfo = account.bank_name 
                                ? ` (${account.bank_name})`
                                : '';
                              
                              return (
                                <option key={account.id} value={account.id}>
                                  {accountType} {account.name}{bankInfo} - ฿{balance}
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

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
                      disabled={!depositAmount || parseFloat(depositAmount) <= 0 || !depositFromAccountId}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedGoal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => !isDeleting && setShowDeleteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ยืนยันการลบเป้าหมาย
                      </h3>
                    </div>
                    <button
                      onClick={() => !isDeleting && setShowDeleteModal(false)}
                      disabled={isDeleting}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  {/* Warning Message */}
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-700">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl flex-shrink-0">🗑️</span>
                      <div>
                        <p className="text-red-800 dark:text-red-200 font-semibold mb-1">
                          คุณกำลังจะลบเป้าหมาย
                        </p>
                        <p className="text-red-700 dark:text-red-300 text-sm">
                          &quot;{selectedGoal.name}&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Goal Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">เป้าหมาย:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ฿{selectedGoal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">ยอดปัจจุบัน:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ฿{selectedGoal.currentAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">สมาชิก:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedGoal.members.length} คน
                      </span>
                    </div>
                  </div>

                  {/* Warning Text */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-2">
                      ⚠️ คำเตือน
                    </p>
                    <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1 list-disc list-inside">
                      <li>การลบเป้าหมายจะไม่สามารถกู้คืนได้</li>
                      <li>ข้อมูลสมาชิกและประวัติการฝากเงินจะถูกลบทั้งหมด</li>
                      <li>สมาชิกทุกคนจะไม่สามารถเข้าถึงเป้าหมายนี้ได้อีก</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => !isDeleting && setShowDeleteModal(false)}
                      disabled={isDeleting}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(selectedGoal.id)}
                      disabled={isDeleting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                    >
                      {isDeleting ? (
                        <span className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>กำลังลบ...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center space-x-2">
                          <span>🗑️</span>
                          <span>ยืนยันการลบ</span>
                        </span>
                      )}
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