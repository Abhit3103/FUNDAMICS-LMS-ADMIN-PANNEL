/**
 * Authentication API service.
 * Uses the deployed FUNDAMICS backend contract.
 * Endpoints verified against /api/v1/openapi.json
 */

import apiClient, { tokenStore } from '@/lib/api-client';
import type { LoginRequest, TokenResponse, AuthUser, RefreshRequest, UserRole } from '@/types';

export const authApi = {
  /**
   * POST /auth/login
   * Authenticate an admin user and receive JWT tokens.
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * POST /auth/refresh
   * Exchange a refresh token for a new access token.
   */
  async refresh(request: RefreshRequest): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/refresh', request);
    return data;
  },

  /**
   * GET /auth/me
   * Retrieve the currently authenticated user's profile.
   */
  async getMe(): Promise<AuthUser> {
    const { data } = await apiClient.get<Record<string, unknown>>('/auth/me');
    const roleLower = String(data.role || 'admin').toLowerCase() as UserRole;
    const displayName = (data.name as string) || (data.full_name as string) || 'System Administrator';
    return {
      ...(data as unknown as AuthUser),
      name: displayName,
      full_name: displayName,
      role: roleLower,
      is_active: data.status === 'ACTIVE' || data.is_active === true,
      is_verified: true,
    };
  },

  /**
   * POST /auth/logout
   * Invalidate the current session on the server.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always clear local token state regardless of server response
      tokenStore.clearTokens();
    }
  },
};
