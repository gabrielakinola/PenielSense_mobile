import { careHomeApiClient } from "@/src/lib/api-client";
import type { ApiSuccessEnvelope } from "@/src/types/auth.types";
import type {
  HandoverSnapshotDto,
  QueryHandoverParams,
  PersonalHandoverDto,
} from "@/src/types/carehome.types";

export async function getActiveHandover(params?: QueryHandoverParams) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<HandoverSnapshotDto | null>
  >("/carehome/handovers", { params });
  return data.data;
}

export async function generateHandover(force = false) {
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

export async function getMyHandover() {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<PersonalHandoverDto>
  >("/carehome/handovers/mine/active");
  return data.data;
}

export async function saveMyHandoverDraft(additionalNote: string) {
  const { data } = await careHomeApiClient.post<
    ApiSuccessEnvelope<PersonalHandoverDto>
  >("/carehome/handovers/mine/draft", { additionalNote });
  return data.data;
}

export async function submitMyHandover(additionalNote: string) {
  const { data } = await careHomeApiClient.post<
    ApiSuccessEnvelope<PersonalHandoverDto>
  >("/carehome/handovers/mine/submit", { additionalNote });
  return data.data;
}
