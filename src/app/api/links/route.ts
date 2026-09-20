import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { newId } from "@/lib/id";

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

  const body = (await request.json()) as {
    slug?: string;
    destinationUrl?: string;
  };

  if (!body.slug || !body.destinationUrl) {
    return new Response("slug and destinationUrl are required", {
      status: 400,
    });
  }

  if (isReservedSlug(body.slug)) {
    return new Response("That slug is reserved", { status: 409 });
  }

  const db = getDb();
  const existing = await db.query.links.findFirst({
    where: eq(links.slug, body.slug),
  });

  if (existing) {
    return new Response("That slug is already taken", { status: 409 });
  }

  const [created] = await db
    .insert(links)
    .values({
      id: newId(),
      slug: body.slug,
      destinationUrl: body.destinationUrl,
      ownerId: session.user.id,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
