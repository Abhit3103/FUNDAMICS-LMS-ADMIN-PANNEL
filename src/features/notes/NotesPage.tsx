import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Search,
  Upload,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { notesApi } from './notes.api';
import { academicsApi } from '@/features/academics/academics.api';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import type { Note, CreateNoteRequest } from '@/types';

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateNoteRequest>();
  const watchedClassId = watch('class_id');

  const { data: classes = [] } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['academic-batches', watchedClassId],
    queryFn: () => academicsApi.getBatches(watchedClassId || undefined),
    enabled: Boolean(watchedClassId),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['academic-subjects', watchedClassId],
    queryFn: () => academicsApi.getSubjects(watchedClassId || undefined),
    enabled: Boolean(watchedClassId),
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes-list'],
    queryFn: () => notesApi.getNotes(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateNoteRequest) => notesApi.createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-list'] });
      toast({ title: 'Study Material Published', description: 'Curriculum material securely stored and published.' });
      setIsDialogOpen(false);
      reset();
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to publish material',
        description: err?.response?.data?.detail || err?.message || 'An unexpected error occurred.',
      });
    },
  });

  const filteredNotes = (Array.isArray(notes) ? notes : []).filter((n: Note) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.description && n.description.toLowerCase().includes(search.toLowerCase()))
  );

  const onSubmit = async (data: CreateNoteRequest) => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'File Required',
        description: 'Please select a document or PDF file to attach to this study material.',
      });
      return;
    }

    try {
      setUploadingFile(true);
      const fileRes = await notesApi.uploadFile(selectedFile);
      setUploadingFile(false);

      createMutation.mutate({
        title: data.title,
        description: data.description || undefined,
        class_id: data.class_id,
        batch_id: data.batch_id || undefined,
        subject_id: data.subject_id,
        file_id: fileRes.id,
      });
    } catch (err: any) {
      setUploadingFile(false);
      toast({
        variant: 'destructive',
        title: 'File Upload Failed',
        description: err?.response?.data?.detail || err?.message || 'Could not upload attachment.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum & Study Materials"
        description="Distribute lecture slides, reference PDFs, formula compendiums, and solved practice questions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Notes & Materials' },
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Upload Material</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes and materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground self-start sm:self-auto">
          Total: <span className="font-semibold text-foreground">{notes.length}</span> documents
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading curriculum materials...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-xl border bg-card p-6">
          <EmptyState
            icon={<FileText className="h-10 w-10 text-muted-foreground" />}
            title="No study materials found"
            message={
              search
                ? `No document matches "${search}".`
                : 'Upload syllabus guides, revision notes, and exam answer keys for students.'
            }
            action={
              !search ? (
                <Button onClick={() => setIsDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Upload First Material
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note: Note) => {
            const assignedClass = classes.find((c) => c.id === note.class_id);
            return (
              <Card key={note.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs font-medium">
                        {assignedClass?.name || 'All Classes'}
                      </Badge>
                      {note.subject_name && (
                        <Badge variant="secondary" className="text-xs">
                          {note.subject_name}
                        </Badge>
                      )}
                    </div>
                    <Badge variant={note.is_published ? 'success' : 'secondary'}>
                      {note.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold mt-2 line-clamp-1">
                    {note.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {note.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(note.created_at)}</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium truncate max-w-[140px]" title={note.original_filename || note.file_name || 'Secure Document'}>
                        {note.original_filename || note.file_name || 'Secure Attachment'}
                      </span>
                      {note.file_size_bytes || note.file_size ? (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({(((note.file_size_bytes || note.file_size || 0) / 1024)).toFixed(0)} KB)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Study Material</DialogTitle>
            <DialogDescription>
              Share PDF lecture notes, formula sheets, or syllabus summaries with students.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Organic Chemistry - Reaction Mechanisms Master Sheet"
                {...register('title', { required: 'Document title is required' })}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="class_id">Target Class *</Label>
                <select
                  id="class_id"
                  {...register('class_id', { required: 'Please select class' })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select Class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.class_id && (
                  <p className="text-xs text-destructive">{errors.class_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject_id">Subject *</Label>
                <select
                  id="subject_id"
                  {...register('subject_id', { required: 'Please select a subject' })}
                  disabled={!watchedClassId || subjects.length === 0}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">
                    {!watchedClassId
                      ? 'Select class first...'
                      : subjects.length === 0
                      ? 'No subjects for class'
                      : 'Select Subject...'}
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.subject_id && (
                  <p className="text-xs text-destructive">{errors.subject_id.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch_id">Target Batch (Optional)</Label>
              <select
                id="batch_id"
                {...register('batch_id')}
                disabled={!watchedClassId || batches.length === 0}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">All Batches in Class</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Key chapters covered, syllabus relevance, or instructions..."
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Attachment (PDF / Document)</Label>
              <div className="border border-dashed border-border rounded-lg p-3 text-center">
                <input
                  type="file"
                  id="note-file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="note-file"
                  className="cursor-pointer text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  {selectedFile ? selectedFile.name : 'Choose attachment file'}
                </label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={createMutation.isPending || uploadingFile}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || uploadingFile}>
                {(createMutation.isPending || uploadingFile) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Publish Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
