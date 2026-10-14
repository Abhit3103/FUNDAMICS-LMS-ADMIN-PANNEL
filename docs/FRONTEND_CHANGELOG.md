# FUNDAMICS Admin Panel — Frontend Changelog

**Release:** Version 1.5.0-admin  
**Date:** October 14, 2026

---

## [Phase 1] Audit & Core Authentication Fixes
- **Fixed:** Resolved `AdminGuard` role casing check that blocked access with "Access Denied" by supporting case-insensitive role verification (`admin` vs `ADMIN`).
- **Fixed:** Resolved `getMe()` response mapping so `name` is properly mirrored to `full_name` and `role` is normalized to lowercase `admin`.
- **Fixed:** Added safe handling in `getInitials` to prevent runtime `TypeError` when user name is undefined or empty.
- **Created:** `docs/FRONTEND_AUDIT.md` providing in-depth analysis of existing frontend structure, issues, and security.
- **Created:** `docs/API_COMPATIBILITY_REPORT.md` verifying live OpenAPI specification endpoints against frontend usage.

---

## [Phase 2] UI/UX Redesign & Coaching Center Simplification
- Redesigned interface into a clean, minimal, coaching-oriented aesthetic.
- Standardized typography, button states, accessible form controls, and clean data tables.
- Added explicit confirmation dialogs for critical actions.
- Added comprehensive Empty, Loading, and Error states across all modules.

---

## [Phase 3] Top Navigation, Daily Controls & Notices
- Added **Institute Daily Operating State Control** directly in the top navigation bar:
  - Coaching Open / Closed toggle with visual status indicator.
  - Automated ERP Messaging (Notifications) enabled / disabled switch.
  - Operating hours and reason input.
  - Integration with `PATCH /admin/settings/institute` (`notifications_enabled`) and `POST /admin/calendar/events` (`CLOSED` event).
- Added **Notices & Announcements** center:
  - Prominent Notices icon with counter.
  - Notices dialog showing coaching announcements, dates, and publication status.
- Added **Student Registration Approvals** badge in top navigation:
  - Real-time indicator for pending student verification.
  - Dialog displaying pending student registrations.

---

## [Phase 4] Student Management Improvements
- Pre-configured academic classes from **Class 1 through Class 12** with education board options (CBSE, ICSE, State Board).
- Fixed `createStudent` payload to strictly supply backend requirements (`name`, `student_code`, `class_id`, `batch_id`, `admission_date`).
- Added robust search by Student Name, Student Code, and Email.
- Added filters for Class and Account Status (`ACTIVE`, `PENDING_VERIFICATION`, etc.).

---

## [Phase 5] Teacher Management Improvements
- Fixed `createTeacher` payload to supply required `name`, `teacher_code`, and `biometric_employee_id`.
- Added search by Teacher Name, Code, and Email.
- Kept biometric device credentials completely private and unexposed.

---

## [Phase 6] Student Attendance Workflow Repairs
- Fixed existing roster state hydration: reads `student.status` and `student.remarks` correctly from backend.
- Fixed `submitAttendance` response handler to parse `created_count` and `updated_count`.
- Added Unsaved Changes warning before changing filters or leaving page.
- Added duplicate submission prevention and instant refetch on save.

---

## [Phase 7] Teacher Attendance Repairs
- Fixed `calculateTeacherAttendance` to use correct query parameter `target_date` (replacing invalid `date` param).
- Removed fake "Present" badges; displayed real calculated metrics (`served_minutes`, `required_minutes`, check-in/out times).
- Added "Sync All Visible" batch calculation trigger.
- Documented absence of Admin teacher attendance roster listing endpoint.

---

## [Phase 8] Excel Attendance Import Repairs
- Fixed `previewExcelImport` to package required `class_id`, `batch_id`, `attendance_date`, and file in `FormData`.
- Fixed preview row validation parsing to handle `preview_data` and `error_message`.
- Enforced strict 2-step workflow: Preview $\to$ Explicit Confirmation.

---

## [Phase 9] Results & Marks Workflow Redesign
- Removed legacy "Create Exam" navigation and prominent container creation.
- Built Student Results & Marks Management workflow:
  - Select Class $\to$ Batch $\to$ Student.
  - Record and review individual marks.
  - Submit through verified `/admin/exams/marks` backend endpoint.
  - Clear documentation on individual PDF result sheet upload limitations.

---

## [Phase 10 & 11] Settings, Security & Account Management
- Added dedicated Account & Security section in Settings.
- Displayed current admin identity and session details safely.
- Enforced strict security: no plaintext password displays or fake local password changes.

---

## [Phase 12] Daily Coaching and ERP Messaging Controls
- Visible operating state control at the top of the Admin Panel:
  - Coaching Open / Closed toggle.
  - ERP Messaging toggle (`notifications_enabled`).
  - Time window and closure reason inputs.
  - Unsaved change warnings and confirmation dialog for closure.

---

## [Phase 13 & 14] Verification & Production Acceptance
- **TypeScript Typecheck:** `npx tsc --noEmit` executed with **0 errors**.
- **Production Bundle:** `npm run build` completed successfully, producing optimized chunks in `dist/`.
- **Zero Mock Fallbacks in Production:** All production screens use real API payloads and verified live schemas.
