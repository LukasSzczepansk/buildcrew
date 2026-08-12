export const DISCORD_INVITE_URL = "https://discord.gg/FzuxHrF6g";

export const AI_CONTEST = {
  title: "BuildCrew AI Challenge",
  shortTitle: "Konkurs AI",
  prize: "100 zł",
  deadlineLabel: "31 sierpnia 2026",
  // Koniec 31 sierpnia w Polsce (CEST, UTC+2).
  endsAt: "2026-08-31T21:59:59.999Z",
  description: "Zbuduj własny projekt wykorzystujący AI i pokaż, co udało Ci się stworzyć.",
} as const;

export function isAiContestActive(now = new Date()) {
  return now.getTime() <= new Date(AI_CONTEST.endsAt).getTime();
}
