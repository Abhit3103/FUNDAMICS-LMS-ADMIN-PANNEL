/**
 * Centralized Axios API client for FUNDAMICS Admin Panel.
 *
 * SECURITY NOTES:
 * - Access tokens are stored in memory (not localStorage) to reduce XSS risk.
 * - Refresh tokens are stored in memory; a cookie-based approach requires
 *   HttpOnly cookie support from the backend which must be confirmed.
 * - Never log tokens, passwords, or sensitive personal data.
 * - Token values are never included in URLs.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { ApiError, parseApiError } from '@/lib/api-errors';

// ─── In-memory token store ────────────────────────────────────────────────────
// Using module-level variables keeps tokens out of localStorage by default.
// This approach means tokens are lost on page reload; the app will redirect to
// the login page, which is the safer behaviour for an admin panel.

let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _refreshPromise: Promise<string> | null = null;

export const tokenStore = {
  setTokens(access: string, refresh: string): void {
    _accessToken = access;
    _refreshToken = refresh;
  },
  clearTokens(): void {
    _accessToken = null;
    _refreshToken = null;
    _refreshPromise = null;
  },
  getAccessToken(): string | null {
    return _accessToken;
  },
  getRefreshToken(): string | null {
    return _refreshToken;
  },
};

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor: attach Authorization header ─────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ─── Response interceptor: error normalisation + token refresh ────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(new ApiError({ status: 0, message: 'Network error. Please check your connection.' }));
    }

    const status = error.response?.status ?? 0;
    const responseData = error.response?.data;

    // 401: attempt token refresh once, then redirect to login
    if (status === 401) {
      const refreshToken = tokenStore.getRefreshToken();

      if (refreshToken && !_refreshPromise) {
        _refreshPromise = attemptTokenRefresh(refreshToken).finally(() => {
          _refreshPromise = null;
        });
      }

      if (_refreshPromise) {
        try {
          const newToken = await _refreshPromise;
          // Retry the original request with the new token
          if (error.config) {
            const retryConfig: AxiosRequestConfig = { ...error.config };
            retryConfig.headers = {
              ...retryConfig.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return apiClient.request(retryConfig);
          }
        } catch {
          // Refresh failed — clear session and let consumers handle 401
          tokenStore.clearTokens();
        }
      } else {
        // No refresh token available; clear any stale state
        tokenStore.clearTokens();
      }
    }

    const detail = parseApiError(status, responseData);
    return Promise.reject(new ApiError(detail));
  }
);

// ─── Token refresh helper ─────────────────────────────────────────────────────

async function attemptTokenRefresh(refreshToken: string): Promise<string> {
  try {
    const response = await axios.post<{ access_token: string; refresh_token?: string }>(
      `${env.API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 15_000 }
    );
    const { access_token, refresh_token } = response.data;
    tokenStore.setTokens(access_token, refresh_token ?? refreshToken);
    return access_token;
  } catch {
    tokenStore.clearTokens();
    throw new ApiError({ status: 401, message: 'Session expired. Please log in again.' });
  }
}

export default apiClient;
