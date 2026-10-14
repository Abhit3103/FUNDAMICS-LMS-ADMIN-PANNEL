import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  School,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  Ban,
  Fingerprint,
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
import { teachersApi } from './teachers.api';
import { getInitials } from '@/lib/utils';
import type { Teacher } from '@/types';

export default function TeachersPage() {
  const [search, setSearch] = useState('');

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => teachersApi.getTeachers(),
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

  const filteredTeachers = (Array.isArray(teachers) ? teachers : []).filter(
    (t: Teacher) =>
      (t.name && t.name.toLowerCase().includes(search.toLowerCase())) ||
      (t.full_name && t.full_name.toLowerCase().includes(search.toLowerCase())) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.teacher_code && t.teacher_code.toLowerCase().includes(search.toLowerCase())) ||
      (t.biometric_employee_id && t.biometric_employee_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty & Teachers"
        description="Manage teaching staff, teacher codes, contact information, and biometric employee mappings."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Teachers' },
        ]}
        actions={
          <Button asChild className="flex items-center gap-1.5">
            <Link to="/teachers/register">
              <UserPlus className="h-4 w-4" />
              <span>Register Faculty</span>
            </Link>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or biometric ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground self-start sm:self-auto">
          Total Faculty: <span className="font-semibold text-foreground">{teachers.length}</span>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading faculty directory...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <EmptyState
            icon={<School className="h-10 w-10 text-muted-foreground" />}
            title="No faculty members found"
            message={
              search
                ? `No faculty member matching "${search}" was found.`
                : 'No teaching faculty has been registered yet.'
            }
            action={
              !search ? (
                <Button asChild size="sm">
                  <Link to="/teachers/register">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Register First Faculty
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Teacher Code</TableHead>
                <TableHead>Faculty Name</TableHead>
                <TableHead>Contact (Email / Phone)</TableHead>
                <TableHead>Biometric ID</TableHead>
                <TableHead>Account Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/30">
                  <TableCell>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                      {teacher.teacher_code || teacher.employee_id || teacher.id.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {getInitials(teacher.name || teacher.full_name)}
                      </div>
                      <span className="font-medium text-foreground">
                        {teacher.name || teacher.full_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-foreground">{teacher.email}</p>
                      <p className="text-xs text-muted-foreground">{teacher.phone || '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {teacher.biometric_employee_id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        <Fingerprint className="h-3 w-3" />
                        {teacher.biometric_employee_id}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(teacher.status || teacher.account_status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
