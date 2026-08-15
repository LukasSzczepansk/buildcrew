import { getCurrentUser } from "@/lib/auth";
import { getApprovedAvatarByUsername } from "@/server/data/profile-avatars";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const row = await getApprovedAvatarByUsername(username);
  if (!row) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  const viewer = await getCurrentUser();
  if (!viewer && !row.publicProfile) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

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
