import { careHomeApiClient } from '@/src/lib/api-client';
import { queueWhenOffline } from '@/src/offline/offline-api';

export interface CreateIncidentPayload {
  residentId: string;
  type: string;
  severity: string;
  occurredAt: string;
  location: string;
  description: string;
  immediateAction: string;
  injuryDetails?: string;
  witnesses?: string;
  medicalAttention?: string;
  familyNotified: boolean;
  managerNotified: boolean;
  safeguardingConcern: boolean;
  safeguardingRationale?: string;
}

export function createIncident(payload: CreateIncidentPayload) {
  const url = '/carehome/incidents';
  return queueWhenOffline('POST', url, payload, async (requestPayload, requestId) => {
    await careHomeApiClient.post(url, requestPayload, {
      headers: { 'Idempotency-Key': requestId },
    });
  });
}
