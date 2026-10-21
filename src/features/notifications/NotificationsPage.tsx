import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Send } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { noticesApi, noticesQueryKey } from './notices.api';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('ALL');

  const {
    data: notices = [],
    isLoading: isLoadingNotices,
    isError: isNoticesError,
    refetch: refetchNotices,
  } = useQuery({
    queryKey: noticesQueryKey,
    queryFn: noticesApi.getNotices,
  });

  const createNoticeMutation = useMutation({
    mutationFn: noticesApi.createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticesQueryKey });
      toast({ title: 'Notice Created', description: 'The notice was published successfully.' });
      setTitle('');
      setMessage('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create notice',
        description: error.message || 'An unexpected error occurred.',
      });
    },
  });

  const handleCreateNotice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: 'Please provide both title and announcement body.' });
      return;
    }
    createNoticeMutation.mutate({
      title: title.trim(),
      content: message.trim(),
      target_audience: recipient,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Management"
        description="Create and manage notices for students, faculty, and guardians."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Notifications' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Announcement */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Create Notice
              </CardTitle>
              <CardDescription>
                Publish an important update to the selected audience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Audience</label>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="ALL">All Enrolled Students & Faculty</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="TEACHERS">Faculty / Teachers Only</option>
                    <option value="PARENTS">Registered Guardians</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Notice Title</label>
                  <Input
                    placeholder="e.g. Schedule Update for Physics Advanced"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Notice Content</label>
                  <Textarea
                    placeholder="Enter detailed message to be delivered via portal push..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={createNoticeMutation.isPending} className="min-w-[130px]">
                    <Send className="h-4 w-4 mr-2" />
                    {createNoticeMutation.isPending ? 'Publishing...' : 'Publish Notice'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Notice Management */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notice Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {isLoadingNotices ? (
                  <p className="text-xs text-muted-foreground">Loading notices...</p>
                ) : isNoticesError ? (
                  <div className="space-y-2">
                    <p className="text-xs text-destructive">Unable to load notices.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchNotices()}>
                      Try again
                    </Button>
                  </div>
                ) : notices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No notices have been published.</p>
                ) : notices.map((notice) => (
                  <div key={notice.id} className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{notice.title}</p>
                      <Badge
                        variant={notice.is_active ? 'success' : 'outline'}
                        className="text-[10px] px-1.5 py-0 shrink-0"
                      >
                        {notice.is_active ? 'PUBLISHED' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{notice.content}</p>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground/80">
                      <span>Target: {notice.target_audience}</span>
                      <span>{new Date(notice.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
