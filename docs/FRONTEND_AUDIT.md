# FUNDAMICS Admin Panel — Frontend Audit Report

**Date:** October 14, 2026  
**Auditor:** Senior React/TypeScript Frontend Engineer & System Architect  
**Scope:** Complete codebase audit of `FUNDAMICS ADMIN PANNEL` against the live backend deployed at `https://fundamics-lms-backend.onrender.com/api/v1`.

---

## 1. Executive Summary

A comprehensive architectural and functional audit of the FUNDAMICS Admin Panel was conducted by analyzing the frontend codebase, local configuration, and comparing every API call against the live OpenAPI 3.1 specification at `https://fundamics-lms-backend.onrender.com/api/v1/openapi.json`.

While the frontend had established foundational UI components using Vite, React 19, Tailwind CSS, Radix UI, TanStack Query, and React Hook Form, **severe integration mismatches and missing backend endpoints previously caused runtime errors, 404s, and 422 unprocessable entity failures**.

---

## 2. Inventory of Existing Frontend Modules

| Module / Route | Source Location | Status Prior to Improvement |
| :--- | :--- | :--- |
| **Authentication & Guard** | `src/features/auth/*`, `src/app/AdminGuard.tsx` | **Critical Bug Fixed:** Casing mismatch (`ADMIN` vs `admin`) locked out admins; missing `name` vs `full_name` caused runtime crashes. |
| **Dashboard** | `src/features/dashboard/DashboardPage.tsx` | Partially working; relied on some hardcoded stats; greetings assumed `user.full_name`. |
| **Student Management** | `src/features/students/*` | **Broken:** `createStudent` omitted required fields (`student_code`, `admission_date`) and used `full_name` instead of `name`. `GET /admin/students/:id` does not exist on backend (404). |
| **Teacher Management** | `src/features/teachers/*` | **Broken:** `createTeacher` omitted required `teacher_code` and used `full_name` and `employee_id`. `GET /admin/teachers/:id` does not exist on backend. |
| **Academic Management** | `src/features/academics/*` | Working for Classes, Batches, Subjects creation and listing. Class model lacks `board` field. |
| **Student Attendance** | `src/features/attendance/StudentAttendancePage.tsx` | **Broken:** Looked for `existing_status` / `existing_remarks` instead of `status` / `remarks`. Submit response checked `created` / `updated` instead of `created_count` / `updated_count`. |
| **Excel Attendance Import** | `src/features/attendance/AttendanceImportPage.tsx` | **Broken:** `previewExcelImport` only sent file; backend strictly requires `class_id`, `batch_id`, and `attendance_date` multipart fields (caused 422). Response schema fields were mismatched. |
| **Teacher Attendance** | `src/features/attendance/TeacherAttendancePage.tsx` | **Broken:** `calculate` endpoint called with query param `date` instead of `target_date` (422). No backend endpoint exists for listing teacher attendance records. |
| **Exams & Results** | `src/features/results/*` | **Broken:** Called `GET /admin/exams` which returns 405 Method Not Allowed (only POST is implemented on backend). "Create Exam" was incorrectly prominent; required workflow is student results management. |
| **Notes & Material** | `src/features/notes/*` | **Broken:** Called `GET /admin/notes` which does not exist. `uploadFile` expected `{ file_url }` instead of `{ id, original_filename, ... }`. |
| **Calendar** | `src/features/calendar/*` | Working; passed unnecessary `month`/`year` parameters not defined in backend schema. |
| **Notifications** | `src/features/notifications/*` | Mock-only; no backend notification or announcement API exists. |
| **Audit Logs** | `src/features/audit-logs/*` | Supported by backend `GET /admin/audit-logs`. |
| **Settings** | `src/features/settings/*` | Partially supported via `GET /admin/settings/institute` and `PATCH /admin/settings/institute`. No password change or account recovery API exists. |

---

## 3. Discovered Frontend Bugs & Root Causes

### 3.1 Authentication & Authorization Lockout
- **Issue:** Admins logging in saw "Access Denied: This panel is restricted to administrators only."
- **Root Cause:** Backend returns `role: "ADMIN"`. Frontend compared `user.role !== 'admin'`. Furthermore, backend returns `name: string`, not `full_name: string`.
- **Resolution:** Normalized user object during `/auth/me` consumption; made `AdminGuard` role check case-insensitive; safely guarded `getInitials()`.

### 3.2 Student Attendance Roster Lost State
- **Issue:** Loading student attendance for a date where attendance was already marked showed all students as unmarked.
- **Root Cause:** `StudentAttendancePage.tsx` accessed `s.existing_status` and `s.existing_remarks`. Backend schema provides `s.status` and `s.remarks`.
- **Resolution:** Updated mapping to use `s.status` and `s.remarks`.

### 3.3 Excel Attendance Import 422 Failure
- **Issue:** Uploading an attendance Excel file immediately threw a 422 Validation Error.
- **Root Cause:** `attendanceApi.previewExcelImport` sent only `file` in the `FormData`. Backend schema `Body_preview_attendance_import_api_v1_admin_attendance_preview_post` strictly requires `class_id`, `batch_id`, and `attendance_date`.
- **Resolution:** Updated UI and API call to bundle `class_id`, `batch_id`, `attendance_date`, and `file` together. Updated preview parser for `preview_data` and `error_message`.

### 3.4 Teacher Attendance Calculation 422
- **Issue:** Recalculating teacher attendance failed with 422.
- **Root Cause:** Sent query parameter `date` instead of `target_date`.
- **Resolution:** Corrected parameter name to `target_date`.

### 3.5 Student & Teacher Registration Failures
- **Issue:** Registering a student or teacher from admin failed.
- **Root Cause:** Frontend forms submitted `full_name` and omitted mandatory backend fields (`student_code`, `admission_date` for students; `teacher_code` for teachers).
- **Resolution:** Aligned forms and TypeScript models to exact backend payload schemas (`name`, `student_code`, `admission_date`, `teacher_code`).

---

## 4. UI/UX Problems Identified

1. **Top Bar Lacked Critical Coaching Controls:** No Notice/Announcements view, no Registration Approvals badge, and no Institute Daily Operating Status toggle.
2. **Missing Empty & Error States:** Several pages failed silently or remained blank on empty queries instead of presenting helpful guidance.
3. **No Unsaved Changes Protection:** Attendance and marks editing pages allowed accidental navigation without warning users about unsaved edits.
4. **Overcomplicated Results Workflow:** Prominently featured exam creation container rather than simple, coaching-oriented student results and marks entry.
5. **Class 1 to 12 Structure:** The UI required administrators to enter class names arbitrarily rather than providing standard coaching classes (Class 1 through Class 12) with education boards (CBSE, ICSE, State Board).

---

## 5. Security & Authentication Audit

1. **Token Storage:** Tokens are held in-memory via `tokenStore` (avoiding `localStorage` XSS exposure). Refresh flow correctly uses Axios interceptor.
2. **Credential Exposure:** Verified that no biometric credentials or secrets are exposed in the frontend.
3. **Access Denied Fallback:** Previously lacked a sign-out mechanism, leaving unauthorized users stranded. A "Sign Out & Return to Login" button was added.
4. **Protected Password Handling:** Frontend does not display or generate plaintext passwords.
