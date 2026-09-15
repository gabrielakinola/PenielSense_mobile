import * as Crypto from "expo-crypto";
import { careHomeApiClient } from "@/src/lib/api-client";
import { cachedOnlineFirst } from "@/src/offline/offline-api";
import type { ApiSuccessEnvelope } from "@/src/types/auth.types";
import type {
  MarAdministrationDto,
  MarOutcome,
  MedicationOrderDto,
} from "@/src/types/medication.types";
export function getMedicationOrders(residentId: string) {
  return cachedOnlineFirst(`medication-orders:${residentId}`, async () => {
    const { data } = await careHomeApiClient.get<
      ApiSuccessEnvelope<MedicationOrderDto[]>
    >("/carehome/medication-orders", {
      params: { residentId, status: "ACTIVE" },
    });
    return data.data;
  });
}
export function getMar(residentId: string) {
  return cachedOnlineFirst(`mar:${residentId}`, async () => {
    const { data } = await careHomeApiClient.get<
      ApiSuccessEnvelope<MarAdministrationDto[]>
    >("/carehome/mar", { params: { residentId } });
    return data.data;
  });
}
export async function recordMar(
  orderId: string,
  payload: {
    outcome: MarOutcome;
    doseRecorded: string;
    scheduledFor?: string;
    reason?: string;
    notes?: string;
    prnIndicationObserved?: string;
    prnReviewDueAt?: string;
  },
) {
  const { data } = await careHomeApiClient.post<
    ApiSuccessEnvelope<MarAdministrationDto>
  >(`/carehome/medication-orders/${orderId}/administrations`, {
    clientRequestId: Crypto.randomUUID(),
    ...payload,
  });
  return data.data;
}
