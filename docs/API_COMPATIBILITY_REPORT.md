# FUNDAMICS LMS — Backend API Compatibility Report

**API Base URL:** `https://fundamics-lms-backend.onrender.com/api/v1`  
**OpenAPI Spec:** `https://fundamics-lms-backend.onrender.com/api/v1/openapi.json`  
**Status:** Verified against live backend on October 14, 2026

---

## 1. Verified Live Endpoints Matrix

| HTTP Method | Route | Operation ID | Authentication | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `login` | Public | **Fully Supported** | Returns `access_token`, `refresh_token`, `expires_in_seconds`. |
| `POST` | `/auth/refresh` | `refresh` | Public | **Fully Supported** | Refreshes JWT tokens. |
| `GET` | `/auth/me` | `get_me` | Bearer Token | **Fully Supported** | Returns `role: "ADMIN"`, `name: string`, `status: "ACTIVE"`. |
| `POST` | `/auth/logout` | `logout` | Bearer Token | **Fully Supported** | Invalidates session. |
| `GET` | `/admin/classes` | `list_classes` | Bearer Token | **Fully Supported** | Returns array of `ClassResponse`. |
| `POST` | `/admin/classes` | `create_class` | Bearer Token | **Fully Supported** | Requires `{ name, code, academic_year }`. |
| `GET` | `/admin/batches` | `list_batches` | Bearer Token | **Fully Supported** | Supports `class_id` query filter. |
| `POST` | `/admin/batches` | `create_batch` | Bearer Token | **Fully Supported** | Requires `{ class_id, name, code, start_time, end_time }`. |
| `GET` | `/admin/subjects` | `list_subjects` | Bearer Token | **Fully Supported** | Supports `class_id` query filter. |
| `POST` | `/admin/subjects` | `create_subject` | Bearer Token | **Fully Supported** | Requires `{ class_id, name, code }`. |
| `GET` | `/admin/students` | `list_students` | Bearer Token | **Fully Supported** | Query params: `class_id`, `batch_id`, `limit`, `offset`. |
| `POST` | `/admin/students` | `create_student` | Bearer Token | **Fully Supported** | Requires `{ name, email, student_code, class_id, batch_id, admission_date }`. |
| `GET` | `/admin/teachers` | `list_teachers` | Bearer Token | **Fully Supported** | Query params: `limit`, `offset`. |
| `POST` | `/admin/teachers` | `create_teacher` | Bearer Token | **Fully Supported** | Requires `{ name, email, teacher_code, biometric_employee_id? }`. |
| `GET` | `/admin/attendance/roster` | `get_attendance_roster` | Bearer Token | **Fully Supported** | Query params: `class_id`, `batch_id`, `subject_id`, `date`. |
| `POST` | `/admin/attendance/submit` | `submit_attendance_roster` | Bearer Token | **Fully Supported** | Payload: `{ class_id, batch_id, subject_id, records: [...] }`. |
| `POST` | `/admin/attendance/preview` | `preview_attendance_import` | Bearer Token | **Fully Supported** | Multipart: `class_id`, `batch_id`, `attendance_date`, `file`. |
| `POST` | `/admin/attendance/confirm/{import_id}` | `confirm_attendance_import` | Bearer Token | **Fully Supported** | Confirms staged import. |
| `POST` | `/admin/teacher-attendance/{teacher_id}/calculate` | `calculate_teacher_attendance` | Bearer Token | **Fully Supported** | Requires query param `target_date: YYYY-MM-DD`. |
| `POST` | `/admin/exams` | `create_exam` | Bearer Token | **Fully Supported** | Creates exam container. |
| `POST` | `/admin/exams/marks` | `record_bulk_marks` | Bearer Token | **Fully Supported** | Payload: `{ exam_id, marks_entries: [...] }`. |
| `POST` | `/admin/exams/publish` | `publish_results` | Bearer Token | **Fully Supported** | Payload: `{ exam_id, publish: boolean }`. |
| `GET` | `/admin/calendar/events` | `list_calendar_events` | Bearer Token | **Fully Supported** | Returns array of `CalendarEventResponse`. |
| `POST` | `/admin/calendar/events` | `create_calendar_event` | Bearer Token | **Fully Supported** | Requires `{ title, date, type: "HOLIDAY"|"CLOSED"|"EXAM"|"SPECIAL_CLASS" }`. |
| `GET` | `/admin/settings/institute` | `get_institute_settings` | Bearer Token | **Fully Supported** | Returns `{ id, status, attendance_required_hours, timezone, attendance_cutoff_time, missing_checkout_policy, notifications_enabled }`. |
| `PATCH` | `/admin/settings/institute` | `update_institute_settings` | Bearer Token | **Fully Supported** | Updatable fields: `notifications_enabled`, `attendance_required_hours`, `timezone`, `attendance_cutoff_time`, `missing_checkout_policy`. |
| `GET` | `/admin/audit-logs` | `list_audit_logs` | Bearer Token | **Fully Supported** | Returns recent system audit actions. |
| `POST` | `/admin/files/upload` | `upload_material_file` | Bearer Token | **Fully Supported** | Multipart file upload; returns `{ id, original_filename, mime_type, size_bytes }`. |
| `POST` | `/admin/notes` | `create_note` | Bearer Token | **Fully Supported** | URL-encoded payload: `req` JSON string and `file_id`. |

---

## 2. Backend Endpoint Gaps & Required Schema Additions

The following sections summarize backend compatibility gaps recorded in this report. Notice management has since been added to the live API contract, as documented in §2.2.

### 2.1 Student Self-Registration Approvals Flow
- **Missing Endpoints:**
  - `GET /api/v1/admin/students/pending-approvals`
  - `POST /api/v1/admin/students/{id}/approve`
  - `POST /api/v1/admin/students/{id}/reject`
- **Current Backend Reality:** The backend supports filtering students by status (`status: "PENDING_VERIFICATION"`), but does not have explicit approval/rejection transition endpoints.
- **Frontend Handling:** The frontend displays pending registrations identified from `GET /admin/students` with `status === "PENDING_VERIFICATION"`, shows their registration details in the top navigation badge/dialog, and clearly indicates that backend approval mutation endpoints are pending implementation.

### 2.2 Notice & Announcement Management
- **Available Endpoints:** `live-openapi.json` (API v1.4.0) defines `GET` and `POST /api/v1/admin/notices`, plus `GET`, `PATCH`, and `DELETE /api/v1/admin/notices/{notice_id}`.
- **Frontend Handling:** The Notifications page creates notices through `POST /admin/notices` and lists notices through `GET /admin/notices`; the top-navigation Notices dialog also displays the live notice list. Requests use the configured `/api/v1` API base URL.

### 2.3 Individual Student Result Uploads
- **Missing Endpoints:**
  - `GET /api/v1/admin/exams` (Only `POST` exists; querying list of exams returns 405).
  - `POST /api/v1/admin/results/student-upload` (No endpoint exists to attach a PDF/image result document directly to a specific student).
- **Current Backend Reality:** The backend supports bulk numerical marks (`/admin/exams/marks`) and result publishing (`/admin/exams/publish`). It does not support file attachments for individual exam result sheets.
- **Frontend Handling:** Redesigned Results screen into a coaching student results workflow that allows selecting Class, Batch, Student, entering student marks, reviewing the record, and submitting marks through the valid `/admin/exams/marks` endpoint, while clearly documenting that document-based result attachment requires backend expansion.

### 2.4 Teacher Attendance Admin Roster Listing
- **Missing Endpoints:**
  - `GET /api/v1/admin/teacher-attendance`
  - `GET /api/v1/admin/teacher-attendance/roster`
- **Current Backend Reality:** The backend only provides biometric ingestion (`/integrations/biometric/secureye/events`) and recalculation (`POST /admin/teacher-attendance/{teacher_id}/calculate?target_date=YYYY-MM-DD`). There is no endpoint for an Admin to query an overview list of teacher attendance records across a date.
- **Frontend Handling:** The Teacher Attendance page lists registered teachers with employee codes, provides date selection, and triggers the live recalculation endpoint with the correct `target_date` parameter.

### 2.5 Admin Account & Password Management
- **Missing Endpoints:**
  - `PATCH /api/v1/auth/password` or `POST /api/v1/admin/users/{id}/reset-password`
  - `PATCH /api/v1/admin/students/{id}`
  - `PATCH /api/v1/admin/teachers/{id}`
- **Current Backend Reality:** Neither password changes nor user updates have dedicated endpoints.
- **Frontend Handling:** Display current account profile in Settings; document missing password update endpoints without faking mutations.

### 2.6 Academic Board Support on Classes
- **Missing Schema Field:** `board` is not present in `ClassResponse` (`{ id, name, code, academic_year, status }`).
- **Frontend Handling:** Pre-configured coaching class names from **Class 1 through Class 12** with standard board qualifiers (e.g., "Class 10 — CBSE", "Class 12 — State Board") mapped cleanly to the `name` and `code` fields.

---

## 3. Summary of API Parameter Fixes Implemented

1. **`attendanceApi.getRoster`**:
   - Correctly maps response `s.status` and `s.remarks` to the active editing table.
2. **`attendanceApi.previewExcelImport`**:
   - Changed from single-file upload to multi-field `FormData` with required `class_id`, `batch_id`, `attendance_date`, and `file`.
3. **`attendanceApi.calculateTeacherAttendance`**:
   - Changed query parameter key from `date` to `target_date`.
4. **`studentsApi.createStudent`**:
   - Sends exact required keys: `name`, `email`, `student_code`, `class_id`, `batch_id`, `admission_date`.
5. **`teachersApi.createTeacher`**:
   - Sends exact required keys: `name`, `email`, `teacher_code`, `biometric_employee_id`.
