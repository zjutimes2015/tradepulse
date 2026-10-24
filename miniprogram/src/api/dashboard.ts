import { get } from './client';

export interface DashboardSummary {
  pendingSignals: number;
  unreadReplies: number;
  todayTouch: number;
  todayConnections: number;
  todayReplies: number;
  totalLeads: number;
  meetings: number;
  linkedInStatus: 'connected' | 'connecting' | 'suspended' | 'none';
  plan: string;
}

export function fetchDashboard(): Promise<DashboardSummary> {
  return get<DashboardSummary>('/api/mobile/dashboard');
}
