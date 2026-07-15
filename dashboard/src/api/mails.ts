/**
 * 邮件管理 API
 */

import request from './request';

export interface MailItem {
  id: number;
  from_address: string;
  to_address: string;
  subject: string;
  received_at: string;
  size: number;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  preview: string;
}

export interface MailAttachment {
  filename: string;
  content_type: string;
  size: number;
  content_id: string | null;
}

export interface MailDetail extends MailItem {
  body: string;
  html_body: string | null;
  text_body: string | null;
  message_id: string;
  in_reply_to: string | null;
  references: string[];
  user_id: number;
  attachments: MailAttachment[];
  headers: Record<string, string>;
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
  stats: {
    total: number;
    unread: number;
    starred: number;
    with_attachments: number;
    total_size: number;
  };
}

export interface MailSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'unread' | 'read' | 'starred';
  sort_by?: 'received_at' | 'size' | 'from_address' | 'subject';
  sort_order?: 'asc' | 'desc';
  has_attachments?: boolean;
  date_from?: string;
  date_to?: string;
  from_address?: string;
}

export interface RegisterEmailData {
  email: string;
  forwardEmail: string | null;
  emailEnabled: boolean;
}

export async function registerEmail(forwardEmail?: string) {
  return request<RegisterEmailData>('/mails/register', {
    method: 'POST',
    body: { forwardEmail: forwardEmail || null },
  });
}

export async function getMails(params: MailSearchParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);
  if (params.has_attachments !== undefined) searchParams.set('has_attachments', String(params.has_attachments));
  if (params.date_from) searchParams.set('date_from', params.date_from);
  if (params.date_to) searchParams.set('date_to', params.date_to);
  if (params.from_address) searchParams.set('from_address', params.from_address);

  return request<MailListData>(`/mails?${searchParams.toString()}`);
}

export async function getMail(id: number) {
  return request<MailDetail>(`/mails/${id}`);
}

export async function markAsRead(id: number) {
  return request(`/mails/${id}/read`, { method: 'PUT' });
}

export async function markAsUnread(id: number) {
  return request(`/mails/${id}/unread`, { method: 'PUT' });
}

export async function toggleStar(id: number) {
  return request<{ is_starred: boolean }>(`/mails/${id}/star`, { method: 'PUT' });
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

export async function markMultipleAsRead(ids: number[]) {
  return request('/mails/read', {
    method: 'PUT',
    body: { ids },
  });
}

export async function markMultipleAsUnread(ids: number[]) {
  return request('/mails/unread', {
    method: 'PUT',
    body: { ids },
  });
}

export async function getMailStats() {
  return request<{
    total: number;
    unread: number;
    starred: number;
    with_attachments: number;
    total_size: number;
    by_date: Array<{ date: string; count: number }>;
    top_senders: Array<{ address: string; count: number }>;
  }>('/mails/stats');
}
