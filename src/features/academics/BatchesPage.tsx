import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search, Loader2, Clock } from 'lucide-react';
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
import type { CreateBatchRequest } from '@/types';

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Form state
  const [classId, setClassId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['academic-batches', selectedClassFilter],
    queryFn: () => academicsApi.getBatches(selectedClassFilter === 'all' ? undefined : selectedClassFilter),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateBatchRequest) => academicsApi.createBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-batches'] });
      toast({ title: 'Batch Created', description: 'Academic batch created successfully.' });
      setIsDialogOpen(false);
      setName('');
      setCode('');
      setClassId('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create batch',
        description: err?.response?.data?.detail || err?.message || 'An unexpected error occurred.',
      });
    },
  });

  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.code && b.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      toast({ variant: 'destructive', title: 'Class required', description: 'Please select an academic class.' });
      return;
    }

    const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    createMutation.mutate({
      class_id: classId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      start_time: formattedStartTime,
      end_time: formattedEndTime,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Batches"
        description="Manage batch timings, student cohorts, and morning/evening sections."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academics' },
          { label: 'Batches' },
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Batch</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
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
          Total Batches: <span className="font-semibold text-foreground">{batches.length}</span>
        </div>
      </div>

      {/* Batches Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading batches...</span>
          </div>
        ) : filteredBatches.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10 text-muted-foreground" />}
            title="No batches found"
            description={
              search || selectedClassFilter !== 'all'
                ? 'No batches match your search or class filter criteria.'
                : 'No batches have been configured yet. Click "Add Batch" to create one.'
            }
            action={
              !search && selectedClassFilter === 'all' ? (
                <Button onClick={() => setIsDialogOpen(true)} size="sm">
                  Add First Batch
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Batch Name</TableHead>
                <TableHead>Batch Code</TableHead>
                <TableHead>Timings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{batch.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                      {batch.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {batch.start_time?.slice(0, 5) || '—'} – {batch.end_time?.slice(0, 5) || '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={batch.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {batch.status || 'Active'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Batch Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Batch</DialogTitle>
            <DialogDescription>
              Create a section with scheduled start and end timings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="batch-class">Target Class *</Label>
              <select
                id="batch-class"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  const selected = classes.find((c) => c.id === e.target.value);
                  if (selected && !code) {
                    setCode(`BAT-${selected.code.replace('CLS-', '')}-MORN`);
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
              <Label htmlFor="batch-name">Batch Name *</Label>
              <Input
                id="batch-name"
                placeholder="e.g. Morning Batch A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch-code">Batch Code *</Label>
              <Input
                id="batch-code"
                placeholder="e.g. BAT-10-MORN"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="batch-start">Start Time *</Label>
                <Input
                  id="batch-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="batch-end">End Time *</Label>
                <Input
                  id="batch-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
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
                Save Batch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
