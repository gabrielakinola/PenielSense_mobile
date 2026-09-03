import { careHomeApiClient } from "@/src/lib/api-client";
import type { ApiSuccessEnvelope } from "@/src/types/auth.types";
import type {
  HandoverSnapshotDto,
  QueryHandoverParams,
} from "@/src/types/carehome.types";

export async function getActiveHandover(params?: QueryHandoverParams) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<HandoverSnapshotDto | null>
  >("/carehome/handovers", { params });
  return data.data;
}

export async function generateHandover(force = true) {
  const { data } = await careHomeApiClient.post<
    ApiSuccessEnvelope<HandoverSnapshotDto>
  >("/carehome/handovers/generate", { force });
  return data.data;
}

export async function acknowledgeHandover(handoverId: string) {
  const { data } = await careHomeApiClient.post<
    ApiSuccessEnvelope<HandoverSnapshotDto>
  >(`/carehome/handovers/${handoverId}/acknowledge`);
  return data.data;
}
