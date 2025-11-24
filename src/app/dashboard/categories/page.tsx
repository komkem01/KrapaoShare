"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCategories, Category } from '@/contexts/CategoryContext';
import { TRANSACTION_TYPES } from '@/constants/types';
import { apiClient } from '@/utils/apiClient';
import { toast } from '@/utils/toast';

const CategoriesPage: React.FC = () => {
  const {
    categories,
    isLoading,
    error,
    refreshCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  // Available transaction types (constant)
  const transactionTypes = [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE];

  // Helper function to get type info from type_id
  const getTypeInfo = (typeId: string | undefined) => {
    if (!typeId) return null;
    return transactionTypes.find(t => t.id === typeId);
  };

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '💰',
    color: '#22c55e',
    type_id: '',
  });

  const predefinedIcons = [
    '💰', '💼', '📈', '💵', '🍽️', '🚗', '🛒', '🎬',
    '🏠', '🏥', '📚', '💳', '🎯', '⚡', '🎁', '🏃‍♂️',
    '📱', '✈️', '🎵', '👕', '🎨', '⚽', '🎮', '📷',
  ];

  const predefinedColors = [
    '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b',
    '#ec4899', '#06b6d4', '#10b981', '#6b7280', '#f97316',
  ];

  // Filter categories
  const filteredCategories = {
    income: categories.income.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    expense: categories.expense.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  };

  const handleAddCategory = (type: 'income' | 'expense') => {
    setModalType(type);
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      icon: type === 'income' ? '💰' : '💳',
      color: type === 'income' ? '#22c55e' : '#ef4444',
      type_id: '',
    });
    setShowModal(true);
  };

  const handleEditCategory = (category: Category, type: 'income' | 'expense') => {
    setModalType(type);
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type_id: category.type_id || '',
    });
    setShowModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    setIsSaving(true);

    try {
      if (editingCategory) {
        await updateCategory(modalType, editingCategory.id, categoryForm);
        toast.success('แก้ไขหมวดหมู่สำเร็จ', `แก้ไขหมวดหมู่ "${categoryForm.name}" เรียบร้อยแล้ว`);
      } else {
        await addCategory(modalType, categoryForm);
        toast.success('เพิ่มหมวดหมู่สำเร็จ', `เพิ่มหมวดหมู่ "${categoryForm.name}" เรียบร้อยแล้ว`);
      }

      setShowModal(false);
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        icon: '💰',
        color: '#22c55e',
        type_id: '',
      });
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('เกิดข้อผิดพลาด', error instanceof Error ? error.message : 'ไม่สามารถบันทึกหมวดหมู่ได้');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, type: 'income' | 'expense') => {
    const category = categories[type].find(cat => cat.id === categoryId);
    if (!category) return;

    const confirmMessage = `ต้องการลบหมวดหมู่ "${category.name}" หรือไม่?\n\n⚠️ หมวดหมู่ที่ถูกลบจะไม่สามารถกู้คืนได้`;
    
    if (!confirm(confirmMessage)) return;

    setIsSaving(true);
    try {
      await deleteCategory(type, categoryId);
      toast.success('ลบหมวดหมู่สำเร็จ', `ลบหมวดหมู่ "${category.name}" เรียบร้อยแล้ว`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('เกิดข้อผิดพลาด', error instanceof Error ? error.message : 'ไม่สามารถลบหมวดหมู่ได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              จัดการหมวดหมู่
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการหมวดหมู่รายรับและรายจ่ายของคุณ
            </p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <span className="text-lg">✅</span>
            <span className="font-medium">บันทึกข้อมูลสำเร็จ!</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาหมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  หมวดหมู่ทั้งหมด
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.income.length + categories.expense.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-xl">📁</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รายรับ
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {categories.income.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รายจ่าย
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {categories.expense.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <span>💰</span>
                <span>หมวดหมู่รายรับ</span>
                <span className="text-sm text-gray-500">({filteredCategories.income.length})</span>
              </h2>
              <button
                onClick={() => handleAddCategory('income')}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors text-sm"
              >
                <span>➕</span>
                <span>เพิ่ม</span>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCategories.income.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'ไม่พบหมวดหมู่ที่ค้นหา' : 'ยังไม่มีหมวดหมู่รายรับ'}
                </div>
              ) : (
                filteredCategories.income.map((category) => (
                  <div
                    key={category.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </p>
                          {category.type_id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getTypeInfo(category.type_id)?.icon}{' '}
                              {getTypeInfo(category.type_id)?.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCategory(category, 'income')}
                          disabled={isSaving}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs disabled:opacity-50 dark:bg-blue-900 dark:text-blue-300"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, 'income')}
                          disabled={isSaving}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <span>💳</span>
                <span>หมวดหมู่รายจ่าย</span>
                <span className="text-sm text-gray-500">({filteredCategories.expense.length})</span>
              </h2>
              <button
                onClick={() => handleAddCategory('expense')}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors text-sm"
              >
                <span>➕</span>
                <span>เพิ่ม</span>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCategories.expense.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'ไม่พบหมวดหมู่ที่ค้นหา' : 'ยังไม่มีหมวดหมู่รายจ่าย'}
                </div>
              ) : (
                filteredCategories.expense.map((category) => (
                  <div
                    key={category.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </p>
                          {category.type_id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getTypeInfo(category.type_id)?.icon}{' '}
                              {getTypeInfo(category.type_id)?.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCategory(category, 'expense')}
                          disabled={isSaving}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs disabled:opacity-50 dark:bg-blue-900 dark:text-blue-300"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, 'expense')}
                          disabled={isSaving}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Category Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div
                  className={`relative px-6 py-4 ${
                    modalType === 'income'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{modalType === 'income' ? '💰' : '💳'}</span>
                      <h3 className="text-lg font-semibold text-white">
                        {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
                        {modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อหมวดหมู่ *
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="กรอกชื่อหมวดหมู่"
                        required
                      />
                    </div>

                    {/* Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ประเภท
                      </label>
                      <select
                        value={categoryForm.type_id}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            type_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">ไม่ระบุประเภท</option>
                        {transactionTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.icon} {type.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        เลือกประเภทเพื่อจัดกลุ่มหมวดหมู่ (เลือก รายรับ หรือ รายจ่าย)
                      </p>
                    </div>

                    {/* Icon Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ไอคอน
                      </label>
                      <div className="grid grid-cols-8 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-xl max-h-32 overflow-y-auto">
                        {predefinedIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() =>
                              setCategoryForm({ ...categoryForm, icon })
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              categoryForm.icon === icon
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        สี
                      </label>
                      <div className="grid grid-cols-5 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() =>
                              setCategoryForm({ ...categoryForm, color })
                            }
                            className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                              categoryForm.color === color
                                ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800'
                                : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ตัวอย่าง:
                      </p>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: categoryForm.color + '20',
                            color: categoryForm.color,
                          }}
                        >
                          <span className="text-lg">{categoryForm.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {categoryForm.name || 'ชื่อหมวดหมู่'}
                          </p>
                          {categoryForm.type_id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getTypeInfo(categoryForm.type_id)?.icon}{' '}
                              {getTypeInfo(categoryForm.type_id)?.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveCategory}
                      disabled={isSaving || !categoryForm.name.trim()}
                      className={`flex-1 px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed ${
                        modalType === 'income'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500'
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500'
                      }`}
                    >
                      {isSaving ? 'กำลังบันทึก...' : editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
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
};

export default CategoriesPage;
