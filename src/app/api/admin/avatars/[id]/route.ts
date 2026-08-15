import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getPendingProfileAvatarForAdmin } from "@/server/data/profile-avatars";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email, user.systemRole)) return new Response(null, { status: 404 });
  const { id } = await params;
  const row = await getPendingProfileAvatarForAdmin(id);
  if (!row) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const bytes = Uint8Array.from(Buffer.from(row.imageBase64, "base64"));
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": row.mimeType || "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
