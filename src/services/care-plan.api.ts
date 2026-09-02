import { careHomeApiClient } from '@/src/lib/api-client';
import { cachedOnlineFirst } from '@/src/offline/offline-api';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type { CarePlanDto, CarePlanSectionDto, CarePlanStatus } from '@/src/types/care-plan.types';

export function getCarePlan(residentId: string) {
  return cachedOnlineFirst(`care-plan:${residentId}`, async () => {
    const { data } = await careHomeApiClient.get<ApiSuccessEnvelope<CarePlanDto | null>>(
      `/carehome/residents/${residentId}/care-plan`,
    );
    return data.data;
  });
}

export async function saveCarePlan(
  residentId: string,
  payload: {
    changeReason: string;
    sections: CarePlanSectionDto[];
    status: CarePlanStatus;
    effectiveFrom?: string;
    reviewDueAt?: string;
  },
) {
  const { data } = await careHomeApiClient.put<ApiSuccessEnvelope<CarePlanDto>>(
    `/carehome/residents/${residentId}/care-plan`,
    payload,
  );
  return data.data;
}
