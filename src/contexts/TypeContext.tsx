"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/utils/apiClient';
import { getStoredUser } from '@/utils/authStorage';

// API Response Type from backend
export interface TypeApiResponse {
  id: string;
  userId?: string;
  icon: string;
  color: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Internal Type interface (normalized)
export interface Type {
  id: string | number;
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active: boolean;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TypeFormData {
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active?: boolean;
}

interface TypeContextType {
  types: Type[];
  isLoading: boolean;
  error: string | null;
  refreshTypes: () => Promise<void>;
  addType: (data: TypeFormData) => Promise<void>;
  updateType: (id: string | number, data: TypeFormData) => Promise<void>;
  deleteType: (id: string | number) => Promise<void>;
}

const TypeContext = createContext<TypeContextType | undefined>(undefined);

// Helper function to normalize API response to internal format
const normalizeType = (apiType: TypeApiResponse): Type => ({
  id: apiType.id,
  name: apiType.name,
  icon: apiType.icon && apiType.icon.trim() !== '' ? apiType.icon : '📝',
  color: apiType.color && apiType.color.trim() !== '' ? apiType.color : '#3b82f6',
  description: apiType.description,
  is_active: apiType.isActive,
  user_id: apiType.userId,
  created_at: apiType.createdAt,
  updated_at: apiType.updatedAt,
});

export const useTypes = () => {
  const context = useContext(TypeContext);
  if (!context) {
    throw new Error('useTypes must be used within a TypeProvider');
  }
  return context;
};

interface TypeProviderProps {
  children: ReactNode;
}

export const TypeProvider: React.FC<TypeProviderProps> = ({ children }) => {
  const [types, setTypes] = useState<Type[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from stored user and load types immediately
  useEffect(() => {
    const storedUser = getStoredUser();
    console.log('TypeProvider mount - Stored User:', storedUser);
    
    if (storedUser?.id) {
      setUserId(storedUser.id as string);
      // Load types immediately when we have user
      refreshTypes();
    } else {
      console.log('TypeProvider - No user found on mount, will retry...');
      // Still try to load types in case user data becomes available
      setTimeout(() => refreshTypes(), 100);
      // Set longer timeout as fallback
      setTimeout(() => refreshTypes(), 1000);
    }
  }, []);

  const refreshTypes = async () => {
    setIsLoading(true);
    setError(null);
    
    // Always get fresh user data
    const storedUser = getStoredUser();
    const activeUserId = storedUser?.id as string | undefined;
    
    console.log('RefreshTypes - User ID:', activeUserId);
    console.log('RefreshTypes - Stored User:', storedUser);
    
    if (!activeUserId) {
      console.warn('No user ID available for fetching types');
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      setTypes([]);
      setIsLoading(false);
      return;
    }
    
    try {
      // ใช้เส้น /types/user/:userId เพื่อดึงข้อมูลเฉพาะของผู้ใช้งานคนนั้น
      const response = await apiClient.get<{
        items: TypeApiResponse[];
        meta: {
          limit: number;
          offset: number;
          page: number;
          total: number;
          totalPages: number;
        };
      }>(`/types/user/${activeUserId}`);
      
      console.log('Types API response:', response);
      
      const items = Array.isArray(response?.items) ? response.items : [];
      const typesData = items.map(normalizeType);
      console.log('Normalized types data:', typesData);
      
      setTypes(typesData);
    } catch (err) {
      console.error('Failed to fetch types:', err);
      setError('ไม่สามารถโหลดข้อมูลประเภทได้');
      
      // Set empty array on error - don't use mock data in production
      setTypes([]);
      
      // Optional: Add some default types for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using fallback types for development');
        const fallbackTypes: Type[] = [
          {
            id: 'dev-1',
            name: 'ทั่วไป',
            icon: '📝',
            color: '#3b82f6',
            description: 'ประเภททั่วไป',
            is_active: true,
            user_id: activeUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];
        setTypes(fallbackTypes);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addType = async (data: TypeFormData) => {
    const activeUserId = userId ?? (getStoredUser()?.id as string | undefined) ?? null;
    
    if (!activeUserId) {
      throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
    }

    try {
      // Convert to API format (camelCase)
      const payload = {
        name: data.name,
        icon: data.icon,
        color: data.color,
        description: data.description || '',
        isActive: data.is_active ?? true,
        userId: activeUserId,
      };
      
      console.log('Adding type with payload:', payload);
      
      const response = await apiClient.post<TypeApiResponse>('/types', payload);
      
      if (response) {
        const normalizedType = normalizeType(response);
        setTypes(prev => [...prev, normalizedType]);
      }
    } catch (err) {
      console.error('Failed to add type:', err);
      throw new Error('ไม่สามารถเพิ่มประเภทได้');
    }
  };

  const updateType = async (id: string | number, data: TypeFormData) => {
    try {
      // Convert to API format (camelCase)
      const payload = {
        name: data.name,
        icon: data.icon,
        color: data.color,
        description: data.description || '',
        isActive: data.is_active ?? true,
      };
      
      console.log('Updating type with payload:', payload);
      
      const response = await apiClient.patch<TypeApiResponse>(`/types/${id}`, payload);
      
      if (response) {
        const normalizedType = normalizeType(response);
        setTypes(prev => 
          prev.map(type => 
            String(type.id) === String(id) ? normalizedType : type
          )
        );
      }
    } catch (err) {
      console.error('Failed to update type:', err);
      throw new Error('ไม่สามารถอัปเดตประเภทได้');
    }
  };

  const deleteType = async (id: string | number) => {
    try {
      await apiClient.delete(`/types/${id}`);
      setTypes(prev => prev.filter(type => String(type.id) !== String(id)));
    } catch (err) {
      console.error('Failed to delete type:', err);
      throw new Error('ไม่สามารถลบประเภทได้');
    }
  };

  // Refresh types when userId changes (but not on initial mount since we handle that above)
  useEffect(() => {
    if (userId) {
      console.log('TypeProvider - userId changed, refreshing types:', userId);
      refreshTypes();
    }
  }, [userId]);

  // Force refresh function that bypasses state checks
  const forceRefresh = async () => {
    console.log('Force refresh types triggered');
    await refreshTypes();
  };

  const value: TypeContextType = {
    types,
    isLoading,
    error,
    refreshTypes: forceRefresh,
    addType,
    updateType,
    deleteType,
  };

  return (
    <TypeContext.Provider value={value}>
      {children}
    </TypeContext.Provider>
  );
};