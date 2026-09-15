import { careHomeApiClient } from "@/src/lib/api-client";
import { cachedOnlineFirst } from "@/src/offline/offline-api";
import type { ApiSuccessEnvelope } from "@/src/types/auth.types";
export interface OperationalRecordDto {
  _id: string;
  kind: string;
  title: string;
  summary: string;
  occurredAt: string;
  reviewDueAt?: string;
  professional?: string;
  organisation?: string;
  documentType?: string;
  storageUrl?: string;
}
export function getOperationalRecords(residentId: string) {
  return cachedOnlineFirst(`operational-records:${residentId}`, async () => {
    const { data } = await careHomeApiClient.get<
      ApiSuccessEnvelope<OperationalRecordDto[]>
    >("/carehome/operational-records", { params: { residentId } });
    return data.data;
  });
}
