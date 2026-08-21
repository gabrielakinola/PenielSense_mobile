import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type {
  ResidentCareBrief,
  ResidentIntelligenceBadgesResponse,
} from '@/src/types/carehome.types';

export async function getResidentCareBrief(
  residentId: string,
  params?: { refresh?: boolean },
) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<ResidentCareBrief>
  >(`/carehome/residents/${residentId}/care-brief`, { params });
  return data.data;
}

export async function getResidentIntelligenceBadges() {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<ResidentIntelligenceBadgesResponse>
  >('/carehome/residents/intelligence-badges');
  return data.data;
}
