import apiClient from '@/lib/api-client';
import type { Note, CreateNoteRequest, FileRecordResponse } from '@/types';

// In-session cache for notes published during this admin session
let _sessionNotes: Note[] = [];

export const notesApi = {
  /**
   * GET /admin/notes
   * Query published study materials filtered by class/batch.
   * Gracefully handles 404/405 if backend deployment is pending.
   */
  getNotes: async (params?: {
    class_id?: string;
    batch_id?: string;
    subject_id?: string;
  }): Promise<Note[]> => {
    try {
      const { data } = await apiClient.get<Note[]>('/admin/notes', { params });
      const list = Array.isArray(data) ? data : [];
      return list.map((n) => ({
        ...n,
        file_name: n.original_filename || n.file_name,
        file_size: n.file_size_bytes || n.file_size,
      }));
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        console.warn('GET /admin/notes endpoint returned 404/405 (pending deployment). Showing session materials.');
        let filtered = [..._sessionNotes];
        if (params?.class_id) {
          filtered = filtered.filter((n) => n.class_id === params.class_id);
        }
        if (params?.batch_id) {
          filtered = filtered.filter((n) => !n.batch_id || n.batch_id === params.batch_id);
        }
        return filtered;
      }
      throw err;
    }
  },

  /**
   * POST /admin/notes
   * Create study material note associated with a securely uploaded file_id.
   * Backend requires application/x-www-form-urlencoded payload with 'req' and 'file_id'.
   */
  createNote: async (payload: CreateNoteRequest): Promise<Note> => {
    if (!payload.file_id) {
      throw new Error('A valid uploaded file_id is required to create note material.');
    }

    const formParams = new URLSearchParams();
    formParams.append(
      'req',
      JSON.stringify({
        title: payload.title.trim(),
        description: payload.description ? payload.description.trim() : null,
        class_id: payload.class_id,
        batch_id: payload.batch_id || null,
        subject_id: payload.subject_id,
      })
    );
    formParams.append('file_id', payload.file_id);

    const { data } = await apiClient.post<Note>('/admin/notes', formParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const normalizedNote: Note = {
      ...data,
      file_name: data.original_filename || data.file_name,
      file_size: data.file_size_bytes || data.file_size,
    };

    _sessionNotes = [normalizedNote, ..._sessionNotes.filter((n) => n.id !== normalizedNote.id)];
    return normalizedNote;
  },

  /**
   * POST /admin/files/upload
   * Securely upload a file to private storage. Returns FileRecordResponse (id, original_filename, mime_type, size_bytes).
   */
  uploadFile: async (file: File): Promise<FileRecordResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<FileRecordResponse>(
      '/admin/files/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return data;
  },
};
