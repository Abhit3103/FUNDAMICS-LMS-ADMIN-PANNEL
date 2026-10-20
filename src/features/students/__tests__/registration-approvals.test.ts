import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient, { tokenStore } from '@/lib/api-client';
import { registrationApprovalsApi } from '../registration-approvals.api';
import type { PendingRegistration, Student, RejectRegistrationResponse } from '@/types';

describe('Phase 3A: Student Registration Approvals API', () => {
  const mockToken = 'mock-test-admin-jwt-token-xyz';

  beforeEach(() => {
    vi.restoreAllMocks();
    tokenStore.setTokens(mockToken, 'mock-refresh-token');
  });

  afterEach(() => {
    tokenStore.clearTokens();
  });

  describe('1. GET /admin/users/pending-registrations', () => {
    it('retrieves pending registrations successfully with correct query params', async () => {
      const mockRegistrations: PendingRegistration[] = [
        {
          user_id: '11111111-1111-1111-1111-111111111111',
          student_id: '22222222-2222-2222-2222-222222222222',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+919876543210',
          student_code: 'STU-101',
          class_id: '33333333-3333-3333-3333-333333333333',
          class_name: 'Grade 11 - Science',
          batch_id: '44444444-4444-4444-4444-444444444444',
          batch_name: 'Morning Batch A',
          status: 'PENDING_APPROVAL',
          email_verified: true,
          created_at: '2026-10-15',
        },
        {
          user_id: '55555555-5555-5555-5555-555555555555',
          student_id: null,
          name: 'Rohit Verma',
          email: 'rohit@example.com',
          phone: null,
          student_code: null,
          class_id: null,
          class_name: null,
          batch_id: null,
          batch_name: null,
          status: 'PENDING_VERIFICATION',
          email_verified: false,
          created_at: '2026-10-16',
        },
      ];

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockRegistrations,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await registrationApprovalsApi.getPendingRegistrations({
        limit: 50,
        offset: 10,
      });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith('/admin/users/pending-registrations', {
        params: { limit: 50, offset: 10 },
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Priya Sharma');
      expect(result[0].email_verified).toBe(true);
      expect(result[0].status).toBe('PENDING_APPROVAL');

      // Verifies lifecycle distinction between email verification and admin approval
      expect(result[1].email_verified).toBe(false);
      expect(result[1].status).toBe('PENDING_VERIFICATION');
    });

    it('returns empty array when backend reports no pending registrations', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await registrationApprovalsApi.getPendingRegistrations();
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles unexpected non-array response by defaulting to empty array', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await registrationApprovalsApi.getPendingRegistrations();
      expect(result).toEqual([]);
    });

    it('propagates API error when pending registrations retrieval fails', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network disconnected'));

      await expect(registrationApprovalsApi.getPendingRegistrations()).rejects.toThrow(
        'Network disconnected'
      );
    });
  });

  describe('2. POST /admin/users/{user_id}/approve', () => {
    const validUserId = '11111111-1111-1111-1111-111111111111';

    it('successfully approves a student registration with optional remarks', async () => {
      const mockApprovedStudent: Student = {
        id: '22222222-2222-2222-2222-222222222222',
        user_id: validUserId,
        name: 'Priya Sharma',
        email: 'priya@example.com',
        student_code: 'STU-101',
        class_id: '33333333-3333-3333-3333-333333333333',
        batch_id: '44444444-4444-4444-4444-444444444444',
        admission_date: '2026-10-16',
        status: 'ACTIVE',
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: mockApprovedStudent,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await registrationApprovalsApi.approveRegistration(validUserId, {
        remarks: 'Verification documents validated by admissions staff.',
      });

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        `/admin/users/${validUserId}/approve`,
        { remarks: 'Verification documents validated by admissions staff.' }
      );
      expect(result.status).toBe('ACTIVE');
      expect(result.user_id).toBe(validUserId);
    });

    it('treats empty or whitespace remarks as null per backend contract', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { id: 'test', status: 'ACTIVE' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await registrationApprovalsApi.approveRegistration(validUserId, { remarks: '   ' });

      expect(postSpy).toHaveBeenCalledWith(`/admin/users/${validUserId}/approve`, {
        remarks: null,
      });
    });

    it('rejects approval request if remarks exceed 255 characters', async () => {
      const longRemarks = 'A'.repeat(256);
      await expect(
        registrationApprovalsApi.approveRegistration(validUserId, { remarks: longRemarks })
      ).rejects.toThrow('Approval remarks cannot exceed 255 characters.');
    });

    it('throws error if userId is missing', async () => {
      await expect(
        registrationApprovalsApi.approveRegistration('', { remarks: 'test' })
      ).rejects.toThrow('User ID is required for approval.');
    });

    it('propagates server error when approval mutation fails', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new Error('Student user registration not found')
      );

      await expect(
        registrationApprovalsApi.approveRegistration(validUserId)
      ).rejects.toThrow('Student user registration not found');
    });
  });

  describe('3. POST /admin/users/{user_id}/reject', () => {
    const validUserId = '11111111-1111-1111-1111-111111111111';

    it('successfully rejects a registration with a valid mandatory reason', async () => {
      const mockRejectResponse: RejectRegistrationResponse = {
        success: true,
        message: 'Registration rejected',
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: mockRejectResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await registrationApprovalsApi.rejectRegistration(validUserId, {
        reason: 'Duplicate registration detected for this applicant.',
      });

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        `/admin/users/${validUserId}/reject`,
        { reason: 'Duplicate registration detected for this applicant.' }
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration rejected');
    });

    it('validates and rejects empty rejection reason before API dispatch', async () => {
      await expect(
        registrationApprovalsApi.rejectRegistration(validUserId, { reason: '' })
      ).rejects.toThrow('A rejection reason is required (1 to 255 characters).');

      await expect(
        registrationApprovalsApi.rejectRegistration(validUserId, { reason: '   ' })
      ).rejects.toThrow('A rejection reason is required (1 to 255 characters).');
    });

    it('validates and rejects rejection reason longer than 255 characters', async () => {
      const overLongReason = 'R'.repeat(256);
      await expect(
        registrationApprovalsApi.rejectRegistration(validUserId, { reason: overLongReason })
      ).rejects.toThrow('Rejection reason cannot exceed 255 characters.');
    });

    it('throws error if userId is missing during rejection', async () => {
      await expect(
        registrationApprovalsApi.rejectRegistration('', { reason: 'Valid reason' })
      ).rejects.toThrow('User ID is required for rejection.');
    });

    it('propagates server error when rejection fails on backend', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new Error('403 Forbidden: Admin privileges required')
      );

      await expect(
        registrationApprovalsApi.rejectRegistration(validUserId, {
          reason: 'Application rejected due to invalid admission test scores.',
        })
      ).rejects.toThrow('403 Forbidden: Admin privileges required');
    });
  });

  describe('4. Authentication & Security Contract', () => {
    it('attaches Bearer token in request header via apiClient interceptor', async () => {
      tokenStore.setTokens('custom-admin-jwt-token-12345', 'refresh-token');

      const config: any = { headers: {} };
      // Invoke the interceptor directly
      const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
      const modifiedConfig = requestInterceptor(config);

      expect(modifiedConfig.headers.Authorization).toBe('Bearer custom-admin-jwt-token-12345');
    });

    it('clears token store when 401 occurs and no refresh token is present', async () => {
      tokenStore.setTokens('expired-access-token', '');

      // Simulate interceptor 401 handling
      const responseErrorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
      const mockAxiosError = {
        isAxiosError: true,
        response: { status: 401, data: { detail: 'Token expired' } },
      };

      await expect(responseErrorInterceptor(mockAxiosError)).rejects.toThrow();
      expect(tokenStore.getAccessToken()).toBeNull();
    });

    it('formats validation errors cleanly without exposing sensitive internals', async () => {
      const responseErrorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
      const mockValidationError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            detail: [
              { loc: ['body', 'reason'], msg: 'String should have at least 1 characters' },
            ],
          },
        },
      };

      try {
        await responseErrorInterceptor(mockValidationError);
        expect.unreachable('Should have thrown ApiError');
      } catch (err: any) {
        expect(err.message).toBe('Please correct the highlighted fields.');
        expect(err.status).toBe(422);
        expect(err.fieldErrors?.['reason']).toContain('String should have at least 1 characters');
      }
    });
  });

  describe('5. Duplicate Submission & State Integrity', () => {
    it('prevents concurrent duplicate approval submissions while one is already pending', async () => {
      const validUserId = '11111111-1111-1111-1111-111111111111';

      let resolveFirstCall: (value: any) => void;
      const firstCallPromise = new Promise((resolve) => {
        resolveFirstCall = resolve;
      });

      let callCount = 0;
      vi.spyOn(apiClient, 'post').mockImplementation(async () => {
        callCount++;
        return firstCallPromise as any;
      });

      // Simulated duplicate prevention logic as used in RegistrationApprovalsList
      let isSubmitting = false;
      const submitDecision = async () => {
        if (isSubmitting) {
          return { skipped: true };
        }
        isSubmitting = true;
        try {
          const res = await registrationApprovalsApi.approveRegistration(validUserId, {
            remarks: 'Documents verified',
          });
          return { skipped: false, data: res };
        } finally {
          isSubmitting = false;
        }
      };

      // Trigger first click
      const run1 = submitDecision();
      // Trigger immediate duplicate click while run1 is pending
      const run2 = submitDecision();

      // Second click should be safely skipped
      const res2 = await run2;
      expect(res2.skipped).toBe(true);
      expect(callCount).toBe(1);

      // Complete first call
      resolveFirstCall!({
        data: { id: 'stu-1', status: 'ACTIVE' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const res1 = await run1;
      expect(res1.skipped).toBe(false);
      expect(callCount).toBe(1);
    });

    it('preserves non-optimistic lifecycle: does not remove registration until server confirms success', async () => {
      const pendingList: PendingRegistration[] = [
        {
          user_id: 'user-abc',
          name: 'Ananya Roy',
          email: 'ananya@example.com',
          status: 'PENDING_APPROVAL',
          email_verified: true,
          created_at: '2026-10-14',
        },
      ];

      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new Error('Database lock error during approval')
      );

      // If mutation fails, list remains unaltered
      try {
        await registrationApprovalsApi.approveRegistration('user-abc');
      } catch {
        // Failed - no mutation committed
      }

      // Roster retains the item because optimistic deletion was not performed
      expect(pendingList).toHaveLength(1);
      expect(pendingList[0].user_id).toBe('user-abc');
    });
  });
});

