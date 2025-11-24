"use client";

import Cookies from "js-cookie";

const AUTH_STORAGE_KEYS = {
  accessToken: "krapaoshare_access_token",
  refreshToken: "krapaoshare_refresh_token",
  expiresAt: "krapaoshare_expires_at",
  user: "krapaoshare_user",
};

const AUTH_COOKIE_KEYS = {
  accessToken: "kp_access_token",
  refreshToken: "kp_refresh_token",
};

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string | null;
  user: Record<string, unknown>;
};

export const saveAuthData = (data: AuthPayload) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, data.accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, data.refreshToken);
  localStorage.setItem(
    AUTH_STORAGE_KEYS.expiresAt,
    data.expiresAt ?? ""
  );
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(data.user));

  Cookies.set(AUTH_COOKIE_KEYS.accessToken, data.accessToken, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  Cookies.set(AUTH_COOKIE_KEYS.refreshToken, data.refreshToken, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const clearAuthData = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.expiresAt);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);

  Cookies.remove(AUTH_COOKIE_KEYS.accessToken);
  Cookies.remove(AUTH_COOKIE_KEYS.refreshToken);
};

export const getStoredTokens = () => {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };

  return {
    accessToken:
      localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
      Cookies.get(AUTH_COOKIE_KEYS.accessToken) ||
      null,
    refreshToken:
      localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken) ||
      Cookies.get(AUTH_COOKIE_KEYS.refreshToken) ||
      null,
  };
};

export const setStoredTokens = (
  accessToken: string,
  refreshToken: string,
  expiresAt?: string
) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  if (expiresAt) {
    localStorage.setItem(AUTH_STORAGE_KEYS.expiresAt, expiresAt);
  }

  Cookies.set(AUTH_COOKIE_KEYS.accessToken, accessToken, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  Cookies.set(AUTH_COOKIE_KEYS.refreshToken, refreshToken, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const userRaw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
  return userRaw ? JSON.parse(userRaw) : null;
};

export const setStoredUser = (user: Record<string, unknown> | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
};