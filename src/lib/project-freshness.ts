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
      label: locale === "en" ? "No activity data" : "Brak danych o aktywności",
      shortLabel: locale === "en" ? "No activity" : "Brak aktywności",
      stale: true,
      recent: false,
    };
  }

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) {
    return {
      daysAgo: Number.POSITIVE_INFINITY,
      label: locale === "en" ? "No activity data" : "Brak danych o aktywności",
      shortLabel: locale === "en" ? "No activity" : "Brak aktywności",
      stale: true,
      recent: false,
    };
  }

  const daysAgo = Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));

  if (daysAgo === 0) {
    return { daysAgo, label: locale === "en" ? "Project updated today" : "Projekt zaktualizowany dzisiaj", shortLabel: locale === "en" ? "Active today" : "Aktywny dzisiaj", stale: false, recent: true };
  }
  if (daysAgo === 1) {
    return { daysAgo, label: locale === "en" ? "Project updated yesterday" : "Projekt zaktualizowany wczoraj", shortLabel: locale === "en" ? "Active yesterday" : "Aktywny wczoraj", stale: false, recent: true };
  }
  if (daysAgo <= 7) {
    return {
      daysAgo,
      label: locale === "en" ? `Project updated ${daysAgo} days ago` : `Projekt zaktualizowany ${daysAgo} dni temu`,
      shortLabel: locale === "en" ? "Active this week" : "Aktywny w tym tygodniu",
      stale: false,
      recent: true,
    };
  }
  if (daysAgo <= 10) {
    return {
      daysAgo,
      label: locale === "en" ? `Project updated ${daysAgo} days ago` : `Projekt zaktualizowany ${daysAgo} dni temu`,
      shortLabel: locale === "en" ? `${daysAgo} days ago` : `${daysAgo} dni temu`,
      stale: false,
      recent: false,
    };
  }

  return {
    daysAgo,
    label: locale === "en" ? `Last activity confirmed ${daysAgo} days ago` : `Ostatnia potwierdzona aktywność ${daysAgo} dni temu`,
    shortLabel: locale === "en" ? `${daysAgo} days ago` : `${daysAgo} dni temu`,
    stale: true,
    recent: false,
  };
}
