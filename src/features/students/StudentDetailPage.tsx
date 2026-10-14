import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Ban,
  GraduationCap,
  Award,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studentsApi } from './students.api';
import { formatDate, getInitials } from '@/lib/utils';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => studentsApi.getStudent(id!),
    enabled: Boolean(id),
  });

  const getStatusBadge = (status?: string) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Active
          </Badge>
        );
      case 'PENDING_VERIFICATION':
      case 'PENDING':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending Verification
          </Badge>
        );
      case 'SUSPENDED':
      case 'INACTIVE':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Ban className="h-3 w-3" /> {s}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || 'Active'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading student profile...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/students">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Students
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <p className="text-destructive font-semibold">Student record not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The requested student ID does not exist or may have been deleted.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.full_name || student.name || 'Student Details'}
        description={`Student Identification: ${student.student_code || student.id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Students', href: '/students' },
          { label: student.full_name || student.name || 'Student' },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/students" className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 mx-auto flex items-center justify-center text-2xl font-bold">
                {getInitials(student.full_name)}
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">{student.full_name}</h2>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                {student.student_code || student.id}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                {getStatusBadge(student.account_status)}
                <Badge variant={student.is_verified ? 'info' : 'outline'}>
                  {student.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>

              <div className="mt-6 border-t pt-4 space-y-3 text-left text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-foreground">{student.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground">{student.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0 text-primary" />
                  <span>Enrolled on {formatDate(student.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Academic Cohort & Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Academic Class
                </p>
                <p className="text-base font-semibold mt-1 text-foreground">
                  {student.class_name || 'Standard 10 - Foundation'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned Grade Level</p>
              </div>

              <div className="p-4 rounded-xl border bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Batch Section
                </p>
                <p className="text-base font-semibold mt-1 text-foreground">
                  {student.batch_name || 'Regular Morning Batch'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned Cohort Group</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Quick Performance Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to={`/attendance/students?class_id=${student.class_id || ''}`}
                className="p-4 rounded-xl border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm">Attendance Log</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check daily attendance records and roster presence.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">View Attendance →</div>
              </Link>

              <Link
                to={`/results/exams?class_id=${student.class_id || ''}`}
                className="p-4 rounded-xl border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm">Examinations & Marks</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Review periodic exam test scores and performance analysis.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">View Results →</div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
