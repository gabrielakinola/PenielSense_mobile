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
}

export interface ManagerReviewInbox {
  generatedAt: string;
  counts: { careTasks: number; incidents: number; safeguarding: number };
  careTasks: CareTaskDto[];
  incidents: ManagerReviewIncident[];
}

export function getManagerReviewInbox() {
  return cachedOnlineFirst('manager-review-inbox', async () => {
    const { data } = await careHomeApiClient.get<ApiSuccessEnvelope<ManagerReviewInbox>>(
      '/carehome/review-inbox',
    );
    return data.data;
  });
}
