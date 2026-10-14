import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Search, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { academicsApi } from './academics.api';
import { toast } from '@/hooks/use-toast';
import type { CreateSubjectRequest } from '@/types';

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Form state
  const [classId, setClassId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['academic-subjects', selectedClassFilter],
    queryFn: () => academicsApi.getSubjects(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSubjectRequest) => academicsApi.createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-subjects'] });
      toast({ title: 'Subject Created', description: 'Subject created successfully.' });
      setIsDialogOpen(false);
      setName('');
      setCode('');
      setClassId('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create subject',
        description: err?.response?.data?.detail || err?.message || 'An unexpected error occurred.',
      });
    },
  });

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase()));
    const matchesClass =
      selectedClassFilter === 'all' || s.class_id === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      toast({ variant: 'destructive', title: 'Class required', description: 'Please select an academic class.' });
      return;
    }

    createMutation.mutate({
      class_id: classId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects & Courses"
        description="Manage curriculum subjects, subjects per class, and subject codes."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academics' },
          { label: 'Subjects' },
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-60 h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
          Total Subjects: <span className="font-semibold text-foreground">{subjects.length}</span>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading subjects...</span>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10 text-muted-foreground" />}
            title="No subjects found"
            description={
              search || selectedClassFilter !== 'all'
                ? 'No subjects match your search or class filter criteria.'
                : 'No subjects have been created yet. Click "Add Subject" to create one.'
            }
            action={
              !search && selectedClassFilter === 'all' ? (
                <Button onClick={() => setIsDialogOpen(true)} size="sm">
                  Add First Subject
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Subject Name</TableHead>
                <TableHead>Subject Code</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((sub) => {
                const parentClass = classes.find((c) => c.id === sub.class_id);
                return (
                  <TableRow key={sub.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>{sub.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                        {sub.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {parentClass?.name || 'Class Assigned'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {sub.status || 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Subject Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Subject</DialogTitle>
            <DialogDescription>
              Assign a curriculum subject to a target class.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sub-class">Target Class *</Label>
              <select
                id="sub-class"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  const selected = classes.find((c) => c.id === e.target.value);
                  if (selected && !code) {
                    setCode(`SUB-${selected.code.replace('CLS-', '')}-GEN`);
                  }
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="">Select an academic class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-name">Subject Name *</Label>
              <Input
                id="sub-name"
                placeholder="e.g. Physics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-code">Subject Code *</Label>
              <Input
                id="sub-code"
                placeholder="e.g. SUB-10-PHY"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Save Subject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
