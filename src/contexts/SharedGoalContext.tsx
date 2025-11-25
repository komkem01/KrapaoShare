"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { sharedGoalApi, sharedGoalMemberApi } from "@/utils/apiClient";
import { useUser } from "./UserContext";

export type SharedGoal = {
  id: string;
  created_by: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  description?: string;
  category?: string;
  share_code?: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type SharedGoalMember = {
  id: string;
  shared_goal_id: string;
  user_id: string;
  contribution_amount: number;
  role: "owner" | "member";
  joined_at: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
};

type SharedGoalContextType = {
  sharedGoals: SharedGoal[];
  members: SharedGoalMember[];
  loading: boolean;
  error: string | null;
  fetchSharedGoals: () => Promise<void>;
  fetchMembers: (goalId?: string) => Promise<void>;
  createSharedGoal: (data: Omit<SharedGoal, "id" | "created_at" | "updated_at" | "current_amount" | "status">) => Promise<SharedGoal>;
  updateSharedGoal: (id: string, data: Partial<SharedGoal>) => Promise<SharedGoal>;
  deleteSharedGoal: (id: string) => Promise<void>;
  addMember: (data: Omit<SharedGoalMember, "id" | "created_at" | "updated_at" | "contribution_amount" | "joined_at">) => Promise<SharedGoalMember>;
  updateMember: (id: string, data: Partial<SharedGoalMember>) => Promise<SharedGoalMember>;
  removeMember: (id: string) => Promise<void>;
  getSharedGoalById: (id: string) => SharedGoal | undefined;
};

const SharedGoalContext = createContext<SharedGoalContextType | undefined>(undefined);

export const SharedGoalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([]);
  const [members, setMembers] = useState<SharedGoalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedGoals = useCallback(async () => {
    if (!user?.id) {
      setSharedGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await sharedGoalApi.list({ created_by: user.id });
      setSharedGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch shared goals:", err);
      setError(err instanceof Error ? err.message : "Failed to load shared goals");
      setSharedGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchMembers = useCallback(async (goalId?: string) => {
    if (!user?.id) return;

    try {
      const data = goalId
        ? await sharedGoalMemberApi.getByGoal(goalId)
        : await sharedGoalMemberApi.getByUser(user.id);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setMembers([]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSharedGoals();
  }, [fetchSharedGoals]);

  const createSharedGoal = async (
    data: Omit<SharedGoal, "id" | "created_at" | "updated_at" | "current_amount" | "status">
  ): Promise<SharedGoal> => {
    if (!user?.id) throw new Error("User not authenticated");

    const newGoal = await sharedGoalApi.create({
      createdByUserId: user.id,
      name: data.name,
      targetAmount: data.target_amount,
      targetDate: data.target_date,
      description: data.description,
      shareCode: data.share_code,
    }) as SharedGoal;

    setSharedGoals((prev) => [...prev, newGoal]);
    return newGoal;
  };

  const updateSharedGoal = async (
    id: string,
    data: Partial<SharedGoal>
  ): Promise<SharedGoal> => {
    const updated = await sharedGoalApi.update(id, data) as SharedGoal;
    setSharedGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  };

  const deleteSharedGoal = async (id: string): Promise<void> => {
    await sharedGoalApi.delete(id);
    setSharedGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addMember = async (
    data: Omit<SharedGoalMember, "id" | "created_at" | "updated_at" | "contribution_amount" | "joined_at">
  ): Promise<SharedGoalMember> => {
    const newMember = await sharedGoalMemberApi.create({
      sharedGoalId: data.shared_goal_id,
      userId: data.user_id,
      role: data.role === 'owner' ? 'admin' : data.role,
    }) as SharedGoalMember;
    setMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const updateMember = async (
    id: string,
    data: Partial<SharedGoalMember>
  ): Promise<SharedGoalMember> => {
    const updateData: {
      contributionAmount?: number;
      targetContribution?: number;
      role?: 'admin' | 'member';
      isActive?: boolean;
    } = {};

    if (data.contribution_amount !== undefined) {
      updateData.contributionAmount = data.contribution_amount;
    }
    if (data.role !== undefined) {
      updateData.role = data.role === 'owner' ? 'admin' : data.role;
    }

    const updated = await sharedGoalMemberApi.update(id, updateData) as SharedGoalMember;
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const removeMember = async (id: string): Promise<void> => {
    await sharedGoalMemberApi.delete(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const getSharedGoalById = (id: string): SharedGoal | undefined => {
    return sharedGoals.find((g) => g.id === id);
  };

  return (
    <SharedGoalContext.Provider
      value={{
        sharedGoals,
        members,
        loading,
        error,
        fetchSharedGoals,
        fetchMembers,
        createSharedGoal,
        updateSharedGoal,
        deleteSharedGoal,
        addMember,
        updateMember,
        removeMember,
        getSharedGoalById,
      }}
    >
      {children}
    </SharedGoalContext.Provider>
  );
};

export const useSharedGoal = () => {
  const context = useContext(SharedGoalContext);
  if (context === undefined) {
    throw new Error("useSharedGoal must be used within a SharedGoalProvider");
  }
  return context;
};
