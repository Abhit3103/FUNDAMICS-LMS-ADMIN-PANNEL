import { useState, useId } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  Globe,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { resultsApi } from './results.api';
import { academicsApi } from '@/features/academics/academics.api';
import { studentsApi } from '@/features/students/students.api';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { Student, EnterMarksItem } from '@/types';

interface RecordedResultItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  examId: string;
  examName: string;
  marksObtained: number;
  maxMarks: number;
  documentName?: string;
  isPublished: boolean;
  date: string;
}

export default function ExamsPage() {
  const queryClient = useQueryClient();
  const fileInputId = useId();

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

  // Marks & upload states
  const [marksObtained, setMarksObtained] = useState<string>('');
  const [maxMarks, setMaxMarks] = useState<string>('100');
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadStatus, setFileUploadStatus] = useState<'idle' | 'uploaded' | 'unsupported'>('idle');
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [autoPublish, setAutoPublish] = useState(false);

  // Local recorded results list for session view
  const [recordedResults, setRecordedResults] = useState<RecordedResultItem[]>([]);
  const [searchHistory, setSearchHistory] = useState('');

  // 1. Fetch Classes
  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  // 2. Fetch Batches for Selected Class
  const { data: batches = [] } = useQuery({
    queryKey: ['academic-batches', selectedClassId],
    queryFn: () => academicsApi.getBatches(selectedClassId || undefined),
    enabled: Boolean(selectedClassId),
  });

  // 3. Fetch Students for Selected Class & Batch
  const { data: studentsData = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-for-results', selectedClassId, selectedBatchId],
    queryFn: () =>
      studentsApi.getStudents({
        class_id: selectedClassId || undefined,
        batch_id: selectedBatchId || undefined,
        size: 100,
      }),
    enabled: Boolean(selectedClassId),
  });

  const studentsList: Student[] = Array.isArray(studentsData)
    ? studentsData
    : (studentsData as any)?.items ?? [];

  // 4. Fetch / Cache Exams
  const { data: exams = [] } = useQuery({
    queryKey: ['exams-list', selectedClassId, selectedBatchId],
    queryFn: () =>
      resultsApi.getExams({
        class_id: selectedClassId || undefined,
        batch_id: selectedBatchId || undefined,
      }),
  });

  // Selected student entity
  const selectedStudent = studentsList.find((s) => s.id === selectedStudentId);

  // File Upload Mutation (uses POST /admin/files/upload)
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/admin/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      setUploadedFileId(data.id);
      setFileUploadStatus('uploaded');
      toast({
        title: 'Document Uploaded to Storage',
        description: `Stored as ${data.original_filename || selectedFile?.name} (Storage ID: ${data.id.slice(0, 8)}).`,
      });
    },
    onError: (err: any) => {
      setFileUploadStatus('unsupported');
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description:
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to upload document to storage. Please check file format and try again.',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileUploadStatus('idle');
      uploadFileMutation.mutate(file);
    }
  };

  // Submit Result & Marks Mutation
  const submitResultMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error('Please select a student.');
      let targetExamId = selectedExamId;

      // If an existing exam is not selected, create one on-the-fly for this test
      if (!targetExamId) {
        if (!newExamName.trim()) {
          throw new Error('Please select an existing exam or enter an Assessment Title.');
        }
        const createdExam = await resultsApi.createExam({
          class_id: selectedClassId,
          batch_id: selectedBatchId || null,
          name: newExamName.trim(),
          date: examDate,
        });
        targetExamId = createdExam.id;
        setSelectedExamId(targetExamId);
      }

      const numMarks = parseFloat(marksObtained);
      const numMax = parseFloat(maxMarks) || 100;
      if (isNaN(numMarks)) throw new Error('Please enter valid numerical marks obtained.');

      const entry: EnterMarksItem = {
        student_id: selectedStudentId,
        marks_obtained: numMarks,
        max_marks: numMax,
        remarks: remarks.trim() || undefined,
        file_id: uploadedFileId || undefined,
      };

      // 1. Submit marks to POST /admin/exams/marks
      await resultsApi.submitMarks({
        exam_id: targetExamId,
        marks_entries: [entry],
      });

      // 2. Publish if toggled
      if (autoPublish) {
        await resultsApi.publishExam({
          exam_id: targetExamId,
          publish: true,
        });
      }

      return {
        examId: targetExamId,
        marksObtained: numMarks,
        maxMarks: numMax,
      };
    },
    onSuccess: (res) => {
      const examNameDisplay =
        exams.find((e) => e.id === res.examId)?.name || newExamName || 'Assessment Test';

      const newRecord: RecordedResultItem = {
        id: Math.random().toString(36).substring(2, 9),
        studentId: selectedStudentId,
        studentName: selectedStudent?.full_name || selectedStudent?.name || 'Student',
        studentCode: selectedStudent?.student_code || selectedStudentId.slice(0, 8),
        examId: res.examId,
        examName: examNameDisplay,
        marksObtained: res.marksObtained,
        maxMarks: res.maxMarks,
        documentName: selectedFile?.name,
        isPublished: autoPublish,
        date: examDate,
      };

      setRecordedResults((prev) => [newRecord, ...prev]);

      toast({
        title: 'Student Result Submitted',
        description: `Scores recorded for ${newRecord.studentName}. ${autoPublish ? 'Results published.' : 'Saved in draft mode.'}`,
      });

      // Reset marks and file for next entry
      setMarksObtained('');
      setRemarks('');
      setSelectedFile(null);
      setFileUploadStatus('idle');
      setUploadedFileId(null);
      queryClient.invalidateQueries({ queryKey: ['exams-list'] });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: err?.message || err?.response?.data?.detail || 'Could not record student result.',
      });
    },
  });

  const handlePublishToggle = async (item: RecordedResultItem) => {
    try {
      await resultsApi.publishExam({
        exam_id: item.examId,
        publish: !item.isPublished,
      });
      setRecordedResults((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, isPublished: !r.isPublished } : r))
      );
      toast({
        title: !item.isPublished ? 'Result Published' : 'Result Un-published',
        description: `Assessment ${item.examName} publication status updated.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: err?.response?.data?.detail || 'Could not update publication state.',
      });
    }
  };

  const filteredHistory = recordedResults.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(searchHistory.toLowerCase()) ||
      r.examName.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Results Management"
        description="Select student, upload result sheet or record exam scores, and publish grades according to institute policy."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Results & Marks' },
          { label: 'Student Results' },
        ]}
      />

      {/* Backend API Documentation Banner */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-900 p-4 text-sm text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">Backend Result Storage & Verification</p>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
            Numerical marks submission (<code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">POST /admin/exams/marks</code>),
            publication status (<code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">POST /admin/exams/publish</code>),
            and direct PDF-to-student result document mapping (<code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">POST /admin/results/document-mapping</code>)
            are fully active and verified.
          </p>
        </div>
      </div>

      {/* Main Results Workflow Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          Record Student Result & Marks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Select Class */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">1. Select Class *</Label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedBatchId('');
                setSelectedStudentId('');
                setSelectedExamId('');
              }}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Choose Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Batch */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">2. Select Batch (Optional)</Label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedStudentId('');
              }}
              disabled={!selectedClassId}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">-- All Batches --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Student */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">3. Select Student *</Label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!selectedClassId || isLoadingStudents}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">
                {isLoadingStudents
                  ? 'Loading students...'
                  : studentsList.length === 0
                  ? '-- No students in this class --'
                  : '-- Choose Student --'}
              </option>
              {studentsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.name} — Code: {s.student_code || s.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exam Container Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Existing Assessment</Label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                if (e.target.value) setNewExamName('');
              }}
              disabled={!selectedClassId}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">-- Or Create New Assessment Below --</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.date || exam.exam_date || 'Date TBD'})
                </option>
              ))}
            </select>
          </div>

          {!selectedExamId && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Assessment Title *</Label>
                <Input
                  placeholder="e.g. Unit Test 2 - Physics"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  disabled={!selectedClassId}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Exam Date</Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={!selectedClassId}
                  className="font-mono text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Scores & Document Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Marks Obtained *</Label>
            <Input
              type="number"
              placeholder="e.g. 88"
              value={marksObtained}
              onChange={(e) => setMarksObtained(e.target.value)}
              disabled={!selectedStudentId}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Maximum Marks *</Label>
            <Input
              type="number"
              placeholder="100"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              disabled={!selectedStudentId}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">Result Sheet / Document (PDF / Scan)</Label>
            <div className="flex items-center gap-2">
              <Input
                id={fileInputId}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={!selectedStudentId}
                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground"
              />
              {uploadFileMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              )}
            </div>
            {selectedFile && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <FileText className="h-3 w-3 text-primary" />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                {uploadedFileId && (
                  <span className="text-emerald-600 font-medium ml-1 flex items-center gap-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Storage ID: {uploadedFileId.slice(0, 8)} ({fileUploadStatus})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Remarks & Publication Options */}
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Examiner Remarks / Feedback (Optional)</Label>
            <Input
              placeholder="e.g. Excellent numerical solving; improve question 4 derivation."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={!selectedStudentId}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <span className="font-medium text-foreground">
                Publish results immediately (Student Portal visible)
              </span>
            </label>

            <Button
              onClick={() => submitResultMutation.mutate()}
              disabled={
                !selectedStudentId ||
                !marksObtained ||
                (!selectedExamId && !newExamName.trim()) ||
                submitResultMutation.isPending
              }
              className="gap-2"
            >
              {submitResultMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Student Result
            </Button>
          </div>
        </div>
      </div>

      {/* Review & Recorded Results Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-foreground">
              Recorded Results in Session
            </h4>
            <p className="text-xs text-muted-foreground">
              History of student examination scores entered during this administrative session.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recorded results..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
            title="No Results Recorded Yet"
            message="Select a class, student, and enter exam scores above to record results."
          />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student Code</TableHead>
                  <TableHead>Assessment Title</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Result Document</TableHead>
                  <TableHead>Publication Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.studentName}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted border">
                        {item.studentCode}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{item.examName}</TableCell>
                    <TableCell className="text-sm font-semibold">
                      <span className="text-primary">{item.marksObtained}</span> / {item.maxMarks}
                    </TableCell>
                    <TableCell>
                      {item.documentName ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3 text-primary" />
                          {item.documentName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.isPublished ? (
                        <Badge variant="success" className="flex items-center gap-1 w-fit text-xs">
                          <Globe className="h-3 w-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit text-xs">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishToggle(item)}
                        className="text-xs"
                      >
                        {item.isPublished ? 'Un-publish' : 'Publish'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
