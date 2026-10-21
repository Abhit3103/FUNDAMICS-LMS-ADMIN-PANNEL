import apiClient from '@/lib/api-client';

export interface Notice {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  priority: string;
  is_active: boolean;
  published_at: string;
}

export interface CreateNoticeRequest {
  title: string;
  content: string;
  target_audience: string;
}

export const noticesQueryKey = ['admin-notices'] as const;

export const noticesApi = {
  getNotices: async (): Promise<Notice[]> => {
    const { data } = await apiClient.get<Notice[]>('/admin/notices');
    if (!Array.isArray(data)) {
      throw new Error('The notices endpoint returned an invalid response.');
    }
    return data;
  },

  createNotice: async (payload: CreateNoticeRequest): Promise<Notice> => {
    const { data } = await apiClient.post<Notice>('/admin/notices', payload);
    return data;
  },
};
