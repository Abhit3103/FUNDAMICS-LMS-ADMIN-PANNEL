import apiClient from '@/lib/api-client';
import type { AuditLog } from '@/types';

export const auditApi = {
  getLogs: async (params?: { page?: number; size?: number }): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<AuditLog[]>('/admin/audit-logs', { params });
    return data;
  },
};
