/**
 * 邮箱设置 API
 */

import request from './request';

export interface EmailSettings {
  email: string;
  forwardEmail: string | null;
  emailEnabled: boolean;
  totalMailSize: number;
  quota: number;
}

export async function getEmailSettings() {
  return request<EmailSettings>('/settings/email');
}

export async function updateEmailSettings(params: {
  forwardEmail?: string | null;
  emailEnabled?: boolean;
}) {
  return request<{ email: string; forwardEmail: string | null; emailEnabled: boolean }>(
    '/settings/email',
    { method: 'PUT', body: params },
  );
}
