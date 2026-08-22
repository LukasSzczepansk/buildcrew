import type { SocialPostKind } from "@/db/schema";
import type { AppLocale } from "@/lib/site-config";

export function socialPostKindLabel(kind: SocialPostKind, locale: AppLocale) {
  const en = locale === "en";
  const labels: Record<SocialPostKind, string> = {
    UPDATE: en ? "Update" : "Aktualizacja",
    QUESTION: en ? "Question" : "Pytanie",
    KNOWLEDGE: en ? "Knowledge" : "Wiedza / doświadczenie",
    IDEA: en ? "Idea" : "Pomysł",
    LOOKING_FOR_PEOPLE: en ? "Looking for teammates" : "Szukam ludzi",
    LOOKING_FOR_PROJECT: en ? "Looking for a project" : "Szukam projektu",
    MILESTONE: en ? "Milestone" : "Kamień milowy",
    LAUNCH: en ? "Launch" : "Premiera",
    OPEN_TO_BUILDING: en ? "Open to building" : "Otwarty na współpracę",
  };
  return labels[kind];
}

export function socialPostVisualKind(kind: SocialPostKind): "project" | "people" | "launch" {
  if (kind === "LAUNCH") return "launch";
  if (kind === "LOOKING_FOR_PEOPLE" || kind === "LOOKING_FOR_PROJECT" || kind === "OPEN_TO_BUILDING") return "people";
  return "project";
}

export function socialPostTitle(
  item: { kind: SocialPostKind; username: string; projectName?: string | null },
  locale: AppLocale,
) {
  const en = locale === "en";
  switch (item.kind) {
    case "QUESTION":
      return en ? `${item.username} asks the community` : `${item.username} pyta społeczność`;
    case "KNOWLEDGE":
      return en ? `${item.username} shares what they learned` : `${item.username} dzieli się doświadczeniem`;
    case "IDEA":
      return en ? `${item.username} shares an idea` : `${item.username} dzieli się pomysłem`;
    case "LOOKING_FOR_PEOPLE":
      return item.projectName ?? (en ? "Project looking for people" : "Projekt szuka ludzi");
    case "LOOKING_FOR_PROJECT":
      return en ? `${item.username} is looking for a project` : `${item.username} szuka projektu`;
    case "OPEN_TO_BUILDING":
      return en ? `${item.username} is open to building` : `${item.username} jest otwarty na współpracę`;
    case "MILESTONE":
      return item.projectName ? (en ? `${item.projectName} reached a milestone` : `${item.projectName} osiągnął kamień milowy`) : (en ? "Project milestone" : "Kamień milowy projektu");
    case "LAUNCH":
      return item.projectName ? (en ? `${item.projectName} launched` : `${item.projectName} wystartował`) : (en ? "Project launch" : "Premiera projektu");
    case "UPDATE":
    default:
      return item.projectName ?? (en ? "Project update" : "Aktualizacja projektu");
  }
}

export function socialPostPrimaryCta(kind: SocialPostKind, locale: AppLocale) {
  const en = locale === "en";
  if (["LOOKING_FOR_PEOPLE", "UPDATE", "MILESTONE", "LAUNCH"].includes(kind)) return en ? "View project" : "Zobacz projekt";
  if (kind === "QUESTION") return en ? "Join the discussion" : "Dołącz do dyskusji";
  if (kind === "KNOWLEDGE") return en ? "View builder" : "Zobacz profil";
  if (kind === "IDEA") return en ? "Discuss the idea" : "Porozmawiaj o pomyśle";
  return en ? "View profile" : "Zobacz profil";
}
