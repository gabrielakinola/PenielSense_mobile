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
  const { data } = await careHomeApiClient.post<
    ApiSuccessEnvelope<CareEntryDto>
  >(careEntriesPath(residentId), payload);
  return data.data;
}

export async function getCareEntries(
  residentId: string,
  params?: QueryCareEntriesParams,
) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<CareEntryListResult>
  >(careEntriesPath(residentId), { params });
  return data.data;
}

export async function updateCareEntry(
  residentId: string,
  entryId: string,
  payload: UpdateCareEntryPayload,
) {
  const { data } = await careHomeApiClient.patch<
    ApiSuccessEnvelope<CareEntryDto>
  >(`${careEntriesPath(residentId)}/${entryId}`, payload);
  return data.data;
}

export async function deleteCareEntry(residentId: string, entryId: string) {
  await careHomeApiClient.delete(`${careEntriesPath(residentId)}/${entryId}`);
}
