import type { Metadata } from "next";
import { ChallengeManager } from "@/components/admin/challenge-manager";
import { listChallenges } from "@/server/data/showcase";
export const metadata: Metadata = { title: "Challenges — Admin BuildCrew" };
export default async function AdminChallengesPage() { const challenges = await listChallenges(); return <div><div className="mb-5"><h2 className="text-xl font-semibold">Build Challenges</h2><p className="mt-1 text-sm text-neutral-500">Twórz wydarzenia, otwieraj etap budowania, głosowania i zamykaj wyniki.</p></div><ChallengeManager challenges={challenges.map((challenge) => ({ ...challenge, startsAt: challenge.startsAt.toISOString(), endsAt: challenge.endsAt.toISOString() }))} /></div>; }
