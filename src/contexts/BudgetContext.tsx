"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { budgetApi } from "@/utils/apiClient";
import { useUser } from "./UserContext";

export type Budget = {
  id: string;
  user_id: string;
  category_id?: string;
  name: string;
  amount: number;
  period_start: string;
  period_end: string;
  description?: string;
  alert_threshold?: number;
  status?: string;
  created_at: string;
  updated_at: string;
};

type BudgetContextType = {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  createBudget: (data: Omit<Budget, "id" | "created_at" | "updated_at" | "status">) => Promise<Budget>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetById: (id: string) => Budget | undefined;
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    if (!user?.id) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await budgetApi.list({ user_id: user.id });
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
      setError(err instanceof Error ? err.message : "Failed to load budgets");
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = async (
    data: Omit<Budget, "id" | "created_at" | "updated_at" | "status">
  ): Promise<Budget> => {
    if (!user?.id) throw new Error("User not authenticated");

    const newBudget = await budgetApi.create({
      user_id: user.id,
      category_id: data.category_id,
      name: data.name,
      amount: data.amount,
      period_start: data.period_start,
      period_end: data.period_end,
      description: data.description,
      alert_threshold: data.alert_threshold,
    }) as Budget;

    setBudgets((prev) => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = async (
    id: string,
    data: Partial<Budget>
  ): Promise<Budget> => {
    const updated = await budgetApi.update(id, {
      category_id: data.category_id,
      name: data.name,
      amount: data.amount,
      period_start: data.period_start,
      period_end: data.period_end,
      description: data.description,
      alert_threshold: data.alert_threshold,
      status: data.status,
    }) as Budget;
    setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const deleteBudget = async (id: string): Promise<void> => {
    await budgetApi.delete(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const getBudgetById = (id: string): Budget | undefined => {
    return budgets.find((b) => b.id === id);
  };

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        loading,
        error,
        fetchBudgets,
        createBudget,
        updateBudget,
        deleteBudget,
        getBudgetById,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
