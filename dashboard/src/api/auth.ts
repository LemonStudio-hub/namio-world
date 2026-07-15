/**
 * 认证 API
 */

import request from './request';

export interface RegisterParams {
  username: string;
  password: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface AuthData {
  token: string;
  user: {
    username: string;
    hasDomain: boolean;
    hasEmail: boolean;
  };
}

export interface UserProfile {
  username: string;
  origin_url: string | null;
  origin_host: string | null;
  forward_email: string | null;
  email_enabled: boolean;
  status: string;
  verify_status: string;
  has_domain: boolean;
  has_email: boolean;
  created_at: string;
  last_login_at: string | null;
  total_mail_size: number;
}

export async function register(params: RegisterParams) {
  return request<AuthData>('/auth/register', {
    method: 'POST',
    body: params,
  });
}

export async function login(params: LoginParams) {
  return request<AuthData>('/auth/login', {
    method: 'POST',
    body: params,
  });
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return request<UserProfile>('/auth/me');
}
