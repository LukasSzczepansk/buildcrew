import { notFound, redirect } from "next/navigation";

const LEGACY_REDIRECTS: Record<string, string> = {
  "ludzi-do-projektu": "/znajdz-ludzi-do-projektu",
  "programiste-do-projektu": "/znajdz-programiste",
  "ux-ui-designera-do-projektu": "/znajdz-designera",
  "cofoundera": "/znajdz-wspolnika",
};

export default async function LegacyDiscoveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const target = LEGACY_REDIRECTS[slug];
  if (!target) notFound();
  redirect(target);
}
