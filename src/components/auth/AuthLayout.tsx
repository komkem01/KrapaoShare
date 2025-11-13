import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-bold text-xl">K</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              KrapaoShare
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            จัดการเงินอย่างง่าย แบบมินิมอล
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}