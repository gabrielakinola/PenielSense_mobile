import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type {
  CareEntryDto,
  CareEntryListResult,
  CreateCareEntryPayload,
  ExtractCareEntryResult,
  QueryCareEntriesParams,
  UpdateCareEntryPayload,
} from '@/src/types/care-entry.types';
import { cachedOnlineFirst, queueWhenOffline } from '@/src/offline/offline-api';

function careEntriesPath(residentId: string) {
  return `/carehome/residents/${residentId}/care-entries`;
}

export async function extractCareEntry(residentId: string, rawText: string) {
  const { data } = await careHomeApiClient.post<
    ApiSuccessEnvelope<ExtractCareEntryResult>
  >(`${careEntriesPath(residentId)}/extract`, { rawText });
  return data.data;
}

export async function createCareEntry(
  residentId: string,
  payload: CreateCareEntryPayload,
) {
  const url = careEntriesPath(residentId);
  let saved: CareEntryDto | null = null;
  const result = await queueWhenOffline('POST', url, payload, async (requestPayload, requestId) => {
    const response = await careHomeApiClient.post<ApiSuccessEnvelope<CareEntryDto>>(url, requestPayload, { headers: { 'Idempotency-Key': requestId } });
    saved = response.data.data;
  });
  return { saved, ...result };
}

export async function getCareEntries(
  residentId: string,
  params?: QueryCareEntriesParams,
) {
  return cachedOnlineFirst(
    `care-entries:${residentId}:${JSON.stringify(params ?? {})}`,
    async () => {
      const { data } = await careHomeApiClient.get<
        ApiSuccessEnvelope<CareEntryListResult>
      >(careEntriesPath(residentId), { params });
      return data.data;
    },
  );
}

export async function updateCareEntry(
  residentId: string,
  entryId: string,
  payload: UpdateCareEntryPayload,
) {
  const url = `${careEntriesPath(residentId)}/${entryId}`;
  let saved: CareEntryDto | null = null;
  const result = await queueWhenOffline('PATCH', url, payload, async (requestPayload, requestId) => {
    const response = await careHomeApiClient.patch<ApiSuccessEnvelope<CareEntryDto>>(url, requestPayload, { headers: { 'Idempotency-Key': requestId } });
    saved = response.data.data;
  });
  return { saved, ...result };
}

export async function deleteCareEntry(
  residentId: string,
  entryId: string,
  reason = 'Voided by staff after reviewing the care entry',
) {
  const url = `${careEntriesPath(residentId)}/${entryId}`;
  return queueWhenOffline('DELETE', url, { reason }, async (requestPayload, requestId) => {
    await careHomeApiClient.delete(url, {
      data: requestPayload,
      headers: { 'Idempotency-Key': requestId },
    });
  });
}
