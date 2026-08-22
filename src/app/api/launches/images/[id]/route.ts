import { NextResponse } from "next/server";
import { getLaunchImage } from "@/server/data/launches";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await getLaunchImage(id);
  if (!image) return new NextResponse(null, { status: 404 });
  const body = Buffer.from(image.imageBase64, "base64");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType || "image/webp",
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
