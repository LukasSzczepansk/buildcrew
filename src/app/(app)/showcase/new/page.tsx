import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ShowcaseForm } from "@/components/showcase/showcase-form";
import { getCurrentUser } from "@/lib/auth";
import { listProjectsForMember } from "@/server/data/projects";
import { getChallengeParticipation, listChallenges } from "@/server/data/showcase";

export const metadata: Metadata = { title: "Pokaż projekt - BuildCrew" };

export default async function NewShowcasePage() {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const [projects, challenges] = await Promise.all([listProjectsForMember(user.id), listChallenges()]);
  const joined = (await Promise.all(challenges.filter((challenge) => ["OPEN","BUILDING","VOTING"].includes(challenge.status)).map(async (challenge) => ({ challenge, participation: await getChallengeParticipation(challenge.id, user.id) })))).filter((item) => item.participation);
  return <div><Topbar title="Pokaż, co zbudowaliście" subtitle="Showcase nie jest listą zleceń. To miejsce na działający efekt, feedback i znalezienie kolejnych współtwórców." /><ShowcaseForm projects={projects.map((project) => ({ id: project.id, name: project.name }))} challenges={joined.map(({ challenge }) => ({ id: challenge.id, title: challenge.title }))} /></div>;
}
