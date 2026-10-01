import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type {
  CreateCareEntryPayload,
  ExtractCareEntryResult,
} from '@/src/types/care-entry.types';

export async function prepareQueuedCareEntry(url: string, requestPayload: unknown) {
  if (!requestPayload || typeof requestPayload !== 'object' || Array.isArray(requestPayload)) {
    return requestPayload;
  }
  const { requiresExtractionOnSync, ...payload } = requestPayload as CreateCareEntryPayload & {
    clientRequestId?: string;
  };
  if (!requiresExtractionOnSync) return payload;

  const { data } = await careHomeApiClient.post<ApiSuccessEnvelope<ExtractCareEntryResult>>(
    `${url}/extract`,
    { rawText: payload.rawText },
  );
  const extracted = data.data;
  return {
    ...payload,
    items: extracted.items,
    extractedItems: extracted.items,
    observations: extracted.observations,
    extractedObservations: extracted.observations,
    usedOpenAI: extracted.usedOpenAI,
    model: extracted.model,
  };
}
