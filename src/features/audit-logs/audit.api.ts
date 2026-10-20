import apiClient from '@/lib/api-client';
import type { AuditLog, AuditLogParams } from '@/types';

export const auditApi = {
  /**
   * GET /admin/audit-logs
   * Query system audit logs using backend limit/offset pagination.
   */
  getLogs: async (params?: AuditLogParams): Promise<AuditLog[]> => {
    const queryParams: Record<string, number> = {};

    if (params?.limit !== undefined) {
      queryParams.limit = params.limit;
    } else if (params?.size !== undefined) {
      queryParams.limit = params.size;
    } else {
      queryParams.limit = 50;
    }

    if (params?.offset !== undefined) {
      queryParams.offset = params.offset;
    } else if (params?.page !== undefined && queryParams.limit) {
      queryParams.offset = (params.page - 1) * queryParams.limit;
    } else {
      queryParams.offset = 0;
    }

    const { data } = await apiClient.get<AuditLog[]>('/admin/audit-logs', {
      params: queryParams,
    });
    return Array.isArray(data) ? data : [];
  },
};
