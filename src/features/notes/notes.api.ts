import apiClient from '@/lib/api-client';
import type { Note, CreateNoteRequest } from '@/types';

export const notesApi = {
  getNotes: async (params?: { class_id?: string; batch_id?: string }): Promise<Note[]> => {
    const { data } = await apiClient.get<Note[]>('/admin/notes', { params });
    return data;
  },

  createNote: async (payload: CreateNoteRequest): Promise<Note> => {
    const { data } = await apiClient.post<Note>('/admin/notes', payload);
    return data;
  },

  uploadFile: async (file: File): Promise<{ file_url: string; file_name: string; file_size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ file_url: string; file_name: string; file_size: number }>(
      '/admin/files/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};
