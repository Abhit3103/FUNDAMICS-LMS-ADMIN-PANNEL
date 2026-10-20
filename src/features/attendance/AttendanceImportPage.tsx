import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FileCheck,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { AttendancePreviewResponse } from '@/types';

export default function AttendanceImportPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [classId, setClassId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(today);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<AttendancePreviewResponse | null>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['academic-batches', classId],
    queryFn: () => academicsApi.getBatches(classId || undefined),
    enabled: Boolean(classId),
  });

  const previewMutation = useMutation({
    mutationFn: (file: File) =>
      attendanceApi.previewExcelImport({
        class_id: classId,
        batch_id: batchId,
        attendance_date: attendanceDate,
        file,
      }),
    onSuccess: (data) => {
      setPreviewData(data);
      toast({
        title: 'Spreadsheet Validated',
        description: `Parsed ${data.total_rows} rows (${data.valid_rows} valid, ${data.error_rows} errors).`,
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Preview Failed',
        description:
          err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          'Failed to validate spreadsheet format.',
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (importId: string) => attendanceApi.confirmExcelImport(importId),
    onSuccess: (res) => {
      toast({
        title: 'Attendance Import Confirmed',
        description:
          res.message ||
          `Successfully committed ${res.committed_rows ?? 'all'} attendance records to database.`,
      });
      navigate('/attendance/students');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Import Confirmation Failed',
        description:
          err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          'Could not commit imported attendance.',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
    }
  };

  const handleUploadPreview = () => {
    if (!classId || !batchId || !attendanceDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Parameters',
        description: 'Please select class, batch, and attendance date before uploading.',
      });
      return;
    }
    if (selectedFile) {
      previewMutation.mutate(selectedFile);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Student Code,Student Name,Status,Remarks\nSTU-2026-001,Aarav Sharma,PRESENT,Regular\nSTU-2026-002,Priya Patel,ABSENT,Sick leave\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'fundamics_attendance_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Excel Attendance Import"
        description="Bulk import attendance sheets generated from offline rosters or classroom spreadsheets."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Attendance', href: '/attendance/students' },
          { label: 'Excel Import' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadSample}>
              <Download className="h-4 w-4 mr-1.5" />
              Download Template
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/attendance/students" className="flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Roster</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Step 1: Select Parameters */}
      <Card>
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              1
            </span>
            <span>Target Session Parameters</span>
          </CardTitle>
          <CardDescription>
            Specify the class, batch, and date this spreadsheet applies to.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-class">Target Class *</Label>
              <select
                id="import-class"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setBatchId('');
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
              <Label htmlFor="import-batch">Target Batch *</Label>
              <select
                id="import-batch"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
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
              <Label htmlFor="import-date">Attendance Date *</Label>
              <Input
                id="import-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Upload File */}
      <Card>
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              2
            </span>
            <span>Select Attendance Spreadsheet</span>
          </CardTitle>
          <CardDescription>
            Supported file formats: .xlsx, .xls, .csv. File must contain student codes and attendance statuses (PRESENT, ABSENT, LATE, EXCUSED).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors flex flex-col items-center justify-center">
            <FileSpreadsheet className="h-12 w-12 text-primary/70 mb-3" />
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-sm font-semibold text-primary hover:underline"
            >
              Click to choose a spreadsheet file
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFile ? selectedFile.name : 'or drag and drop your file here'}
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                onClick={handleUploadPreview}
                disabled={previewMutation.isPending || !classId || !batchId}
                size="sm"
              >
                {previewMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                )}
                Analyze & Preview
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Verification Preview Table */}
      {previewData && (
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <span>Review Preview & Confirm Commit</span>
                </CardTitle>
                <CardDescription>
                  Examine row validations before committing records into the official attendance ledger.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">Total: {previewData.total_rows}</Badge>
                <Badge variant="success">Valid: {previewData.valid_rows}</Badge>
                {previewData.error_rows > 0 && (
                  <Badge variant="destructive">Errors: {previewData.error_rows}</Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Student Code</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validation Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previewData.preview_data || previewData.preview || []).map((row) => (
                    <TableRow key={row.row_number} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">{row.row_number}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{row.student_code}</TableCell>
                      <TableCell className="font-medium text-sm">{row.student_name || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === 'PRESENT'
                              ? 'success'
                              : row.status === 'ABSENT'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.is_valid ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                            <AlertTriangle className="h-3 w-3" />{' '}
                            {row.error_message || row.errors?.join(', ') || 'Invalid Record'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPreviewData(null)}
                disabled={confirmMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmMutation.mutate(previewData.import_id)}
                disabled={confirmMutation.isPending || previewData.valid_rows === 0}
              >
                {confirmMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Confirm & Import {previewData.valid_rows} Records
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
