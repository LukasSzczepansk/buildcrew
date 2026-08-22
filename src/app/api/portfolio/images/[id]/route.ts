import { getCurrentUser } from "@/lib/auth";
import { getPortfolioImage } from "@/server/data/portfolio";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const [{ id }, viewer] = await Promise.all([params, getCurrentUser()]);
  const image = await getPortfolioImage(id);
  if (!image || (!image.publicProfile && !viewer)) return new Response("Not found", { status: 404 });
  const bytes = Uint8Array.from(Buffer.from(image.imageBase64, "base64"));
  return new Response(bytes, {
    headers: {
      "Content-Type": image.mimeType || "image/webp",
      "Cache-Control": image.publicProfile ? "public, max-age=86400, stale-while-revalidate=604800" : "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
