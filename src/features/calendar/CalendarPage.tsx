import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Plus,
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { calendarApi } from './calendar.api';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import type { CalendarEvent, CreateCalendarEventRequest, CalendarEventType } from '@/types';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCalendarEventRequest>();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarApi.getEvents(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCalendarEventRequest) => calendarApi.createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event Created', description: 'Calendar event added successfully.' });
      setIsDialogOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create event',
        description: err?.response?.data?.detail || 'An unexpected error occurred.',
      });
    },
  });

  const getEventTypeBadge = (type?: CalendarEventType) => {
    switch (type) {
      case 'HOLIDAY':
        return <Badge variant="warning">Holiday</Badge>;
      case 'EXAM':
        return <Badge variant="destructive">Exam Assessment</Badge>;
      case 'SPECIAL_CLASS':
        return <Badge variant="info">Special Class</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Institute Closed</Badge>;
      default:
        return <Badge variant="outline">Announcement</Badge>;
    }
  };

  const filteredEvents = (Array.isArray(events) ? events : []).filter((e: CalendarEvent) =>
    filterType === 'all' ? true : e.event_type === filterType
  );

  const onSubmit = (data: CreateCalendarEventRequest) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institute Calendar & Schedules"
        description="Academic calendar, holidays, examination dates, special doubt sessions, and closures."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Calendar' },
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'HOLIDAY', label: 'Holidays' },
            { id: 'EXAM', label: 'Exams' },
            { id: 'SPECIAL_CLASS', label: 'Special Sessions' },
            { id: 'CLOSED', label: 'Closures' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing: <span className="font-semibold text-foreground">{filteredEvents.length}</span> scheduled events
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading calendar schedules...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-xl border bg-card p-6">
          <EmptyState
            icon={<CalendarIcon className="h-10 w-10 text-muted-foreground" />}
            title="No events scheduled"
            message="No calendar entries match the selected filter criteria."
            action={
              <Button onClick={() => setIsDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Schedule First Event
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event: CalendarEvent) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-base text-foreground leading-snug">
                    {event.title}
                  </span>
                  {getEventTypeBadge(event.event_type || event.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-muted-foreground">
                <p className="line-clamp-2 text-foreground/80">
                  {event.description || 'No additional details provided.'}
                </p>
                <div className="pt-2 border-t flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    {formatDate(event.start_date || event.date)}
                  </span>
                  {event.end_date && (
                    <span>to {formatDate(event.end_date)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
            <DialogDescription>
              Schedule a holiday, exam slot, special lecture, or administrative holiday.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Diwali Holiday Break"
                {...register('title', { required: 'Event title is required' })}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event_type">Event Type *</Label>
              <select
                id="event_type"
                {...register('event_type', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="HOLIDAY">Holiday</option>
                <option value="EXAM">Examination</option>
                <option value="SPECIAL_CLASS">Special Class / Revision</option>
                <option value="CLOSED">Centre Closed</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date', { required: 'Start date is required' })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Event Details (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Notice instructions for students or faculty..."
                rows={3}
                {...register('description')}
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
                Save Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
