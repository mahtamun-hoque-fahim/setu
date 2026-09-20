import { after } from "next/server";
import { eq } from "drizzle-orm";
import { newId } from "@/lib/id";
import { getDb } from "@/lib/db";
import { links, scans } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const db = getDb();

  const link = await db.query.links.findFirst({
    where: eq(links.slug, slug),
  });

  if (!link) {
    return new Response("Not found", { status: 404 });
  }

  // Log the scan after the redirect response has already been sent,
  // so analytics never add latency to the person scanning the code.
  after(async () => {
    const country = request.headers.get("x-vercel-ip-country") ?? undefined;
    await db.insert(scans).values({
      id: newId(),
      linkId: link.id,
      userAgent: request.headers.get("user-agent") ?? undefined,
      country,
      referrer: request.headers.get("referer") ?? undefined,
    });
  });

  return Response.redirect(link.destinationUrl, 302);
}
