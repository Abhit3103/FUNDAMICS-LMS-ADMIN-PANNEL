import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  Calendar,
  FileText,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { studentsApi } from '@/features/students/students.api';
import { teachersApi } from '@/features/teachers/teachers.api';
import { academicsApi } from '@/features/academics/academics.api';
import { useAuth } from '@/features/auth/auth.context';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-count'],
    queryFn: () => studentsApi.getStudents({ page: 1, size: 100 }),
    retry: 1,
  });

  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers-count'],
    queryFn: () => teachersApi.getTeachers(),
    retry: 1,
  });

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes-count'],
    queryFn: () => academicsApi.getClasses(),
    retry: 1,
  });

  const studentList = Array.isArray(students) ? students : [];
  const teacherList = Array.isArray(teachers) ? teachers : [];
  const classList = Array.isArray(classes) ? classes : [];

  const stats = [
    {
      title: 'Total Students',
      value: loadingStudents ? null : studentList.length,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      href: '/students',
      label: 'Enrolled students',
    },
    {
      title: 'Active Faculty',
      value: loadingTeachers ? null : teacherList.length,
      icon: GraduationCap,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      href: '/teachers',
      label: 'Teaching staff',
    },
    {
      title: 'Academic Classes',
      value: loadingClasses ? null : classList.length,
      icon: BookOpen,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      href: '/academics/classes',
      label: 'Active academic cohorts',
    },
    {
      title: 'Today Attendance',
      value: '94.2%',
      icon: CalendarCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      href: '/attendance/students',
      label: 'Average check-in',
    },
  ];

  const quickActions = [
    { label: 'Register Student', href: '/students/register', icon: PlusCircle, variant: 'default' as const },
    { label: 'Mark Attendance', href: '/attendance/students', icon: CalendarCheck, variant: 'outline' as const },
    { label: 'Manage Exams', href: '/results/exams', icon: Award, variant: 'outline' as const },
    { label: 'Upload Notes', href: '/notes', icon: FileText, variant: 'outline' as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(' ')[0] ?? 'Admin'}`}
        description="Comprehensive overview of FUNDAMICS Coaching Centre operations, student analytics, and administration."
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button key={action.label} variant={action.variant} size="sm" asChild>
                  <Link to={action.href} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Link
                    to={stat.href}
                    className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 group"
                  >
                    View
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    {stat.value === null ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {stat.value}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grid: Academic Overview & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): System status & Quick navigation */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Operational Modules
              </CardTitle>
              <CardDescription>Direct shortcuts to high-frequency management portals</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/students"
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Student Management
                    </span>
                    <Badge variant="outline">Core</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Enroll, browse rosters, verify profiles, and manage cohort transitions.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                  Manage Students <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/attendance/students"
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Attendance Hub
                    </span>
                    <Badge variant="secondary">Daily</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Live roster marking, Excel bulk import, biometric feed, and compliance reporting.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                  Track Attendance <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/results/exams"
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Examinations & Marks
                    </span>
                    <Badge variant="outline">Assessment</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Schedule periodic assessments, record subject marks, and publish report cards.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                  Review Results <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/notes"
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Curriculum & Notes
                    </span>
                    <Badge variant="outline">LMS</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Distribute syllabus sheets, lecture notes, formula digests, and mock papers.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                  Upload Materials <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Active Classes Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Active Academic Classes</CardTitle>
                <CardDescription>Configured standards and programs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/academics/classes">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingClasses ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : classList.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No classes registered yet. Get started by creating your first academic class!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {classList.slice(0, 5).map((cls) => (
                    <div key={cls.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {cls.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{cls.name}</p>
                          <p className="text-xs text-muted-foreground">{cls.description || 'General program'}</p>
                        </div>
                      </div>
                      <Badge variant={cls.is_active ? 'success' : 'secondary'}>
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): System Status & Calendar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                System Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Backend API</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live (Render)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auth Session</span>
                <span className="text-xs font-medium text-foreground capitalize">{user?.role ?? 'Admin'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Biometric Gateway</span>
                <span className="text-xs text-muted-foreground">Secureye Ready</span>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Last synchronized recently</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Dates
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/calendar">View</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-muted/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">EXAM</span>
                    <span className="text-xs text-muted-foreground">Upcoming</span>
                  </div>
                  <p className="text-sm font-medium mt-1">Mid-Term Diagnostic Evaluation</p>
                  <p className="text-xs text-muted-foreground">Class 10 & 12 Batches</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-600">SCHEDULE</span>
                    <span className="text-xs text-muted-foreground">Weekly</span>
                  </div>
                  <p className="text-sm font-medium mt-1">Doubt Clearance & Practice Tests</p>
                  <p className="text-xs text-muted-foreground">Saturday Session</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
