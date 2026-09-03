import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type { CareTaskDto, CareTaskStatus, CreateCareTaskPayload } from '@/src/types/care-task.types';
import { cachedOnlineFirst, queueWhenOffline } from '@/src/offline/offline-api';

export async function getCareTasks(params?: {
  residentId?: string;
  status?: CareTaskStatus;
  from?: string;
  to?: string;
}) {
  return cachedOnlineFirst(`care-tasks:${JSON.stringify(params ?? {})}`, async () => {
    const { data } = await careHomeApiClient.get<ApiSuccessEnvelope<CareTaskDto[]>>(
      '/carehome/care-tasks',
      { params },
    );
    return data.data;
  });
}

export async function recordCareTaskOutcome(
  taskId: string,
  status: Exclude<CareTaskStatus, 'PENDING'>,
  outcomeNote = '',
) {
  const url = `/carehome/care-tasks/${taskId}/outcome`;
  const payload = { status, outcomeNote };
  let saved: CareTaskDto | null = null;
  const result = await queueWhenOffline('PATCH', url, payload, async (requestPayload, requestId) => {
    const response = await careHomeApiClient.patch<ApiSuccessEnvelope<CareTaskDto>>(url, requestPayload, { headers: { 'Idempotency-Key': requestId } });
    saved = response.data.data;
  });
  return { saved, ...result };
}

export async function createCareTask(payload: CreateCareTaskPayload) {
  const { data } = await careHomeApiClient.post<ApiSuccessEnvelope<CareTaskDto>>(
    '/carehome/care-tasks',
    payload,
  );
  return data.data;
}
