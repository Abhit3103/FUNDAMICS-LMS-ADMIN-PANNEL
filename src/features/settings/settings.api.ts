import apiClient from '@/lib/api-client';
import type { InstituteSettings, UpdateInstituteSettingsRequest } from '@/types';

export const settingsApi = {
  getSettings: async (): Promise<InstituteSettings> => {
    const { data } = await apiClient.get<InstituteSettings>('/admin/settings/institute');
    return data;
  },

  updateSettings: async (payload: UpdateInstituteSettingsRequest): Promise<InstituteSettings> => {
    const { data } = await apiClient.patch<InstituteSettings>('/admin/settings/institute', payload);
    return data;
  },
};
