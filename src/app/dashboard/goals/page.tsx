"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AccountSelector, { Account } from "@/components/ui/AccountSelector";
import { toast } from "@/utils/toast";
import { useGoal } from "@/contexts/GoalContext";
import { useUser } from "@/contexts/UserContext";
import { useAccounts } from "@/contexts/AccountContext";
import type { Goal } from "@/contexts/GoalContext";

// Types
interface Deposit {
  date: string;
  amount: number;
  note: string;
}

export default function GoalsPage() {
  const router = useRouter();
  const { user } = useUser();
  const {
    goals: apiGoals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    fetchGoals,
  } = useGoal();
  const {
    accounts,
    refreshAccounts,
    isLoading: accountsLoading,
  } = useAccounts();

  // States
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    goalType: "savings" as "savings" | "purchase" | "debt_payoff",
  });

  // Load accounts on mount
  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Convert backend accounts to AccountSelector format
  const formattedAccounts: Account[] = accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    type: acc.account_type as "personal" | "shared" | "business",
    balance: acc.current_balance,
    bank: acc.bank_name || "ไม่ระบุธนาคาร",
    accountNumber: acc.bank_number || "-",
  }));

  // Calculate stats from current goals
  const activeGoals = apiGoals.filter((goal) => !goal.isCompleted);
  const completedGoals = apiGoals.filter((goal) => goal.isCompleted);

  const filteredGoals = activeTab === "active" ? activeGoals : completedGoals;

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      toast.warning("ข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (!user?.id) {
      toast.error("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      // Convert targetDate to ISO timestamp if provided
      const targetDate = newGoal.targetDate
        ? new Date(newGoal.targetDate).toISOString()
        : undefined;

      await createGoal({
        userId: user.id,
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        targetDate: targetDate,
        description: newGoal.description || undefined,
        priority: newGoal.priority,
        goalType: newGoal.goalType,
        autoSaveAmount: 0,
      });

      setShowCreateModal(false);
      setNewGoal({
        name: "",
        targetAmount: "",
        targetDate: "",
        description: "",
        priority: "medium",
        goalType: "savings",
      });
      toast.success(
        "สร้างเป้าหมายสำเร็จ! 🎯",
        `เป้าหมาย "${newGoal.name}" ถูกสร้างเรียบร้อยแล้ว`
      );
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถสร้างเป้าหมายได้");
    }
  };

  const handleDeposit = async () => {
    if (!selectedGoal || !depositAmount) {
      toast.warning("ข้อมูลไม่ครบถ้วน", "กรุณากรอกจำนวนเงิน");
      return;
    }

    if (!user?.id) {
      toast.error("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    const amount = parseFloat(depositAmount);
    const selectedAccount = formattedAccounts.find(
      (acc) => acc.id === selectedAccountId
    );

    if (!selectedAccount) {
      toast.error("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกบัญชี");
      return;
    }

    if (amount > selectedAccount.balance) {
      toast.error(
        "ยอดเงินไม่เพียงพอ",
        `ยอดเงินในบัญชีไม่เพียงพอ (คงเหลือ ฿${selectedAccount.balance.toLocaleString()})`
      );
      return;
    }

    try {
      // เรียก API goal-deposits ที่จะจัดการ transaction และ update goal อัตโนมัติ
      const { goalDepositApi } = await import("@/utils/apiClient");
      await goalDepositApi.create({
        goalId: selectedGoal.id,
        userId: user.id,
        fromAccountId:
          typeof selectedAccount.id === "string"
            ? selectedAccount.id
            : selectedAccount.id.toString(),
        amount: amount,
        notes: depositNote || undefined,
      });

      // Check if goal is completed after deposit
      const newCurrentAmount = selectedGoal.currentAmount + amount;
      const willBeCompleted = newCurrentAmount >= selectedGoal.targetAmount;

      setShowDepositModal(false);
      setDepositAmount("");
      setDepositNote("");
      setSelectedGoal(null);

      toast.success(
        "โอนเงินสำเร็จ! 💰",
        `โอนเงิน ฿${amount.toLocaleString()} เข้าเป้าหมายเรียบร้อยแล้ว`
      );

      if (willBeCompleted) {
        setTimeout(
          () => toast.success("🎉 ยินดีด้วย!", "คุณบรรลุเป้าหมายแล้ว!"),
          500
        );
      }

      // Refresh goals and accounts data from API
      await Promise.all([fetchGoals(), refreshAccounts()]);
    } catch (error) {
      console.error("Error depositing:", error);
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถโอนเงินได้");
    }
  };

  const openDepositModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDepositModal(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);

    // Convert ISO timestamp to YYYY-MM-DD format for date input
    let dateString = "";
    if (goal.targetDate) {
      const date = new Date(goal.targetDate);
      dateString = date.toISOString().split("T")[0];
    }

    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      targetDate: dateString,
      description: goal.description || "",
      priority: goal.priority,
      goalType: goal.goalType,
    });
    setShowEditModal(true);
  };

  const handleUpdateGoal = async () => {
    if (
      !selectedGoal ||
      !newGoal.name ||
      !newGoal.targetAmount ||
      !newGoal.targetDate
    ) {
      toast.warning("ข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      // Convert targetDate to ISO timestamp if provided
      const targetDate = newGoal.targetDate
        ? new Date(newGoal.targetDate).toISOString()
        : undefined;

      await updateGoal(selectedGoal.id, {
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        targetDate: targetDate,
        description: newGoal.description || undefined,
        priority: newGoal.priority,
        goalType: newGoal.goalType,
      });

      setShowEditModal(false);
      setSelectedGoal(null);
      setNewGoal({
        name: "",
        targetAmount: "",
        targetDate: "",
        description: "",
        priority: "medium",
        goalType: "savings",
      });
      toast.success(
        "แก้ไขเป้าหมายสำเร็จ! ✅",
        `แก้ไขเป้าหมาย "${newGoal.name}" เรียบร้อยแล้ว`
      );
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถแก้ไขเป้าหมายได้");
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDeleteModal(true);
  };

  const confirmDeleteGoal = async () => {
    if (!selectedGoal) return;

    try {
      setShowDeleteModal(false);
      await deleteGoal(selectedGoal.id);
      toast.success(
        "ลบเป้าหมายสำเร็จ! 🗑️",
        `ลบเป้าหมาย "${selectedGoal.name}" และคืนเงิน ฿${selectedGoal.currentAmount.toLocaleString()} เรียบร้อยแล้ว`
      );
      setSelectedGoal(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถลบเป้าหมายได้");
    }
  };

  const handleViewDetails = (goalId: string) => {
    router.push(`/dashboard/goals/${goalId}`);
  };

  const handleCreateNewGoalFromCompleted = (completedGoal: Goal) => {
    setNewGoal({
      name: `${completedGoal.name} (รอบใหม่)`,
      targetAmount: completedGoal.targetAmount.toString(),
      targetDate: "",
      description: completedGoal.description || "",
      priority: completedGoal.priority,
      goalType: completedGoal.goalType,
    });
    setShowCreateModal(true);
  };

  const categories = [
    "ทั่วไป",
    "เทคโนโลยี",
    "ท่องเที่ยว",
    "การเงิน",
    "สุขภาพ",
    "การศึกษา",
    "บ้านและที่อยู่",
    "รถยนต์",
  ];

  const totalSaved = activeGoals.reduce(
    (sum, goal) => sum + goal.currentAmount,
    0
  );
  const totalTarget = activeGoals.reduce(
    (sum, goal) => sum + goal.targetAmount,
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              เป้าหมายการออม
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ตั้งเป้าหมายและติดตามความคืบหน้าการออมเงิน
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            + ตั้งเป้าหมายใหม่
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-xl">
                  🎯
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เป้าหมายทั้งหมด
                </p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {activeGoals.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-xl">
                  💰
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ออมไปแล้ว
                </p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  ฿{totalSaved.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 text-xl">
                  🏆
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เป้าหมายรวม
                </p>
                <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  ฿{totalTarget.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <span className="text-orange-600 dark:text-orange-400 text-xl">
                  📊
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ความคืบหน้า
                </p>
                <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                  {totalTarget > 0
                    ? Math.round((totalSaved / totalTarget) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("active")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "active"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              กำลังดำเนินการ ({activeGoals.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "completed"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              สำเร็จแล้ว ({completedGoals.length})
            </button>
          </nav>
        </div>

        {/* Goals List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin mx-auto mb-4">
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  กำลังโหลดข้อมูล...
                </p>
              </div>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === "active"
                  ? "ยังไม่มีเป้าหมายการออม"
                  : "ยังไม่มีเป้าหมายที่สำเร็จ"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === "active"
                  ? "เริ่มต้นสร้างเป้าหมายการออมของคุณเพื่อบรรลุความฝัน"
                  : "เมื่อคุณบรรลุเป้าหมาย จะแสดงที่นี่"}
              </p>
              {activeTab === "active" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>ตั้งเป้าหมายใหม่</span>
                </button>
              )}
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const progressPercentage =
                (goal.currentAmount / goal.targetAmount) * 100;
              const daysLeft = goal.targetDate
                ? Math.ceil(
                    (new Date(goal.targetDate).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0;
              const isCompleted = goal.isCompleted || progressPercentage >= 100;
              const isNearDeadline = daysLeft <= 30 && daysLeft > 0;
              const isOverdue = daysLeft < 0 && !isCompleted;

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {goal.name}
                        </h3>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded">
                          {goal.goalType === "savings"
                            ? "ออมเงิน"
                            : goal.goalType === "purchase"
                            ? "ซื้อของ"
                            : "ชำระหนี้"}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            goal.priority === "critical"
                              ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                              : goal.priority === "high"
                              ? "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                              : goal.priority === "medium"
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                              : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          }`}
                        >
                          {goal.priority === "critical"
                            ? "🔥 สูงมาก"
                            : goal.priority === "high"
                            ? "⚠️ สูง"
                            : goal.priority === "medium"
                            ? "📌 ปานกลาง"
                            : "✅ ต่ำ"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {goal.description || "ไม่มีรายละเอียด"}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          สร้างเมื่อ:{" "}
                          {new Date(goal.createdAt).toLocaleDateString("th-TH")}
                        </span>
                        <span>•</span>
                        <span>
                          เป้าหมาย:{" "}
                          {goal.targetDate
                            ? new Date(goal.targetDate).toLocaleDateString(
                                "th-TH"
                              )
                            : "ไม่ระบุ"}
                        </span>
                        {activeTab === "completed" && goal.completedAt && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              สำเร็จ:{" "}
                              {new Date(goal.completedAt).toLocaleDateString(
                                "th-TH"
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Status indicators */}
                      <div className="flex space-x-2 mt-2">
                        {isCompleted && (
                          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded">
                            ✅ สำเร็จแล้ว!
                          </span>
                        )}
                        {isNearDeadline && !isCompleted && (
                          <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium px-2 py-1 rounded">
                            ⏰ ใกล้ครบกำหนด
                          </span>
                        )}
                        {isOverdue && (
                          <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium px-2 py-1 rounded">
                            ⚠️ เลยกำหนดแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        ฿{goal.targetAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ออมแล้ว ฿{goal.currentAmount.toLocaleString()}
                      </p>
                      {activeTab === "active" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {daysLeft > 0
                            ? `เหลือ ${daysLeft} วัน`
                            : isCompleted
                            ? "สำเร็จแล้ว!"
                            : "เลยกำหนดแล้ว"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ความคืบหน้า
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          isCompleted
                            ? "bg-green-500"
                            : progressPercentage > 75
                            ? "bg-blue-500"
                            : "bg-gray-400"
                        }`}
                        style={{
                          width: `${Math.min(progressPercentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>฿0</span>
                      <span>
                        เหลือ ฿
                        {(
                          goal.targetAmount - goal.currentAmount
                        ).toLocaleString()}
                      </span>
                      <span>฿{goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    {activeTab === "active" ? (
                      <>
                        <button
                          onClick={() => openDepositModal(goal)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          💰 โอนเงินเข้า
                        </button>
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                          แก้ไขเป้าหมาย
                        </button>
                        <button
                          onClick={() => handleViewDetails(goal.id)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                          ดูรายละเอียด
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                          title="ลบเป้าหมาย"
                        >
                          🗑️ ลบ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCreateNewGoalFromCompleted(goal)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          🔄 ตั้งเป้าหมายใหม่
                        </button>
                        <button
                          onClick={() => handleViewDetails(goal.id)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                          📊 ดูสรุป
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal)}
                          className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                          title="ลบเป้าหมาย"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Savings Tips */}
        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 dark:text-green-400 text-xl">
              💡
            </span>
            <div>
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                เคล็ดลับการออมเงิน
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• ตั้งการโอนอัตโนมัติจากบัญชีเงินเดือนไปเป้าหมายการออม</li>
                <li>• แบ่งเป้าหมายใหญ่เป็นเป้าหมายเล็กๆ ที่ทำได้</li>
                <li>• ใช้กฎ "จ่ายตัวเองก่อน" - ออมก่อนใช้จ่าย</li>
                <li>• ตั้งแจ้งเตือนการฝากเงินเป็นประจำ</li>
              </ul>
            </div>
          </div>
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
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🎯</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ตั้งเป้าหมายการออมใหม่
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
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="เช่น ซื้อ MacBook ใหม่"
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
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base font-medium">
                          ฿
                        </span>
                        <input
                          type="number"
                          value={newGoal.targetAmount}
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              targetAmount: e.target.value,
                            }))
                          }
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="65,000"
                          min="0"
                          step="1000"
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
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              targetDate: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base"
                          min={new Date().toISOString().split("T")[0]}
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>ประเภทเป้าหมาย</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.goalType}
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              goalType: e.target.value as
                                | "savings"
                                | "purchase"
                                | "debt_payoff",
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none cursor-pointer"
                        >
                          <option value="savings">ออมเงิน</option>
                          <option value="purchase">ซื้อของ</option>
                          <option value="debt_payoff">ชำระหนี้</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>ความสำคัญ</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.priority}
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              priority: e.target.value as
                                | "low"
                                | "medium"
                                | "high"
                                | "critical",
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none cursor-pointer"
                        >
                          <option value="low">ต่ำ</option>
                          <option value="medium">ปานกลาง</option>
                          <option value="high">สูง</option>
                          <option value="critical">สูงมาก</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
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
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400 resize-none"
                          rows={4}
                          placeholder="อธิบายเป้าหมายนี้..."
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="group relative overflow-hidden px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 font-semibold"
                  >
                    <div className="absolute inset-0 bg-gray-100 dark:bg-gray-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    <span className="relative flex items-center justify-center space-x-2">
                      <span>❌</span>
                      <span>ยกเลิก</span>
                    </span>
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    disabled={
                      !newGoal.name ||
                      !newGoal.targetAmount ||
                      !newGoal.targetDate
                    }
                    className="group relative overflow-hidden px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center space-x-2">
                      <span>🎯</span>
                      <span>ตั้งเป้าหมาย</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                {/* Header with gradient */}
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
                  {selectedGoal && (
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
                            เหลืออีก ฿
                            {(
                              selectedGoal.targetAmount -
                              selectedGoal.currentAmount
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Account Selector */}
                    {accountsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            กำลังโหลดบัญชี...
                          </p>
                        </div>
                      </div>
                    ) : formattedAccounts.length === 0 ? (
                      <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                        <span className="text-4xl mb-2 block">⚠️</span>
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                          ไม่มีบัญชีที่ใช้งานได้
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                          กรุณาสร้างบัญชีก่อนฝากเงินเข้าเป้าหมาย
                        </p>
                      </div>
                    ) : (
                      <AccountSelector
                        accounts={formattedAccounts}
                        selectedAccountId={selectedAccountId}
                        onSelect={(account) =>
                          setSelectedAccountId(
                            typeof account.id === "string"
                              ? account.id
                              : account.id.toString()
                          )
                        }
                      />
                    )}

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>จำนวนเงิน *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">
                          ฿
                        </span>
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
                          onClick={() => setDepositAmount("1000")}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositAmount("5000")}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          ฿5,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositAmount("10000")}
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
                      onClick={() => {
                        setShowDepositModal(false);
                        setDepositAmount("");
                        setDepositNote("");
                        setSelectedGoal(null);
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleDeposit}
                      disabled={
                        !depositAmount ||
                        parseFloat(depositAmount) <= 0 ||
                        formattedAccounts.length === 0 ||
                        !selectedAccountId
                      }
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedGoal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 transition-opacity backdrop-blur-sm" 
                onClick={() => setShowDeleteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              {/* Center modal vertically */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal */}
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🗑️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        ยืนยันการลบเป้าหมาย
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    {/* Warning message */}
                    <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          คุณกำลังจะลบเป้าหมายนี้
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          การกระทำนี้ไม่สามารถยกเลิกได้
                        </p>
                      </div>
                    </div>

                    {/* Goal details */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">เป้าหมาย:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{selectedGoal.name}</span>
                      </div>
                      
                      {selectedGoal.currentAmount > 0 && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            <div className="flex-shrink-0">
                              <span className="text-2xl">💰</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                ระบบจะคืนเงินอัตโนมัติ
                              </p>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                จำนวน <span className="font-bold text-lg">฿{selectedGoal.currentAmount.toLocaleString()}</span>
                              </p>
                              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                เงินจะถูกโอนกลับไปยังบัญชีที่ฝากเข้ามา
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirmation text */}
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        กรุณายืนยันว่าคุณต้องการลบเป้าหมายนี้
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedGoal(null);
                    }}
                    className="w-full sm:w-auto inline-flex justify-center items-center space-x-2 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-medium shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>ยกเลิก</span>
                  </button>
                  <button
                    onClick={confirmDeleteGoal}
                    className="w-full sm:w-auto inline-flex justify-center items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>ลบเป้าหมาย</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Goal Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity backdrop-blur-sm"
                onClick={() => setShowEditModal(false)}
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
                        <span className="text-white text-xl">✏️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        แก้ไขเป้าหมายการออม
                      </h3>
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
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>ชื่อเป้าหมาย *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newGoal.name}
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="เช่น ซื้อ MacBook ใหม่"
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
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-bold">
                          ฿
                        </span>
                        <input
                          type="number"
                          value={newGoal.targetAmount}
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              targetAmount: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400"
                          placeholder="65,000"
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
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              targetDate: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>ประเภทเป้าหมาย</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.goalType}
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              goalType: e.target.value as
                                | "savings"
                                | "purchase"
                                | "debt_payoff",
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none bg-white"
                        >
                          <option value="savings">ออมเงิน</option>
                          <option value="purchase">ซื้อของ</option>
                          <option value="debt_payoff">ชำระหนี้</option>
                        </select>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>ความสำคัญ</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newGoal.priority}
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              priority: e.target.value as
                                | "low"
                                | "medium"
                                | "high"
                                | "critical",
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base appearance-none bg-white"
                        >
                          <option value="low">ต่ำ</option>
                          <option value="medium">ปานกลาง</option>
                          <option value="high">สูง</option>
                          <option value="critical">สูงมาก</option>
                        </select>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
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
                          onChange={(e) =>
                            setNewGoal((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white text-base placeholder-gray-400 resize-none"
                          rows={4}
                          placeholder="อธิบายเป้าหมายนี้เพิ่มเติม..."
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedGoal(null);
                        setNewGoal({
                          name: "",
                          targetAmount: "",
                          targetDate: "",
                          description: "",
                          priority: "medium",
                          goalType: "savings",
                        });
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleUpdateGoal}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>✏️</span>
                        <span>บันทึกการแก้ไข</span>
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
