export type ActivityState = "TODAY" | "THIS_WEEK" | "INACTIVE" | "UNKNOWN";

export function getActivityState(value: Date | string | null | undefined, now = new Date()): ActivityState {
  if (!value) return "UNKNOWN";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "UNKNOWN";
  const age = now.getTime() - date.getTime();
  if (age <= 24 * 60 * 60 * 1000) return "TODAY";
  if (age <= 7 * 24 * 60 * 60 * 1000) return "THIS_WEEK";
  return "INACTIVE";
}

export function activityLabel(value: Date | string | null | undefined) {
  const state = getActivityState(value);
  if (state === "TODAY") return "Aktywny dziś";
  if (state === "THIS_WEEK") return "Aktywny w tym tygodniu";
  if (state === "INACTIVE") return "Ostatnio mniej aktywny";
  return "Brak świeżej aktywności";
}
