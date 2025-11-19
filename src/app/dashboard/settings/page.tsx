"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCategories, Category } from "@/contexts/CategoryContext";
import { useTypes, Type, TypeFormData } from "@/contexts/TypeContext";
import { apiClient } from "@/utils/apiClient";
import {
  clearAuthData,
  setStoredUser,
  getStoredTokens,
} from "@/utils/authStorage";

// API Response Types for /auth/me endpoint
interface UserResponse {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  occupation?: string;
  avatar_url?: string;
  role?: "admin" | "member" | "owner";
  status?: "active" | "inactive" | "suspended";
  timezone?: string;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

// API Response Types for update user endpoint
interface UpdateUserResponse {
  code: number;
  message: string;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    occupation?: string;
    address?: string;
    role?: "admin" | "member" | "owner";
    status?: "active" | "inactive" | "suspended";
    timezone?: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Update User Request interface to match backend expectations
interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string | null;
  occupation?: string;
  address?: string;
  role?: "admin" | "member" | "owner";
  status?: "active" | "inactive" | "suspended";
  avatarUrl?: string;
  timezone?: string;
  password?: string;
}

interface SystemSettings {
  setting_id: string;
  user_id: string;
  theme?: string;
  language?: string;
  currency?: string;
  date_format?: string;
  start_of_week?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationSettings {
  notification_setting_id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  budget_alerts: boolean;
  goal_reminders: boolean;
  bill_reminders: boolean;
  debt_alerts: boolean;
  created_at: string;
  updated_at: string;
}

// Combined Settings Request for system settings API
interface CombinedSettingsRequest {
  user_id: string;
  theme?: string;
  language?: string;
  currency?: string;
  date_format?: string;
  start_of_week?: string;
}

// Notification Settings Request for notification API
interface NotificationSettingsRequest {
  notification_setting_id?: string;
  user_id: string;
  notification_type: "system";
  email_notifications?: boolean;
  push_notifications?: boolean;
  budget_alerts?: boolean;
  goal_reminders?: boolean;
  bill_reminders?: boolean;
  debt_alerts?: boolean;
}

interface AuditLog {
  audit_log_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

const toArray = <T,>(data: T | T[] | null | undefined): T[] => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

const camelToSnake = (key: string) =>
  key.replace(/([A-Z])/g, "_$1").toLowerCase();

// Helper function to format ISO date to YYYY-MM-DD for form inputs
const formatDateForInput = (isoDate: string | null | undefined): string => {
  if (!isoDate) return "";
  try {
    return new Date(isoDate).toISOString().split("T")[0];
  } catch (error) {
    console.warn("Invalid date format:", isoDate);
    return "";
  }
};

// Helper function to format date for display (Thai format)
const formatDateForDisplay = (isoDate: string | null | undefined): string => {
  if (!isoDate) return "";
  try {
    return new Date(isoDate).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.warn("Invalid date format:", isoDate);
    return "";
  }
};

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "preferences"
  | "categories"
  | "types";

export default function SettingsPage() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    isLoading: isLoadingCategories,
    error: categoryError,
  } = useCategories();

  const {
    types,
    addType,
    updateType,
    deleteType,
    refreshTypes,
    isLoading: isLoadingTypes,
    error: typesError,
  } = useTypes();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [systemSettingsId, setSystemSettingsId] = useState<string | null>(null);
  const [notificationSettingsId, setNotificationSettingsId] = useState<
    string | null
  >(null);

  // User data - loaded from /auth/me API
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    occupation: "",
    profileImage: "",
    role: "member" as "admin" | "member" | "owner",
    status: "active" as "active" | "inactive" | "suspended",
    timezone: "Asia/Bangkok",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    budgetAlerts: true,
    goalReminders: true,
    billReminders: true,
    debtAlerts: true,
  });

  const [appPreferences, setAppPreferences] = useState({
    theme: "auto",
    language: "th",
    currency: "THB",
    dateFormat: "dd/mm/yyyy",
    startOfWeek: "monday",
  });

  // Category management states
  const [categoryModalType, setCategoryModalType] = useState<
    "income" | "expense" | null
  >(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "💰",
    color: "#22c55e",
    type_id: "", // เพิ่ม type_id
  });

  // Types management states
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<Type | null>(null);
  const [typeForm, setTypeForm] = useState<TypeFormData>({
    name: "",
    icon: "📝",
    color: "#3b82f6",
    description: "",
    is_active: true,
  });

  // Audit logs for security tab
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const predefinedIcons = [
    "💰",
    "💼",
    "📈",
    "💵",
    "🍽️",
    "🚗",
    "🛒",
    "🎬",
    "🏠",
    "🏥",
    "📚",
    "💳",
    "🎯",
    "⚡",
    "🎁",
    "🏃‍♂️",
    "📱",
    "✈️",
    "🎵",
    "👕",
  ];

  const predefinedTypeIcons = [
    "📝",
    "💼",
    "📊",
    "🎯",
    "🔧",
    "📚",
    "💡",
    "🏆",
    "🎨",
    "🔬",
    "🌟",
    "⚡",
    "🎵",
    "🎭",
    "🏃‍♂️",
    "🍔",
    "🏠",
    "🚗",
    "💳",
    "📱",
    "✈️",
    "🎁",
    "🌸",
    "🔥",
  ];
  const predefinedColors = [
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#10b981",
    "#6b7280",
    "#f97316",
  ];

  // Fetch initial data from backend
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Debug: Check stored tokens first
        const { accessToken } = getStoredTokens();
        console.log("Debug - Access token exists:", !!accessToken);

        if (!accessToken) {
          throw new Error("ไม่พบ access token กรุณาเข้าสู่ระบบใหม่");
        }

        // Fetch user info from /auth/me
        const userResponse = await apiClient.get<UserResponse>("/auth/me");
        console.log("Debug - User response:", userResponse);

        if (userResponse && userResponse.id) {
          console.log("Debug - Setting currentUserId:", userResponse.id);
          setCurrentUserId(userResponse.id);

          // Use firstname and lastname directly from API
          const newUserData = {
            firstName: userResponse.firstname || "",
            lastName: userResponse.lastname || "",
            email: userResponse.email || "",
            phone: userResponse.phone || "",
            birthDate: formatDateForInput(userResponse.birth_date),
            address: userResponse.address || "",
            occupation: userResponse.occupation || "",
            profileImage: userResponse.avatar_url || "",
            role: userResponse.role || "member",
            status: userResponse.status || "active",
            timezone: userResponse.timezone || "Asia/Bangkok",
          };

          console.log("Debug - Setting userData:", newUserData);
          setUserData(newUserData);

          // Set 2FA status from user response
          setTwoFactorEnabled(userResponse.two_factor_enabled || false);

          // Update stored user cache
          setStoredUser(userResponse as unknown as Record<string, unknown>);

          // ขั้นตอนที่ 1: ดึงข้อมูลประเภท (Types) ก่อน
          console.log(
            "Debug - Fetching Types first for user:",
            userResponse.id
          );
          try {
            await refreshTypes();
            console.log(
              "Debug - Types loaded successfully, count:",
              types.length
            );
            console.log("Debug - Types data:", types);
          } catch (typeError) {
            console.warn("Failed to load types:", typeError);
            // ถ้าไม่สามารถดึงประเภทได้ ให้แสดงเตือนแต่ยังคงดำเนินการต่อ
          }

          // ขั้นตอนที่ 2: ดึงข้อมูลหมวดหมู่ (Categories) หลังจากได้ Types แล้ว
          console.log("Debug - Fetching Categories after Types...");
          try {
            await refreshCategories();
            console.log("Debug - Categories loaded successfully");
          } catch (categoryError) {
            console.warn("Failed to load categories:", categoryError);
            // ถ้าไม่สามารถดึงหมวดหมู่ได้ ให้แสดงเตือนแต่ยังคงดำเนินการต่อ
          }

          // Fetch system settings from new API
          try {
            const systemSettingsResponse =
              await apiClient.get<CombinedSettingsRequest>(
                `/system-settings/user/${userResponse.id}`
              );

            if (systemSettingsResponse) {
              // Update app preferences
              setAppPreferences({
                theme: systemSettingsResponse.theme || "auto",
                language: systemSettingsResponse.language || "th",
                currency: systemSettingsResponse.currency || "THB",
                dateFormat: systemSettingsResponse.date_format || "dd/mm/yyyy",
                startOfWeek: systemSettingsResponse.start_of_week || "monday",
              });

              console.log(
                "Debug - System settings loaded:",
                systemSettingsResponse
              );
            }
          } catch (err) {
            console.warn("Could not fetch system settings from new API:", err);
          }

          // Fetch notification settings from new API
          try {
            let notificationResponse: NotificationSettingsRequest | null = null;

            // Try to get all notification settings and filter by user_id
            try {
              const allNotificationSettings = await apiClient.get<
                NotificationSettingsRequest | NotificationSettingsRequest[]
              >(`/notification-settings`);
              // Find the setting for current user
              if (Array.isArray(allNotificationSettings)) {
                notificationResponse =
                  allNotificationSettings.find(
                    (setting) => setting.user_id === userResponse.id
                  ) || null;
              } else if (
                allNotificationSettings &&
                "user_id" in allNotificationSettings &&
                allNotificationSettings.user_id === userResponse.id
              ) {
                notificationResponse = allNotificationSettings;
              }
            } catch (firstError) {
              console.warn(
                "Failed with /notification-settings, trying /notifications:",
                firstError
              );
              const allNotifications = await apiClient.get<
                NotificationSettingsRequest | NotificationSettingsRequest[]
              >(`/notifications`);
              // Find the setting for current user
              if (Array.isArray(allNotifications)) {
                notificationResponse =
                  allNotifications.find(
                    (setting) => setting.user_id === userResponse.id
                  ) || null;
              } else if (
                allNotifications &&
                "user_id" in allNotifications &&
                allNotifications.user_id === userResponse.id
              ) {
                notificationResponse = allNotifications;
              }
            }

            if (notificationResponse) {
              // Store notification settings ID for updates
              if (
                "notification_setting_id" in notificationResponse &&
                typeof notificationResponse.notification_setting_id === "string"
              ) {
                setNotificationSettingsId(
                  notificationResponse.notification_setting_id
                );
              }

              // Update notification settings
              setNotificationSettings({
                emailNotifications:
                  notificationResponse.email_notifications ?? true,
                pushNotifications:
                  notificationResponse.push_notifications ?? true,
                budgetAlerts: notificationResponse.budget_alerts ?? true,
                goalReminders: notificationResponse.goal_reminders ?? true,
                billReminders: notificationResponse.bill_reminders ?? true,
                debtAlerts: notificationResponse.debt_alerts ?? true,
              });

              console.log(
                "Debug - Notification settings loaded:",
                notificationResponse
              );
            }
          } catch (err) {
            console.warn(
              "Could not fetch notification settings from new API, trying fallback:",
              err
            );

            // Fallback to old API endpoints
            try {
              const systemSettingsResponse = await apiClient.get<
                SystemSettings | SystemSettings[]
              >(`/api/v1/system-settings/user/${userResponse.id}`);

              const settings = toArray(systemSettingsResponse)[0];
              if (settings) {
                setSystemSettingsId(settings.setting_id);
                setAppPreferences({
                  theme: settings.theme || "auto",
                  language: settings.language || "th",
                  currency: settings.currency || "THB",
                  dateFormat: settings.date_format || "dd/mm/yyyy",
                  startOfWeek: settings.start_of_week || "monday",
                });
              }

              const notificationParams = new URLSearchParams();
              notificationParams.append("user_id", userResponse.id);
              notificationParams.append("userId", userResponse.id);
              const notificationResponse = await apiClient.get<
                NotificationSettings | NotificationSettings[]
              >(`/notification-settings?${notificationParams.toString()}`);

              const userNotificationSettings = toArray(notificationResponse)[0];

              if (userNotificationSettings) {
                setNotificationSettingsId(
                  userNotificationSettings.notification_setting_id
                );
                setNotificationSettings({
                  emailNotifications:
                    userNotificationSettings.email_notifications,
                  pushNotifications:
                    userNotificationSettings.push_notifications,
                  budgetAlerts: userNotificationSettings.budget_alerts,
                  goalReminders: userNotificationSettings.goal_reminders,
                  billReminders: userNotificationSettings.bill_reminders,
                  debtAlerts: userNotificationSettings.debt_alerts,
                });
              }
            } catch (fallbackErr) {
              console.warn("Fallback settings fetch also failed:", fallbackErr);
            }
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string; status?: number };
        console.error("Failed to fetch user data:", err);
        setError(err.message || "ไม่สามารถโหลดข้อมูลได้");

        // If unauthorized, clear auth and redirect
        if (err.status === 401) {
          clearAuthData();
          window.location.href = "/auth/login";
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Debug userData changes
  useEffect(() => {
    console.log("Debug - userData state changed:", userData);
  }, [userData]);

  // Debug types changes
  useEffect(() => {
    console.log("Debug - types state changed:", types);
    console.log("Debug - types loading:", isLoadingTypes);
    console.log("Debug - types error:", typesError);
    console.log("Debug - types data details:", types.map(t => ({id: t.id, name: t.name, active: t.is_active})));
    
    // Force re-render when types change
    if (types.length > 0) {
      console.log("Debug - Types loaded successfully, count:", types.length);
    }
  }, [types, isLoadingTypes, typesError]);

  // Fetch audit logs when security tab is active
  useEffect(() => {
    if (activeTab === "security" && currentUserId && auditLogs.length === 0) {
      const fetchAuditLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const logs = await apiClient.get<AuditLog | AuditLog[]>(
            `/audit-logs?user_id=${currentUserId}&action=login&limit=10`
          );
          // Use API filtered logs directly, ensure it's always an array
          setAuditLogs(toArray(logs));
        } catch (err) {
          console.warn("Could not fetch audit logs:", err);
          setAuditLogs([]);
        } finally {
          setIsLoadingLogs(false);
        }
      };

      fetchAuditLogs();
    }
  }, [activeTab, currentUserId, auditLogs.length]);

  // Handle system settings update using new API
  const updateSystemSettings = async (
    updates: Partial<CombinedSettingsRequest>
  ) => {
    if (!currentUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return false;
    }

    try {
      const payload: CombinedSettingsRequest = {
        user_id: currentUserId,
        // Current app preferences
        theme: appPreferences.theme,
        language: appPreferences.language,
        currency: appPreferences.currency,
        date_format: appPreferences.dateFormat,
        start_of_week: appPreferences.startOfWeek,
        // Apply updates
        ...updates,
      };

      console.log("Debug - System settings payload:", payload);

      await apiClient.post("/system-settings", payload);

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      return true;
    } catch (error: unknown) {
      console.error("Failed to update system settings:", error);
      const err = error as { message?: string; status?: number };
      let errorMessage = "ไม่สามารถบันทึกการตั้งค่าระบบได้";

      if (err.status === 401) {
        errorMessage = "หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่";
        clearAuthData();
        setTimeout(() => (window.location.href = "/auth/login"), 2000);
      }

      alert("เกิดข้อผิดพลาด: " + errorMessage);
      return false;
    }
  };

  // Handle notification settings update using notification API
  const updateNotificationSettings = async (
    updates: Partial<NotificationSettingsRequest>
  ) => {
    if (!currentUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return false;
    }

    try {
      const payload: NotificationSettingsRequest = {
        user_id: currentUserId,
        notification_type: "system",
        // Current notification settings
        email_notifications: notificationSettings.emailNotifications,
        push_notifications: notificationSettings.pushNotifications,
        budget_alerts: notificationSettings.budgetAlerts,
        goal_reminders: notificationSettings.goalReminders,
        bill_reminders: notificationSettings.billReminders,
        debt_alerts: notificationSettings.debtAlerts,
        // Apply updates
        ...updates,
      };

      console.log("Debug - Notification settings payload:", payload);

      // Try the notification-settings endpoint first, then notifications as fallback
      try {
        // If we have existing notification settings ID, try to update it first
        if (notificationSettingsId) {
          try {
            await apiClient.patch(
              `/notification-settings/${notificationSettingsId}`,
              payload
            );
          } catch (patchError) {
            console.warn("Failed to PATCH, trying POST:", patchError);
            await apiClient.post("/notification-settings", payload);
          }
        } else {
          await apiClient.post("/notification-settings", payload);
        }
      } catch (firstError) {
        console.warn(
          "Failed with /notification-settings, trying /notifications:",
          firstError
        );
        try {
          if (notificationSettingsId) {
            await apiClient.patch(
              `/notifications/${notificationSettingsId}`,
              payload
            );
          } else {
            await apiClient.post("/notifications", payload);
          }
        } catch (secondError) {
          console.warn("Failed with /notifications as well:", secondError);
          throw secondError;
        }
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      return true;
    } catch (error: unknown) {
      console.error("Failed to update notification settings:", error);
      const err = error as { message?: string; status?: number };
      let errorMessage = "ไม่สามารถบันทึกการตั้งค่าการแจ้งเตือนได้";

      if (err.status === 401) {
        errorMessage = "หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่";
        clearAuthData();
        setTimeout(() => (window.location.href = "/auth/login"), 2000);
      }

      alert("เกิดข้อผิดพลาด: " + errorMessage);
      return false;
    }
  };

  // Handle notification settings change with new API
  const handleNotificationChange = async (key: string, value: boolean) => {
    const previousSettings = { ...notificationSettings };
    const updatedSettings = {
      ...notificationSettings,
      [key]: value,
    };

    // Optimistic update
    setNotificationSettings(updatedSettings);

    // Map camelCase to snake_case for API
    const settingKey = camelToSnake(key);
    const success = await updateNotificationSettings({
      [settingKey]: value,
    } as Partial<NotificationSettingsRequest>);

    // Revert on error
    if (!success) {
      setNotificationSettings(previousSettings);
    }
  };

  // Handle app preferences change with new API
  const handlePreferenceChange = async (key: string, value: string) => {
    const previousPreferences = { ...appPreferences };
    const updatedPreferences = {
      ...appPreferences,
      [key]: value,
    };

    // Optimistic update
    setAppPreferences(updatedPreferences);

    // Map camelCase to snake_case for API
    const settingKey = camelToSnake(key);
    const success = await updateSystemSettings({
      [settingKey]: value,
    } as Partial<CombinedSettingsRequest>);

    // Revert on error
    if (!success) {
      setAppPreferences(previousPreferences);
    }
  };

  const handleSave = async () => {
    console.log("Debug - handleSave currentUserId:", currentUserId);

    if (!currentUserId) {
      console.error("Debug - No currentUserId available");
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    // Validate currentUserId format
    if (typeof currentUserId !== "string" || currentUserId.trim() === "") {
      console.error("Debug - Invalid currentUserId format:", currentUserId);
      alert("รูปแบบ User ID ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!userData.firstName.trim()) {
        setError("กรุณากรอกชื่อ");
        setIsSaving(false);
        return;
      }

      if (!userData.lastName.trim()) {
        setError("กรุณากรอกนามสกุล");
        setIsSaving(false);
        return;
      }

      if (!userData.email.trim()) {
        setError("กรุณากรอกอีเมล");
        setIsSaving(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        setError("รูปแบบอีเมลไม่ถูกต้อง");
        setIsSaving(false);
        return;
      }

      // Build update payload according to backend expectations
      const updatePayload: UpdateUserRequest = {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.trim(),
        phone: userData.phone.trim() || undefined,
        birthDate: userData.birthDate || null,
        address: userData.address.trim() || undefined,
        occupation: userData.occupation.trim() || undefined,
        avatarUrl: userData.profileImage || undefined,
        timezone: userData.timezone || "Asia/Bangkok",
        // Don't include role and status in profile updates - these should be admin-only
      };

      console.log("Debug - PATCH URL:", `/users/${currentUserId}`);
      console.log("Debug - Update payload:", updatePayload);

      const response = await apiClient.patch<UpdateUserResponse>(
        `/users/${currentUserId}`,
        updatePayload
      );

      console.log("Debug - Update response:", response);

      // Update local state with response data
      if (response && response.data) {
        const updatedData = response.data;

        // Convert ISO date to YYYY-MM-DD format for form input
        const formattedBirthDate = formatDateForInput(updatedData.birthDate);

        const newUserData = {
          firstName: updatedData.firstName,
          lastName: updatedData.lastName,
          email: updatedData.email,
          phone: updatedData.phone || "",
          birthDate: formattedBirthDate,
          address: updatedData.address || "",
          occupation: updatedData.occupation || "",
          profileImage: userData.profileImage, // Keep existing profile image
          role: updatedData.role || "member",
          status: updatedData.status || "active",
          timezone: updatedData.timezone || "Asia/Bangkok",
        };

        setUserData(newUserData);

        // Update stored user cache with the API format
        const cacheData = {
          id: updatedData.id,
          firstname: updatedData.firstName,
          lastname: updatedData.lastName,
          email: updatedData.email,
          phone: updatedData.phone,
          birth_date: formattedBirthDate,
          address: updatedData.address,
          occupation: updatedData.occupation,
          avatar_url: userData.profileImage,
          role: updatedData.role,
          status: updatedData.status,
          timezone: updatedData.timezone,
          created_at: updatedData.createdAt,
          updated_at: updatedData.updatedAt,
        };
        setStoredUser(cacheData as unknown as Record<string, unknown>);
      }

      setIsSaving(false);
      setIsEditing(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      alert("✅ อัปเดตข้อมูลส่วนตัวสำเร็จ!");
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        status?: number;
        data?: {
          message?: string;
          errors?: Record<string, string[]>;
        };
      };

      console.error("Failed to update profile:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        data: err.data,
        currentUserId: currentUserId,
      });

      let errorMessage = "ไม่สามารถบันทึกข้อมูลได้";

      // Handle specific error cases
      if (err.status === 400) {
        if (err.data?.errors) {
          // Handle validation errors from backend
          const validationErrors = err.data.errors;
          const errorMessages = [];

          if (validationErrors.firstName) {
            errorMessages.push(
              "ชื่อ: " + validationErrors.firstName.join(", ")
            );
          }
          if (validationErrors.lastName) {
            errorMessages.push(
              "นามสกุล: " + validationErrors.lastName.join(", ")
            );
          }
          if (validationErrors.email) {
            errorMessages.push("อีเมล: " + validationErrors.email.join(", "));
          }
          if (validationErrors.phone) {
            errorMessages.push(
              "เบอร์โทร: " + validationErrors.phone.join(", ")
            );
          }
          if (validationErrors.birthDate) {
            errorMessages.push(
              "วันเกิด: " + validationErrors.birthDate.join(", ")
            );
          }

          errorMessage =
            errorMessages.length > 0
              ? "ข้อมูลไม่ถูกต้อง:\n• " + errorMessages.join("\n• ")
              : err.data.message || "ข้อมูลไม่ถูกต้อง";
        } else if (err.message?.includes("Invalid user ID")) {
          errorMessage =
            "User ID ไม่ถูกต้อง กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่";
          clearAuthData();
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 2000);
        } else {
          errorMessage = err.data?.message || err.message || "ข้อมูลไม่ถูกต้อง";
        }
      } else if (err.status === 200 || err.status === 201) {
        // Handle success response that might be wrapped in error handling
        console.log("Success response caught in error handler:", err);
        return; // Don't show error for successful responses
      } else if (err.status === 401) {
        errorMessage = "หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่";
        clearAuthData();
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
      } else if (err.status === 409) {
        errorMessage = "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
      } else if (err.status === 422) {
        errorMessage = "ข้อมูลไม่เป็นไปตามเงื่อนไข กรุณาตรวจสอบอีกครั้ง";
      } else {
        errorMessage =
          err.data?.message || err.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
      }

      setError(errorMessage);
      setIsSaving(false);
      alert("❌ เกิดข้อผิดพลาด:\n" + errorMessage);
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (passwordData.currentPassword.length < 6) {
      alert("รหัสผ่านปัจจุบันต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Use the correct change password API endpoint
      const changePasswordRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };

      await apiClient.post("/auth/change-password", changePasswordRequest);

      setIsSaving(false);
      setShowChangePasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      alert(
        "🔐 เปลี่ยนรหัสผ่านสำเร็จ!\nกรุณาใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งต่อไป"
      );
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      console.error("Failed to change password:", err);
      setIsSaving(false);

      let errorMessage = "ไม่สามารถเปลี่ยนรหัสผ่านได้";

      if (err.status === 400) {
        errorMessage =
          "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านปัจจุบันและรหัสผ่านใหม่";
      } else if (err.status === 401) {
        errorMessage = "รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
      } else if (err.status === 422) {
        errorMessage =
          "รหัสผ่านใหม่ไม่เป็นไปตามเงื่อนไข (ต้องมีอย่างน้อย 6 ตัวอักษร)";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      alert("❌ เกิดข้อผิดพลาด: " + errorMessage);
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!currentUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update user's 2FA setting via PATCH /users/:id
      const newTwoFactorState = !twoFactorEnabled;
      await apiClient.patch(`/users/${currentUserId}`, {
        two_factor_enabled: newTwoFactorState,
      });

      setTwoFactorEnabled(newTwoFactorState);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      if (newTwoFactorState) {
        alert(
          "🔐 เปิดใช้งานการยืนยันตัวตนแบบสองขั้นตอนแล้ว!\nบัญชีของคุณมีความปลอดภัยมากขึ้น"
        );
      } else {
        alert("⚠️ ปิดใช้งานการยืนยันตัวตนแบบสองขั้นตอนแล้ว");
      }
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      console.error("Failed to toggle 2FA:", err);

      let errorMessage = "ไม่สามารถเปลี่ยนการตั้งค่าได้";
      if (err.status === 401) {
        errorMessage = "หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่";
        clearAuthData();
        setTimeout(() => (window.location.href = "/auth/login"), 2000);
      }

      setError(errorMessage);
      alert("เกิดข้อผิดพลาด: " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!currentUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Request data export from backend
      const exportResponse = await apiClient.get(
        `/users/${currentUserId}/export`
      );
      const exportData = exportResponse as Record<string, unknown>;

      // Create comprehensive export with all user data
      const completeData = {
        user_profile: (exportData?.profile as typeof userData) || userData,
        transactions: (exportData?.transactions as unknown[]) || [],
        categories: (exportData?.categories as typeof categories) || categories,
        budgets: (exportData?.budgets as unknown[]) || [],
        goals: (exportData?.goals as unknown[]) || [],
        bills: (exportData?.bills as unknown[]) || [],
        debts: (exportData?.debts as unknown[]) || [],
        notification_settings:
          (exportData?.notification_settings as typeof notificationSettings) ||
          notificationSettings,
        system_settings:
          (exportData?.system_settings as typeof appPreferences) ||
          appPreferences,
        audit_logs: (exportData?.audit_logs as AuditLog[]) || auditLogs,
        export_metadata: {
          export_date: new Date().toISOString(),
          user_id: currentUserId,
          export_version: "1.0",
          total_records: Object.keys(exportData || {}).reduce((sum, key) => {
            const value = exportData?.[key];
            return sum + (Array.isArray(value) ? value.length : 1);
          }, 0),
        },
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(completeData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `krapao-share-backup-${currentUserId}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      alert("📁 ส่งออกข้อมูลสำเร็จ!\nไฟล์ข้อมูลถูกดาวน์โหลดแล้ว");
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      console.error("Failed to export data:", err);
      console.warn("Using fallback local export due to API error");

      // Fallback to local data export if API fails
      const fallbackData = {
        user_profile: userData,
        categories: categories,
        notification_settings: notificationSettings,
        system_settings: appPreferences,
        export_metadata: {
          export_date: new Date().toISOString(),
          user_id: currentUserId,
          export_version: "1.0-fallback",
          note: "Local data export due to API unavailability",
        },
      };

      const blob = new Blob([JSON.stringify(fallbackData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `krapao-share-local-${currentUserId}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(
        "⚠️ ส่งออกข้อมูลท้องถิ่นสำเร็จ\nไม่สามารถเชื่อมต่อ API ได้ แต่ส่งออกข้อมูลที่มีอยู่แล้ว"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    const confirmMessage = `คุณแน่ใจหรือไม่ที่จะล้างข้อมูลแคชทั้งหมด?\n\n⚠️ การกระทำนี้จะลบ:\n• ข้อมูลแคชของเว็บไซต์\n• ข้อมูลการตั้งค่าชั่วคราว\n• ข้อมูลการล็อกอินอาจถูกรีเซ็ต\n\nแนะนำให้รีเฟรชหน้าเว็บหลังจากนี้`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let clearedItems = [];

      // Clear service worker caches if available
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        if (cacheNames.length > 0) {
          clearedItems.push(
            `Service Worker Cache (${cacheNames.length} caches)`
          );
        }
      }

      // Clear localStorage selectively (keep auth tokens)
      const authKeys = ["accessToken", "refreshToken", "user"];
      const localStorageKeys = Object.keys(localStorage);
      const keysToRemove = localStorageKeys.filter(
        (key) => !authKeys.includes(key)
      );

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      if (keysToRemove.length > 0) {
        clearedItems.push(`Local Storage (${keysToRemove.length} items)`);
      }

      // Clear sessionStorage
      const sessionStorageCount = sessionStorage.length;
      sessionStorage.clear();
      if (sessionStorageCount > 0) {
        clearedItems.push(`Session Storage (${sessionStorageCount} items)`);
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      const clearedMessage =
        clearedItems.length > 0
          ? `🧹 ล้างแคชสำเร็จ!\n\nรายการที่ล้าง:\n• ${clearedItems.join(
              "\n• "
            )}\n\nแนะนำให้รีเฟรชหน้าเว็บเพื่อประสิทธิภาพที่ดีที่สุด`
          : "✅ ไม่พบข้อมูลแคชที่ต้องล้าง";

      alert(clearedMessage);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      setError("ไม่สามารถล้างแคชได้อย่างสมบูรณ์");
      alert("⚠️ เกิดข้อผิดพลาดขณะล้างแคช กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!currentUserId) {
      alert("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Delete user account via DELETE /users/:id
      await apiClient.delete(`/users/${currentUserId}`);

      // Clear all auth data
      clearAuthData();

      setIsSaving(false);
      setShowDeleteModal(false);

      alert("🗑️ ลบบัญชีสำเร็จ\nข้อมูลทั้งหมดของคุณได้ถูกลบออกจากระบบแล้ว");

      // Redirect to home page after account deletion
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      console.error("Failed to delete account:", err);

      let errorMessage = "ไม่สามารถลบบัญชีได้";
      if (err.status === 401) {
        errorMessage = "หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่";
        clearAuthData();
        setTimeout(() => (window.location.href = "/auth/login"), 2000);
      } else if (err.status === 403) {
        errorMessage = "ไม่มีสิทธิ์ลบบัญชีนี้";
      } else if (err.status === 409) {
        errorMessage =
          "ไม่สามารถลบบัญชีได้ เนื่องจากมีข้อมูลที่ยังไม่ได้จัดการ";
      }

      setError(errorMessage);
      setIsSaving(false);
      alert("เกิดข้อผิดพลาด: " + errorMessage);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (
      !confirm(
        "คุณแน่ใจหรือไม่ที่จะยกเลิกเซสชันนี้?\n\nเซสชันนี้จะถูกออกจากระบบทันที"
      )
    ) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Revoke session via DELETE /auth/sessions/:id
      await apiClient.delete(`/auth/sessions/${sessionId}`);

      // Refresh audit logs to show updated session list
      if (currentUserId) {
        const logs = await apiClient.get<AuditLog | AuditLog[]>(
          `/audit-logs?user_id=${currentUserId}&action=login&limit=10`
        );
        setAuditLogs(toArray(logs));
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      alert("✅ ยกเลิกเซสชันสำเร็จ");
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      console.error("Failed to revoke session:", err);

      let errorMessage = "ไม่สามารถยกเลิกเซสชันได้";
      if (err.status === 401) {
        errorMessage = "หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่";
        clearAuthData();
        setTimeout(() => (window.location.href = "/auth/login"), 2000);
      } else if (err.status === 404) {
        errorMessage = "ไม่พบเซสชันที่ต้องการยกเลิก";
      }

      setError(errorMessage);
      alert("เกิดข้อผิดพลาด: " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUserData({
            ...userData,
            profileImage: e.target?.result as string,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const tabs: { id: SettingsTab; name: string; icon: string }[] = [
    { id: "profile", name: "ข้อมูลส่วนตัว", icon: "👤" },
    { id: "security", name: "ความปลอดภัย", icon: "🔒" },
    { id: "notifications", name: "การแจ้งเตือน", icon: "🔔" },
    { id: "preferences", name: "การตั้งค่า", icon: "⚙️" },
    { id: "categories", name: "หมวดหมู่", icon: "📁" },
    { id: "types", name: "ประเภท", icon: "📝" },
  ];

  // Category management functions
  const handleAddCategory = (type: "income" | "expense") => {
    // ตรวจสอบว่าประเภทถูกโหลดแล้วหรือไม่
    if (isLoadingTypes) {
      alert("กรุณารอให้ประเภทโหลดเสร็จก่อน");
      return;
    }

    setCategoryModalType(type);
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      icon: type === "income" ? "💰" : "💳",
      color: type === "income" ? "#22c55e" : "#ef4444",
      type_id: "", // รีเซ็ต type_id
    });
  };

  const handleResetCategories = async () => {
    const confirmMessage = `ต้องการรีเซ็ตหมวดหมู่กลับไปเป็นค่าเริ่มต้นหรือไม่?\n\n⚠️ หมวดหมู่ที่สร้างเองทั้งหมดจะถูกลบ และจะกลับมาเป็นหมวดหมู่เริ่มต้นเท่านั้น`;

    if (!confirm(confirmMessage)) return;

    setIsSaving(true);
    try {
      await refreshCategories();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      alert("รีเซ็ตหมวดหมู่สำเร็จ! 🎉\nหมวดหมู่ถูกซิงค์ตามข้อมูลล่าสุดแล้ว");
    } catch (error) {
      console.error("Failed to reset categories:", error);
      alert("ไม่สามารถรีเซ็ตหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = (
    category: Category,
    type: "income" | "expense"
  ) => {
    setCategoryModalType(type);
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type_id: category.type_id || "", // เพิ่ม type_id
    });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim() || !categoryModalType) return;

    setIsSaving(true);

    try {
      if (editingCategory) {
        await updateCategory(
          categoryModalType,
          editingCategory.id,
          categoryForm
        );
      } else {
        await addCategory(categoryModalType, categoryForm);
      }

      setCategoryModalType(null);
      setEditingCategory(null);
      setCategoryForm({ name: "", icon: "💰", color: "#22c55e", type_id: "" });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("ไม่สามารถบันทึกหมวดหมู่ได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (
    categoryId: string | number,
    type: "income" | "expense"
  ) => {
    const category = categories[type].find(
      (cat) => String(cat.id) === String(categoryId)
    );
    if (!category) return;

    // ป้องกันการลบหมวดหมู่สุดท้าย
    if (categories[type].length === 1) {
      alert(
        `ไม่สามารถลบหมวดหมู่${
          type === "income" ? "รายรับ" : "รายจ่าย"
        }สุดท้ายได้ กรุณาเพิ่มหมวดหมู่ใหม่ก่อน`
      );
      return;
    }

    const confirmMessage = `ต้องการลบหมวดหมู่ "${category.name}" หรือไม่?\n\n⚠️ หมวดหมู่ที่ถูกลบจะไม่สามารถกู้คืนได้ และรายการที่ใช้หมวดหมู่นี้จะต้องจัดหมวดหมู่ใหม่`;

    if (!confirm(confirmMessage)) return;

    setIsSaving(true);
    try {
      await deleteCategory(type, String(categoryId));
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("ไม่สามารถลบหมวดหมู่ได้");
    } finally {
      setIsSaving(false);
    }
  };

  // Type management functions
  const handleAddType = () => {
    setEditingType(null);
    setTypeForm({
      name: "",
      icon: "📝",
      color: "#3b82f6",
      description: "",
      is_active: true,
    });
    setShowTypeModal(true);
  };

  const handleEditType = (type: Type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      icon: type.icon,
      color: type.color,
      description: type.description || "",
      is_active: type.is_active,
    });
    setShowTypeModal(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name.trim()) {
      alert("กรุณากรอกชื่อประเภท");
      return;
    }

    setIsSaving(true);

    try {
      if (editingType) {
        await updateType(editingType.id, typeForm);
      } else {
        await addType(typeForm);
      }

      setShowTypeModal(false);
      setEditingType(null);
      setTypeForm({
        name: "",
        icon: "📝",
        color: "#3b82f6",
        description: "",
        is_active: true,
      });

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Failed to save type:", error);
      alert(
        error instanceof Error ? error.message : "ไม่สามารถบันทึกประเภทได้"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteType = async (
    typeId: string | number,
    typeName: string
  ) => {
    const confirmMessage = `ต้องการลบประเภท "${typeName}" หรือไม่?\n\n⚠️ ประเภทที่ถูกลบจะไม่สามารถกู้คืนได้`;

    if (!confirm(confirmMessage)) return;

    setIsSaving(true);
    try {
      await deleteType(typeId);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Failed to delete type:", error);
      alert(error instanceof Error ? error.message : "ไม่สามารถลบประเภทได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTypeStatus = async (type: Type) => {
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
      console.error("Failed to toggle type status:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถเปลี่ยนสถานะประเภทได้"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-white">
            ตั้งค่า
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการข้อมูลส่วนตัวและการตั้งค่าแอปพลิเคชัน
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                กำลังโหลดข้อมูล...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {isLoadingTypes
                  ? "กำลังโหลดประเภท..."
                  : isLoadingCategories
                  ? "กำลังโหลดหมวดหมู่..."
                  : "กำลังโหลดข้อมูลผู้ใช้..."}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">❌ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              โหลดใหม่
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
                        activeTab === tab.id
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Success Message */}
                {showSuccessMessage && (
                  <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
                    <span className="text-lg">✅</span>
                    <span className="font-medium">บันทึกข้อมูลสำเร็จ!</span>
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-light text-gray-900 dark:text-white">
                          ข้อมูลส่วนตัว
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          จัดการข้อมูลโปรไฟล์ของคุณ
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2 text-sm font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={
                                isSaving ||
                                !userData.firstName.trim() ||
                                !userData.lastName.trim() ||
                                !userData.email.trim() ||
                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                  userData.email
                                )
                              }
                              className="px-4 py-2 text-sm font-light bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm font-light border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            แก้ไข
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Profile Image */}
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          {userData.profileImage ? (
                            <img
                              src={userData.profileImage}
                              alt="Profile"
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl text-gray-500 dark:text-gray-400">
                              {userData.firstName.charAt(0)}
                              {userData.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={handleProfileImageUpload}
                            className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center text-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                            title="เปลี่ยนรูปโปรไฟล์"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-light text-gray-900 dark:text-white">
                          {userData.firstName || userData.lastName
                            ? `${userData.firstName} ${userData.lastName}`.trim()
                            : "ไม่ระบุชื่อ"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {userData.email || "ไม่ระบุอีเมล"}
                        </p>
                        {userData.occupation && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {userData.occupation}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">
                          ❌ {error}
                        </p>
                      </div>
                    )}

                    {/* Profile Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          ชื่อ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={userData.firstName}
                          placeholder="กรอกชื่อของคุณ"
                          onChange={(e) => {
                            setUserData({
                              ...userData,
                              firstName: e.target.value,
                            });
                            // Clear error when user starts typing
                            if (error && error.includes("ชื่อ")) {
                              setError(null);
                            }
                          }}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors ${
                            isEditing && userData.firstName.trim() === ""
                              ? "border-red-300 dark:border-red-600"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {isEditing && userData.firstName.trim() === "" && (
                          <p className="text-red-500 text-xs mt-1">
                            กรุณากรอกชื่อ
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={userData.lastName}
                          placeholder="กรอกนามสกุลของคุณ"
                          onChange={(e) => {
                            setUserData({
                              ...userData,
                              lastName: e.target.value,
                            });
                            // Clear error when user starts typing
                            if (error && error.includes("นามสกุล")) {
                              setError(null);
                            }
                          }}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors ${
                            isEditing && userData.lastName.trim() === ""
                              ? "border-red-300 dark:border-red-600"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {isEditing && userData.lastName.trim() === "" && (
                          <p className="text-red-500 text-xs mt-1">
                            กรุณากรอกนามสกุล
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          อีเมล <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={userData.email}
                          placeholder="กรอกอีเมลของคุณ"
                          onChange={(e) => {
                            setUserData({ ...userData, email: e.target.value });
                            // Clear error when user starts typing
                            if (error && error.includes("อีเมล")) {
                              setError(null);
                            }
                          }}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors ${
                            isEditing &&
                            (userData.email.trim() === "" ||
                              (userData.email &&
                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                  userData.email
                                )))
                              ? "border-red-300 dark:border-red-600"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {isEditing && userData.email.trim() === "" && (
                          <p className="text-red-500 text-xs mt-1">
                            กรุณากรอกอีเมล
                          </p>
                        )}
                        {isEditing &&
                          userData.email &&
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email) &&
                          userData.email.trim() !== "" && (
                            <p className="text-red-500 text-xs mt-1">
                              รูปแบบอีเมลไม่ถูกต้อง
                            </p>
                          )}
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          เบอร์โทรศัพท์
                        </label>
                        <input
                          type="tel"
                          value={userData.phone}
                          onChange={(e) =>
                            setUserData({ ...userData, phone: e.target.value })
                          }
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          วันเกิด
                        </label>
                        <input
                          type="date"
                          value={userData.birthDate}
                          max={new Date().toISOString().split("T")[0]} // ไม่ให้เลือกวันในอนาคต
                          onChange={(e) => {
                            setUserData({
                              ...userData,
                              birthDate: e.target.value,
                            });
                            // Clear error when user changes birth date
                            if (error && error.includes("วันเกิด")) {
                              setError(null);
                            }
                          }}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        />
                        {isEditing &&
                          userData.birthDate &&
                          new Date(userData.birthDate) > new Date() && (
                            <p className="text-red-500 text-xs mt-1">
                              วันเกิดไม่สามารถเป็นวันในอนาคตได้
                            </p>
                          )}
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          อาชีพ
                        </label>
                        <input
                          type="text"
                          value={userData.occupation}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              occupation: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          เขตเวลา
                        </label>
                        <select
                          value={userData.timezone}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              timezone: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                        >
                          <option value="Asia/Bangkok">
                            Asia/Bangkok (GMT+7)
                          </option>
                          <option value="Asia/Jakarta">
                            Asia/Jakarta (GMT+7)
                          </option>
                          <option value="Asia/Ho_Chi_Minh">
                            Asia/Ho_Chi_Minh (GMT+7)
                          </option>
                          <option value="Asia/Singapore">
                            Asia/Singapore (GMT+8)
                          </option>
                          <option value="Asia/Manila">
                            Asia/Manila (GMT+8)
                          </option>
                          <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                          <option value="America/New_York">
                            America/New_York (GMT-5)
                          </option>
                          <option value="Europe/London">
                            Europe/London (GMT+0)
                          </option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                          ที่อยู่
                        </label>
                        <textarea
                          value={userData.address}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              address: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors resize-none"
                        />
                      </div>

                      {/* Account Info - Read Only */}
                      <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-light text-gray-900 dark:text-white mb-4">
                          ข้อมูลบัญชี
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                              บทบาท
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  userData.role === "admin"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : userData.role === "owner"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                }`}
                              >
                                {userData.role === "admin"
                                  ? "👑 ผู้ดูแลระบบ"
                                  : userData.role === "owner"
                                  ? "🏆 เจ้าของ"
                                  : "👤 สมาชิก"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                              สถานะบัญชี
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  userData.status === "active"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : userData.status === "inactive"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {userData.status === "active"
                                  ? "✅ ใช้งานได้"
                                  : userData.status === "inactive"
                                  ? "⏸️ ไม่ใช้งาน"
                                  : "🚫 ถูกระงับ"}
                              </span>
                            </div>
                          </div>
                          {userData.birthDate && (
                            <div>
                              <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                                วันเกิด
                              </label>
                              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  🎂 {formatDateForDisplay(userData.birthDate)}
                                </span>
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                              User ID
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <span className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                                {currentUserId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-light text-gray-900 dark:text-white">
                        ความปลอดภัย
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        จัดการรหัสผ่านและการตั้งค่าความปลอดภัย
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Change Password */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-light text-gray-900 dark:text-white">
                              เปลี่ยนรหัสผ่าน
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              อัปเดตรหัสผ่านของคุณเพื่อความปลอดภัย
                            </p>
                          </div>
                          <button
                            onClick={() => setShowChangePasswordModal(true)}
                            className="px-4 py-2 text-sm font-light bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                          >
                            เปลี่ยนรหัสผ่าน
                          </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-green-500">🔒</span>
                            <span>
                              รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร
                              และประกอบด้วยตัวเลข เครื่องหมาย
                              และตัวอักษรภาษาอังกฤษ
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-light text-gray-900 dark:text-white">
                              การยืนยันตัวตนแบบสองขั้นตอน
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              เพิ่มความปลอดภัยให้กับบัญชีของคุณ
                            </p>
                          </div>
                          <button
                            onClick={handleToggleTwoFactor}
                            disabled={isSaving}
                            className={`px-4 py-2 text-sm font-light border rounded-lg transition-colors ${
                              twoFactorEnabled
                                ? "border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            } disabled:opacity-50`}
                          >
                            {isSaving
                              ? "กำลังประมวลผล..."
                              : twoFactorEnabled
                              ? "ปิดใช้งาน"
                              : "เปิดใช้งาน"}
                          </button>
                        </div>
                      </div>

                      {/* Login History */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-base font-light text-gray-900 dark:text-white mb-4">
                          ประวัติการเข้าสู่ระบบ
                        </h3>
                        {isLoadingLogs ? (
                          <div className="text-center py-4">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              กำลังโหลด...
                            </p>
                          </div>
                        ) : !Array.isArray(auditLogs) ||
                          auditLogs.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ไม่พบประวัติการเข้าสู่ระบบ
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {toArray(auditLogs).map((log, index) => {
                              const logDate = new Date(log.created_at);
                              const formattedDate = logDate.toLocaleDateString(
                                "th-TH",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              );
                              const formattedTime = logDate.toLocaleTimeString(
                                "th-TH",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              );

                              // Parse user agent for device info
                              const userAgent = log.user_agent || "";
                              let deviceInfo = "Unknown Device";
                              if (userAgent.includes("Chrome"))
                                deviceInfo = "Chrome";
                              if (
                                userAgent.includes("Safari") &&
                                !userAgent.includes("Chrome")
                              )
                                deviceInfo = "Safari";
                              if (userAgent.includes("Firefox"))
                                deviceInfo = "Firefox";
                              if (userAgent.includes("Windows"))
                                deviceInfo += " บน Windows";
                              else if (userAgent.includes("Mac"))
                                deviceInfo += " บน Mac";
                              else if (userAgent.includes("iPhone"))
                                deviceInfo += " บน iPhone";
                              else if (userAgent.includes("Android"))
                                deviceInfo += " บน Android";

                              return (
                                <div
                                  key={log.audit_log_id}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-light text-gray-900 dark:text-white">
                                      {deviceInfo}
                                      {index === 0 && (
                                        <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                                          เซสชันปัจจุบัน
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {log.ip_address || "Unknown IP"} •{" "}
                                      {formattedDate}, {formattedTime}
                                    </p>
                                  </div>
                                  {index !== 0 && (
                                    <button
                                      onClick={() =>
                                        handleRevokeSession(log.audit_log_id)
                                      }
                                      disabled={isSaving}
                                      className="px-2 py-1 text-xs font-light border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      ยกเลิกเซสชัน
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-light text-gray-900 dark:text-white">
                        การแจ้งเตือน
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        จัดการการแจ้งเตือนและการติดต่อจากแอป
                      </p>
                    </div>

                    <div className="space-y-6">
                      {[
                        {
                          key: "emailNotifications",
                          title: "การแจ้งเตือนทางอีเมล",
                          description: "รับการแจ้งเตือนผ่านอีเมล",
                        },
                        {
                          key: "pushNotifications",
                          title: "การแจ้งเตือนแบบ Push",
                          description: "รับการแจ้งเตือนบนอุปกรณ์",
                        },
                        {
                          key: "budgetAlerts",
                          title: "แจ้งเตือนงบประมาณ",
                          description: "แจ้งเตือนเมื่องบประมาณใกล้หมด",
                        },
                        {
                          key: "goalReminders",
                          title: "แจ้งเตือนเป้าหมาย",
                          description: "แจ้งเตือนความคืบหน้าเป้าหมาย",
                        },
                        {
                          key: "billReminders",
                          title: "แจ้งเตือนบิล",
                          description: "แจ้งเตือนการชำระบิลที่ค้างชำระ",
                        },
                        {
                          key: "debtAlerts",
                          title: "แจ้งเตือนหนี้สิน",
                          description: "แจ้งเตือนหนี้สินที่เกินกำหนด",
                        },
                      ].map((setting) => (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div>
                            <h3 className="text-sm font-light text-gray-900 dark:text-white">
                              {setting.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                notificationSettings[
                                  setting.key as keyof typeof notificationSettings
                                ]
                              }
                              onChange={(e) =>
                                handleNotificationChange(
                                  setting.key,
                                  e.target.checked
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-white"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories Tab */}
                {activeTab === "categories" && (
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-light text-gray-900 dark:text-white">
                            จัดการหมวดหมู่
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            กำหนดและจัดการหมวดหมู่สำหรับรายรับและรายจ่าย
                          </p>
                          {(categoryError || typesError) && (
                            <div className="text-sm mt-2 space-y-1">
                              {typesError && (
                                <p className="text-red-500 dark:text-red-400">
                                  ❌ ประเภท: {typesError}
                                </p>
                              )}
                              {categoryError && (
                                <p className="text-red-500 dark:text-red-400">
                                  ❌ หมวดหมู่: {categoryError}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              setIsSaving(true);
                              try {
                                await refreshTypes();
                                await refreshCategories();
                                alert("รีเฟรชข้อมูลสำเร็จ! 🎉");
                              } catch (error) {
                                console.error("Failed to refresh data:", error);
                                alert(
                                  "ไม่สามารถรีเฟรชข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
                                );
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={
                              isSaving || isLoadingTypes || isLoadingCategories
                            }
                            className="px-3 py-1.5 text-sm font-light border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 flex items-center space-x-1"
                            title="รีเฟรชข้อมูลประเภทและหมวดหมู่"
                          >
                            <span>🔄</span>
                            <span className="hidden sm:inline">รีเฟรช</span>
                          </button>
                          <button
                            onClick={handleResetCategories}
                            disabled={isSaving || isLoadingCategories}
                            className="px-3 py-1.5 text-sm font-light border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50 flex items-center space-x-1"
                            title="รีเซ็ตหมวดหมู่กลับเป็นค่าเริ่มต้น"
                          >
                            <span>🔄</span>
                            <span className="hidden sm:inline">รีเซ็ต</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {(isLoadingCategories || isLoadingTypes) && (
                      <div className="flex items-center justify-center py-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                          <span>
                            {isLoadingTypes
                              ? "กำลังโหลดประเภท..."
                              : isLoadingCategories
                              ? "กำลังโหลดหมวดหมู่..."
                              : "กำลังซิงค์ข้อมูล..."}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">📝</span>
                          </div>
                          <div>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                              ประเภท
                            </p>
                            <p className="text-2xl font-light text-purple-700 dark:text-purple-300">
                              {types.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">📈</span>
                          </div>
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              หมวดหมู่รายรับ
                            </p>
                            <p className="text-2xl font-light text-green-700 dark:text-green-300">
                              {categories.income.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">📉</span>
                          </div>
                          <div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                              หมวดหมู่รายจ่าย
                            </p>
                            <p className="text-2xl font-light text-red-700 dark:text-red-300">
                              {categories.expense.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">📊</span>
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                              รวมหมวดหมู่
                            </p>
                            <p className="text-2xl font-light text-blue-700 dark:text-blue-300">
                              {categories.income.length +
                                categories.expense.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Income Categories */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-light text-gray-900 dark:text-white flex items-center space-x-2">
                            <span className="text-green-500">📈</span>
                            <span>หมวดหมู่รายรับ</span>
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                              {categories.income.length}
                            </span>
                          </h3>
                          <button
                            onClick={() => handleAddCategory("income")}
                            className="px-3 py-1.5 text-sm font-light bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <span>+</span>
                            <span>เพิ่ม</span>
                          </button>
                        </div>
                        {categories.income.length === 0 ? (
                          <div className="col-span-full text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            <div className="text-gray-400 dark:text-gray-500 mb-2">
                              <span className="text-4xl">📈</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              ยังไม่มีหมวดหมู่รายรับ
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              คลิก "เพิ่ม" เพื่อสร้างหมวดหมู่แรกของคุณ
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {categories.income.map((category) => (
                              <div
                                key={category.id}
                                className="group p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors relative hover:shadow-md"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className="text-lg"
                                      style={{
                                        filter: `hue-rotate(${
                                          category.color === "#22c55e"
                                            ? "0deg"
                                            : "180deg"
                                        })`,
                                      }}
                                    >
                                      {category.icon}
                                    </span>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-light text-gray-900 dark:text-white truncate">
                                        {category.name}
                                      </span>
                                      {category.type_id && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {
                                            types.find(
                                              (t) =>
                                                String(t.id) ===
                                                String(category.type_id)
                                            )?.icon
                                          }{" "}
                                          {category.type_name ||
                                            types.find(
                                              (t) =>
                                                String(t.id) ===
                                                String(category.type_id)
                                            )?.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="w-full h-1 rounded-full mb-2"
                                  style={{ backgroundColor: category.color }}
                                ></div>

                                {/* Action Buttons - Always visible */}
                                <div className="flex justify-end space-x-2 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditCategory(category, "income");
                                    }}
                                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs flex items-center space-x-1 transition-all duration-200 hover:scale-105 shadow-md"
                                    title="แก้ไขหมวดหมู่"
                                  >
                                    <span>✏️</span>
                                    <span className="hidden sm:inline">
                                      แก้ไข
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteCategory(
                                        category.id,
                                        "income"
                                      );
                                    }}
                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs flex items-center space-x-1 transition-all duration-200 hover:scale-105 shadow-md"
                                    title="ลบหมวดหมู่"
                                  >
                                    <span>🗑️</span>
                                    <span className="hidden sm:inline">ลบ</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expense Categories */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-light text-gray-900 dark:text-white flex items-center space-x-2">
                            <span className="text-red-500">📉</span>
                            <span>หมวดหมู่รายจ่าย</span>
                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                              {categories.expense.length}
                            </span>
                          </h3>
                          <button
                            onClick={() => handleAddCategory("expense")}
                            className="px-3 py-1.5 text-sm font-light bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <span>+</span>
                            <span>เพิ่ม</span>
                          </button>
                        </div>
                        {categories.expense.length === 0 ? (
                          <div className="col-span-full text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            <div className="text-gray-400 dark:text-gray-500 mb-2">
                              <span className="text-4xl">📉</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              ยังไม่มีหมวดหมู่รายจ่าย
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              คลิก "เพิ่ม" เพื่อสร้างหมวดหมู่แรกของคุณ
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {categories.expense.map((category) => (
                              <div
                                key={category.id}
                                className="group p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-600 transition-colors relative hover:shadow-md"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">
                                      {category.icon}
                                    </span>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-light text-gray-900 dark:text-white truncate">
                                        {category.name}
                                      </span>
                                      {category.type_id && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {
                                            types.find(
                                              (t) =>
                                                String(t.id) ===
                                                String(category.type_id)
                                            )?.icon
                                          }{" "}
                                          {category.type_name ||
                                            types.find(
                                              (t) =>
                                                String(t.id) ===
                                                String(category.type_id)
                                            )?.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="w-full h-1 rounded-full mb-2"
                                  style={{ backgroundColor: category.color }}
                                ></div>

                                {/* Action Buttons - Always visible */}
                                <div className="flex justify-end space-x-2 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditCategory(category, "expense");
                                    }}
                                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs flex items-center space-x-1 transition-all duration-200 hover:scale-105 shadow-md"
                                    title="แก้ไขหมวดหมู่"
                                  >
                                    <span>✏️</span>
                                    <span className="hidden sm:inline">
                                      แก้ไข
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteCategory(
                                        category.id,
                                        "expense"
                                      );
                                    }}
                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs flex items-center space-x-1 transition-all duration-200 hover:scale-105 shadow-md"
                                    title="ลบหมวดหมู่"
                                  >
                                    <span>🗑️</span>
                                    <span className="hidden sm:inline">ลบ</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === "preferences" && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-light text-gray-900 dark:text-white">
                        การตั้งค่าแอป
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ปรับแต่งการแสดงผลและการทำงานของแอป
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            ธีม
                          </label>
                          <select
                            value={appPreferences.theme}
                            onChange={(e) =>
                              handlePreferenceChange("theme", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          >
                            <option value="auto">อัตโนมัติ</option>
                            <option value="light">สว่าง</option>
                            <option value="dark">มืด</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            ภาษา
                          </label>
                          <select
                            value={appPreferences.language}
                            onChange={(e) =>
                              handlePreferenceChange("language", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          >
                            <option value="th">ไทย</option>
                            <option value="en">English</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            สกุลเงิน
                          </label>
                          <select
                            value={appPreferences.currency}
                            onChange={(e) =>
                              handlePreferenceChange("currency", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          >
                            <option value="THB">บาท (฿)</option>
                            <option value="USD">ดอลลาร์ ($)</option>
                            <option value="EUR">ยูโร (€)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            รูปแบบวันที่
                          </label>
                          <select
                            value={appPreferences.dateFormat}
                            onChange={(e) =>
                              handlePreferenceChange(
                                "dateFormat",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          >
                            <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                            <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                            วันแรกของสัปดาห์
                          </label>
                          <select
                            value={appPreferences.startOfWeek}
                            onChange={(e) =>
                              handlePreferenceChange(
                                "startOfWeek",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-light focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
                          >
                            <option value="sunday">วันอาทิตย์</option>
                            <option value="monday">วันจันทร์</option>
                          </select>
                        </div>
                      </div>

                      {/* Data Management */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-base font-light text-gray-900 dark:text-white mb-4">
                          การจัดการข้อมูล
                        </h3>
                        <div className="space-y-3">
                          <button
                            onClick={handleExportData}
                            className="w-full px-4 py-2 text-sm font-light border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            📤 ส่งออกข้อมูล
                          </button>
                          <button
                            onClick={handleClearCache}
                            disabled={isSaving}
                            className="w-full px-4 py-2 text-sm font-light border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                          >
                            🗑️ {isSaving ? "กำลังล้าง..." : "ล้างข้อมูลแคช"}
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            className="w-full px-4 py-2 text-sm font-light border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                          >
                            ⚠️ ลบบัญชี
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Types Tab */}
                {activeTab === "types" && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-light text-gray-900 dark:text-white">
                          จัดการประเภท
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          จัดการประเภทสำหรับจำแนกข้อมูลต่างๆ ในระบบ
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={refreshTypes}
                          disabled={isLoadingTypes}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                        >
                          <span>🔄</span>
                          <span>{isLoadingTypes ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
                        </button>
                        <button
                          onClick={handleAddType}
                          disabled={isSaving}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                        >
                          <span>➕</span>
                          <span>เพิ่มประเภท</span>
                        </button>
                      </div>
                    </div>

                    {isLoadingTypes && (
                      <div className="flex items-center justify-center py-6">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mb-2"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            กำลังโหลดข้อมูล...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              ประเภททั้งหมด
                            </p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {types.length}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📝</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              ใช้งาน
                            </p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                              {types.filter((t) => t.is_active).length}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <span className="text-lg">✅</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              ไม่ใช้งาน
                            </p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                              {types.filter((t) => !t.is_active).length}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                            <span className="text-lg">❌</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Error Display for Types */}
                    {typesError && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-red-500 text-lg">⚠️</span>
                          <div>
                            <p className="text-red-600 dark:text-red-400 font-medium">เกิดข้อผิดพลาดในการโหลดประเภท</p>
                            <p className="text-red-500 dark:text-red-300 text-sm mt-1">{typesError}</p>
                          </div>
                        </div>
                        <button
                          onClick={refreshTypes}
                          disabled={isLoadingTypes}
                          className="mt-3 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                          {isLoadingTypes ? 'กำลังโหลด...' : 'ลองใหม่'}
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {isLoadingTypes ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-400">กำลังโหลดประเภท...</p>
                        </div>
                      ) : types.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-4">📝</div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {typesError ? 'ไม่สามารถโหลดประเภทได้' : 'ยังไม่มีประเภท'}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {typesError ? 'กรุณาลองโหลดใหม่อีกครั้ง' : 'เริ่มต้นสร้างประเภทแรกของคุณ'}
                          </p>
                          <div className="space-x-2">
                            {typesError ? (
                              <button
                                onClick={refreshTypes}
                                disabled={isLoadingTypes}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                {isLoadingTypes ? 'กำลังโหลด...' : 'ลองใหม่'}
                              </button>
                            ) : (
                              <button
                                onClick={handleAddType}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                เพิ่มประเภทใหม่
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Debug info
                          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                            Debug: types = {JSON.stringify(types.slice(0,2))}
                            <br />Loading = {isLoadingTypes.toString()}, Error = {typesError || 'none'}
                            <br />Array length = {types.length} */}
                          {/* </div> */}
                          {types.map((type) => (
                            <div
                              key={type.id}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                                  style={{
                                    backgroundColor: type.color + "20",
                                    color: type.color,
                                  }}
                                >
                                  <span className="text-lg">{type.icon}</span>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                      {type.name}
                                    </h3>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        type.is_active
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                      }`}
                                    >
                                      {type.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}
                                    </span>
                                  </div>
                                  {type.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {type.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleToggleTypeStatus(type)}
                                  disabled={isSaving}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                    type.is_active
                                      ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                                      : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                                  }`}
                                >
                                  {type.is_active ? "ปิด" : "เปิด"}
                                </button>
                                <button
                                  onClick={() => handleEditType(type)}
                                  disabled={isSaving}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium disabled:opacity-50 dark:bg-blue-900 dark:text-blue-300"
                                >
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteType(type.id, type.name)
                                  }
                                  disabled={isSaving}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                                >
                                  ลบ
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity backdrop-blur-sm"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setError(null);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🔒</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        เปลี่ยนรหัสผ่าน
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowChangePasswordModal(false);
                        setError(null);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  {/* Error Display */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        ❌ {error}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รหัสผ่านปัจจุบัน
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                          passwordData.currentPassword.length > 0 &&
                          passwordData.currentPassword.length < 6
                            ? "border-red-300 dark:border-red-600"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                        placeholder="กรอกรหัสผ่านปัจจุบัน"
                      />
                      {passwordData.currentPassword.length > 0 &&
                        passwordData.currentPassword.length < 6 && (
                          <p className="text-red-500 text-xs mt-1">
                            รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
                          </p>
                        )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รหัสผ่านใหม่
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                          passwordData.newPassword.length > 0 &&
                          passwordData.newPassword.length < 6
                            ? "border-red-300 dark:border-red-600"
                            : passwordData.newPassword.length >= 6
                            ? "border-green-300 dark:border-green-600"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                        placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                      />
                      {passwordData.newPassword.length > 0 &&
                        passwordData.newPassword.length < 6 && (
                          <p className="text-red-500 text-xs mt-1">
                            รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร
                          </p>
                        )}
                      {passwordData.newPassword.length >= 6 && (
                        <p className="text-green-500 text-xs mt-1">
                          ✓ รหัสผ่านใหม่ถูกต้อง
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ยืนยันรหัสผ่านใหม่
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                          passwordData.confirmPassword.length > 0 &&
                          passwordData.newPassword !==
                            passwordData.confirmPassword
                            ? "border-red-300 dark:border-red-600"
                            : passwordData.confirmPassword.length > 0 &&
                              passwordData.newPassword ===
                                passwordData.confirmPassword &&
                              passwordData.newPassword.length >= 6
                            ? "border-green-300 dark:border-green-600"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                        placeholder="ยืนยันรหัสผ่านใหม่"
                      />
                      {passwordData.confirmPassword.length > 0 &&
                        passwordData.newPassword !==
                          passwordData.confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">
                            รหัสผ่านไม่ตรงกัน
                          </p>
                        )}
                      {passwordData.confirmPassword.length > 0 &&
                        passwordData.newPassword ===
                          passwordData.confirmPassword &&
                        passwordData.newPassword.length >= 6 && (
                          <p className="text-green-500 text-xs mt-1">
                            ✓ รหัสผ่านตรงกัน
                          </p>
                        )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <p className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-2">
                        📋 ข้อกำหนดรหัสผ่าน:
                      </p>
                      <ul className="text-blue-600 dark:text-blue-400 text-xs space-y-1">
                        <li
                          className={
                            passwordData.newPassword.length >= 6
                              ? "text-green-600 dark:text-green-400"
                              : ""
                          }
                        >
                          {passwordData.newPassword.length >= 6 ? "✓" : "•"}{" "}
                          อย่างน้อย 6 ตัวอักษร
                        </li>
                        <li
                          className={
                            passwordData.newPassword !==
                              passwordData.confirmPassword ||
                            passwordData.confirmPassword.length === 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-green-600 dark:text-green-400"
                          }
                        >
                          {passwordData.newPassword ===
                            passwordData.confirmPassword &&
                          passwordData.confirmPassword.length > 0
                            ? "✓"
                            : "•"}{" "}
                          รหัสผ่านใหม่และยืนยันต้องตรงกัน
                        </li>
                        <li
                          className={
                            passwordData.currentPassword.length >= 6
                              ? "text-green-600 dark:text-green-400"
                              : ""
                          }
                        >
                          {passwordData.currentPassword.length >= 6 ? "✓" : "•"}{" "}
                          กรอกรหัสผ่านปัจจุบันถูกต้อง
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowChangePasswordModal(false);
                        setError(null);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        isSaving ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword ||
                        passwordData.currentPassword.length < 6 ||
                        passwordData.newPassword.length < 6 ||
                        passwordData.newPassword !==
                          passwordData.confirmPassword
                      }
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isSaving ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity backdrop-blur-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-red-200 dark:border-red-700">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">⚠️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">ลบบัญชี</h3>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-red-600 dark:text-red-400 text-2xl">
                        ⚠️
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      คุณแน่ใจหรือไม่?
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      การลบบัญชีนี้จะไม่สามารถยกเลิกได้
                      ข้อมูลทั้งหมดของคุณจะถูกลบอย่างถาวร
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        • ข้อมูลส่วนตัวทั้งหมด
                        <br />
                        • ประวัติการทำธุรกรรม
                        <br />
                        • เป้าหมายการออมและงบประมาณ
                        <br />• การตั้งค่าและคำแนะนำ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={confirmDeleteAccount}
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isSaving ? "กำลังลบ..." : "ลบบัญชีถาวร"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {categoryModalType && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity backdrop-blur-sm"
                onClick={() => setCategoryModalType(null)}
              >
                <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div
                  className={`relative bg-gradient-to-r px-6 py-4 ${
                    categoryModalType === "income"
                      ? "from-green-500 to-emerald-600"
                      : "from-red-500 to-red-600"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">
                          {categoryModalType === "income" ? "📈" : "📉"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {editingCategory ? "แก้ไข" : "เพิ่ม"}หมวดหมู่
                        {categoryModalType === "income" ? "รายรับ" : "รายจ่าย"}
                      </h3>
                    </div>
                    <button
                      onClick={() => setCategoryModalType(null)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อหมวดหมู่
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        placeholder="กรอกชื่อหมวดหมู่"
                      />
                    </div>

                    {/* Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ประเภท
                      </label>
                      <select
                        value={categoryForm.type_id}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            type_id: e.target.value,
                          })
                        }
                        disabled={isLoadingTypes}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {isLoadingTypes
                            ? "กำลังโหลดประเภท..."
                            : "ไม่ระบุประเภท"}
                        </option>
                        {!isLoadingTypes &&
                          types
                            .filter((t) => t.is_active)
                            .map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.icon} {type.name}
                              </option>
                            ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        เลือกประเภทเพื่อจัดกลุ่มหมวดหมู่ (ไม่บังคับ)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ไอคอน
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {predefinedIcons.map((icon) => (
                          <button
                            key={icon}
                            onClick={() =>
                              setCategoryForm({ ...categoryForm, icon })
                            }
                            className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                              categoryForm.icon === icon
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        สี
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              setCategoryForm({ ...categoryForm, color })
                            }
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              categoryForm.color === color
                                ? "border-gray-800 dark:border-white scale-110"
                                : "border-gray-200 dark:border-gray-600 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            {categoryForm.color === color && (
                              <span className="text-white text-lg">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ตัวอย่าง
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{categoryForm.icon}</span>
                        <span className="text-gray-900 dark:text-white">
                          {categoryForm.name || "ชื่อหมวดหมู่"}
                        </span>
                      </div>
                      <div
                        className="w-full h-2 rounded-full mt-2"
                        style={{ backgroundColor: categoryForm.color }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 px-6 py-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCategoryModalType(null)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveCategory}
                      disabled={isSaving || !categoryForm.name.trim()}
                      className={`flex-1 px-6 py-3 bg-gradient-to-r text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                        categoryModalType === "income"
                          ? "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      }`}
                    >
                      {isSaving
                        ? "กำลังบันทึก..."
                        : editingCategory
                        ? "บันทึกการแก้ไข"
                        : "เพิ่มหมวดหมู่"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Type Modal */}
        {showTypeModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity backdrop-blur-sm"
                onClick={() => setShowTypeModal(false)}
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
                        {editingType ? "แก้ไขประเภท" : "เพิ่มประเภทใหม่"}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowTypeModal(false)}
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
                      <div className="grid grid-cols-8 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-xl max-h-32 overflow-y-auto">
                        {predefinedTypeIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setTypeForm({ ...typeForm, icon })}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              typeForm.icon === icon
                                ? "bg-blue-500 text-white shadow-lg"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
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
                            onClick={() => setTypeForm({ ...typeForm, color })}
                            className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                              typeForm.color === color
                                ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800"
                                : ""
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
                            backgroundColor: typeForm.color + "20",
                            color: typeForm.color,
                          }}
                        >
                          <span className="text-lg">{typeForm.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {typeForm.name || "ชื่อประเภท"}
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
                      onClick={() => setShowTypeModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveType}
                      disabled={isSaving || !typeForm.name.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                    >
                      {isSaving
                        ? "กำลังบันทึก..."
                        : editingType
                        ? "บันทึกการแก้ไข"
                        : "เพิ่มประเภท"}
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
}
