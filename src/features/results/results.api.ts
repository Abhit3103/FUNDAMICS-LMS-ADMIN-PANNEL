import apiClient from '@/lib/api-client';
import type {
  Exam,
  CreateExamRequest,
  BulkEnterMarksRequest,
  PublishExamResultsRequest,
} from '@/types';

// In-memory fallback cache for exams created during the session
let _sessionExams: Exam[] = [];

export const resultsApi = {
  /**
   * GET /admin/exams
   * List available exams filtered by class or batch.
   */
  getExams: async (params?: { class_id?: string; batch_id?: string; status?: string }): Promise<Exam[]> => {
    try {
      const { data } = await apiClient.get<Exam[]>('/admin/exams', { params });
      return data.map((e) => ({
        ...e,
        exam_date: (e as any).date || (e as any).exam_date,
      }));
    } catch {
      let exams = [..._sessionExams];
      if (params?.class_id) {
        exams = exams.filter((e) => e.class_id === params.class_id);
      }
      if (params?.batch_id) {
        exams = exams.filter((e) => !e.batch_id || e.batch_id === params.batch_id);
      }
      return exams;
    }
  },

  /**
   * POST /admin/exams
   * Create an exam container.
   */
  createExam: async (payload: CreateExamRequest): Promise<Exam> => {
    const { data } = await apiClient.post<Exam>('/admin/exams', {
      class_id: payload.class_id,
      batch_id: payload.batch_id || null,
      name: payload.name,
      date: payload.date,
    });

    const created: Exam = {
      ...data,
      exam_date: data.date,
    };

    // Cache created exam in session
    _sessionExams = [created, ..._sessionExams.filter((e) => e.id !== created.id)];

    return created;
  },

  /**
   * POST /admin/exams/marks
   * Record or update marks for an exam (supports embedded file_id / remarks).
   */
  submitMarks: async (payload: BulkEnterMarksRequest): Promise<{ message?: string }> => {
    const { data } = await apiClient.post<{ message?: string }>(
      '/admin/exams/marks',
      payload
    );
    return data;
  },

  /**
   * POST /admin/results/document-mapping
   * Map an uploaded document (file_id) directly to a student's exam result.
   */
  mapResultDocument: async (payload: {
    exam_id: string;
    student_id: string;
    file_id: string;
    subject_id?: string;
    remarks?: string;
  }) => {
    const { data } = await apiClient.post('/admin/results/document-mapping', payload);
    return data;
  },

  /**
   * POST /admin/exams/publish
   * Publish results for an exam.
   */
  publishExam: async (payload: PublishExamResultsRequest): Promise<{ message?: string }> => {
    const { data } = await apiClient.post<{ message?: string }>(
      '/admin/exams/publish',
      {
        exam_id: payload.exam_id,
        publish: payload.publish ?? true,
      }
    );
    return data;
  },
};
