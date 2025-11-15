'use client';

import { useState, useRef, useEffect } from 'react';
import { useCategories, Category } from '@/contexts/CategoryContext';

interface CategorySelectorProps {
  type: 'income' | 'expense';
  selectedCategoryId?: number;
  onSelect: (category: Category) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CategorySelector({
  type,
  selectedCategoryId,
  onSelect,
  placeholder = 'เลือกหมวดหมู่',
  className = '',
  disabled = false
}: CategorySelectorProps) {
  const { categories } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categoriesList = categories[type];
  const selectedCategory = categoriesList.find(cat => cat.id === selectedCategoryId);

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

  const handleCategorySelect = (category: Category) => {
    onSelect(category);
    setIsOpen(false);
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
        <div className="flex items-center space-x-3">
          {selectedCategory ? (
            <>
              <span 
                className="text-xl p-1 rounded-lg"
                style={{ backgroundColor: `${selectedCategory.color}20` }}
              >
                {selectedCategory.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-gray-900 dark:text-white font-medium">
                  {selectedCategory.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="text-xl text-gray-400 dark:text-gray-500 p-1">
                {type === 'income' ? '📈' : '📉'}
              </span>
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
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              หมวดหมู่{type === 'income' ? 'รายรับ' : 'รายจ่าย'} ({categoriesList.length})
            </div>
            
            {categoriesList.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                ยังไม่มีหมวดหมู่
                <br />
                <span className="text-xs">สามารถเพิ่มได้ในหน้าการตั้งค่า</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1 py-2">
                {categoriesList.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full px-3 py-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3 ${
                      selectedCategoryId === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                        : ''
                    }`}
                  >
                    <span 
                      className="text-lg p-1.5 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {category.name}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {category.color}
                        </span>
                      </div>
                    </div>
                    {selectedCategoryId === category.id && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook สำหรับใช้งานง่าย ๆ
export function useCategorySelector(type: 'income' | 'expense') {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleSelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const reset = () => {
    setSelectedCategory(null);
  };

  return {
    selectedCategory,
    selectedCategoryId: selectedCategory?.id,
    handleSelect,
    reset
  };
}