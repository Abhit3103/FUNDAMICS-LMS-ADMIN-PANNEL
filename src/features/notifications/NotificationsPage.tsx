import { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('ALL');
  const [sending, setSending] = useState(false);

  const mockBroadcasts = [
    {
      id: '1',
      title: 'Weekly Test Series Rescheduled',
      target: 'Class 12 - NEET Batch',
      sent_at: '2026-10-10 14:30',
      status: 'Delivered',
    },
    {
      id: '2',
      title: 'Biometric System Routine Calibration',
      target: 'Faculty & Teachers',
      sent_at: '2026-10-08 09:15',
      status: 'Delivered',
    },
    {
      id: '3',
      title: 'Diwali Break Schedule Announcement',
      target: 'All Students & Parents',
      sent_at: '2026-10-05 18:00',
      status: 'Delivered',
    },
  ];

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: 'Please provide both title and announcement body.' });
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({
        title: 'Broadcast Dispatched',
        description: `Announcement "${title}" broadcasted to ${recipient.toLowerCase()} recipients.`,
      });
      setTitle('');
      setMessage('');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification & Broadcast Hub"
        description="Send push alerts, SMS announcements, and portal notifications to students and faculty."
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
                Dispatch New Broadcast
              </CardTitle>
              <CardDescription>
                Deliver important schedule updates or exam reminders immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBroadcast} className="space-y-4">
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
                  <label className="text-sm font-medium">Notification Title</label>
                  <Input
                    placeholder="e.g. Schedule Update for Physics Advanced"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Message Content</label>
                  <Textarea
                    placeholder="Enter detailed message to be delivered via portal push..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={sending} className="min-w-[130px]">
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Broadcast'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Dispatches */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Recent Broadcasts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockBroadcasts.map((b) => (
                <div key={b.id} className="p-3 rounded-lg border bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{b.title}</p>
                    <Badge variant="success" className="text-[10px] px-1.5 py-0">
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Target: {b.target}</p>
                  <p className="text-[10px] text-muted-foreground/80">{b.sent_at}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
