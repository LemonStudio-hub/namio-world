/**
 * 域名管理 API
 */

import request from './request';

export interface DomainInfo {
  username: string;
  origin_url: string;
  origin_host: string;
  verify_status: string;
  created_at: string;
}

export interface RegisterDomainParams {
  originUrl: string;
  originHost?: string;
}

export interface RegisterDomainData {
  originUrl: string;
  originHost: string;
  verifyToken: string;
  verifyStatus: string;
}

export async function getDomain() {
  return request<DomainInfo>('/domains');
}

export async function registerDomain(params: RegisterDomainParams) {
  return request<RegisterDomainData>('/domains/register', {
    method: 'POST',
    body: params,
  });
}

export async function updateDomain(originUrl: string, originHost?: string) {
  return request<{ originUrl: string; originHost: string; verifyStatus: string }>('/domains', {
    method: 'PUT',
    body: { originUrl, originHost },
  });
}

export async function deleteDomain() {
  return request('/domains', { method: 'DELETE' });
}

export async function verifyDomain() {
  return request<{ verifyStatus: string }>('/domains/verify', { method: 'POST' });
}
