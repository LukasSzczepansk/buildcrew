export const DISCORD_INVITE_URL = "https://discord.gg/FzuxHrF6g";

export const AI_CONTEST = {
  title: "Sierpniowy Build Challenge",
  shortTitle: "Sierpniowy challenge",
  deadlineLabel: "31 sierpnia 2026",
  // End 31 sierpnia w Polsce (CEST, UTC+2).
  endsAt: "2026-08-31T21:59:59.999Z",
  description: "A community BuildCrew challenge run on Discord.",
} as const;

export function isAiContestActive(now = new Date()) {
  return now.getTime() <= new Date(AI_CONTEST.endsAt).getTime();
}
