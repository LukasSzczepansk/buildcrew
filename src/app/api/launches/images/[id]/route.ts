import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getLaunchImage } from "@/server/data/launches";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const image = await getLaunchImage(
    id,
    user?.id,
    Boolean(user && isAdmin(user.email, user.systemRole)),
  );
  if (!image) return new NextResponse(null, { status: 404 });
  const body = Buffer.from(image.imageBase64, "base64");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType || "image/webp",
      "Content-Length": String(body.length),
      "Cache-Control": image.reviewStatus === "APPROVED"
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
    },
  });
}
