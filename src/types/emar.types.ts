export type MedicationOutcome = 'GIVEN' | 'REFUSED' | 'OMITTED' | 'NOT_AVAILABLE' | 'PRN_GIVEN';
export interface MedicationOrder { _id:string; residentId:string; medicineName:string; dose:string; route:string; times:string[]; prn:boolean; prnProtocol:string; controlledDrug:boolean; instructions:string; status:string }
export interface MedicationAdministration { _id:string; orderId:string; residentId:string; slotKey:string; scheduledAt:string; recordedAt:string; outcome:MedicationOutcome; reason:string; note:string; witnessUserId?:string|null; effectiveness?:string|null; voided:boolean }
export interface MedicationSlot { slotKey:string; scheduledAt:string; order:MedicationOrder; administration:MedicationAdministration|null }
export interface MedicationRounds { date:string; slots:MedicationSlot[]; prnOrders:MedicationOrder[]; administrations:MedicationAdministration[] }
export interface MedicationWitness { id:string; firstName:string; lastName:string; role:string }
