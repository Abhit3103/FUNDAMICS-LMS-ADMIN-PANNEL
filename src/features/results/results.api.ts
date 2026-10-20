import apiClient from '@/lib/api-client';
import type {
  Exam,
  ExamDetailResponse,
  CreateExamRequest,
  BulkEnterMarksRequest,
  PublishExamResultsRequest,
} from '@/types';

export const resultsApi = {
  /**
   * GET /admin/exams
   * List available exams directly from live backend with optional class/batch/status filtering.
   */
  getExams: async (params?: {
    class_id?: string;
    batch_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Exam[]> => {
    const { data } = await apiClient.get<Exam[]>('/admin/exams', { params });
    const exams = Array.isArray(data) ? data : [];
    return exams.map((e) => ({
      ...e,
      exam_date: (e as any).date || (e as any).exam_date,
    }));
  },

  /**
   * GET /admin/exams/{exam_id}
   * Retrieve full details of an exam including student performance records.
   */
  getExamDetail: async (examId: string): Promise<ExamDetailResponse> => {
    const { data } = await apiClient.get<ExamDetailResponse>(`/admin/exams/${examId}`);
    return data;
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

    return {
      ...data,
      exam_date: data.date,
    };
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
