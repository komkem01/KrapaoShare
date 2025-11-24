"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { goalApi, goalContributionApi } from "@/utils/apiClient";
import { useUser } from "./UserContext";

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  description?: string;
  category?: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type GoalContribution = {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

type GoalContextType = {
  goals: Goal[];
  contributions: GoalContribution[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  fetchContributions: (goalId?: string) => Promise<void>;
  createGoal: (data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_amount" | "status">) => Promise<Goal>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  addContribution: (data: Omit<GoalContribution, "id" | "created_at" | "updated_at">) => Promise<GoalContribution>;
  updateContribution: (id: string, data: Partial<GoalContribution>) => Promise<GoalContribution>;
  deleteContribution: (id: string) => Promise<void>;
  getGoalById: (id: string) => Goal | undefined;
};

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user?.id) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await goalApi.list({ user_id: user.id });
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setError(err instanceof Error ? err.message : "Failed to load goals");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchContributions = useCallback(async (goalId?: string) => {
    if (!user?.id) return;

    try {
      const data = goalId
        ? await goalContributionApi.getByGoal(goalId)
        : await goalContributionApi.getByUser(user.id);
      setContributions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch contributions:", err);
      setContributions([]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_amount" | "status">
  ): Promise<Goal> => {
    if (!user?.id) throw new Error("User not authenticated");

    const newGoal = await goalApi.create({
      ...data,
      user_id: user.id,
    }) as Goal;

    setGoals((prev) => [...prev, newGoal]);
    return newGoal;
  };

  const updateGoal = async (id: string, data: Partial<Goal>): Promise<Goal> => {
    const updated = await goalApi.update(id, data) as Goal;
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  };

  const deleteGoal = async (id: string): Promise<void> => {
    await goalApi.delete(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addContribution = async (
    data: Omit<GoalContribution, "id" | "created_at" | "updated_at">
  ): Promise<GoalContribution> => {
    const newContribution = await goalContributionApi.create(data) as GoalContribution;
    setContributions((prev) => [...prev, newContribution]);
    
    // Update goal's current amount
    const goal = goals.find(g => g.id === data.goal_id);
    if (goal) {
      setGoals(prev => prev.map(g => 
        g.id === data.goal_id 
          ? { ...g, current_amount: g.current_amount + data.amount }
          : g
      ));
    }
    
    return newContribution;
  };

  const updateContribution = async (
    id: string,
    data: Partial<GoalContribution>
  ): Promise<GoalContribution> => {
    const updated = await goalContributionApi.update(id, data) as GoalContribution;
    setContributions((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteContribution = async (id: string): Promise<void> => {
    const contribution = contributions.find(c => c.id === id);
    await goalContributionApi.delete(id);
    setContributions((prev) => prev.filter((c) => c.id !== id));
    
    // Update goal's current amount
    if (contribution) {
      setGoals(prev => prev.map(g => 
        g.id === contribution.goal_id 
          ? { ...g, current_amount: Math.max(0, g.current_amount - contribution.amount) }
          : g
      ));
    }
  };

  const getGoalById = (id: string): Goal | undefined => {
    return goals.find((g) => g.id === id);
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        contributions,
        loading,
        error,
        fetchGoals,
        fetchContributions,
        createGoal,
        updateGoal,
        deleteGoal,
        addContribution,
        updateContribution,
        deleteContribution,
        getGoalById,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

export const useGoal = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error("useGoal must be used within a GoalProvider");
  }
  return context;
};
