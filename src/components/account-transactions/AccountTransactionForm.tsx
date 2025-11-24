"use client";

import { useState } from "react";
import { AccountTransaction, CreateAccountTransactionForm, Account, Category } from "@/types";
import { accountTransactionApi } from "@/utils/apiClient";

interface AccountTransactionFormProps {
  onSuccess?: (transaction: AccountTransaction) => void;
  onCancel?: () => void;
  accounts: Account[];
  categories: Category[];
  currentUserId: string;
}

export default function AccountTransactionForm({
  onSuccess,
  onCancel,
  accounts,
  categories,
  currentUserId,
}: AccountTransactionFormProps) {
  const [formData, setFormData] = useState<CreateAccountTransactionForm>({
    user_id: currentUserId,
    account_id: "",
    transaction_type: "deposit",
    amount: 0,
    note: "",
    category_id: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Clean up empty fields
      const submitData = {
        ...formData,
        note: formData.note || undefined,
        category_id: formData.category_id || undefined,
      };

      const response = await accountTransactionApi.create(submitData) as AccountTransaction;
      onSuccess?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกรายการ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        เพิ่มรายการฝาก-ถอน
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 mb-1">
            บัญชี <span className="text-red-500">*</span>
          </label>
          <select
            id="account_id"
            name="account_id"
            value={formData.account_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">เลือกบัญชี</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.bank_name || "ไม่ระบุธนาคาร"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-700 mb-1">
            ประเภทรายการ <span className="text-red-500">*</span>
          </label>
          <select
            id="transaction_type"
            name="transaction_type"
            value={formData.transaction_type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="deposit">ฝากเงิน</option>
            <option value="withdraw">ถอนเงิน</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนเงิน <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            min="0.01"
            step="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            หมวดหมู่
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">เลือกหมวดหมู่ (ไม่บังคับ)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            หมายเหตุ
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>
    </div>
  );
}