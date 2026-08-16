const DAY_MS = 24 * 60 * 60 * 1000;

export type ProjectFreshness = {
  daysAgo: number;
  label: string;
  shortLabel: string;
  stale: boolean;
  recent: boolean;
};

export function getProjectFreshness(value: Date | string | null | undefined, now = new Date(), locale: "pl" | "en" = "pl"): ProjectFreshness {
  if (!value) {
    return {
      daysAgo: Number.POSITIVE_INFINITY,
      label: locale === "en" ? "No activity data" : "No activity data",
      shortLabel: locale === "en" ? "No activity" : "No activity",
      stale: true,
      recent: false,
    };
  }

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) {
    return {
      daysAgo: Number.POSITIVE_INFINITY,
      label: locale === "en" ? "No activity data" : "No activity data",
      shortLabel: locale === "en" ? "No activity" : "No activity",
      stale: true,
      recent: false,
    };
  }

  const daysAgo = Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));

  if (daysAgo === 0) {
    return { daysAgo, label: locale === "en" ? "Project updated today" : "Project updated today", shortLabel: locale === "en" ? "Active today" : "Active today", stale: false, recent: true };
  }
  if (daysAgo === 1) {
    return { daysAgo, label: locale === "en" ? "Project updated yesterday" : "Project updated yesterday", shortLabel: locale === "en" ? "Active yesterday" : "Active yesterday", stale: false, recent: true };
  }
  if (daysAgo <= 7) {
    return { daysAgo, label: `Project updated ${daysAgo} days ago`, shortLabel: "Active this week", stale: false, recent: true };
  }
  if (daysAgo <= 10) {
    return { daysAgo, label: `Project updated ${daysAgo} days ago`, shortLabel: `${daysAgo} days ago`, stale: false, recent: false };
  }

  return {
    daysAgo,
    label: `Last activity confirmed ${daysAgo} days ago`,
    shortLabel: `${daysAgo} days ago`,
    stale: true,
    recent: false,
  };
}
