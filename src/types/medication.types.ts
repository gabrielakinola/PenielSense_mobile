export type MarOutcome =
  "GIVEN" | "REFUSED" | "OMITTED" | "NOT_AVAILABLE" | "PRN_GIVEN";
export interface MedicationOrderDto {
  id: string;
  residentId: string;
  name: string;
  form?: string;
  strength?: string;
  dose: string;
  route: string;
  scheduleTimes: string[];
  prn: boolean;
  prnIndication?: string;
  minimumInterval?: string;
  maximumDailyDose?: string;
  instructions?: string;
  status: "ACTIVE" | "PAUSED" | "DISCONTINUED";
}
export interface MarAdministrationDto {
  id: string;
  medicationOrderId: string;
  scheduledFor?: string | null;
  outcome: MarOutcome;
  doseRecorded: string;
  reason?: string;
  notes?: string;
  prnIndicationObserved?: string;
  prnEffect?: string;
  prnReviewDueAt?: string | null;
  administeredAt: string;
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  version?: number;
}
