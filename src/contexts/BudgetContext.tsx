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
  userId?: string;
  categoryId?: string;
  name?: string;
  budgetAmount: number;
  spentAmount: number;
  periodType?: string;
  periodStart?: string;
  periodEnd?: string;
  budgetMonth?: number;
  budgetYear?: number;
  alertPercentage?: number;
  isActive?: boolean;
  autoRollover?: boolean;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  // Frontend specific fields
  category: string;
  month: string;
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
      console.log('🔍 Fetching budgets for user:', user.id);
      
      // Temporary: Call API directly without auth for testing
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/budgets?user_id=${user.id}`;
      console.log('🌐 Direct API call to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const apiData = await response.json();
      console.log('📥 Budget API Response:', apiData);
      
      // Handle backend response format: { data: { items: [...] } }
      const rawBudgets = apiData?.data?.items || apiData?.items || apiData || [];
      console.log('📋 Raw budgets:', rawBudgets);
      
      if (!Array.isArray(rawBudgets)) {
        console.warn('⚠️ Raw budgets is not an array:', rawBudgets);
        setBudgets([]);
        return;
      }

      // Transform backend data to frontend format
      const transformedBudgets = await Promise.all(
        rawBudgets.map(async (budget: any) => {
          try {
            // Fetch category name
            let categoryName = 'ไม่ระบุหมวดหมู่';
            if (budget.categoryId) {
              try {
                const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/categories/${budget.categoryId}`);
                if (categoryResponse.ok) {
                  const categoryData = await categoryResponse.json();
                  categoryName = categoryData?.data?.name || 'ไม่ระบุหมวดหมู่';
                }
              } catch (categoryError) {
                console.warn('Failed to fetch category:', categoryError);
              }
            }

            // Transform to frontend format
            return {
              id: budget.id,
              category: categoryName,
              categoryId: budget.categoryId,
              budgetAmount: budget.budgetAmount || 0,
              spentAmount: budget.spentAmount || 0,
              month: budget.periodStart ? new Date(budget.periodStart).toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7), // YYYY-MM format
              description: budget.description || budget.name || '',
              name: budget.name || '',
              // Keep original fields for API compatibility
              userId: budget.userId,
              periodType: budget.periodType,
              periodStart: budget.periodStart,
              periodEnd: budget.periodEnd,
              budgetMonth: budget.budgetMonth,
              budgetYear: budget.budgetYear,
              alertPercentage: budget.alertPercentage,
              isActive: budget.isActive,
              autoRollover: budget.autoRollover,
              status: budget.status,
              createdAt: budget.createdAt,
              updatedAt: budget.updatedAt,
            };
          } catch (transformError) {
            console.error('Failed to transform budget:', transformError);
            return {
              id: budget.id,
              category: 'ไม่ระบุหมวดหมู่',
              categoryId: budget.categoryId,
              budgetAmount: budget.budgetAmount || 0,
              spentAmount: budget.spentAmount || 0,
              month: new Date().toISOString().substring(0, 7),
              description: budget.description || budget.name || '',
              name: budget.name || '',
              // Keep original fields for API compatibility
              userId: budget.userId,
              periodType: budget.periodType,
              periodStart: budget.periodStart,
              periodEnd: budget.periodEnd,
              budgetMonth: budget.budgetMonth,
              budgetYear: budget.budgetYear,
              alertPercentage: budget.alertPercentage,
              isActive: budget.isActive,
              autoRollover: budget.autoRollover,
              status: budget.status,
              createdAt: budget.createdAt,
              updatedAt: budget.updatedAt,
            };
          }
        })
      );

      console.log('✅ Transformed budgets:', transformedBudgets);
      setBudgets(transformedBudgets);
    } catch (err) {
      console.error("❌ Failed to fetch budgets:", err);
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
    data: any // ใช้ any เพื่อรองรับ backend fields
  ): Promise<Budget> => {
    if (!user?.id) throw new Error("User not authenticated");

    const newBudget = await budgetApi.create({
      userId: user.id,
      categoryId: data.category_id,
      name: data.name,
      budgetAmount: data.amount,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      description: data.description,
      // เพิ่ม backend fields ตาม JSON tags
      budgetMonth: data.budget_month,
      budgetYear: data.budget_year,
      alertPercentage: data.alert_percentage,
      periodType: data.period_type,
      isActive: data.is_active,
      autoRollover: data.auto_rollover,
    }) as Budget;

    setBudgets((prev) => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = async (
    id: string,
    data: any // ใช้ any เพื่อรองรับ backend fields
  ): Promise<Budget> => {
    console.log('🔄 [BudgetContext] Updating budget:', id, 'with data:', data);
    
    const updated = await budgetApi.update(id, {
      categoryId: data.categoryId,
      name: data.name,
      budgetAmount: data.budgetAmount,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      description: data.description,
      // Backend fields
      budgetMonth: data.budgetMonth,
      budgetYear: data.budgetYear,
      alertPercentage: data.alertPercentage,
      periodType: data.periodType,
      isActive: data.isActive,
      autoRollover: data.autoRollover,
    }) as Budget;
    
    console.log('✅ [BudgetContext] Budget updated:', updated);
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
