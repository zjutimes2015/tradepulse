import { get, post } from './client';

export interface Signal {
  id: string;
  name: string;
  company: string;
  title: string;
  location?: string;
  linkedinUrl: string;
  signalScore: number;
  signalSummary: string;
  signalTypes: string[];
  status: 'pending' | 'sent' | 'ignored' | 'replied';
  aiMessage?: string;
  connectionNote?: string;
  createdAt: string;
}

export interface SignalListParams {
  status?: 'pending' | 'sent' | 'ignored';
  page?: number;
  limit?: number;
}

export interface SignalListResponse {
  items: Signal[];
  total: number;
  page: number;
}

export function fetchSignals(params: SignalListParams = {}): Promise<SignalListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return get<SignalListResponse>(`/api/mobile/signals${qs ? `?${qs}` : ''}`);
}

export function fetchSignalDetail(id: string): Promise<Signal> {
  return get<Signal>(`/api/mobile/signals/${id}`);
}

/** 确认发送（Copilot：用户点按钮后真正执行） */
export function confirmSend(id: string): Promise<{ ok: boolean; message?: string }> {
  return post<{ ok: boolean; message?: string }>(`/api/mobile/signals/${id}/confirm`);
}

export function ignoreSignal(id: string): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>(`/api/mobile/signals/${id}/ignore`);
}
