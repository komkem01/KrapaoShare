'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { apiClient } from '@/utils/apiClient';
import { getStoredUser } from '@/utils/authStorage';

// Basic types and constants
type CategoryGroup = 'income' | 'expense';

interface CategoryState {
  income: Category[];
  expense: Category[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense'; // ประเภทหมวดหมู่ (รายรับ/รายจ่าย) จาก Backend
  type_id?: string; // ประเภทเพิ่มเติม (optional) - foreign key to types table
  user_id?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

interface CategoryContextType {
  categories: CategoryState; // หมวดหมู่แยกตาม income/expense
  allCategories: Category[]; // หมวดหมู่ทั้งหมด
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  addCategory: (type: CategoryGroup, category: Omit<Category, 'id' | 'type'>) => Promise<void>;
  updateCategory: (type: CategoryGroup, categoryId: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (type: CategoryGroup, categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
}

interface ApiCategory {
  id: string;
  typeId?: string; // Backend ส่งมาเป็น camelCase
  user_id?: string;
  userId?: string;
  icon?: string;
  color?: string;
  name: string;
  type?: 'income' | 'expense'; // Backend อาจไม่ส่ง ต้องหาจาก typeId
  type_id?: string; // ประเภทเพิ่มเติม (optional)
  description?: string;
  is_active?: boolean;
  isActive?: boolean;
}

interface CategoryListResponse {
  items?: ApiCategory[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const generateCategoryId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

const mapApiCategoryToLocal = (item: ApiCategory): Category | null => {
  // Normalize fields (Backend อาจส่งมาเป็น camelCase หรือ snake_case)
  const typeId = item.typeId || item.type_id;
  const userId = item.userId || item.user_id;
  const isActive = item.isActive ?? item.is_active ?? true;
  
  // ต้องมี typeId เพื่อกำหนด type (income/expense)
  if (!typeId) {
    console.warn('[CategoryContext] Category missing typeId:', item);
    return null;
  }
  
  // กำหนด type จาก item.type ถ้ามี หรือต้องหาจาก typeId
  let categoryType: 'income' | 'expense';
  
  if (item.type === 'income' || item.type === 'expense') {
    categoryType = item.type;
  } else {
    // Backend ไม่ส่ง type มา ต้องหาจาก external source
    // จะต้อง inject types array เข้ามา หรือ hardcode
    console.warn('[CategoryContext] Cannot determine type from typeId:', typeId);
    // ใช้ค่า default เป็น expense
    categoryType = 'expense';
  }
  
  return {
    id: item.id,
    name: item.name,
    type: categoryType,
    type_id: typeId,
    icon: item.icon ?? (categoryType === 'income' ? '💰' : '💳'),
    color: item.color ?? (categoryType === 'income' ? '#22c55e' : '#ef4444'),
    user_id: userId,
    description: item.description,
    is_active: isActive,
  };
};

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryState>({
    income: [],
    expense: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [categoryMeta, setCategoryMeta] = useState<Record<string, ApiCategory>>({});
  const categoriesLoadedRef = useRef(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser?.id) {
      setUserId(storedUser.id as string);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    const activeUserId = userId ?? (getStoredUser()?.id as string | undefined) ?? null;
    if (!activeUserId) {
      console.warn('No user ID available, clearing categories');
      setCategories({ income: [], expense: [] });
      setUserId(null);
      return;
    }

    setUserId(activeUserId);
    setIsLoading(true);
    setError(null);

    try {
      
      console.log('[CategoryContext] Loading categories for user:', activeUserId);
      
      // ใช้เส้น /categories/user/:userId เพื่อดึงข้อมูลเฉพาะของผู้ใช้งานคนนั้น
      const response = await apiClient.get<CategoryListResponse | ApiCategory[]>(`/categories/user/${activeUserId}`);
      console.log('[CategoryContext] Raw API response:', response);
      
      // Handle both array response and object with items
      let remoteCategories: ApiCategory[] = [];
      if (Array.isArray(response)) {
        remoteCategories = response;
      } else if (response && 'items' in response && Array.isArray(response.items)) {
        remoteCategories = response.items;
      }
      
      console.log('[CategoryContext] Parsed categories:', remoteCategories);

      if (remoteCategories.length === 0) {
        console.warn('[CategoryContext] No categories found for user, setting empty state');
        setCategories({ income: [], expense: [] });
        setCategoryMeta({});
        categoriesLoadedRef.current = true;
        return;
      }

      const grouped: CategoryState = { income: [], expense: [] };
      const metaMap: Record<string, ApiCategory> = {};

      remoteCategories.forEach((item) => {
        const mapped = mapApiCategoryToLocal(item);
        
        if (!mapped) {
          console.warn('[CategoryContext] Failed to map category:', item);
          return;
        }
        
        const group = mapped.type; // 'income' หรือ 'expense'
        console.log('[CategoryContext] Processing category:', mapped.name, 'type:', mapped.type);

        grouped[group].push(mapped);
        metaMap[item.id] = item;
      });
      
      console.log('[CategoryContext] Final grouped categories:', grouped);

      setCategories(grouped);
      setCategoryMeta(metaMap);
      categoriesLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load categories', err);
      setError((err as Error).message ?? 'ไม่สามารถโหลดหมวดหมู่ได้');
      if (!categoriesLoadedRef.current) {
        setCategories({ income: [], expense: [] });
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshCategories().catch((err) => {
      console.warn('Initial category fetch failed', err);
    });
  }, [userId, refreshCategories]);

  const addCategory = useCallback<
    CategoryContextType['addCategory']
  >(
    async (type, category) => {
      const tempId = generateCategoryId();

      const optimistic: Category = {
        id: tempId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: type, // income หรือ expense
      };

      setCategories((prev) => ({
        ...prev,
        [type]: [...prev[type], optimistic],
      }));

      if (!userId) {
        return;
      }

      try {
        const payload = {
          user_id: userId,
          type: type, // ส่ง income หรือ expense
          icon: category.icon,
          color: category.color,
          name: category.name.trim(),
          is_active: true,
          // ส่ง type_id เป็น null ถ้าเป็น empty string หรือ undefined
          type_id: category.type_id && category.type_id.trim() !== '' ? category.type_id : null,
        };

        const created = await apiClient.post<ApiCategory>('/categories', payload);
        setCategoryMeta((prev) => ({ ...prev, [created.id]: created }));
        setCategories((prev) => ({
          ...prev,
          [type]: prev[type].map((cat) =>
            cat.id === tempId
              ? mapApiCategoryToLocal(created)
              : cat
          ),
        }));
        
        // Refresh to sync with backend
        await refreshCategories();
      } catch (err) {
        console.error('Failed to create category', err);
        setCategories((prev) => ({
          ...prev,
          [type]: prev[type].filter((cat) => cat.id !== tempId),
        }));
        setError((err as Error).message ?? 'ไม่สามารถสร้างหมวดหมู่ได้');
        throw err;
      }
    },
    [userId, refreshCategories]
  );

  const updateCategory = useCallback<
    CategoryContextType['updateCategory']
  >(
    async (type, categoryId, updates) => {
      let currentCategory: Category | undefined;
      setCategories((prev) => {
        currentCategory = prev[type].find((cat) => cat.id === categoryId);
        if (!currentCategory) return prev;
        
        return {
          ...prev,
          [type]: prev[type].map((cat) =>
            cat.id === categoryId ? { ...cat, ...updates } : cat
          ),
        };
      });

      if (!currentCategory || !userId) {
        return;
      }

      const existingMeta = categoryMeta[categoryId];

      try {
        const payload = {
          name: (updates.name ?? currentCategory.name).trim(),
          icon: updates.icon ?? existingMeta?.icon,
          color: updates.color ?? existingMeta?.color,
          type: updates.type ?? existingMeta?.type ?? currentCategory.type,
          is_active: existingMeta?.is_active ?? true,
          // ส่ง type_id เป็น null ถ้าเป็น empty string หรือ undefined
          type_id: updates.type_id !== undefined 
            ? (updates.type_id && updates.type_id.trim() !== '' ? updates.type_id : null)
            : (existingMeta?.type_id || null),
        };

        const updated = await apiClient.patch<ApiCategory>(`/categories/${categoryId}`, payload);
        setCategoryMeta((prev) => ({ ...prev, [categoryId]: updated }));
        
        // Refresh to sync with backend
        await refreshCategories();
      } catch (err) {
        console.error('Failed to update category', err);
        setError((err as Error).message ?? 'ไม่สามารถอัปเดตหมวดหมู่ได้');
        await refreshCategories();
        throw err;
      }
    },
    [categoryMeta, refreshCategories, userId]
  );

  const deleteCategory = useCallback<
    CategoryContextType['deleteCategory']
  >(
    async (type, categoryId) => {
      let previousCategories: Category[] = [];
      setCategories((prev) => {
        previousCategories = prev[type];
        return {
          ...prev,
          [type]: prev[type].filter((cat) => cat.id !== categoryId),
        };
      });

      if (!userId) {
        return;
      }

      try {
        await apiClient.delete(`/categories/${categoryId}`);
        setCategoryMeta((prev) => {
          const next = { ...prev };
          delete next[categoryId];
          return next;
        });
        
        // Refresh to sync with backend
        await refreshCategories();
      } catch (err) {
        console.error('Failed to delete category', err);
        setCategories((prev) => ({
          ...prev,
          [type]: previousCategories,
        }));
        setError((err as Error).message ?? 'ไม่สามารถลบหมวดหมู่ได้');
        throw err;
      }
    },
    [userId, refreshCategories]
  );

  const getCategoryById = useCallback<CategoryContextType['getCategoryById']>(
    (categoryId) => {
      // Search in all categories
      for (const category of [...categories.income, ...categories.expense]) {
        if (category.id === categoryId) {
          return category;
        }
      }
      return undefined;
    },
    [categories]
  );

  // Create allCategories for easy access
  const allCategories = [...categories.income, ...categories.expense];

  const value: CategoryContextType = {
    categories,
    allCategories,
    isLoading,
    error,
    refreshCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
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

export function useCategoriesByType(type: CategoryGroup) {
  const { categories } = useCategories();
  return categories[type];
}

export function useCategoryOptions() {
  const { categories } = useCategories();
  return {
    incomeOptions: categories.income.map((cat) => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon,
      color: cat.color,
    })),
    expenseOptions: categories.expense.map((cat) => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon,
      color: cat.color,
    })),
  };
}