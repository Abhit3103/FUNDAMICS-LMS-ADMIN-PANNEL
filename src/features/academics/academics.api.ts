import apiClient from '@/lib/api-client';
import type {
  AcademicClass,
  CreateClassRequest,
  Batch,
  CreateBatchRequest,
  Subject,
  CreateSubjectRequest,
} from '@/types';

export const academicsApi = {
  // ── Classes ──────────────────────────────────────────────────────────────
  getClasses: async (): Promise<AcademicClass[]> => {
    const { data } = await apiClient.get<AcademicClass[]>('/admin/classes');
    return data;
  },

  createClass: async (payload: CreateClassRequest): Promise<AcademicClass> => {
    const { data } = await apiClient.post<AcademicClass>('/admin/classes', payload);
    return data;
  },

  // ── Batches ──────────────────────────────────────────────────────────────
  getBatches: async (classId?: string): Promise<Batch[]> => {
    const params = classId ? { class_id: classId } : undefined;
    const { data } = await apiClient.get<Batch[]>('/admin/batches', { params });
    return data;
  },

  createBatch: async (payload: CreateBatchRequest): Promise<Batch> => {
    const { data } = await apiClient.post<Batch>('/admin/batches', payload);
    return data;
  },

  // ── Subjects ─────────────────────────────────────────────────────────────
  getSubjects: async (): Promise<Subject[]> => {
    const { data } = await apiClient.get<Subject[]>('/admin/subjects');
    return data;
  },

  createSubject: async (payload: CreateSubjectRequest): Promise<Subject> => {
    const { data } = await apiClient.post<Subject>('/admin/subjects', payload);
    return data;
  },
};
