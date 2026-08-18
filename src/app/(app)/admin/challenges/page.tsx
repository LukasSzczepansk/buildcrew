import type { Metadata } from "next";
import { ChallengeManager } from "@/components/admin/challenge-manager";
import { listChallenges } from "@/server/data/showcase";
export const metadata: Metadata = { title: "Sprints - Admin BuildCrew" };
export default async function AdminChallengesPage() { const challenges = await listChallenges(); return <div><div className="mb-5"><h2 className="text-xl font-semibold">BuildCrew Sprints</h2><p className="mt-1 text-sm text-neutral-500">Twórz kolejne edycje Sprintu, otwieraj zapisy, etap budowania i Demo Day.</p></div><ChallengeManager challenges={challenges.map((challenge) => ({ ...challenge, startsAt: challenge.startsAt.toISOString(), endsAt: challenge.endsAt.toISOString() }))} /></div>; }
