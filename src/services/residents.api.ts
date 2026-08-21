import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type {
  ApiResidentDto,
  QueryResidentsParams,
} from '@/src/types/carehome.types';

export async function getCareHomeResidents(params?: QueryResidentsParams) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<ApiResidentDto[]>
  >('/carehome/residents', { params });
  return data.data;
}

export async function getCareHomeResidentById(id: string) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<ApiResidentDto>
  >(`/carehome/residents/${id}`);
  return data.data;
}
