/**
 * Core domain types for the FUNDAMICS Admin Panel.
 * Synchronized with the deployed FUNDAMICS LMS OpenAPI 3.1 specification.
 * Base URL: https://fundamics-lms-backend.onrender.com/api/v1
 */

// ─── Authentication ───────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds?: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'INACTIVE';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole | string;
  name?: string;
  full_name?: string;
  phone?: string | null;
  status?: UserStatus | string;
  is_active?: boolean;
  is_verified?: boolean;
  student_id?: string | null;
  teacher_id?: string | null;
  student_code?: string | null;
  teacher_code?: string | null;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  limit?: number;
  offset?: number;
}

// ─── Academic ─────────────────────────────────────────────────────────────────

export interface AcademicClass {
  id: string;
  name: string;
  code: string;
  academic_year: string;
  status?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClassRequest {
  name: string;
  code: string;
  academic_year: string;
}

export interface Batch {
  id: string;
  class_id: string;
  class_name?: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  status?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBatchRequest {
  class_id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
}

export interface Subject {
  id: string;
  class_id: string;
  name: string;
  code: string;
  status?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSubjectRequest {
  class_id: string;
  name: string;
  code: string;
}

// ─── Students ─────────────────────────────────────────────────────────────────

export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'INACTIVE' | 'active' | 'pending' | 'suspended' | 'inactive';

export interface Student {
  id: string;
  user_id?: string;
  name: string;
  full_name?: string; // fallback / alias
  email: string;
  phone?: string | null;
  student_code: string;
  class_id: string;
  class_name?: string | null;
  batch_id: string;
  batch_name?: string | null;
  admission_date: string;
  status: string;
  account_status?: AccountStatus; // fallback / alias
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentRequest {
  name: string;
  email: string;
  student_code: string;
  class_id: string;
  batch_id: string;
  admission_date: string;
  phone?: string | null;
  password?: string | null;
}

// ─── Registration Approvals (Phase 3A) ────────────────────────────────────────

export interface PendingRegistration {
  user_id: string;
  student_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  student_code?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  batch_id?: string | null;
  batch_name?: string | null;
  status: UserStatus | string;
  email_verified: boolean;
  created_at: string;
}

export type PendingRegistrationResponse = PendingRegistration;

export interface PendingRegistrationsParams {
  limit?: number;
  offset?: number;
}

export interface ApproveRegistrationRequest {
  remarks?: string | null;
}

export interface RejectRegistrationRequest {
  reason: string;
}

export interface RejectRegistrationResponse {
  success: boolean;
  message: string;
}

// ─── Teachers ─────────────────────────────────────────────────────────────────

export interface Teacher {
  id: string;
  user_id?: string;
  name: string;
  full_name?: string; // fallback / alias
  email: string;
  phone?: string | null;
  teacher_code: string;
  employee_id?: string; // alias
  biometric_employee_id?: string | null;
  status: string;
  account_status?: AccountStatus; // alias
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTeacherRequest {
  name: string;
  email: string;
  teacher_code: string;
  phone?: string | null;
  biometric_employee_id?: string | null;
  password?: string | null;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY';

export interface AttendanceRosterParams {
  class_id: string;
  batch_id: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
}

export interface RosterStudent {
  student_id: string;
  student_code: string;
  student_name: string;
  full_name?: string; // alias
  status?: AttendanceStatus | null;
  existing_status?: AttendanceStatus; // backward compatibility
  remarks?: string | null;
  existing_remarks?: string; // backward compatibility
  attendance_id?: string | null;
}

export interface AttendanceRosterResponse {
  class_id: string;
  class_name: string;
  batch_id: string;
  batch_name: string;
  subject_id: string;
  subject_name: string;
  date: string;
  is_holiday?: boolean;
  calendar_event_title?: string | null;
  holiday_name?: string; // alias
  total_students: number;
  total_count?: number; // alias
  marked_count: number;
  unmarked_count: number;
  students: RosterStudent[];
}

export interface AttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
  remarks?: string | null;
}

export interface SubmitAttendanceRequest {
  class_id: string;
  batch_id: string;
  subject_id: string;
  date?: string;
  attendance_date?: string;
  allow_holiday_override?: boolean;
  records: Array<{
    student_id?: string;
    student_code?: string;
    status: AttendanceStatus;
    remarks?: string | null;
  }>;
}

export interface AttendanceSubmitResponse {
  class_id?: string;
  batch_id?: string;
  subject_id?: string;
  date?: string;
  total_submitted?: number;
  created_count?: number;
  updated_count?: number;
  created?: number; // alias
  updated?: number; // alias
  message?: string;
  records?: unknown[];
}

// Excel import
export interface AttendanceImportPreviewRow {
  row_number: number;
  student_code: string;
  student_name?: string | null;
  status: AttendanceStatus;
  is_valid: boolean;
  error_message?: string | null;
  errors?: string[]; // alias
  remarks?: string;
}

export interface AttendancePreviewResponse {
  import_id: string;
  filename: string;
  class_id: string;
  batch_id: string;
  attendance_date: string;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  invalid_rows?: number; // alias
  preview_data: AttendanceImportPreviewRow[];
  preview?: AttendanceImportPreviewRow[]; // alias
}

export interface ConfirmAttendanceImportResponse {
  import_id: string;
  status: string;
  committed_rows: number;
  message: string;
}

// ─── Teacher Attendance ───────────────────────────────────────────────────────

export interface TeacherAttendanceRecord {
  teacher_id: string;
  employee_id: string;
  full_name: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'INCOMPLETE' | 'REVIEW_REQUIRED' | 'HOLIDAY';
}

export interface TeacherAttendanceDaySummary {
  date: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  served_minutes: number;
  required_minutes: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'INCOMPLETE' | 'REVIEW_REQUIRED' | 'HOLIDAY';
}

// ─── Exams & Results ─────────────────────────────────────────────────────────

export interface Exam {
  id: string;
  class_id: string;
  class_name?: string | null;
  batch_id?: string | null;
  batch_name?: string | null;
  name: string;
  date: string;
  status: string;
  exam_date?: string; // alias
  max_marks?: number;
  passing_marks?: number;
  is_published?: boolean;
  total_students?: number;
  results_count?: number;
  created_at?: string;
}

export type ExamResponse = Exam;

export interface ResultResponse {
  id: string;
  exam_id: string;
  exam_name?: string | null;
  student_id: string;
  student_name?: string | null;
  student_code?: string | null;
  subject_id: string;
  subject_name?: string | null;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  grade?: string | null;
  remarks?: string | null;
  published_at?: string | null;
  document_file_id?: string | null;
  document_filename?: string | null;
  has_document?: boolean;
}

export interface ExamDetailResponse {
  id: string;
  class_id: string;
  class_name?: string | null;
  batch_id?: string | null;
  batch_name?: string | null;
  name: string;
  date: string;
  status: string;
  results: ResultResponse[];
}

export interface CreateExamRequest {
  class_id: string;
  batch_id?: string | null;
  name: string;
  date: string;
}

export interface EnterMarksItem {
  student_id: string;
  subject_id?: string | null;
  marks_obtained: number;
  max_marks: number;
  grade?: string | null;
  remarks?: string | null;
  file_id?: string | null;
  document_file_id?: string | null;
}

export interface BulkEnterMarksRequest {
  exam_id: string;
  marks_entries: EnterMarksItem[];
}

export interface PublishExamResultsRequest {
  exam_id: string;
  publish?: boolean;
}

// ─── Notes & Study Material ───────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  description?: string | null;
  class_id: string;
  batch_id?: string | null;
  subject_id?: string;
  subject_name?: string | null;
  file_id?: string;
  original_filename?: string | null;
  file_size_bytes?: number | null;
  status?: string;
  file_url?: string; // alias
  file_name?: string; // alias
  file_size?: number; // alias
  is_published?: boolean;
  created_at: string;
  created_by?: string;
}

export type NoteResponse = Note;

export interface CreateNoteRequest {
  title: string;
  description?: string | null;
  class_id: string;
  batch_id?: string | null;
  subject_id?: string;
  file_id?: string;
  file_url?: string; // legacy alias
  is_published?: boolean;
}

export interface FileRecordResponse {
  id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type CalendarEventType = 'HOLIDAY' | 'CLOSED' | 'EXAM' | 'SPECIAL_CLASS' | 'ANNOUNCEMENT';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType;
  applies_to: string;
  class_id?: string | null;
  batch_id?: string | null;
  description?: string;
  event_type?: CalendarEventType; // alias
  start_date?: string; // alias
  end_date?: string | null; // alias
}

export interface CreateCalendarEventRequest {
  title: string;
  date?: string;
  type?: CalendarEventType;
  applies_to?: string;
  class_id?: string | null;
  batch_id?: string | null;
  start_date?: string; // alias
  end_date?: string | null; // alias
  event_type?: CalendarEventType; // alias
  description?: string; // alias
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogParams {
  limit?: number;
  offset?: number;
  page?: number;
  size?: number;
}

// ─── Institute Settings ───────────────────────────────────────────────────────

export interface InstituteSettings {
  id: string;
  status: string;
  attendance_required_hours: number;
  timezone: string;
  attendance_cutoff_time: string;
  missing_checkout_policy: string;
  notifications_enabled: boolean;
}

export interface UpdateInstituteSettingsRequest {
  attendance_required_hours?: number | null;
  timezone?: string | null;
  attendance_cutoff_time?: string | null;
  missing_checkout_policy?: string | null;
  notifications_enabled?: boolean | null;
}
