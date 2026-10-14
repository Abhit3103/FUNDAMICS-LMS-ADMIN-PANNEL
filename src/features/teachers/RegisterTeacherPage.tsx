import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teachersApi } from './teachers.api';
import { toast } from '@/hooks/use-toast';
import type { CreateTeacherRequest } from '@/types';

export default function RegisterTeacherPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [biometricId, setBiometricId] = useState('');

  // Auto-generate suggested teacher code
  useEffect(() => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setTeacherCode(`TCH-${new Date().getFullYear()}-${randomSuffix}`);
  }, []);

  const registerMutation = useMutation({
    mutationFn: (payload: CreateTeacherRequest) => teachersApi.createTeacher(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
      toast({
        title: 'Faculty Registered Successfully',
        description: `${data.name || data.full_name} enrolled with Code ${data.teacher_code}.`,
      });
      navigate('/teachers');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description:
          err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          'Please verify mandatory fields and try again.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !teacherCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please provide teacher name, email, and teacher code.',
      });
      return;
    }

    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      teacher_code: teacherCode.trim().toUpperCase(),
      phone: phone.trim() || null,
      biometric_employee_id: biometricId.trim() || null,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Faculty Registration"
        description="Add a new teacher or instructor to the coaching centre staff directory."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Teachers', href: '/teachers' },
          { label: 'Register' },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/teachers" className="flex items-center gap-1.5">
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
            Faculty Enrollment Form
          </CardTitle>
          <CardDescription>
            Enter instructor details and biometric employee mapping.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="teacher-name">Faculty Full Name *</Label>
                <Input
                  id="teacher-name"
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="teacher-code">Teacher / Employee Code *</Label>
                <Input
                  id="teacher-code"
                  placeholder="e.g. TCH-2026-001"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biometric-id">Biometric Employee ID (Optional)</Label>
                <Input
                  id="biometric-id"
                  placeholder="e.g. BIO-EMP-001"
                  value={biometricId}
                  onChange={(e) => setBiometricId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Secureye hardware device mapping ID.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="teacher-email">Email Address *</Label>
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="e.g. rajesh.verma@fundamics.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="teacher-phone">Phone Number (Optional)</Label>
                <Input
                  id="teacher-phone"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/teachers')}
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
                    Register Faculty
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
