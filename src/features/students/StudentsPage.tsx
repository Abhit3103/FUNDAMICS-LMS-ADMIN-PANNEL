import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Users,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
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
import { studentsApi } from './students.api';
import { academicsApi } from '@/features/academics/academics.api';
import { getInitials } from '@/lib/utils';
import type { Student } from '@/types';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [page] = useState(1);

  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students-list', page, selectedClass, search],
    queryFn: () =>
      studentsApi.getStudents({
        page,
        size: 50,
        class_id: selectedClass === 'all' ? undefined : selectedClass,
        search: search.trim() || undefined,
      }),
  });

  const students: Student[] = Array.isArray(studentsData) ? studentsData : [];

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
            <Clock className="h-3 w-3" /> Pending
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        description="Comprehensive roster of enrolled students, registration details, batch mappings, and credentials."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Students' },
        ]}
        actions={
          <Button asChild className="flex items-center gap-1.5">
            <Link to="/students/register">
              <UserPlus className="h-4 w-4" />
              <span>Register Student</span>
            </Link>
          </Button>
        }
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or student code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-muted-foreground self-start sm:self-auto">
          Showing: <span className="font-semibold text-foreground">{students.length}</span> students
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading student directory...</p>
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10 text-muted-foreground" />}
            title="No students found"
            message={
              search
                ? `No student matching "${search}" was found.`
                : 'No students have been enrolled in the coaching centre yet.'
            }
            action={
              !search ? (
                <Button asChild size="sm">
                  <Link to="/students/register">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Register First Student
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Code</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Class / Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                      {student.student_code || student.id.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center text-xs font-semibold">
                        {getInitials(student.full_name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">
                        {student.class_name || 'Assigned Class'}
                      </span>
                      {student.batch_name && (
                        <span className="text-[11px] text-muted-foreground">
                          {student.batch_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(student.account_status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/students/${student.id}`} className="flex items-center gap-1 text-xs">
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
