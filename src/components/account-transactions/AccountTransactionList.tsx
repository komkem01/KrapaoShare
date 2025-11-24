"use client";

import { useState, useEffect } from "react";
import { AccountTransaction, Account, Category } from "@/types";
import { accountTransactionApi } from "@/utils/apiClient";
import { toast } from "@/utils/toast";

interface AccountTransactionListProps {
  currentUserId: string;
  accounts: Account[];
  categories: Category[];
}

export default function AccountTransactionList({
  currentUserId,
  accounts,
  categories,
}: AccountTransactionListProps) {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    account_id: "",
    transaction_type: "" as "" | "deposit" | "withdraw",
    category_id: "",
  });

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filterParams = {
        user_id: currentUserId,
        ...filters,
        // Remove empty filters
        account_id: filters.account_id || undefined,
        transaction_type: filters.transaction_type || undefined,
        category_id: filters.category_id || undefined,
      };

      const response = await accountTransactionApi.list(filterParams) as {
        data: AccountTransaction[];
        total: number;
      };
      
      setTransactions(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentUserId, filters]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบรายการนี้หรือไม่?")) {
      return;
    }

    try {
      await accountTransactionApi.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("ลบรายการสำเร็จ", "ลบรายการฝาก-ถอนเรียบร้อยแล้ว");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด", err instanceof Error ? err.message : "ไม่สามารถลบรายการได้");
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.name} (${account.bank_name || "ไม่ระบุธนาคาร"})` : "ไม่พบบัญชี";
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "ไม่ระบุหมวดหมู่";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "ไม่พบหมวดหมู่";
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          รายการฝาก-ถอน
        </h2>
        <button
          onClick={loadTransactions}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          รีเฟรช
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="filter-account" className="block text-sm font-medium text-gray-700 mb-1">
            กรองตามบัญชี
          </label>
          <select
            id="filter-account"
            name="account_id"
            value={filters.account_id}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">บัญชีทั้งหมด</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.bank_name || "ไม่ระบุธนาคาร"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">
            กรองตามประเภท
          </label>
          <select
            id="filter-type"
            name="transaction_type"
            value={filters.transaction_type}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ประเภททั้งหมด</option>
            <option value="deposit">ฝากเงิน</option>
            <option value="withdraw">ถอนเงิน</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700 mb-1">
            กรองตามหมวดหมู่
          </label>
          <select
            id="filter-category"
            name="category_id"
            value={filters.category_id}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">หมวดหมู่ทั้งหมด</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          ไม่มีรายการฝาก-ถอน
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่/เวลา
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บัญชี
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวนเงิน
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หมวดหมู่
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หมายเหตุ
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {getAccountName(transaction.account_id)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.transaction_type === "deposit"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.transaction_type === "deposit" ? "ฝากเงิน" : "ถอนเงิน"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <span
                      className={
                        transaction.transaction_type === "deposit"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {transaction.transaction_type === "deposit" ? "+" : "-"}
                      {formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {getCategoryName(transaction.category_id)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {transaction.note || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}