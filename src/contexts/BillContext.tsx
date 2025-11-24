"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { billApi, billParticipantApi } from "@/utils/apiClient";
import { useUser } from "./UserContext";

export type Bill = {
  id: string;
  user_id: string;
  title: string;
  total_amount: number;
  description?: string;
  bill_date?: string;
  due_date?: string;
  status: "pending" | "settled" | "cancelled";
  settled_at?: string;
  created_at: string;
  updated_at: string;
};

export type BillParticipant = {
  id: string;
  bill_id: string;
  user_id: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
};

type BillContextType = {
  bills: Bill[];
  participants: BillParticipant[];
  loading: boolean;
  error: string | null;
  fetchBills: () => Promise<void>;
  fetchParticipants: (billId?: string) => Promise<void>;
  createBill: (data: Omit<Bill, "id" | "created_at" | "updated_at" | "status">) => Promise<Bill>;
  updateBill: (id: string, data: Partial<Bill>) => Promise<Bill>;
  deleteBill: (id: string) => Promise<void>;
  addParticipant: (data: Omit<BillParticipant, "id" | "created_at" | "updated_at" | "is_paid" | "paid_at" | "user_name" | "user_email">) => Promise<BillParticipant>;
  updateParticipant: (id: string, data: Partial<BillParticipant>) => Promise<BillParticipant>;
  removeParticipant: (id: string) => Promise<void>;
  getBillById: (id: string) => Bill | undefined;
};

const BillContext = createContext<BillContextType | undefined>(undefined);

export const BillProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [bills, setBills] = useState<Bill[]>([]);
  const [participants, setParticipants] = useState<BillParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    if (!user?.id) {
      setBills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await billApi.list({ user_id: user.id });
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
      setError(err instanceof Error ? err.message : "Failed to load bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchParticipants = useCallback(async (billId?: string) => {
    try {
      const data = billId
        ? await billParticipantApi.getByBill(billId)
        : await billParticipantApi.list();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
      setParticipants([]);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const createBill = async (
    data: Omit<Bill, "id" | "created_at" | "updated_at" | "status" | "settled_at">
  ): Promise<Bill> => {
    if (!user?.id) throw new Error("User not authenticated");

    const newBill = await billApi.create({
      user_id: user.id,
      title: data.title,
      total_amount: data.total_amount,
      description: data.description,
      bill_date: data.bill_date,
      due_date: data.due_date,
    }) as Bill;

    setBills((prev) => [...prev, newBill]);
    return newBill;
  };

  const updateBill = async (id: string, data: Partial<Bill>): Promise<Bill> => {
    const updated = await billApi.update(id, {
      title: data.title,
      total_amount: data.total_amount,
      description: data.description,
      bill_date: data.bill_date,
      due_date: data.due_date,
      status: data.status,
      settled_at: data.settled_at,
    }) as Bill;
    setBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const deleteBill = async (id: string): Promise<void> => {
    await billApi.delete(id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const addParticipant = async (
    data: Omit<BillParticipant, "id" | "created_at" | "updated_at" | "is_paid" | "paid_at" | "user_name" | "user_email">
  ): Promise<BillParticipant> => {
    const newParticipant = await billParticipantApi.create({
      bill_id: data.bill_id,
      user_id: data.user_id,
      amount: data.amount,
    }) as BillParticipant;
    setParticipants((prev) => [...prev, newParticipant]);
    return newParticipant;
  };

  const updateParticipant = async (
    id: string,
    data: Partial<BillParticipant>
  ): Promise<BillParticipant> => {
    const updated = await billParticipantApi.update(id, {
      amount: data.amount,
      is_paid: data.is_paid,
      paid_at: data.paid_at,
    }) as BillParticipant;
    setParticipants((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const removeParticipant = async (id: string): Promise<void> => {
    await billParticipantApi.delete(id);
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const getBillById = (id: string): Bill | undefined => {
    return bills.find((b) => b.id === id);
  };

  return (
    <BillContext.Provider
      value={{
        bills,
        participants,
        loading,
        error,
        fetchBills,
        fetchParticipants,
        createBill,
        updateBill,
        deleteBill,
        addParticipant,
        updateParticipant,
        removeParticipant,
        getBillById,
      }}
    >
      {children}
    </BillContext.Provider>
  );
};

export const useBill = () => {
  const context = useContext(BillContext);
  if (context === undefined) {
    throw new Error("useBill must be used within a BillProvider");
  }
  return context;
};
