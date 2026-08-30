import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import {
  getAccessToken,
  getAdminAccessToken,
  notifyAuthExpired,
  setAccessToken,
  setAdminAccessToken,
} from "./authToken";

/**
 * Shared axios instance for all backend calls.
 *
 * Cross-origin setup (frontend on Vercel, API on the VPS):
 *   - baseURL is env-driven (NEXT_PUBLIC_API_URL) — never hardcoded.
 *   - withCredentials: true so the httpOnly refresh cookie is sent on
 *     credentialed requests (login, refresh, logout). The browser only
 *     includes it when the API responds with the matching
 *     Access-Control-Allow-Credentials + a specific Allow-Origin (handled by
 *     Caddy at the edge).
 *
 * Access token (short-lived) is attached from the in-memory holder on each
 * request. On a 401 we attempt ONE refresh (single-flight) and retry.
 */
export const api: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach the in-memory access token ──────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isAdminRoute = config.url?.includes("/api/v1/admin") || config.url?.includes("/api/v1/auth/admin");
  const token = isAdminRoute ? getAdminAccessToken() : getAccessToken();
  
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// ── Response: refresh-on-401 with single-flight de-duplication ──────────────
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Endpoints that must NOT trigger the refresh loop.
const NO_REFRESH_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/register",
  "/api/v1/auth/admin/login",
  "/api/v1/auth/admin/refresh",
];

let refreshInFlight: Promise<string | null> | null = null;
let adminRefreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(isAdmin: boolean): Promise<string | null> {
  const refreshUrl = isAdmin 
    ? `${env.apiUrl}/api/v1/auth/admin/refresh`
    : `${env.apiUrl}/api/v1/auth/refresh`;

  try {
    const res = await axios.post<{ access_token: string }>(
      refreshUrl,
      {},
      { withCredentials: true, timeout: 15000 },
    );
    const next = res.data.access_token;
    if (isAdmin) {
      setAdminAccessToken(next);
    } else {
      setAccessToken(next);
    }
    return next;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    const isAuthEndpoint = NO_REFRESH_PATHS.some((p) => url.includes(p));
    if (status !== 401 || !original || original._retried || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retried = true;
    const isAdminRoute = url.includes("/api/v1/admin") || url.includes("/api/v1/auth/admin");

    if (isAdminRoute) {
      adminRefreshInFlight ??= refreshAccessToken(true).finally(() => {
        adminRefreshInFlight = null;
      });
      const newToken = await adminRefreshInFlight;
      if (!newToken) {
        notifyAuthExpired();
        return Promise.reject(error);
      }
      original.headers.set("Authorization", `Bearer ${newToken}`);
    } else {
      refreshInFlight ??= refreshAccessToken(false).finally(() => {
        refreshInFlight = null;
      });
      const newToken = await refreshInFlight;
      if (!newToken) {
        notifyAuthExpired();
        return Promise.reject(error);
      }
      original.headers.set("Authorization", `Bearer ${newToken}`);
    }

    return api(original);
  },
);
