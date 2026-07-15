/**
 * 设置 API
 */

import request from './request';

// 邮箱设置
export interface EmailSettings {
  email: string;
  emailEnabled: boolean;
  totalMailSize: number;
  quota: number;
}

export async function getEmailSettings() {
  return request<EmailSettings>('/settings/email');
}

export async function updateEmailSettings(params: {
  emailEnabled?: boolean;
}) {
  return request<{ email: string; emailEnabled: boolean }>(
    '/settings/email',
    { method: 'PUT', body: params },
  );
}

// SEO 设置
export type SeoVariant = 'default' | 'minimal' | 'branded' | 'friendly';
export type SeoPosition = 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface SeoSettings {
  enabled: boolean;
  variant: SeoVariant;
  customText: string | null;
  customStyle: string | null;
  position: SeoPosition;
}

export interface UpdateSeoParams {
  enabled?: boolean;
  variant?: SeoVariant;
  customText?: string | null;
  customStyle?: string | null;
  position?: SeoPosition;
}

export async function getSeoSettings() {
  return request<SeoSettings>('/settings/seo');
}

export async function updateSeoSettings(params: UpdateSeoParams) {
  return request<SeoSettings>(
    '/settings/seo',
    { method: 'PUT', body: params },
  );
}

// SEO 文案变体描述
export const SEO_VARIANT_OPTIONS: Array<{ value: SeoVariant; label: string; description: string }> = [
  { value: 'default', label: '默认', description: '由 Nomio.World 提供域名服务' },
  { value: 'minimal', label: '简约', description: 'Nomio.World' },
  { value: 'branded', label: '品牌', description: '数字身份由 Nomio.World 提供' },
  { value: 'friendly', label: '友好', description: '免费域名由 Nomio.World 慷慨提供' },
];

// SEO 位置选项
export const SEO_POSITION_OPTIONS: Array<{ value: SeoPosition; label: string }> = [
  { value: 'bottom-right', label: '右下角' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-center', label: '底部居中' },
];
