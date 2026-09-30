import { careHomeApiClient } from "@/src/lib/api-client";
import { cachedOnlineFirst } from "@/src/offline/offline-api";
import type { ApiSuccessEnvelope } from "@/src/types/auth.types";
import type {
  OperationalRecordDto,
  OperationalRecordKind,
} from "@/src/types/operational-record.types";

export interface OperationalRecordQuery {
  residentId?: string;
  kind?: OperationalRecordKind;
  from?: string;
  to?: string;
}

export async function getOperationalRecords(
  params: OperationalRecordQuery = {},
) {
  return cachedOnlineFirst(
    `operational-records:${JSON.stringify(params)}`,
    async () => {
      const { data } = await careHomeApiClient.get<
        ApiSuccessEnvelope<OperationalRecordDto[]>
      >("/carehome/operational-records", { params });
      return data.data;
    },
  );
}
