'use client';

import { useState, useRef, useEffect } from 'react';

export interface Account {
  id: number | string;
  name: string;
  type: 'personal' | 'shared' | 'business';
  balance: number;
  bank: string;
  accountNumber: string;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId?: number | string | null;
  onSelect: (account: Account) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  filterType?: 'personal' | 'shared' | 'all';
}

export default function AccountSelector({
  accounts,
  selectedAccountId,
  onSelect,
  placeholder = 'เลือกบัญชี',
  className = '',
  disabled = false,
  filterType = 'all'
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredAccounts = filterType === 'all' 
    ? accounts 
    : accounts.filter(acc => acc.type === filterType);

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAccountSelect = (account: Account) => {
    onSelect(account);
    setIsOpen(false);
  };

  const getAccountIcon = (account: Account) => {
    if (account.type === 'shared') return '👥';
    return '🏦';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-gray-800'
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
        }`}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {selectedAccount ? (
            <>
              <span className="text-xl">{getAccountIcon(selectedAccount)}</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-gray-900 dark:text-white font-medium truncate">
                  {selectedAccount.name}
                </span>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>฿{selectedAccount.balance.toLocaleString()}</span>
                  <span>•</span>
                  <span className="truncate">{selectedAccount.bank}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-xl text-gray-400 dark:text-gray-500">🏦</span>
              <span className="text-gray-500 dark:text-gray-400">
                {placeholder}
              </span>
            </>
          )}
        </div>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {filteredAccounts.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                ไม่มีบัญชีที่พร้อมใช้งาน
              </div>
            ) : (
              <>
                {/* Personal Accounts */}
                {filteredAccounts.some(acc => acc.type === 'personal') && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      บัญชีส่วนตัว
                    </div>
                    <div className="space-y-1 py-2">
                      {filteredAccounts
                        .filter(acc => acc.type === 'personal')
                        .map((account) => (
                          <button
                            key={account.id}
                            onClick={() => handleAccountSelect(account)}
                            className={`w-full px-3 py-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                              selectedAccountId === account.id
                                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                                : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">🏦</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {account.name}
                                  </span>
                                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 ml-2">
                                    ฿{account.balance.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {account.bank}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {account.accountNumber}
                                  </span>
                                </div>
                              </div>
                              {selectedAccountId === account.id && (
                                <div className="flex-shrink-0">
                                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Shared Accounts */}
                {filteredAccounts.some(acc => acc.type === 'shared') && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      บัญชีร่วม
                    </div>
                    <div className="space-y-1 py-2">
                      {filteredAccounts
                        .filter(acc => acc.type === 'shared')
                        .map((account) => (
                          <button
                            key={account.id}
                            onClick={() => handleAccountSelect(account)}
                            className={`w-full px-3 py-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                              selectedAccountId === account.id
                                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                                : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">👥</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {account.name}
                                  </span>
                                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-2">
                                    ฿{account.balance.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                    {account.bank}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {account.accountNumber}
                                  </span>
                                </div>
                              </div>
                              {selectedAccountId === account.id && (
                                <div className="flex-shrink-0">
                                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}