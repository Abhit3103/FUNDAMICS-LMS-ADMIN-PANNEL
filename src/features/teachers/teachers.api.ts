import apiClient from '@/lib/api-client';
import { ApiError } from '@/lib/api-errors';
import type { Teacher, CreateTeacherRequest } from '@/types';

export const teachersApi = {
  /**
   * GET /admin/teachers
   * Query registered teachers roster.
   */
  getTeachers: async (): Promise<Teacher[]> => {
    const { data } = await apiClient.get<Teacher[]>('/admin/teachers', {
      params: { limit: 100 },
    });

    const teachers = Array.isArray(data) ? data : [];

    return teachers.map((t) => ({
      ...t,
      full_name: t.name || t.full_name || '',
      employee_id: t.teacher_code || t.employee_id || '',
      account_status: t.status as any,
    }));
  },

  /**
   * Look up teacher by ID.
   * NOTE: The backend does not implement GET /admin/teachers/{id}.
   */
  getTeacher: async (id: string): Promise<Teacher> => {
    const allTeachers = await teachersApi.getTeachers();
    const match = allTeachers.find((t) => t.id === id);
    if (!match) {
      throw new ApiError({
        status: 404,
        message: 'Teacher record not found in registered roster.',
      });
    }
    return match;
  },

  /**
   * POST /admin/teachers
   * Register a teacher profile and linked user account.
   */
  createTeacher: async (payload: CreateTeacherRequest): Promise<Teacher> => {
    const { data } = await apiClient.post<Teacher>('/admin/teachers', {
      name: payload.name,
      email: payload.email,
      teacher_code: payload.teacher_code,
      phone: payload.phone || null,
      biometric_employee_id: payload.biometric_employee_id || null,
      password: payload.password || null,
    });

    return {
      ...data,
      full_name: data.name || data.full_name || '',
      employee_id: data.teacher_code || data.employee_id || '',
      account_status: data.status as any,
    };
  },
};
