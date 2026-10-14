import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GraduationCap,
  Calculator,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { teachersApi } from '@/features/teachers/teachers.api';
import { attendanceApi } from '@/features/attendance/attendance.api';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import type { Teacher, TeacherAttendanceDaySummary } from '@/types';

export default function TeacherAttendancePage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState('');
  const [calculatingId, setCalculatingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [calculatedRecords, setCalculatedRecords] = useState<
    Record<string, TeacherAttendanceDaySummary>
  >({});

  const { data: teachers = [], isLoading, refetch } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => teachersApi.getTeachers(),
  });

  const calculateMutation = useMutation({
    mutationFn: async ({ teacherId, targetDate }: { teacherId: string; targetDate: string }) => {
      setCalculatingId(teacherId);
      const res = await attendanceApi.calculateTeacherAttendance(teacherId, targetDate);
      return { teacherId, res };
    },
    onSuccess: ({ teacherId, res }) => {
      setCalculatedRecords((prev) => ({
        ...prev,
        [teacherId]: res,
      }));
      toast({
        title: 'Attendance Evaluated',
        description: `Status: ${res.status} | Served: ${res.served_minutes || 0}m of ${res.required_minutes || 0}m required.`,
      });
      setCalculatingId(null);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description:
          err?.response?.data?.detail || 'Could not evaluate attendance for this faculty member.',
      });
      setCalculatingId(null);
    },
  });

  const handleSyncAll = async () => {
    if (filteredTeachers.length === 0) return;
    setIsSyncingAll(true);
    let successCount = 0;
    for (const t of filteredTeachers) {
      try {
        const res = await attendanceApi.calculateTeacherAttendance(t.id, date);
        setCalculatedRecords((prev) => ({
          ...prev,
          [t.id]: res,
        }));
        successCount++;
      } catch {
        // Continue with others
      }
    }
    setIsSyncingAll(false);
    toast({
      title: 'Batch Sync Complete',
      description: `Evaluated ${successCount} of ${filteredTeachers.length} faculty attendance records for ${date}.`,
    });
  };

  const filteredTeachers = (Array.isArray(teachers) ? teachers : []).filter(
    (t: Teacher) =>
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      (t.employee_id && t.employee_id.toLowerCase().includes(search.toLowerCase())) ||
      (t.teacher_code && t.teacher_code.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (summary?: TeacherAttendanceDaySummary) => {
    if (!summary) {
      return (
        <Badge variant="outline" className="text-muted-foreground border-dashed">
          Not Evaluated
        </Badge>
      );
    }

    switch (summary.status) {
      case 'PRESENT':
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" /> Present
          </Badge>
        );
      case 'HALF_DAY':
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" /> Half Day
          </Badge>
        );
      case 'INCOMPLETE':
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" /> Incomplete
          </Badge>
        );
      case 'REVIEW_REQUIRED':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="h-3 w-3" /> Review Req.
          </Badge>
        );
      case 'HOLIDAY':
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit bg-blue-50 text-blue-700 border-blue-200">
            Holiday
          </Badge>
        );
      case 'ABSENT':
      default:
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" /> Absent
          </Badge>
        );
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Attendance"
        description="Monitor staff check-in times, biometric clock-in logs, and evaluate working hours against institute policy."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Attendance' },
          { label: 'Faculty' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSyncAll}
              disabled={isSyncingAll || filteredTeachers.length === 0}
              className="gap-1.5"
            >
              {isSyncingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              Sync All Visible ({filteredTeachers.length})
            </Button>
          </div>
        }
      />

      {/* Backend API Integration Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 dark:bg-blue-950/20 dark:border-blue-900 p-4 text-sm text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">Biometric Sync & Calculation Engine</p>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
            Biometric punches are ingested automatically from hardware devices at{' '}
            <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">
              /api/v1/teacher-attendance/events
            </code>
            . Use the <strong>Sync Biometric</strong> button to run the calculation engine on-demand
            for the selected date. The backend computes check-in, check-out, served minutes, and
            status according to institute working-hour rules.
          </p>
        </div>
      </div>

      {/* Date & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search faculty name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Target Date:</span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 font-mono text-sm"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing: <span className="font-semibold text-foreground">{filteredTeachers.length}</span> of{' '}
          {teachers.length} faculty
        </div>
      </div>

      {/* Teachers Attendance Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading faculty directory...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-10 w-10 text-muted-foreground" />}
            title="No faculty members found"
            message="No registered faculty members found matching your search criteria."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Member</TableHead>
                <TableHead>Employee / Bio ID</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead>Served / Required</TableHead>
                <TableHead>Calculated Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => {
                const summary = calculatedRecords[teacher.id];
                const displayName = teacher.full_name || teacher.name || 'Faculty Member';
                const empCode =
                  teacher.employee_id ||
                  teacher.teacher_code ||
                  teacher.biometric_employee_id ||
                  teacher.id.slice(0, 8);

                return (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center text-xs font-semibold shrink-0">
                          {getInitials(displayName)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{teacher.email || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted border">
                        {empCode}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {formatTime(summary?.check_in_at)}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {formatTime(summary?.check_out_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {summary ? (
                        <span className="text-xs font-mono">
                          <span
                            className={
                              (summary.served_minutes || 0) >= (summary.required_minutes || 0)
                                ? 'text-emerald-600 font-semibold'
                                : 'text-amber-600'
                            }
                          >
                            {Math.round((summary.served_minutes || 0) / 60)}h{' '}
                            {(summary.served_minutes || 0) % 60}m
                          </span>{' '}
                          / {Math.round((summary.required_minutes || 0) / 60)}h req
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(summary)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          calculateMutation.mutate({ teacherId: teacher.id, targetDate: date })
                        }
                        disabled={calculatingId === teacher.id || isSyncingAll}
                        className="text-xs gap-1.5"
                      >
                        {calculatingId === teacher.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        Sync Biometric
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
