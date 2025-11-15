'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface CategoryContextType {
  categories: {
    income: Category[];
    expense: Category[];
  };
  setCategories: React.Dispatch<React.SetStateAction<{
    income: Category[];
    expense: Category[];
  }>>;
  addCategory: (type: 'income' | 'expense', category: Omit<Category, 'id'>) => void;
  updateCategory: (type: 'income' | 'expense', categoryId: number, updates: Partial<Category>) => void;
  deleteCategory: (type: 'income' | 'expense', categoryId: number) => void;
  getCategoryById: (type: 'income' | 'expense', categoryId: number) => Category | undefined;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Default categories
const defaultCategories = {
  income: [
    { id: 1, name: 'เงินเดือน', icon: '💰', color: '#22c55e' },
    { id: 2, name: 'ธุรกิจ', icon: '💼', color: '#3b82f6' },
    { id: 3, name: 'เงินลงทุน', icon: '📈', color: '#8b5cf6' },
    { id: 4, name: 'อื่นๆ', icon: '💵', color: '#10b981' }
  ],
  expense: [
    { id: 1, name: 'อาหาร', icon: '🍽️', color: '#ef4444' },
    { id: 2, name: 'ค่าเดินทาง', icon: '🚗', color: '#f59e0b' },
    { id: 3, name: 'ช้อปปิ้ง', icon: '🛒', color: '#ec4899' },
    { id: 4, name: 'บันเทิง', icon: '🎬', color: '#8b5cf6' },
    { id: 5, name: 'ค่าใช้จ่ายบ้าน', icon: '🏠', color: '#06b6d4' },
    { id: 6, name: 'สุขภาพ', icon: '🏥', color: '#10b981' },
    { id: 7, name: 'การศึกษา', icon: '📚', color: '#3b82f6' },
    { id: 8, name: 'อื่นๆ', icon: '💳', color: '#6b7280' }
  ]
};

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState(defaultCategories);

  const addCategory = (type: 'income' | 'expense', category: Omit<Category, 'id'>) => {
    const newCategory = {
      ...category,
      id: Date.now() + Math.random() // Ensure unique ID
    };

    setCategories(prev => ({
      ...prev,
      [type]: [...prev[type], newCategory]
    }));
  };

  const updateCategory = (type: 'income' | 'expense', categoryId: number, updates: Partial<Category>) => {
    setCategories(prev => ({
      ...prev,
      [type]: prev[type].map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    }));
  };

  const deleteCategory = (type: 'income' | 'expense', categoryId: number) => {
    setCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(cat => cat.id !== categoryId)
    }));
  };

  const getCategoryById = (type: 'income' | 'expense', categoryId: number): Category | undefined => {
    return categories[type].find(cat => cat.id === categoryId);
  };

  const value = {
    categories,
    setCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}

// Hook สำหรับดึงข้อมูลหมวดหมู่แยกตามประเภท
export function useCategoriesByType(type: 'income' | 'expense') {
  const { categories } = useCategories();
  return categories[type];
}

// Hook สำหรับดึงข้อมูลหมวดหมู่ทั้งหมดในรูปแบบ options สำหรับ dropdown
export function useCategoryOptions() {
  const { categories } = useCategories();
  
  return {
    incomeOptions: categories.income.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon,
      color: cat.color
    })),
    expenseOptions: categories.expense.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon,
      color: cat.color
    }))
  };
}