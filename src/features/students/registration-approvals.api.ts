import apiClient from '@/lib/api-client';
import type {
  PendingRegistration,
  PendingRegistrationsParams,
  ApproveRegistrationRequest,
  RejectRegistrationRequest,
  RejectRegistrationResponse,
  Student,
} from '@/types';

export const registrationApprovalsApi = {
  /**
   * GET /admin/users/pending-registrations
   * Admin-only: Query student registrations awaiting approval.
   */
  getPendingRegistrations: async (
    params?: PendingRegistrationsParams
  ): Promise<PendingRegistration[]> => {
    const { data } = await apiClient.get<PendingRegistration[]>(
      '/admin/users/pending-registrations',
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * POST /admin/users/{user_id}/approve
   * Admin-only: Approve pending student registration, activate account, and notify student.
   * Remarks are optional (max 255 chars).
   */
  approveRegistration: async (
    userId: string,
    payload?: ApproveRegistrationRequest
  ): Promise<Student> => {
    if (!userId || !userId.trim()) {
      throw new Error('User ID is required for approval.');
    }

    const cleanPayload: ApproveRegistrationRequest = {
      remarks: payload?.remarks?.trim() ? payload.remarks.trim() : null,
    };

    if (cleanPayload.remarks && cleanPayload.remarks.length > 255) {
      throw new Error('Approval remarks cannot exceed 255 characters.');
    }

    const { data } = await apiClient.post<Student>(
      `/admin/users/${userId}/approve`,
      cleanPayload
    );
    return data;
  },

  /**
   * POST /admin/users/{user_id}/reject
   * Admin-only: Reject pending student registration with reason and notify applicant.
   * Reason is strictly required by the backend contract (1 to 255 characters).
   */
  rejectRegistration: async (
    userId: string,
    payload: RejectRegistrationRequest
  ): Promise<RejectRegistrationResponse> => {
    if (!userId || !userId.trim()) {
      throw new Error('User ID is required for rejection.');
    }

    const trimmedReason = payload?.reason?.trim();
    if (!trimmedReason) {
      throw new Error('A rejection reason is required (1 to 255 characters).');
    }
    if (trimmedReason.length > 255) {
      throw new Error('Rejection reason cannot exceed 255 characters.');
    }

    const { data } = await apiClient.post<RejectRegistrationResponse>(
      `/admin/users/${userId}/reject`,
      { reason: trimmedReason }
    );
    return data;
  },
};
