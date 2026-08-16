import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ShowcaseForm } from "@/components/showcase/showcase-form";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { listProjectsForMember } from "@/server/data/projects";
import { getChallengeParticipation, listChallenges } from "@/server/data/showcase";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Share a project - BuildCrew" : "Showcase project - BuildCrew" }; }
export default async function NewShowcasePage() { const user = await getCurrentUser(); if (!user) redirect("/login"); const locale = await getRequestLocale(); const en = locale === "en"; const [projects, challenges] = await Promise.all([listProjectsForMember(user.id), listChallenges()]); const joined = (await Promise.all(challenges.filter((challenge) => ["OPEN","BUILDING","VOTING"].includes(challenge.status)).map(async (challenge) => ({ challenge, participation: await getChallengeParticipation(challenge.id, user.id) })))).filter((item) => item.participation); return <div><Topbar title={en ? "Share what you built" : "Show what you built"} subtitle={en ? "Showcase is for working products, experiments, feedback and meeting future collaborators." : "Showcase is not a job board. It is a place for working results, feedback, and finding more collaborators."} /><ShowcaseForm projects={projects.map((project) => ({ id: project.id, name: project.name }))} challenges={joined.map(({ challenge }) => ({ id: challenge.id, title: challenge.title }))} /></div>; }
