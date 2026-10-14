import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AdminGuard } from './AdminGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

// Lazy-load pages for code splitting
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));

// Academic
const ClassesPage = lazy(() => import('@/features/academics/ClassesPage'));
const BatchesPage = lazy(() => import('@/features/academics/BatchesPage'));
const SubjectsPage = lazy(() => import('@/features/academics/SubjectsPage'));

// Students
const StudentsPage = lazy(() => import('@/features/students/StudentsPage'));
const RegisterStudentPage = lazy(() => import('@/features/students/RegisterStudentPage'));
const StudentDetailPage = lazy(() => import('@/features/students/StudentDetailPage'));

// Teachers
const TeachersPage = lazy(() => import('@/features/teachers/TeachersPage'));
const RegisterTeacherPage = lazy(() => import('@/features/teachers/RegisterTeacherPage'));

// Attendance
const StudentAttendancePage = lazy(() => import('@/features/attendance/StudentAttendancePage'));
const TeacherAttendancePage = lazy(() => import('@/features/attendance/TeacherAttendancePage'));
const AttendanceImportPage = lazy(() => import('@/features/attendance/AttendanceImportPage'));

// Results
const ExamsPage = lazy(() => import('@/features/results/ExamsPage'));
const EnterMarksPage = lazy(() => import('@/features/results/EnterMarksPage'));

// Notes
const NotesPage = lazy(() => import('@/features/notes/NotesPage'));

// Calendar
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'));

// System
const AuditLogsPage = lazy(() => import('@/features/audit-logs/AuditLogsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));

const ComingSoonPage = lazy(() => import('@/components/shared/ComingSoonPage'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    // All admin routes are protected
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          {
            path: '/dashboard',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          // Academic
          {
            path: '/academics/classes',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <ClassesPage />
              </Suspense>
            ),
          },
          {
            path: '/academics/batches',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <BatchesPage />
              </Suspense>
            ),
          },
          {
            path: '/academics/subjects',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <SubjectsPage />
              </Suspense>
            ),
          },
          // Students
          {
            path: '/students',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <StudentsPage />
              </Suspense>
            ),
          },
          {
            path: '/students/register',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <RegisterStudentPage />
              </Suspense>
            ),
          },
          {
            path: '/students/:id',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <StudentDetailPage />
              </Suspense>
            ),
          },
          // Teachers
          {
            path: '/teachers',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <TeachersPage />
              </Suspense>
            ),
          },
          {
            path: '/teachers/register',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <RegisterTeacherPage />
              </Suspense>
            ),
          },
          // Attendance
          {
            path: '/attendance/students',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <StudentAttendancePage />
              </Suspense>
            ),
          },
          {
            path: '/attendance/teachers',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <TeacherAttendancePage />
              </Suspense>
            ),
          },
          {
            path: '/attendance/import',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <AttendanceImportPage />
              </Suspense>
            ),
          },
          // Results
          { path: '/results', element: <Navigate to="/results/exams" replace /> },
          {
            path: '/results/exams',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <ExamsPage />
              </Suspense>
            ),
          },
          {
            path: '/results/marks/:examId',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <EnterMarksPage />
              </Suspense>
            ),
          },
          // Notes
          {
            path: '/notes',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <NotesPage />
              </Suspense>
            ),
          },
          // Calendar
          {
            path: '/calendar',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <CalendarPage />
              </Suspense>
            ),
          },
          // System
          {
            path: '/analytics',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <AnalyticsPage />
              </Suspense>
            ),
          },
          {
            path: '/notifications',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <NotificationsPage />
              </Suspense>
            ),
          },
          {
            path: '/audit-logs',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <AuditLogsPage />
              </Suspense>
            ),
          },
          {
            path: '/settings',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <SettingsPage />
              </Suspense>
            ),
          },
          {
            path: '*',
            element: (
              <Suspense fallback={<LoadingScreen />}>
                <ComingSoonPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
