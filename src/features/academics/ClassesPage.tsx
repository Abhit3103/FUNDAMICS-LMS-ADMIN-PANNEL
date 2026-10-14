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
import type { CreateClassRequest } from '@/types';

// Standard Indian coaching classes 1 through 12
const STANDARD_CLASSES = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

const EDUCATION_BOARDS = ['CBSE', 'ICSE', 'State Board', 'Foundation / Olympiad'];

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Structured form state aligned to coaching standards
  const [selectedGrade, setSelectedGrade] = useState('Class 10');
  const [selectedBoard, setSelectedBoard] = useState('CBSE');
  const [streamOrSpec, setStreamOrSpec] = useState('Science');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateClassRequest) => academicsApi.createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      toast({
        title: 'Class Created',
        description: 'Academic class has been created successfully.',
      });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create class',
        description: err?.response?.data?.detail || err?.message || 'An unexpected error occurred.',
      });
    },
  });

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate clean coaching standard name and code
    const specSuffix = streamOrSpec.trim() ? ` - ${streamOrSpec.trim()}` : '';
    const className = `${selectedGrade} (${selectedBoard})${specSuffix}`;

    // Clean code e.g. CLS-10-CBSE-SCI
    const gradeNum = selectedGrade.replace(/\D/g, '');
    const boardCode = selectedBoard.replace(/\s+/g, '').slice(0, 4).toUpperCase();
    const specCode = streamOrSpec.trim()
      ? `-${streamOrSpec.trim().slice(0, 3).toUpperCase()}`
      : '';
    const classCode = `CLS-${gradeNum || 'GEN'}-${boardCode}${specCode}`;

    createMutation.mutate({
      name: className,
      code: classCode,
      academic_year: academicYear.trim() || '2026-2027',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Classes"
        description="Standard classes (Class 1 to 12) and education boards for coaching batches."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academics' },
          { label: 'Classes' },
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground self-start sm:self-auto">
          Total Classes: <span className="font-semibold text-foreground">{classes.length}</span>
        </div>
      </div>

      {/* Classes Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading academic classes...</span>
          </div>
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10 text-muted-foreground" />}
            title="No classes found"
            description={
              search
                ? `No class matched "${search}". Try another search term.`
                : 'No academic classes configured yet. Click "Add Class" to get started.'
            }
            action={
              !search ? (
                <Button onClick={() => setIsDialogOpen(true)} size="sm">
                  Add First Class
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Class Name</TableHead>
                <TableHead>Class Code</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                      {item.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.academic_year || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {item.status || 'Active'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Class Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Class</DialogTitle>
            <DialogDescription>
              Select grade standard (Class 1 to 12) and applicable education board.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="grade-select">Standard Grade *</Label>
              <select
                id="grade-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {STANDARD_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="board-select">Education Board / Curriculum *</Label>
              <select
                id="board-select"
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {EDUCATION_BOARDS.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stream-spec">Stream / Specialization (Optional)</Label>
              <Input
                id="stream-spec"
                placeholder="e.g. Science, Commerce, Foundation"
                value={streamOrSpec}
                onChange={(e) => setStreamOrSpec(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="academic-year">Academic Year *</Label>
              <Input
                id="academic-year"
                placeholder="e.g. 2026-2027"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
              />
            </div>

            {/* Live generated preview */}
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1 border">
              <p className="font-medium text-foreground">Generated Class Details:</p>
              <p className="text-muted-foreground">
                Name: <span className="font-semibold text-foreground">{selectedGrade} ({selectedBoard}){streamOrSpec ? ` - ${streamOrSpec}` : ''}</span>
              </p>
              <p className="text-muted-foreground">
                Code: <code className="font-mono text-foreground font-semibold">CLS-{selectedGrade.replace(/\D/g, '') || 'GEN'}-{selectedBoard.slice(0, 4).toUpperCase()}</code>
              </p>
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
                Save Class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
