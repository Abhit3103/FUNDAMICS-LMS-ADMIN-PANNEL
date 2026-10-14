import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { studentsApi } from './students.api';
import { academicsApi } from '@/features/academics/academics.api';
import { toast } from '@/hooks/use-toast';
import type { CreateStudentRequest } from '@/types';

export default function RegisterStudentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [admissionDate, setAdmissionDate] = useState(today);

  // Auto-generate suggested student code on mount
  useEffect(() => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setStudentCode(`STU-${new Date().getFullYear()}-${randomSuffix}`);
  }, []);

  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['academic-batches', selectedClassId],
    queryFn: () => academicsApi.getBatches(selectedClassId || undefined),
    enabled: Boolean(selectedClassId),
  });

  const registerMutation = useMutation({
    mutationFn: (payload: CreateStudentRequest) => studentsApi.createStudent(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      toast({
        title: 'Student Registered Successfully',
        description: `${data.name || data.full_name} enrolled with ID ${data.student_code || data.id}.`,
      });
      navigate('/students');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description:
          err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          'Please verify all mandatory fields and try again.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !studentCode.trim() || !selectedClassId || !selectedBatchId) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please provide student name, email, student code, class, and batch.',
      });
      return;
    }

    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      student_code: studentCode.trim().toUpperCase(),
      class_id: selectedClassId,
      batch_id: selectedBatchId,
      admission_date: admissionDate || today,
      phone: phone.trim() || null,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Student Registration"
        description="Enroll a new student into the FUNDAMICS coaching centre system and assign academic cohort."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Students', href: '/students' },
          { label: 'Register' },
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Student Enrollment Form
          </CardTitle>
          <CardDescription>
            Enter student details and assign to target class and batch cohort.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-xs border-b pb-1.5">
                1. Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Student Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Aryan Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="student-code">Student Code / Roll Number *</Label>
                  <Input
                    id="student-code"
                    placeholder="e.g. STU-2026-001"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. aryan.sharma@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Academic Placement */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-xs border-b pb-1.5">
                2. Academic Placement & Admission
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="class_id">Academic Class *</Label>
                  <select
                    id="class_id"
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedBatchId('');
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  >
                    <option value="">Select an academic class...</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="batch_id">Batch Cohort *</Label>
                  <select
                    id="batch_id"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={!selectedClassId}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    required
                  >
                    <option value="">
                      {!selectedClassId
                        ? 'Select class first...'
                        : batches.length === 0
                        ? 'No batches found for this class'
                        : 'Select batch...'}
                    </option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} ({batch.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admission-date">Admission Date *</Label>
                  <Input
                    id="admission-date"
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/students')}
                disabled={registerMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={registerMutation.isPending} className="min-w-[140px]">
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Registration
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
