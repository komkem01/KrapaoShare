'use client';

import { useState } from 'react';

interface Account {
  id: number;
  name: string;
  type: 'personal' | 'shared';
  balance: number;
  color: string;
  bankName?: string;
  isDefault: boolean;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: number;
  onAccountChange: (accountId: number) => void;
  className?: string;
  required?: boolean;
  showBalance?: boolean;
}

export default function AccountSelector({ 
  accounts, 
  selectedAccountId, 
  onAccountChange, 
  className = '',
  required = false,
  showBalance = true
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        เลือกบัญชี {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
          {selectedAccount ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedAccount.color }}
                ></div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedAccount.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedAccount.type === 'personal' ? 'บัญชีส่วนตัว' : 'บัญชีร่วม'}
                    {selectedAccount.bankName && ` • ${selectedAccount.bankName}`}
                  </div>
                </div>
              </div>
              {showBalance && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    ฿{selectedAccount.balance.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              เลือกบัญชี
            </div>
          )}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              {accounts.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  ไม่มีบัญชีที่ใช้งานได้
                </div>
              ) : (
                <>
                  {/* Personal Accounts */}
                  {accounts.filter(acc => acc.type === 'personal').length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                        บัญชีส่วนตัว
                      </div>
                      {accounts.filter(acc => acc.type === 'personal').map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => {
                            onAccountChange(account.id);
                            setIsOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                            selectedAccountId === account.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: account.color }}
                            ></div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {account.name}
                                {account.isDefault && (
                                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                    หลัก
                                  </span>
                                )}
                              </div>
                              {account.bankName && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {account.bankName}
                                </div>
                              )}
                            </div>
                          </div>
                          {showBalance && (
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              ฿{account.balance.toLocaleString()}
                            </div>
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Shared Accounts */}
                  {accounts.filter(acc => acc.type === 'shared').length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                        บัญชีร่วม
                      </div>
                      {accounts.filter(acc => acc.type === 'shared').map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => {
                            onAccountChange(account.id);
                            setIsOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                            selectedAccountId === account.id ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: account.color }}
                            >
                              <span className="text-white text-xs">👥</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {account.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                บัญชีร่วม
                              </div>
                            </div>
                          </div>
                          {showBalance && (
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              ฿{account.balance.toLocaleString()}
                            </div>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}