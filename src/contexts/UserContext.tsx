'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { apiClient } from '@/utils/apiClient';
import { getStoredUser, setStoredUser, clearAuthData } from '@/utils/authStorage';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ลองดึงจาก localStorage ก่อน
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser as User);
      }

      // ดึงข้อมูลล่าสุดจาก API
      const userData = await apiClient.get<User>('/auth/me');
      setUser(userData);
      setStoredUser(userData as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
      
      // หากเกิดข้อผิดพลาดในการดึงข้อมูล อาจเป็นเพราะ token หมดอายุ
      if (err instanceof Error && err.message.includes('401')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const logout = () => {
    setUser(null);
    clearAuthData();
    window.location.href = '/auth/login';
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      loading,
      error,
      refreshUser,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}