import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { and, count, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { linkEdits, links, scans } from "@/lib/db/schema";
import { publicHost, shortUrl } from "@/lib/public-url";
import { LinkDetailView } from "@/components/link-detail-view";

export const metadata: Metadata = { title: "Link details" };

// Enough for a glance at recent activity. The total is a real count, so the
// list can stay short however popular a link gets.
const SCAN_ROWS = 50;

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const db = getDb();

  // Scoped to the signed-in owner, not just the id, so one user can never
  // view another user's link by guessing or sharing a linkId. A link that
  // is someone else's gets the same 404 as one that does not exist.
  const link = await db.query.links.findFirst({
    where: and(eq(links.id, linkId), eq(links.ownerId, session.user.id)),
  });

  if (!link) {
    notFound();
  }

  const [recentScans, [{ total }], edits] = await Promise.all([
    db.query.scans.findMany({
      where: eq(scans.linkId, link.id),
      orderBy: desc(scans.scannedAt),
      limit: SCAN_ROWS,
    }),
    db.select({ total: count() }).from(scans).where(eq(scans.linkId, link.id)),
    // Most recent 20 edits is plenty for a glance, the table is indexed on
    // (link_id, edited_at) so this stays cheap.
    db.query.linkEdits.findMany({
      where: eq(linkEdits.linkId, link.id),
      orderBy: desc(linkEdits.editedAt),
      limit: 20,
    }),
  ]);

  return (
    <LinkDetailView
      username={session.user.name || session.user.email}
      host={publicHost()}
      publicUrl={shortUrl(link.slug)}
      link={link}
      total={total}
      recentScans={recentScans}
      edits={edits}
    />
  );
}
