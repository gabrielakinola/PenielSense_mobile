import { careHomeApiClient } from '@/src/lib/api-client';
import { cachedOnlineFirst } from '@/src/offline/offline-api';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type { CareTaskDto } from '@/src/types/care-task.types';

export interface ManagerReviewIncident {
  id: string;
  residentId: string;
  type: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  occurredAt: string;
  description: string;
  safeguardingConcern: boolean;
  status: string;
  workflow: ManagerReviewWorkflow | null;
}
export type ManagerReviewStatus = 'NEW' | 'ACKNOWLEDGED' | 'ACTIONED' | 'CLOSED';
export interface ManagerReviewWorkflow { id: string; residentId: string; sourceType: 'CARE_TASK' | 'INCIDENT' | 'CARE_PLAN_REVIEW'; sourceId: string; status: ManagerReviewStatus; assignedTo: string | null; actionTaken: string; dueAt: string | null; acknowledgedAt: string | null; closedAt: string | null; updatedAt: string | null; }

export interface ManagerReviewInbox {
  generatedAt: string;
  counts: { careTasks: number; incidents: number; safeguarding: number; carePlansDue: number };
  careTasks: CareTaskDto[];
  incidents: ManagerReviewIncident[];
  carePlansDue: import('@/src/types/care-plan.types').CarePlanDto[];
}

export function getManagerReviewInbox() {
  return cachedOnlineFirst('manager-review-inbox', async () => {
    const { data } = await careHomeApiClient.get<ApiSuccessEnvelope<ManagerReviewInbox>>(
      '/carehome/review-inbox',
    );
    return data.data;
  });
}

export async function updateManagerReviewAction(payload: { sourceType: ManagerReviewWorkflow['sourceType']; sourceId: string; residentId: string; status: ManagerReviewStatus; assignedTo?: string; actionTaken?: string; dueAt?: string }) {
  const { data } = await careHomeApiClient.put<ApiSuccessEnvelope<ManagerReviewWorkflow>>('/carehome/review-inbox/action', payload);
  return data.data;
}
