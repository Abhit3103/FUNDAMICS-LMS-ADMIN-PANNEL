import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  Save,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { attendanceApi } from './attendance.api';
import { academicsApi } from '@/features/academics/academics.api';
import { toast } from '@/hooks/use-toast';
import type { AttendanceStatus } from '@/types';

export default function StudentAttendancePage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [classId, setClassId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(today);
  const [allowHolidayOverride, setAllowHolidayOverride] = useState(false);

  // Local state for modified roster records
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['academic-batches', classId],
    queryFn: () => academicsApi.getBatches(classId || undefined),
    enabled: Boolean(classId),
  });

  // Query subjects filtered by classId so invalid cross-class subjects cannot be picked
  const { data: allSubjects = [] } = useQuery({
    queryKey: ['academic-subjects'],
    queryFn: () => academicsApi.getSubjects(),
  });

  const classSubjects = useMemo(() => {
    if (!classId) return [];
    return allSubjects.filter((s) => s.class_id === classId);
  }, [allSubjects, classId]);

  // Query roster when all 4 filters are selected
  const isFilterComplete = Boolean(classId && batchId && subjectId && date);

  const {
    data: rosterData,
    isLoading: loadingRoster,
    error: rosterError,
  } = useQuery({
    queryKey: ['attendance-roster', classId, batchId, subjectId, date],
    queryFn: () =>
      attendanceApi.getRoster({
        class_id: classId,
        batch_id: batchId,
        subject_id: subjectId,
        date,
      }),
    enabled: isFilterComplete,
  });

  // Sync existing roster statuses when data loads
  useEffect(() => {
    if (rosterData?.students) {
      const initialStatus: Record<string, AttendanceStatus> = {};
      const initialRemarks: Record<string, string> = {};
      rosterData.students.forEach((s) => {
        const studentStatus = s.status || s.existing_status;
        if (studentStatus) {
          initialStatus[s.student_id] = studentStatus;
        } else {
          initialStatus[s.student_id] = 'PRESENT'; // default to present if unmarked
        }
        const studentRemarks = s.remarks || s.existing_remarks;
        if (studentRemarks) {
          initialRemarks[s.student_id] = studentRemarks;
        }
      });
      setStatusMap(initialStatus);
      setRemarksMap(initialRemarks);
      setIsDirty(false);
    }
  }, [rosterData]);

  // Warn about unsaved changes on window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!rosterData?.students) throw new Error('No roster loaded');
      const records = rosterData.students.map((s) => ({
        student_id: s.student_id,
        student_code: s.student_code,
        status: statusMap[s.student_id] || 'PRESENT',
        remarks: remarksMap[s.student_id] || null,
      }));

      return attendanceApi.submitAttendance({
        class_id: classId,
        batch_id: batchId,
        subject_id: subjectId,
        date,
        allow_holiday_override: allowHolidayOverride,
        records,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance-roster', classId, batchId, subjectId, date],
      });
      setIsDirty(false);
      const created = res.created_count ?? res.created ?? 0;
      const updated = res.updated_count ?? res.updated ?? 0;
      toast({
        title: 'Attendance Saved Successfully',
        description:
          res.message ||
          `Processed records: ${created} created, ${updated} updated.`,
      });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'An error occurred while saving attendance records.';
      toast({
        variant: 'destructive',
        title: 'Failed to Save Attendance',
        description: msg,
      });
    },
  });

  const setAllStatus = (status: AttendanceStatus) => {
    if (!rosterData?.students) return;
    const newMap: Record<string, AttendanceStatus> = {};
    rosterData.students.forEach((s) => {
      newMap[s.student_id] = status;
    });
    setStatusMap(newMap);
    setIsDirty(true);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRemarksMap((prev) => ({ ...prev, [studentId]: remarks }));
    setIsDirty(true);
  };

  const studentsList = rosterData?.students ?? [];
  const presentCount = Object.values(statusMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(statusMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(statusMap).filter((s) => s === 'LATE').length;
  const excusedCount = Object.values(statusMap).filter((s) => s === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Attendance"
        description="Daily coaching subject attendance workflow: Class, Batch, Subject, and Date."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Attendance' },
          { label: 'Students' },
        ]}
        actions={
          <Button variant="outline" asChild className="flex items-center gap-1.5">
            <Link to="/attendance/import">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import via Excel</span>
            </Link>
          </Button>
        }
      />

      {/* Filter Selection Panel */}
      <Card>
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span>Attendance Session Parameters</span>
            </div>
            {isDirty && (
              <Badge variant="warning" className="text-xs">
                Unsaved Changes
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">1. Class *</label>
              <select
                value={classId}
                onChange={(e) => {
                  if (isDirty && !window.confirm('You have unsaved changes. Change class anyway?')) return;
                  setClassId(e.target.value);
                  setBatchId('');
                  setSubjectId('');
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select Class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">2. Batch *</label>
              <select
                value={batchId}
                onChange={(e) => {
                  if (isDirty && !window.confirm('You have unsaved changes. Change batch anyway?')) return;
                  setBatchId(e.target.value);
                }}
                disabled={!classId}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              >
                <option value="">
                  {!classId
                    ? 'Select class first...'
                    : batches.length === 0
                    ? 'No batches for class'
                    : 'Select Batch...'}
                </option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">3. Subject *</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  if (isDirty && !window.confirm('You have unsaved changes. Change subject anyway?')) return;
                  setSubjectId(e.target.value);
                }}
                disabled={!classId}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              >
                <option value="">
                  {!classId
                    ? 'Select class first...'
                    : classSubjects.length === 0
                    ? 'No subjects for class'
                    : 'Select Subject...'}
                </option>
                {classSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">4. Date *</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  if (isDirty && !window.confirm('You have unsaved changes. Change date anyway?')) return;
                  setDate(e.target.value);
                }}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holiday / Closed Warning Notice */}
      {rosterData?.is_holiday && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Scheduled Institute Closure / Holiday
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {rosterData.calendar_event_title
                  ? `Event: ${rosterData.calendar_event_title}`
                  : 'This date is marked as a holiday or closed in the academic calendar.'}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-200 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={allowHolidayOverride}
              onChange={(e) => setAllowHolidayOverride(e.target.checked)}
              className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <span>Allow Holiday Override</span>
          </label>
        </div>
      )}

      {/* Backend Error State */}
      {rosterError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            {(rosterError as any)?.response?.data?.error?.message ||
              (rosterError as any)?.response?.data?.detail ||
              'Unable to load attendance roster. Please verify parameters.'}
          </span>
        </div>
      )}

      {/* Roster & Attendance Grid */}
      {!isFilterComplete ? (
        <Card className="p-12 text-center bg-card">
          <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="font-semibold text-foreground">Select session parameters</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
            Choose an academic class, batch, subject, and date above to load the student attendance roster.
          </p>
        </Card>
      ) : loadingRoster ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading student roster from server...</p>
        </div>
      ) : studentsList.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
          title="No enrolled students found"
          message="There are no students assigned to this class and batch combination yet."
          action={
            <Button asChild size="sm">
              <Link to="/students/register">Enroll Students</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Action Bar & Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllStatus('PRESENT')}
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllStatus('ABSENT')}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Mark All Absent
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                Present: {presentCount}
              </span>
              <span className="text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
                Absent: {absentCount}
              </span>
              {lateCount > 0 && (
                <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full">
                  Late: {lateCount}
                </span>
              )}
              {excusedCount > 0 && (
                <span className="text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
                  Excused: {excusedCount}
                </span>
              )}
              <span className="text-muted-foreground">Total: {studentsList.length}</span>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student Code</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Attendance Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsList.map((student, idx) => {
                  const currentStatus = statusMap[student.student_id] || 'PRESENT';
                  return (
                    <TableRow key={student.student_id} className="hover:bg-muted/30">
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                          {student.student_code}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {student.student_name || student.full_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(student.student_id, st)}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                                currentStatus === st
                                  ? st === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : st === 'ABSENT'
                                    ? 'bg-destructive text-destructive-foreground shadow-sm'
                                    : st === 'LATE'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-muted text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Optional remark..."
                          value={remarksMap[student.student_id] || ''}
                          onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                          className="h-8 text-xs max-w-xs"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              <span>Saving will record status for all {studentsList.length} students.</span>
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="min-w-[160px]"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
