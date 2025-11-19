"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTypes, Type, TypeFormData } from '@/contexts/TypeContext';

const TypesPage: React.FC = () => {
  const {
    types,
    isLoading,
    error,
    refreshTypes,
    addType,
    updateType,
    deleteType,
  } = useTypes();

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<Type | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const [typeForm, setTypeForm] = useState<TypeFormData>({
    name: '',
    icon: '📝',
    color: '#3b82f6',
    description: '',
    is_active: true,
  });

  const predefinedIcons = [
    '📝', '💼', '📊', '🎯', '🔧', '📚', '💡', '🏆', 
    '🎨', '🔬', '🌟', '⚡', '🎵', '🎭', '🏃‍♂️', '🍔',
    '🏠', '🚗', '💳', '📱', '✈️', '🎁', '🌸', '🔥',
  ];

  const predefinedColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6366f1',
  ];

  // Filter types based on search and status
  const filteredTypes = types.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && type.is_active) ||
                         (filterActive === 'inactive' && !type.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const handleAddType = () => {
    setEditingType(null);
    setTypeForm({
      name: '',
      icon: '📝',
      color: '#3b82f6',
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEditType = (type: Type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      icon: type.icon,
      color: type.color,
      description: type.description || '',
      is_active: type.is_active,
    });
    setShowModal(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name.trim()) {
      alert('กรุณากรอกชื่อประเภท');
      return;
    }

    setIsSaving(true);

    try {
      if (editingType) {
        await updateType(editingType.id, typeForm);
      } else {
        await addType(typeForm);
      }

      setShowModal(false);
      setEditingType(null);
      setTypeForm({
        name: '',
        icon: '📝',
        color: '#3b82f6',
        description: '',
        is_active: true,
      });
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to save type:', error);
      alert(error instanceof Error ? error.message : 'ไม่สามารถบันทึกประเภทได้');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteType = async (typeId: string | number, typeName: string) => {
    const confirmMessage = `ต้องการลบประเภท "${typeName}" หรือไม่?\n\n⚠️ ประเภทที่ถูกลบจะไม่สามารถกู้คืนได้`;
    
    if (!confirm(confirmMessage)) return;

    setIsSaving(true);
    try {
      await deleteType(typeId);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to delete type:', error);
      alert(error instanceof Error ? error.message : 'ไม่สามารถลบประเภทได้');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (type: Type) => {
    setIsSaving(true);
    try {
      await updateType(type.id, {
        name: type.name,
        icon: type.icon,
        color: type.color,
        description: type.description,
        is_active: !type.is_active,
      });
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to toggle type status:', error);
      alert(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะประเภทได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-white">
              จัดการประเภท
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการประเภทสำหรับจำแนกข้อมูลต่างๆ ในระบบ
            </p>
          </div>
          <button
            onClick={handleAddType}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span className="text-lg">➕</span>
            <span>เพิ่มประเภท</span>
          </button>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <span className="text-lg">✅</span>
            <span className="font-medium">บันทึกข้อมูลสำเร็จ!</span>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาประเภท..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ประเภททั้งหมด
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {types.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ใช้งาน
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {types.filter(t => t.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ไม่ใช้งาน
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {types.filter(t => !t.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <span className="text-xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Types List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-4">❌</div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={refreshTypes}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                โหลดใหม่
              </button>
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || filterActive !== 'all' ? 'ไม่พบประเภทที่ค้นหา' : 'ยังไม่มีประเภท'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || filterActive !== 'all' 
                  ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' 
                  : 'เริ่มต้นสร้างประเภทแรกของคุณ'}
              </p>
              {!searchTerm && filterActive === 'all' && (
                <button
                  onClick={handleAddType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  เพิ่มประเภทใหม่
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTypes.map((type) => (
                <div key={type.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: type.color + '20', color: type.color }}
                      >
                        <span className="text-xl">{type.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {type.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              type.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {type.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </span>
                        </div>
                        {type.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {type.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          สร้างเมื่อ: {new Date(type.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(type)}
                        disabled={isSaving}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                          type.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {type.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </button>
                      <button
                        onClick={() => handleEditType(type)}
                        disabled={isSaving}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50 dark:bg-blue-900 dark:text-blue-300"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id, type.name)}
                        disabled={isSaving}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Type Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📝</span>
                      <h3 className="text-lg font-semibold text-white">
                        {editingType ? 'แก้ไขประเภท' : 'เพิ่มประเภทใหม่'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อประเภท *
                      </label>
                      <input
                        type="text"
                        value={typeForm.name}
                        onChange={(e) =>
                          setTypeForm({
                            ...typeForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="กรอกชื่อประเภท"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        คำอธิบาย
                      </label>
                      <textarea
                        value={typeForm.description}
                        onChange={(e) =>
                          setTypeForm({
                            ...typeForm,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="คำอธิบายประเภท (ไม่บังคับ)"
                      />
                    </div>

                    {/* Icon Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ไอคอน
                      </label>
                      <div className="grid grid-cols-8 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                        {predefinedIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() =>
                              setTypeForm({ ...typeForm, icon })
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              typeForm.icon === icon
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        สี
                      </label>
                      <div className="grid grid-cols-5 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() =>
                              setTypeForm({ ...typeForm, color })
                            }
                            className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                              typeForm.color === color
                                ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800'
                                : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={typeForm.is_active}
                          onChange={(e) =>
                            setTypeForm({
                              ...typeForm,
                              is_active: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          เปิดใช้งาน
                        </span>
                      </label>
                    </div>

                    {/* Preview */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ตัวอย่าง:
                      </p>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: typeForm.color + '20',
                            color: typeForm.color,
                          }}
                        >
                          <span className="text-lg">{typeForm.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {typeForm.name || 'ชื่อประเภท'}
                          </p>
                          {typeForm.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {typeForm.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveType}
                      disabled={isSaving || !typeForm.name.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TypesPage;