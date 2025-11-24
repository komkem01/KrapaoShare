"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { debtApi, debtPaymentApi } from "@/utils/apiClient";
import { useUser } from "./UserContext";

export type Debt = {
  id: string;
  creditor_id: string;
  debtor_id: string;
  amount: number;
  paid_amount: number;
  description?: string;
  due_date?: string;
  interest_rate?: number;
  status: "pending" | "settled" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type DebtPayment = {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

type DebtContextType = {
  debts: Debt[];
  payments: DebtPayment[];
  loading: boolean;
  error: string | null;
  fetchDebts: () => Promise<void>;
  fetchPayments: (debtId?: string) => Promise<void>;
  createDebt: (data: Omit<Debt, "id" | "created_at" | "updated_at" | "paid_amount" | "status">) => Promise<Debt>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<Debt>;
  deleteDebt: (id: string) => Promise<void>;
  addPayment: (data: Omit<DebtPayment, "id" | "created_at" | "updated_at">) => Promise<DebtPayment>;
  updatePayment: (id: string, data: Partial<DebtPayment>) => Promise<DebtPayment>;
  deletePayment: (id: string) => Promise<void>;
  getDebtById: (id: string) => Debt | undefined;
  getCreditorDebts: () => Debt[];
  getDebtorDebts: () => Debt[];
};

const DebtContext = createContext<DebtContextType | undefined>(undefined);

export const DebtProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async () => {
    if (!user?.id) {
      setDebts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Fetch both creditor and debtor debts
      const [creditorDebts, debtorDebts] = await Promise.all([
        debtApi.getByCreditor(user.id).then(d => d as Debt[]).catch(() => [] as Debt[]),
        debtApi.getByDebtor(user.id).then(d => d as Debt[]).catch(() => [] as Debt[]),
      ]);
      
      // Combine and deduplicate
      const allDebts = [...creditorDebts, ...debtorDebts];
      const uniqueDebts = Array.from(
        new Map(allDebts.map(debt => [debt.id, debt])).values()
      );
      
      setDebts(uniqueDebts);
    } catch (err) {
      console.error("Failed to fetch debts:", err);
      setError(err instanceof Error ? err.message : "Failed to load debts");
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchPayments = useCallback(async (debtId?: string) => {
    try {
      const data = debtId
        ? await debtPaymentApi.getByDebt(debtId)
        : await debtPaymentApi.list();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setPayments([]);
    }
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const createDebt = async (
    data: Omit<Debt, "id" | "created_at" | "updated_at" | "paid_amount" | "status">
  ): Promise<Debt> => {
    if (!user?.id) throw new Error("User not authenticated");

    const newDebt = await debtApi.create(data) as Debt;
    setDebts((prev) => [...prev, newDebt]);
    return newDebt;
  };

  const updateDebt = async (id: string, data: Partial<Debt>): Promise<Debt> => {
    const updated = await debtApi.update(id, data) as Debt;
    setDebts((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  };

  const deleteDebt = async (id: string): Promise<void> => {
    await debtApi.delete(id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const addPayment = async (
    data: Omit<DebtPayment, "id" | "created_at" | "updated_at">
  ): Promise<DebtPayment> => {
    const newPayment = await debtPaymentApi.create(data) as DebtPayment;
    setPayments((prev) => [...prev, newPayment]);
    
    // Update debt's paid amount
    const debt = debts.find(d => d.id === data.debt_id);
    if (debt) {
      setDebts(prev => prev.map(d => 
        d.id === data.debt_id 
          ? { ...d, paid_amount: d.paid_amount + data.amount }
          : d
      ));
    }
    
    return newPayment;
  };

  const updatePayment = async (
    id: string,
    data: Partial<DebtPayment>
  ): Promise<DebtPayment> => {
    const updated = await debtPaymentApi.update(id, data) as DebtPayment;
    setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePayment = async (id: string): Promise<void> => {
    const payment = payments.find(p => p.id === id);
    await debtPaymentApi.delete(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
    
    // Update debt's paid amount
    if (payment) {
      setDebts(prev => prev.map(d => 
        d.id === payment.debt_id 
          ? { ...d, paid_amount: Math.max(0, d.paid_amount - payment.amount) }
          : d
      ));
    }
  };

  const getDebtById = (id: string): Debt | undefined => {
    return debts.find((d) => d.id === id);
  };

  const getCreditorDebts = (): Debt[] => {
    return debts.filter((d) => d.creditor_id === user?.id);
  };

  const getDebtorDebts = (): Debt[] => {
    return debts.filter((d) => d.debtor_id === user?.id);
  };

  return (
    <DebtContext.Provider
      value={{
        debts,
        payments,
        loading,
        error,
        fetchDebts,
        fetchPayments,
        createDebt,
        updateDebt,
        deleteDebt,
        addPayment,
        updatePayment,
        deletePayment,
        getDebtById,
        getCreditorDebts,
        getDebtorDebts,
      }}
    >
      {children}
    </DebtContext.Provider>
  );
};

export const useDebt = () => {
  const context = useContext(DebtContext);
  if (context === undefined) {
    throw new Error("useDebt must be used within a DebtProvider");
  }
  return context;
};
