export type MedicationOutcome = 'GIVEN' | 'REFUSED' | 'OMITTED' | 'NOT_AVAILABLE' | 'DESTROYED' | 'PRN_GIVEN';
export interface MedicationOrder { _id:string; residentId:string; medicineName:string; dose:string; route:string; times:string[]; prn:boolean; prnProtocol:string; controlledDrug:boolean; instructions:string; status:string }
export interface MedicationApplicationSite { view:'FRONT'|'BACK'; x:number; y:number; label?:string }
export interface MedicationAdministration { _id:string; orderId:string; residentId:string; slotKey:string; scheduledAt:string; administeredAt?:string; recordedAt:string; outcome:MedicationOutcome; reason:string; note:string; witnessUserId?:string|null; effectiveness?:string|null; voided:boolean; stockBefore?:number|null; quantityUsed?:number|null; stockAfter?:number|null; applicationSite?:MedicationApplicationSite|null; recordedByName?:string; order?:MedicationOrder|null }
export interface MedicationSlot { slotKey:string; scheduledAt:string; order:MedicationOrder; administration:MedicationAdministration|null }
export interface MedicationRounds { date:string; slots:MedicationSlot[]; prnOrders:MedicationOrder[]; administrations:MedicationAdministration[] }
export interface MedicationWitness { id:string; firstName:string; lastName:string; role:string }
export interface MedicationStockMovement { _id:string; orderId:string; quantity:number; change:number; reason:string; recordedBy:string; createdAt:string }
