import { get, post } from './client';

export interface Reply {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  originalText: string;
  translatedText: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  interestLevel: number;
  suggestedReply?: string;
  nextAction?: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

export interface ReplyListResponse {
  items: Reply[];
  total: number;
  unread: number;
}

export function fetchReplies(params: { unread?: boolean; page?: number } = {}): Promise<ReplyListResponse> {
  const query = new URLSearchParams();
  if (params.unread) query.set('unread', '1');
  if (params.page) query.set('page', String(params.page));
  const qs = query.toString();
  return get<ReplyListResponse>(`/api/mobile/replies${qs ? `?${qs}` : ''}`);
}

export function fetchReplyDetail(id: string): Promise<Reply> {
  return get<Reply>(`/api/mobile/replies/${id}`);
}

export function confirmReply(id: string): Promise<{ ok: boolean; message?: string }> {
  return post<{ ok: boolean; message?: string }>(`/api/mobile/replies/${id}/confirm`);
}

export function regenerateReply(id: string): Promise<{ suggestedReply: string }> {
  return post<{ suggestedReply: string }>(`/api/mobile/replies/${id}/regenerate`);
}
