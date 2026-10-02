import { careHomeApiClient } from '@/src/lib/api-client';
import type { ApiSuccessEnvelope } from '@/src/types/auth.types';
import type { MedicationAdministration, MedicationApplicationSite, MedicationOutcome, MedicationRounds, MedicationStockMovement, MedicationWitness } from '@/src/types/emar.types';
const base='/carehome/emar';
export async function getMedicationRounds(date?:string){const{data}=await careHomeApiClient.get<ApiSuccessEnvelope<MedicationRounds>>(`${base}/rounds`,{params:{date}});return data.data}
export async function getMedicationWitnesses(){const{data}=await careHomeApiClient.get<ApiSuccessEnvelope<MedicationWitness[]>>(`${base}/witnesses`);return data.data}
export async function getMedicationStock(orderId:string){const{data}=await careHomeApiClient.get<ApiSuccessEnvelope<MedicationStockMovement[]>>(`${base}/orders/${orderId}/stock`);return data.data}
export async function getResidentMedicationHistory(residentId:string,from?:string,to?:string){const{data}=await careHomeApiClient.get<ApiSuccessEnvelope<MedicationAdministration[]>>(`${base}/residents/${residentId}/history`,{params:{from,to}});return data.data}
export async function recordMedicationAdministration(orderId:string,payload:{slotKey:string;scheduledAt:string;administeredAt?:string;outcome:MedicationOutcome;reason?:string;note?:string;witnessUserId?:string;stockBefore?:number;quantityUsed?:number;applicationSite?:MedicationApplicationSite}){const{data}=await careHomeApiClient.post<ApiSuccessEnvelope<MedicationAdministration>>(`${base}/orders/${orderId}/administrations`,payload);return data.data}
export async function reviewPrnEffectiveness(id:string,effectiveness:string){const{data}=await careHomeApiClient.patch<ApiSuccessEnvelope<MedicationAdministration>>(`${base}/administrations/${id}/effectiveness`,{effectiveness});return data.data}
