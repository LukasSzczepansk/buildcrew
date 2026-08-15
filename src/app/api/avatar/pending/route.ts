import { getCurrentUser } from "@/lib/auth";
import { getPendingProfileAvatarImageForUser } from "@/server/data/profile-avatars";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 404 });
  const row = await getPendingProfileAvatarImageForUser(user.id);
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
