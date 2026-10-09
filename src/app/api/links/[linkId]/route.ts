import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { linkEdits, links } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { parseDestinationUrl } from "@/lib/validate-destination";

/**
 * Edit where an existing link points.
 *
 * Only destinationUrl can change. The slug is deliberately immutable: the
 * QR code encodes the slug URL, so renaming a slug would break every code
 * already printed. Editing the destination leaves the QR code untouched.
 *
 * Every real change is recorded in link_edits (old URL, new URL, who, when),
 * so a destination swapped to something harmful leaves a trail.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { linkId } = await params;

  let body: { destinationUrl?: unknown };
  try {
    body = (await request.json()) as { destinationUrl?: unknown };
  } catch {
    return new Response("Send a JSON body", { status: 400 });
  }

  const parsed = parseDestinationUrl(body.destinationUrl);
  if (!parsed.ok) {
    return new Response(parsed.error, { status: 400 });
  }

  const db = getDb();
  const owned = and(eq(links.id, linkId), eq(links.ownerId, session.user.id));

  // Scoped to id AND ownerId, so a user can never edit someone else's link
  // by guessing a linkId. A link that exists but belongs to another user
  // returns the same 404 as one that does not exist.
  const current = await db.query.links.findFirst({ where: owned });
  if (!current) {
    return new Response("Not found", { status: 404 });
  }

  // Saving the same URL again is not an edit, so it leaves no history row.
  if (current.destinationUrl === parsed.url) {
    return Response.json(current);
  }

  // The neon-http driver has no interactive transactions, but batch() runs
  // both statements in one transaction, so the link is never changed
  // without its history row, or the other way round.
  const [updatedRows] = await db.batch([
    db
      .update(links)
      .set({ destinationUrl: parsed.url })
      .where(owned)
      .returning(),
    db.insert(linkEdits).values({
      id: newId(),
      linkId: current.id,
      editedBy: session.user.id,
      previousUrl: current.destinationUrl,
      newUrl: parsed.url,
    }),
  ]);

  return Response.json(updatedRows[0]);
}
