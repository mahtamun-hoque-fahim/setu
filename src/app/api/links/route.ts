import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { newId } from "@/lib/id";
import { destinationOptionsFromEnv, prepareDestination } from "@/lib/destination-check";
import { parseSlug } from "@/lib/slug";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const rows = await db.query.links.findMany({
    where: eq(links.ownerId, session.user.id),
  });

  return Response.json(rows);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { slug?: unknown; destinationUrl?: unknown };
  try {
    body = (await request.json()) as { slug?: unknown; destinationUrl?: unknown };
  } catch {
    return new Response("Send a JSON body", { status: 400 });
  }

  if (!body.slug || !body.destinationUrl) {
    return new Response("Enter both a slug and a destination URL", {
      status: 400,
    });
  }

  const slugResult = parseSlug(body.slug);
  if (!slugResult.ok) {
    return new Response(slugResult.error, { status: 409 });
  }
  const slug = slugResult.slug;

  if (isReservedSlug(slug)) {
    return new Response("That slug is reserved", { status: 409 });
  }

  const db = getDb();

  const existing = await db.query.links.findFirst({
    where: eq(links.slug, slug),
  });

  if (existing) {
    return new Response("That slug is already taken", { status: 409 });
  }

  const destination = await prepareDestination(
    db,
    body.destinationUrl,
    destinationOptionsFromEnv(),
  );
  if (!destination.ok) {
    return new Response(destination.error, { status: 400 });
  }

  const [created] = await db
    .insert(links)
    .values({
      id: newId(),
      slug,
      destinationUrl: destination.url,
      urlCheck: destination.check,
      ownerId: session.user.id,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
