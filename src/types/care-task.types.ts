export type CareTaskStatus =
  | "PENDING"
  | "COMPLETED"
  | "PARTIAL"
  | "DECLINED"
  | "NOT_REQUIRED"
  | "UNABLE"
  | "ESCALATED";

export interface CareTaskDto {
  id: string;
  residentId: string;
  carePlanId: string | null;
  title: string;
  category: string;
  instructions: string;
  dueAt: string;
  priority: "ROUTINE" | "IMPORTANT" | "URGENT";
  recurrence: "ONCE" | "DAILY";
  scheduledTime: string | null;
  status: CareTaskStatus;
  outcomeNote: string;
  quantity: string;
  completedBy: string | null;
  completedAt: string | null;
  version: number;
  workflow?:
    import("@/src/services/manager-review.api").ManagerReviewWorkflow | null;
}

export interface CreateCareTaskPayload {
  residentId: string;
  carePlanId?: string;
  title: string;
  category: string;
  instructions: string;
  dueAt: string;
  priority: "ROUTINE" | "IMPORTANT" | "URGENT";
  recurrence?: "ONCE" | "DAILY";
  scheduleTimes?: string[];
}
