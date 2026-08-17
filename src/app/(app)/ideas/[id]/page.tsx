import { redirect } from "next/navigation";
export default async function IdeaRedirect({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; redirect(`/projects/${id}`); }
