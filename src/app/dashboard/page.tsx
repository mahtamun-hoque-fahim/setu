import type { Metadata } from "next";
import { headers } from "next/headers";
import { count, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { links, scans } from "@/lib/db/schema";
import { publicHost } from "@/lib/public-url";
import { DashboardView } from "@/components/dashboard-view";

export const metadata: Metadata = { title: "Your links" };

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // The proxy already redirects unauthenticated visitors, this is the
  // server-side confirmation that never trusts the client alone.
  if (!session) {
    return null;
  }

  const db = getDb();

  // One grouped query for the scan counts, instead of loading every scan
  // row of every link just to call .length on it.
  const myLinks = await db
    .select({
      id: links.id,
      slug: links.slug,
      destinationUrl: links.destinationUrl,
      createdAt: links.createdAt,
      scanCount: count(scans.id),
    })
    .from(links)
    .leftJoin(scans, eq(scans.linkId, links.id))
    .where(eq(links.ownerId, session.user.id))
    .groupBy(links.id)
    .orderBy(desc(links.createdAt));

  return (
    <DashboardView
      username={session.user.name || session.user.email}
      host={publicHost()}
      links={myLinks}
    />
  );
}
