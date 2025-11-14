'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('user@example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    setIsEmailSent(true);
  };

  if (isEmailSent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6">
            <span className="text-2xl">📧</span>
          </div>
          
          <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
            ตรวจสอบอีเมลของคุณ
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง <strong>{email}</strong> แล้ว 
            กรุณาตรวจสอบกล่องจดหมายของคุณ
          </p>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-light text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              ส่งอีเมลอีกครั้ง
            </button>

            <Link
              href="/auth/login"
              className="block w-full text-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>เคล็ดลับ:</strong> หากไม่พบอีเมล ลองตรวจสอบในโฟลเดอร์ Spam หรือ Junk Mail
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
          <span className="text-2xl">🔑</span>
        </div>
        
        <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
          ลืมรหัสผ่าน?
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400">
          กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent font-light transition-colors"
            placeholder="กรุณากรอกอีเมลของคุณ"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-light rounded-lg text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-900 mr-2"></div>
              กำลังส่งอีเมล...
            </div>
          ) : (
            'ส่งลิงก์รีเซ็ตรหัสผ่าน'
          )}
        </button>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-light transition-colors"
          >
            ← กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          ต้องการความช่วยเหลือ?
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• ตรวจสอบว่าอีเมลที่กรอกถูกต้อง</p>
          <p>• หากยังไม่ได้รับอีเมล ลองตรวจสอบในโฟลเดอร์ Spam</p>
          <p>• ลิงก์รีเซ็ตจะหมดอายุภายใน 24 ชั่วโมง</p>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            หากยังมีปัญหา ติดต่อทีมสนับสนุนที่{' '}
            <a href="mailto:support@krapaoshare.com" className="text-gray-700 dark:text-gray-300 hover:underline">
              support@krapaoshare.com
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}