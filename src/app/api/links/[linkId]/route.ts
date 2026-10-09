import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { parseDestinationUrl } from "@/lib/validate-destination";

/**
 * Edit where an existing link points.
 *
 * Only destinationUrl can change. The slug is deliberately immutable: the
 * QR code encodes the slug URL, so renaming a slug would break every code
 * already printed. Editing the destination leaves the QR code untouched.
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

  // Scoped to id AND ownerId in the same statement, so a user can never
  // edit someone else's link by guessing a linkId. A link that exists but
  // belongs to another user returns the same 404 as one that does not exist.
  const [updated] = await db
    .update(links)
    .set({ destinationUrl: parsed.url })
    .where(and(eq(links.id, linkId), eq(links.ownerId, session.user.id)))
    .returning();

  if (!updated) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(updated);
}
