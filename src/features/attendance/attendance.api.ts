import apiClient from '@/lib/api-client';
import type {
  AttendanceRosterParams,
  AttendanceRosterResponse,
  SubmitAttendanceRequest,
  AttendanceSubmitResponse,
  AttendancePreviewResponse,
  TeacherAttendanceDaySummary,
} from '@/types';

export interface ExcelPreviewParams {
  class_id: string;
  batch_id: string;
  attendance_date: string;
  file: File;
}

export const attendanceApi = {
  /**
   * GET /admin/attendance/roster
   * Load the student roster with existing attendance for the given filters.
   */
  getRoster: async (params: AttendanceRosterParams): Promise<AttendanceRosterResponse> => {
    const { data } = await apiClient.get<AttendanceRosterResponse>('/admin/attendance/roster', {
      params: {
        class_id: params.class_id,
        batch_id: params.batch_id,
        subject_id: params.subject_id,
        date: params.date,
      },
    });

    // Normalize student records for UI consumption
    const normalizedStudents = (data.students || []).map((s) => ({
      ...s,
      full_name: s.student_name || s.full_name || '',
      existing_status: s.status ?? undefined,
      existing_remarks: s.remarks ?? undefined,
    }));

    return {
      ...data,
      total_count: data.total_students,
      holiday_name: data.calendar_event_title ?? undefined,
      students: normalizedStudents,
    };
  },

  /**
   * POST /admin/attendance/submit
   * Submit attendance records for a class/batch/subject/date.
   */
  submitAttendance: async (
    payload: SubmitAttendanceRequest
  ): Promise<AttendanceSubmitResponse> => {
    const formattedRecords = payload.records.map((r) => ({
      student_id: r.student_id,
      student_code: r.student_code,
      status: r.status,
      remarks: r.remarks || null,
    }));

    const { data } = await apiClient.post<AttendanceSubmitResponse>(
      '/admin/attendance/submit',
      {
        class_id: payload.class_id,
        batch_id: payload.batch_id,
        subject_id: payload.subject_id,
        date: payload.date || payload.attendance_date,
        attendance_date: payload.date || payload.attendance_date,
        allow_holiday_override: payload.allow_holiday_override ?? false,
        records: formattedRecords,
      }
    );

    return {
      ...data,
      created: data.created_count ?? data.total_submitted ?? 0,
      updated: data.updated_count ?? 0,
    };
  },

  /**
   * POST /admin/attendance/preview
   * Preview an Excel attendance upload before confirming.
   * Requires class_id, batch_id, attendance_date, and file multipart fields.
   */
  previewExcelImport: async ({
    class_id,
    batch_id,
    attendance_date,
    file,
  }: ExcelPreviewParams): Promise<AttendancePreviewResponse> => {
    const formData = new FormData();
    formData.append('class_id', class_id);
    formData.append('batch_id', batch_id);
    formData.append('attendance_date', attendance_date);
    formData.append('file', file);

    const { data } = await apiClient.post<AttendancePreviewResponse>(
      '/admin/attendance/preview',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    const normalizedRows = (data.preview_data || []).map((row) => ({
      ...row,
      errors: row.error_message ? [row.error_message] : [],
    }));

    return {
      ...data,
      invalid_rows: data.error_rows,
      preview: normalizedRows,
      preview_data: normalizedRows,
    };
  },

  /**
   * POST /admin/attendance/confirm/{import_id}
   * Confirm a previewed Excel import.
   */
  confirmExcelImport: async (importId: string): Promise<AttendanceSubmitResponse> => {
    const { data } = await apiClient.post<AttendanceSubmitResponse>(
      `/admin/attendance/confirm/${importId}`
    );
    return {
      ...data,
      created: data.created_count ?? data.total_submitted ?? 0,
      updated: data.updated_count ?? 0,
    };
  },

  /**
   * POST /admin/teacher-attendance/{teacher_id}/calculate
   * Recalculate daily biometric teacher attendance for target_date.
   */
  calculateTeacherAttendance: async (
    teacherId: string,
    targetDate: string
  ): Promise<TeacherAttendanceDaySummary> => {
    const { data } = await apiClient.post<TeacherAttendanceDaySummary>(
      `/admin/teacher-attendance/${teacherId}/calculate`,
      {},
      { params: { target_date: targetDate } }
    );
    return data;
  },
};
