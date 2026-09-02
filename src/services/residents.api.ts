import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type {
  ApiResidentDto,
  QueryResidentsParams,
  ResidentCareProfileDto,
} from '@/src/types/carehome.types';
import { cachedOnlineFirst } from '@/src/offline/offline-api';

export async function getCareHomeResidents(params?: QueryResidentsParams) {
  const key = `residents:${JSON.stringify(params ?? {})}`;
  return cachedOnlineFirst(key, async () => {
    const { data } = await careHomeApiClient.get<
      ApiSuccessEnvelope<ApiResidentDto[]>
    >('/carehome/residents', { params });
    return data.data;
  });
}

export async function getResidentCareProfile(id: string) {
  return cachedOnlineFirst(`resident-care-profile:${id}`, async () => {
    const { data } = await careHomeApiClient.get<
      ApiSuccessEnvelope<ResidentCareProfileDto>
    >(`/carehome/residents/${id}/care-profile`);
    return data.data;
  });
}

export async function getCareHomeResidentById(id: string) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<ApiResidentDto>
  >(`/carehome/residents/${id}`);
  return data.data;
}
