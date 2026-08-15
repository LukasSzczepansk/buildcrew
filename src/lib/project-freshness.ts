const DAY_MS = 24 * 60 * 60 * 1000;

export type ProjectFreshness = {
  daysAgo: number;
  label: string;
  shortLabel: string;
  stale: boolean;
  recent: boolean;
};

export function getProjectFreshness(value: Date | string | null | undefined, now = new Date()): ProjectFreshness {
  if (!value) {
    return {
      daysAgo: Number.POSITIVE_INFINITY,
      label: "Brak danych o aktywności",
      shortLabel: "Brak aktywności",
      stale: true,
      recent: false,
    };
  }

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) {
    return {
      daysAgo: Number.POSITIVE_INFINITY,
      label: "Brak danych o aktywności",
      shortLabel: "Brak aktywności",
      stale: true,
      recent: false,
    };
  }

  const daysAgo = Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));

  if (daysAgo === 0) {
    return { daysAgo, label: "Projekt aktualizowany dziś", shortLabel: "Aktywny dziś", stale: false, recent: true };
  }
  if (daysAgo === 1) {
    return { daysAgo, label: "Projekt aktualizowany wczoraj", shortLabel: "Aktywny wczoraj", stale: false, recent: true };
  }
  if (daysAgo <= 7) {
    return { daysAgo, label: `Projekt aktualizowany ${daysAgo} dni temu`, shortLabel: "Aktywny w tym tygodniu", stale: false, recent: true };
  }
  if (daysAgo <= 10) {
    return { daysAgo, label: `Projekt aktualizowany ${daysAgo} dni temu`, shortLabel: `${daysAgo} dni temu`, stale: false, recent: false };
  }

  return {
    daysAgo,
    label: `Ostatnie potwierdzenie aktywności ${daysAgo} dni temu`,
    shortLabel: `${daysAgo} dni temu`,
    stale: true,
    recent: false,
  };
}
