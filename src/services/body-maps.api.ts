import { careHomeApiClient } from '@/src/lib/api-client';
import { cachedOnlineFirst, queueWhenOffline } from '@/src/offline/offline-api';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';

export type BodyMapRecordType = 'BRUISE' | 'WOUND' | 'SKIN_TEAR' | 'PRESSURE_AREA' | 'RASH' | 'SWELLING' | 'OTHER';
export type BodyMapRecordStatus = 'OPEN' | 'HEALING' | 'REQUIRES_REVIEW' | 'RESOLVED';
export interface BodyMapRecordDto {
  id: string; residentId: string; type: BodyMapRecordType; status: BodyMapRecordStatus;
  position: { view: 'FRONT' | 'BACK'; x: number; y: number }; observedAt: string;
  description: string; immediateAction: string; treatmentPlan: string; reviewNote: string;
  recordedBy: string; reviewedBy: string | null; reviewedAt: string | null; version: number;
}

export function getBodyMapRecords(residentId: string) {
  return cachedOnlineFirst(`body-map-records:${residentId}`, async () => {
    const { data } = await careHomeApiClient.get<ApiSuccessEnvelope<BodyMapRecordDto[]>>('/carehome/body-map-records', { params: { residentId } });
    return data.data;
  });
}

export function createBodyMapRecord(payload: {
  residentId: string; type: BodyMapRecordType; position: BodyMapRecordDto['position'];
  observedAt: string; description: string; immediateAction?: string; treatmentPlan?: string;
}) {
  const url = '/carehome/body-map-records';
  return queueWhenOffline('POST', url, payload, async (requestPayload, requestId) => {
    await careHomeApiClient.post(url, requestPayload, { headers: { 'Idempotency-Key': requestId } });
  });
}
