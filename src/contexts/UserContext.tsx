'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authApi } from '@/utils/apiClient';
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
      console.log('🔍 Fetching user data...');
      
      // ลองดึงจาก localStorage ก่อน
      const storedUser = getStoredUser();
      console.log('💾 Stored user:', storedUser);
      if (storedUser) {
        setUser(storedUser as User);
        return; // ใช้ stored user แทน
      }

      // TODO: Remove this mock user - for testing only
      const mockUser = {
        id: '2b4b9985-d299-43a7-a954-c0e2b47e9450',
        email: 'test@example.com',
        firstname: 'Test',
        lastname: 'User',
        role: 'member' as const,
        status: 'active' as const,
        timezone: 'Asia/Bangkok',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('🧪 Using mock user for testing:', mockUser);
      setUser(mockUser as User);
      setStoredUser(mockUser as unknown as Record<string, unknown>);

      // Uncomment this when you have real authentication
      /*
      // ดึงข้อมูลล่าสุดจาก API
      console.log('🌐 Calling authApi.me()...');
      const userData = await authApi.me() as User;
      console.log('👤 User data from API:', userData);
      setUser(userData);
      setStoredUser(userData as unknown as Record<string, unknown>);
      */
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
    try {
      setError(null);
      
      // ดึงข้อมูลล่าสุดจาก API
      const userData = await authApi.me() as User;
      setUser(userData);
      setStoredUser(userData as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
      
      // หากเกิดข้อผิดพลาดในการดึงข้อมูล อาจเป็นเพราะ token หมดอายุ
      if (err instanceof Error && err.message.includes('401')) {
        logout();
      }
    }
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