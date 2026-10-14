import apiClient from '@/lib/api-client';
import type { CalendarEvent, CreateCalendarEventRequest } from '@/types';

export const calendarApi = {
  /**
   * GET /admin/calendar/events
   * Query academic calendar events (Holidays, Closed, Exams, Special Classes).
   */
  getEvents: async (): Promise<CalendarEvent[]> => {
    const { data } = await apiClient.get<CalendarEvent[]>('/admin/calendar/events');
    const events = Array.isArray(data) ? data : [];
    return events.map((e) => ({
      ...e,
      event_type: e.type,
      start_date: e.date,
    }));
  },

  /**
   * POST /admin/calendar/events
   * Create an academic calendar event.
   */
  createEvent: async (payload: CreateCalendarEventRequest): Promise<CalendarEvent> => {
    const { data } = await apiClient.post<CalendarEvent>('/admin/calendar/events', {
      title: payload.title,
      date: payload.date,
      type: payload.type,
      applies_to: payload.applies_to || 'ALL',
      class_id: payload.class_id || null,
      batch_id: payload.batch_id || null,
    });
    return {
      ...data,
      event_type: data.type,
      start_date: data.date,
    };
  },
};
