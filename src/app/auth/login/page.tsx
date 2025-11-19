"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import InputField from "@/components/auth/InputField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { saveAuthData } from "@/utils/authStorage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const googleCode = searchParams?.get("code");
  const googleState = searchParams?.get("state");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/login`);
      if (!response.ok) {
        throw new Error("ไม่สามารถเชื่อมต่อ Google OAuth ได้");
      }

      const data = await response.json().catch(() => null);

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrors({ general: "ไม่สามารถเชื่อมต่อ Google OAuth ได้" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage =
          result?.message || result?.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
        setErrors({ general: errorMessage });
        return;
      }

      const authData = result?.data;
      if (!authData?.accessToken || !authData?.refreshToken || !authData?.user) {
        setErrors({
          general: "ข้อมูลการเข้าสู่ระบบไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง",
        });
        return;
      }

      saveAuthData({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        expiresAt: authData.expiresAt,
        user: authData.user,
      });

      setSuccessMessage(result?.message || "เข้าสู่ระบบสำเร็จ");
      setFormData({ email: "", password: "" });
      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleCode) return;

    let isCancelled = false;

    const handleGoogleCallback = async () => {
      setLoading(true);
      setErrors({});
      setSuccessMessage("");

      try {
        const params = new URLSearchParams({ code: googleCode });
        if (googleState) {
          params.set("state", googleState);
        }

        const response = await fetch(
          `${API_BASE_URL}/auth/google/callback?${params.toString()}`
        );
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          if (!isCancelled) {
            setErrors({
              general:
                result?.message || "ไม่สามารถเข้าสู่ระบบด้วย Google ได้",
            });
          }
          return;
        }

        const authData = result?.data;
        if (
          !authData?.accessToken ||
          !authData?.refreshToken ||
          !authData?.user
        ) {
          if (!isCancelled) {
            setErrors({ general: "ข้อมูลการเข้าสู่ระบบไม่ครบถ้วน" });
          }
          return;
        }

        saveAuthData({
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          expiresAt: authData.expiresAt,
          user: authData.user,
        });

        if (!isCancelled) {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Google callback error:", error);
        if (!isCancelled) {
          setErrors({ general: "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google" });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    handleGoogleCallback();

    return () => {
      isCancelled = true;
    };
  }, [googleCode, googleState, router]);

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            ยินดีต้อนรับกลับ
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            เข้าสู่ระบบเพื่อจัดการเงินของคุณ
          </p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200 font-light">
              💡 <strong>สำหรับการทดสอบ:</strong> กรอกอีเมลและรหัสผ่านที่ได้จากการลงทะเบียน
            </p>
          </div>
        </div>

        <GoogleButton onClick={handleGoogleLogin} disabled={loading}>
          เข้าสู่ระบบด้วย Google
        </GoogleButton>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              หรือ
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          )}

          <InputField
            name="email"
            type="email"
            placeholder="อีเมล"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <InputField
            name="password"
            type="password"
            placeholder="รหัสผ่าน"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            showPasswordToggle
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          />

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <PrimaryButton type="submit" loading={loading}>
            เข้าสู่ระบบ
          </PrimaryButton>
        </form>

        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
            >
              สมัครใช้งาน
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
          </div>
        </div>
      </AuthLayout>
    }>
      <LoginContent />
    </Suspense>
  );
}