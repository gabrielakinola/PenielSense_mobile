import * as Crypto from "expo-crypto";
import { careHomeApiClient } from "@/src/lib/api-client";
import { cachedOnlineFirst } from "@/src/offline/offline-api";
import type { ApiSuccessEnvelope } from "@/src/types/auth.types";
import type {
  MarAdministrationDto,
  MarOutcome,
  MedicationOrderDto,
} from "@/src/types/medication.types";
type EmarOrder={_id:string;residentId:string;medicineName:string;dose:string;route:string;times:string[];prn:boolean;prnProtocol?:string;instructions?:string;status:MedicationOrderDto['status']};
type EmarAdministration={_id:string;orderId:string;scheduledAt:string;outcome:MarOutcome;reason?:string;note?:string;recordedAt:string;voided:boolean;voidedAt?:string|null;voidedBy?:string|null;voidReason?:string|null;order?:EmarOrder|null};
const mapOrder=(x:EmarOrder):MedicationOrderDto=>({id:x._id,residentId:x.residentId,name:x.medicineName,dose:x.dose,route:x.route,scheduleTimes:x.times,prn:x.prn,prnIndication:x.prnProtocol,instructions:x.instructions,status:x.status});
const mapMar=(x:EmarAdministration):MarAdministrationDto=>({id:x._id,medicationOrderId:x.orderId,scheduledFor:x.scheduledAt,outcome:x.outcome,doseRecorded:x.order?.dose??'',reason:x.reason,notes:x.note,administeredAt:x.recordedAt,voidedAt:x.voided?x.voidedAt??x.recordedAt:null,voidedBy:x.voidedBy,voidReason:x.voidReason,version:x.voided?2:1});
export function getMedicationOrders(residentId: string) {
  return cachedOnlineFirst(`medication-orders:${residentId}`, async () => {
    const { data } = await careHomeApiClient.get<
      ApiSuccessEnvelope<EmarOrder[]>
    >(`/carehome/emar/residents/${residentId}/orders`);
    return data.data.filter((x)=>x.status==='ACTIVE').map(mapOrder);
  });
}
export function getMar(residentId: string) {
  return cachedOnlineFirst(`mar:${residentId}`, async () => {
    const { data } = await careHomeApiClient.get<
      ApiSuccessEnvelope<EmarAdministration[]>
    >(`/carehome/emar/residents/${residentId}/history`);
    return data.data.map(mapMar);
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
  const scheduledAt=payload.scheduledFor??new Date().toISOString();
  const slotKey=payload.outcome==='PRN_GIVEN'?`${orderId}:prn:${Crypto.randomUUID()}`:`${orderId}:${scheduledAt.slice(0,10)}:${scheduledAt.slice(11,16)}`;
  const { data } = await careHomeApiClient.post<ApiSuccessEnvelope<EmarAdministration>>(`/carehome/emar/orders/${orderId}/administrations`, {slotKey,scheduledAt,outcome:payload.outcome,reason:payload.reason||payload.prnIndicationObserved,note:payload.notes});
  return mapMar(data.data);
}
