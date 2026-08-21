import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type { ApiDashboardStatsDto } from '@/src/types/carehome.types';

export async function getCareHomeDashboardStats() {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<ApiDashboardStatsDto>
  >('/carehome/dashboard/stats');
  return data.data;
}
