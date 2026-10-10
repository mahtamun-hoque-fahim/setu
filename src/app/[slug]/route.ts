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
    // A route handler cannot render a page, and notFound() here returns an
    // empty 404. Send scanners of an unknown slug to a small page that shows
    // the branded 404 instead of a blank screen. no-store because the slug
    // may be created later and a cached redirect would keep pointing here.
    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL("/link-not-found", request.url).toString(),
        "Cache-Control": "no-store",
      },
    });
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
      // Snapshot where this scan was sent, the owner may edit it later.
      destinationUrl: link.destinationUrl,
    });
  });

  // Destinations are editable, so this response must never be cached by a
  // browser, proxy or CDN. A cached redirect would keep sending scanners to
  // the old destination after the owner changed it.
  return new Response(null, {
    status: 302,
    headers: {
      Location: link.destinationUrl,
      "Cache-Control": "no-store",
    },
  });
}
