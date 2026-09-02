/** Admin / manager roles land on Today. Everyone else (carers) lands on residents. */
export function isCareHomeManagerRole(role?: string | null): boolean {
  const normalized = (role ?? "").toUpperCase().replace(/-/g, "_");
  return (
    normalized === "ADMIN" ||
    normalized === "SUPER_ADMIN" ||
    normalized === "CARE_MANAGER" ||
    normalized === "MANAGER"
  );
}

export function careHomeTabsHref(role?: string | null): "/(tabs)" | "/(tabs)/residents" {
  return isCareHomeManagerRole(role) ? "/(tabs)" : "/(tabs)/residents";
}

export const CARER_TAB_ORDER = [
  "residents",
  "tasks",
  "flags",
  "handovers",
  "profile",
] as const;

export const MANAGER_TAB_ORDER = [
  "index",
  "residents",
  "flags",
  "handovers",
  "profile",
] as const;
