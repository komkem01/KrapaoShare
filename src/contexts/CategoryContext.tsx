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

interface TypeRecord {
  id: string;
  name: string;
}

interface TypeListResponse {
  items: TypeRecord[];
}

interface TypeMetadata {
  loaded: boolean;
  byId: Record<string, string>;
  groupByTypeId: Record<string, CategoryGroup | null>;
  typeIdByGroup: Partial<Record<CategoryGroup, string>>;
}

const defaultTypeMetadata: TypeMetadata = {
  loaded: false,
  byId: {},
  groupByTypeId: {},
  typeIdByGroup: {},
};

// Keywords for detecting category groups
const incomeKeywords = ['รายรับ', 'income', 'revenue', 'เงินเดือน', 'salary', 'เงินได้'];
const expenseKeywords = ['รายจ่าย', 'expense', 'cost', 'ค่าใช้จ่าย', 'spending'];

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type_id: string; // ประเภทที่ผู้ใช้สร้าง (required)
  type_name?: string; // ชื่อประเภท (สำหรับแสดงผล)
  user_id?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

// Categories grouped by type ID
interface CategoriesByType {
  [typeId: string]: Category[];
}

interface CategoryContextType {
  categories: CategoryState; // หมวดหมู่แบบเก่า สำหรับ backward compatibility
  categoriesByType: CategoriesByType; // หมวดหมู่จัดกลุ่มตาม Type ID
  allCategories: Category[]; // หมวดหมู่ทั้งหมด
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  addCategory: (type: CategoryGroup, category: Omit<Category, 'id' | 'type_id'>) => Promise<void>;
  updateCategory: (type: CategoryGroup, categoryId: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (type: CategoryGroup, categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoriesByTypeId: (typeId: string) => Category[];
}

interface ApiCategory {
  id: string;
  typeId: string;
  userId?: string;
  icon?: string;
  color?: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
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

const detectGroupFromName = (name?: string): CategoryGroup | null => {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (incomeKeywords.some((keyword) => lower.includes(keyword))) {
    return 'income';
  }
  if (expenseKeywords.some((keyword) => lower.includes(keyword))) {
    return 'expense';
  }
  return null;
};

const ensureArray = <T,>(payload: T | { items?: T[] } | undefined): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as { items?: T[] }).items)) {
    return (payload as { items?: T[] }).items ?? [];
  }
  return [];
};

const mapApiCategoryToLocal = (item: ApiCategory, group: CategoryGroup): Category => ({
  id: item.id,
  name: item.name,
  icon: item.icon ?? (group === 'income' ? '💰' : '💳'),
  color: item.color ?? (group === 'income' ? '#22c55e' : '#ef4444'),
  type_id: item.typeId, // Map typeId to type_id
});

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryState>({
    income: [],
    expense: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [categoryMeta, setCategoryMeta] = useState<Record<string, ApiCategory>>({});
  const [typeMetadata, setTypeMetadata] = useState<TypeMetadata>(defaultTypeMetadata);
  const categoriesLoadedRef = useRef(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser?.id) {
      setUserId(storedUser.id as string);
    }
  }, []);

  const resolveGroupForType = (typeId: string, meta: TypeMetadata): CategoryGroup | null => {
    if (meta.groupByTypeId[typeId]) {
      return meta.groupByTypeId[typeId] ?? null;
    }

    const name = meta.byId[typeId];
    const detected = detectGroupFromName(name);
    if (detected) {
      setTypeMetadata((prev) => ({
        ...prev,
        groupByTypeId: { ...prev.groupByTypeId, [typeId]: detected },
        typeIdByGroup: {
          ...prev.typeIdByGroup,
          [detected]: prev.typeIdByGroup[detected] ?? typeId,
        },
      }));
    }
    return detected;
  };

  const ensureTypeMetadata = useCallback(async (): Promise<TypeMetadata> => {
    const activeUserId = userId ?? (getStoredUser()?.id as string | undefined) ?? null;
    
    if (!activeUserId) {
      console.warn('No user ID available for fetching types');
      const next = { ...typeMetadata, loaded: true };
      setTypeMetadata(next);
      return next;
    }

    setTypeMetadata((current) => {
      if (current.loaded && Object.keys(current.byId).length) {
        return current;
      }
      return current;
    });

    // Get current state for reference
    const currentMeta = typeMetadata;
    if (currentMeta.loaded && Object.keys(currentMeta.byId).length) {
      return currentMeta;
    }

    try {
      // ใช้เส้น /types/user/:userId เพื่อดึงข้อมูลเฉพาะของผู้ใช้งานคนนั้น
      const response = await apiClient.get<TypeRecord[] | TypeListResponse>(`/types/user/${activeUserId}`);
      
      // Handle both array response and object with items
      let items: TypeRecord[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && 'items' in response && Array.isArray(response.items)) {
        items = response.items;
      }
      
      const byId: Record<string, string> = {};
      const groupByTypeId: Record<string, CategoryGroup | null> = {};
      const typeIdByGroup: Partial<Record<CategoryGroup, string>> = {};

      items.forEach((item) => {
        byId[item.id] = item.name;
        const detected = detectGroupFromName(item.name);
        groupByTypeId[item.id] = detected;
        if (detected && !typeIdByGroup[detected]) {
          typeIdByGroup[detected] = item.id;
        }
      });

      const next: TypeMetadata = {
        loaded: true,
        byId: { ...currentMeta.byId, ...byId },
        groupByTypeId: { ...currentMeta.groupByTypeId, ...groupByTypeId },
        typeIdByGroup: { ...currentMeta.typeIdByGroup, ...typeIdByGroup },
      };
      setTypeMetadata(next);
      return next;
    } catch (err) {
      console.warn('Failed to load category types', err);
      const next = { ...currentMeta, loaded: true };
      setTypeMetadata(next);
      return next;
    }
  }, [userId]);

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
      const typeMeta = await ensureTypeMetadata();
      
      // ใช้เส้น /categories/user/:userId เพื่อดึงข้อมูลเฉพาะของผู้ใช้งานคนนั้น
      const response = await apiClient.get<CategoryListResponse | ApiCategory[]>(`/categories/user/${activeUserId}`);
      
      // Handle both array response and object with items
      let remoteCategories: ApiCategory[] = [];
      if (Array.isArray(response)) {
        remoteCategories = response;
      } else if (response && 'items' in response && Array.isArray(response.items)) {
        remoteCategories = response.items;
      }

      if (remoteCategories.length === 0) {
        console.warn('No categories found for user, setting empty state');
        setCategories({ income: [], expense: [] });
        setCategoryMeta({});
        categoriesLoadedRef.current = true;
        return;
      }

      const grouped: CategoryState = { income: [], expense: [] };
      const metaMap: Record<string, ApiCategory> = {};

      remoteCategories.forEach((item) => {
        const group =
          resolveGroupForType(item.typeId, typeMeta) ||
          (Object.entries(typeMeta.typeIdByGroup).find(([, id]) => id === item.typeId)?.[0] as CategoryGroup | undefined) ||
          detectGroupFromName(item.name);

        if (!group) {
          console.warn(`Could not determine group for category: ${item.name}`);
          return;
        }

        grouped[group].push(mapApiCategoryToLocal(item, group));
        metaMap[item.id] = item;
      });

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
  }, [userId, ensureTypeMetadata]);  useEffect(() => {
    refreshCategories().catch((err) => {
      console.warn('Initial category fetch failed', err);
    });
  }, [userId]);

  const resolveTypeIdForGroup = useCallback(
    async (group: CategoryGroup): Promise<string | null> => {
      const meta = await ensureTypeMetadata();
      if (meta.typeIdByGroup[group]) {
        return meta.typeIdByGroup[group] ?? null;
      }

      const candidate = Object.entries(meta.groupByTypeId).find(([, value]) => value === group)?.[0];
      if (candidate) {
        setTypeMetadata((prev) => ({
          ...prev,
          typeIdByGroup: { ...prev.typeIdByGroup, [group]: candidate },
        }));
        return candidate;
      }
      return null;
    },
    [ensureTypeMetadata]
  );

  const addCategory = useCallback<
    CategoryContextType['addCategory']
  >(
    async (type, category) => {
      const tempId = generateCategoryId();
      
      // Get type_id for this category group
      const typeId = await resolveTypeIdForGroup(type);
      if (!typeId) {
        throw new Error(`ไม่พบประเภทสำหรับหมวดหมู่ ${type}`);
      }

      const optimistic: Category = {
        id: tempId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type_id: typeId,
      };

      setCategories((prev) => ({
        ...prev,
        [type]: [...prev[type], optimistic],
      }));

      if (!userId) {
        return;
      }

      try {
        const typeId = await resolveTypeIdForGroup(type);
        if (!typeId) {
          throw new Error(`ไม่พบประเภทสำหรับหมวดหมู่ ${type}`);
        }

        const payload = {
          typeId,
          userId,
          icon: category.icon,
          color: category.color,
          name: category.name.trim(),
          description: undefined,
          isActive: true,
          sortOrder: 999, // Use high number instead of depending on current length
        };

        const created = await apiClient.post<ApiCategory>('/categories', payload);
        setCategoryMeta((prev) => ({ ...prev, [created.id]: created }));
        setCategories((prev) => ({
          ...prev,
          [type]: prev[type].map((cat) =>
            cat.id === tempId
              ? mapApiCategoryToLocal(created, type)
              : cat
          ),
        }));
      } catch (err) {
        console.error('Failed to create category', err);
        setCategories((prev) => ({
          ...prev,
          [type]: prev[type].filter((cat) => cat.id !== tempId),
        }));
        setError((err as Error).message ?? 'ไม่สามารถสร้างหมวดหมู่ได้');
      }
    },
    [resolveTypeIdForGroup, userId]
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
          description: existingMeta?.description,
          isActive: existingMeta?.isActive ?? true,
          sortOrder: existingMeta?.sortOrder ?? 0,
        };

        const updated = await apiClient.patch<ApiCategory>(`/categories/${categoryId}`, payload);
        setCategoryMeta((prev) => ({ ...prev, [categoryId]: updated }));
      } catch (err) {
        console.error('Failed to update category', err);
        setError((err as Error).message ?? 'ไม่สามารถอัปเดตหมวดหมู่ได้');
        refreshCategories();
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
      } catch (err) {
        console.error('Failed to delete category', err);
        setCategories((prev) => ({
          ...prev,
          [type]: previousCategories,
        }));
        setError((err as Error).message ?? 'ไม่สามารถลบหมวดหมู่ได้');
      }
    },
    [userId]
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

  const getCategoriesByTypeId = useCallback<CategoryContextType['getCategoriesByTypeId']>(
    (typeId) => {
      return [...categories.income, ...categories.expense].filter(cat => cat.type_id === typeId);
    },
    [categories]
  );

  // Create categoriesByType and allCategories for new API
  const categoriesByType: CategoriesByType = {};
  const allCategories = [...categories.income, ...categories.expense];
  
  allCategories.forEach(category => {
    if (!categoriesByType[category.type_id]) {
      categoriesByType[category.type_id] = [];
    }
    categoriesByType[category.type_id].push(category);
  });

  const value: CategoryContextType = {
    categories,
    categoriesByType,
    allCategories,
    isLoading,
    error,
    refreshCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByTypeId,
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