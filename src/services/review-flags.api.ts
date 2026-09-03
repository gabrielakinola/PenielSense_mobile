import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type {
  ApiReviewFlagDto,
  ApiReviewFlagsListDto,
  ApiManualCloseReviewFlagStatus,
  QueryReviewFlagsParams,
} from '@/src/types/carehome.types';

export async function getCareHomeReviewFlags(params?: QueryReviewFlagsParams) {
  const { data } = await careHomeApiClient.get<
    ApiSuccessEnvelope<ApiReviewFlagsListDto>
  >('/carehome/review-flags', { params });
  return data.data;
}

export async function closeCareHomeReviewFlag(
  flagId: string,
  reviewStatus: ApiManualCloseReviewFlagStatus,
  details?: { residentChecked?: boolean; actionTaken?: string },
) {
  const { data } = await careHomeApiClient.patch<
    ApiSuccessEnvelope<ApiReviewFlagDto>
  >(`/carehome/review-flags/${flagId}`, { reviewStatus, ...details });
  return data.data;
}
