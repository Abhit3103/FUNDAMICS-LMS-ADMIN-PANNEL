import apiClient from '@/lib/api-client';
import { ApiError } from '@/lib/api-errors';
import type { Student, CreateStudentRequest } from '@/types';

export interface StudentListFilters {
  class_id?: string;
  batch_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  size?: number;
  status?: string;
}

export const studentsApi = {
  /**
   * GET /admin/students
   * Query registered students list with optional class/batch filtering.
   */
  getStudents: async (params?: StudentListFilters): Promise<Student[]> => {
    const queryParams: Record<string, unknown> = {};
    if (params?.class_id) queryParams.class_id = params.class_id;
    if (params?.batch_id) queryParams.batch_id = params.batch_id;
    if (params?.limit) queryParams.limit = params.limit;
    else if (params?.size) queryParams.limit = params.size;

    if (params?.offset !== undefined) {
      queryParams.offset = params.offset;
    } else if (params?.page && params?.size) {
      queryParams.offset = (params.page - 1) * params.size;
    }

    const { data } = await apiClient.get<Student[]>('/admin/students', {
      params: queryParams,
    });

    const students = Array.isArray(data) ? data : [];

    return students.map((s) => ({
      ...s,
      full_name: s.name || s.full_name || '',
      account_status: s.status as any,
    }));
  },

  /**
   * Look up an individual student by ID.
   * NOTE: The backend does not implement GET /admin/students/{id}.
   * This retrieves from the roster list to preserve frontend navigation.
   */
  getStudent: async (id: string): Promise<Student> => {
    const allStudents = await studentsApi.getStudents({ limit: 100 });
    const match = allStudents.find((s) => s.id === id);
    if (!match) {
      throw new ApiError({
        status: 404,
        message: 'Student record not found in registered roster.',
      });
    }
    return match;
  },

  /**
   * POST /admin/students
   * Create a student profile and user account.
   */
  createStudent: async (payload: CreateStudentRequest): Promise<Student> => {
    const { data } = await apiClient.post<Student>('/admin/students', {
      name: payload.name,
      email: payload.email,
      student_code: payload.student_code,
      class_id: payload.class_id,
      batch_id: payload.batch_id,
      admission_date: payload.admission_date,
      phone: payload.phone || null,
      password: payload.password || null,
    });

    return {
      ...data,
      full_name: data.name || data.full_name || '',
      account_status: data.status as any,
    };
  },
};

export { registrationApprovalsApi } from './registration-approvals.api';

