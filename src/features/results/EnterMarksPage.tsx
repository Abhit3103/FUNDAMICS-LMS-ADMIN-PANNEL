import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Award,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { resultsApi } from './results.api';
import { studentsApi } from '@/features/students/students.api';
import { toast } from '@/hooks/use-toast';
import type { Student } from '@/types';

export default function EnterMarksPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [marksMap, setMarksMap] = useState<Record<string, number | undefined>>({});
  const [absentMap, setAbsentMap] = useState<Record<string, boolean>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const { data: studentsData = [], isLoading } = useQuery({
    queryKey: ['students-list', 'marks-roster'],
    queryFn: () => studentsApi.getStudents({ page: 1, size: 100 }),
  });

  const students: Student[] = Array.isArray(studentsData)
    ? studentsData
    : (studentsData as any)?.items ?? [];

  const submitMutation = useMutation({
    mutationFn: (payload: { exam_id: string; marks_entries: any[] }) =>
      resultsApi.submitMarks(payload),
    onSuccess: () => {
      toast({
        title: 'Marks Saved',
        description: 'Student test scores recorded successfully.',
      });
      navigate('/results/exams');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save marks',
        description: err?.response?.data?.detail || 'An error occurred while saving marks.',
      });
    },
  });

  const handleMarksChange = (studentId: string, val: string) => {
    const num = val === '' ? undefined : Number(val);
    setMarksMap((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleAbsentToggle = (studentId: string) => {
    setAbsentMap((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRemarksMap((prev) => ({ ...prev, [studentId]: remarks }));
  };

  const handleSaveMarks = () => {
    const entries = students
      .filter((s) => marksMap[s.id] !== undefined || absentMap[s.id])
      .map((s) => ({
        student_id: s.id,
        marks_obtained: absentMap[s.id] ? 0 : (marksMap[s.id] ?? 0),
        max_marks: 100,
        remarks: absentMap[s.id] ? 'ABSENT' : remarksMap[s.id] || null,
      }));

    if (entries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Marks Entered',
        description: 'Please enter scores for at least one student before saving.',
      });
      return;
    }

    submitMutation.mutate({
      exam_id: examId!,
      marks_entries: entries,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enter Assessment Marks"
        description={`Record scores for Assessment ID: ${examId}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Results', href: '/results/exams' },
          { label: 'Enter Marks' },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/results/exams" className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Exams</span>
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading marks roster...</p>
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={<Award className="h-10 w-10 text-muted-foreground" />}
            title="No students enrolled"
            message="No active students found in the roster to assign marks to."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Student Code</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-32">Marks</TableHead>
                <TableHead className="w-24 text-center">Absent</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, idx) => {
                const isAbsent = Boolean(absentMap[student.id]);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                        {student.student_code || student.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {student.full_name}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Marks"
                        disabled={isAbsent}
                        value={marksMap[student.id] ?? ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={isAbsent}
                        onChange={() => handleAbsentToggle(student.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional feedback..."
                        value={remarksMap[student.id] || ''}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        className="h-8 text-xs max-w-xs"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSaveMarks}
          disabled={submitMutation.isPending || students.length === 0}
          className="min-w-[150px]"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Submit Marks
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
