import { afterEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/lib/api-client';
import { noticesApi } from '../notices.api';

describe('noticesApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists notices from the admin notices endpoint', async () => {
    const notices = [
      {
        id: 'notice-id',
        title: 'Assessment schedule',
        content: 'Unit tests begin next Monday.',
        target_audience: 'ALL',
        priority: 'NORMAL',
        is_active: true,
        published_at: '2026-10-14T10:00:00Z',
      },
    ];
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: notices,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as never,
    });

    await expect(noticesApi.getNotices()).resolves.toEqual(notices);
    expect(getSpy).toHaveBeenCalledWith('/admin/notices');
  });

  it('creates a notice with the backend request contract', async () => {
    const payload = {
      title: 'Assessment schedule',
      content: 'Unit tests begin next Monday.',
      target_audience: 'STUDENTS',
    };
    const response = {
      id: 'notice-id',
      ...payload,
      priority: 'NORMAL',
      is_active: true,
      published_at: '2026-10-14T10:00:00Z',
    };
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: response,
      status: 201,
      statusText: 'Created',
      headers: {},
      config: {} as never,
    });

    await expect(noticesApi.createNotice(payload)).resolves.toEqual(response);
    expect(postSpy).toHaveBeenCalledWith('/admin/notices', payload);
  });

  it('rejects a non-array list response', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as never,
    });

    await expect(noticesApi.getNotices()).rejects.toThrow(
      'The notices endpoint returned an invalid response.'
    );
  });
});
