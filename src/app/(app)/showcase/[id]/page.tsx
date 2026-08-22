import { redirect } from "next/navigation";

export default async function ShowcaseEntryRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/launches/${id}`);
}
