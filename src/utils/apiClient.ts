"use client";

import { getStoredTokens } from "./authStorage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

type RequestConfig = RequestInit & {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data: T;
};

const buildUrl = (endpoint: string) => {
  if (endpoint.startsWith("http")) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function unwrapResponse<T>(payload: unknown): T {
  if (isJsonObject(payload) && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestConfig = {}
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const url = buildUrl(endpoint);
  const config: RequestInit = {
    ...rest,
    headers: {
      ...headers,
    },
  };

  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;

  if (!isFormData) {
    (config.headers as HeadersInit) = {
      "Content-Type": "application/json",
      ...config.headers,
    };
  }

  if (!skipAuth) {
    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      throw new ApiError("ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่", 401);
    }

    (config.headers as HeadersInit) = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type") ?? "";
  const expectsBody = response.status !== 204 && response.status !== 205;
  const isJson = expectsBody && contentType.includes("application/json");
  const data = expectsBody
    ? isJson
      ? await response.json().catch(() => null)
      : await response.text()
    : null;

  if (!response.ok) {
    const message =
      (isJson && isJsonObject(data) &&
        (data.message as string | undefined || data.error as string | undefined)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  if (!expectsBody) {
    return undefined as T;
  }

  return unwrapResponse<T>(data);
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }),
  delete: <T = unknown>(endpoint: string, options?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

export { API_BASE_URL };
