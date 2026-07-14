/**
 * 邮件管理 API
 */

import request from './request';

export interface MailItem {
  id: number;
  from_address: string;
  subject: string;
  received_at: string;
  size: number;
  is_read: boolean;
}

export interface MailDetail extends MailItem {
  body: string;
  message_id: string;
  user_id: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MailListData {
  mails: MailItem[];
  pagination: Pagination;
}

export async function getMails(page = 1, limit = 20, unread = false) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (unread) params.set('unread', 'true');
  return request<MailListData>(`/mails?${params}`);
}

export async function getMail(id: number) {
  return request<MailDetail>(`/mails/${id}`);
}

export async function deleteMail(id: number) {
  return request(`/mails/${id}`, { method: 'DELETE' });
}

export async function deleteMails(ids: number[]) {
  return request<{ deleted: number }>('/mails', {
    method: 'DELETE',
    body: { ids },
  });
}
