import { count, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/types";
import {
  blockedHosts,
  inviteRequests,
  invites,
  links,
  scans,
  user,
} from "@/lib/db/schema";

/**
 * What the admin dashboard reads. Deliberately has no function that returns
 * individual scans: the admin sees accounts, links, destinations and scan
 * counts, which is what moderating abuse needs, and never a per-scan record.
 */

export async function listRequests(db: Db) {
  return db.select().from(inviteRequests).orderBy(desc(inviteRequests.createdAt)).limit(200);
}

export async function listInvites(db: Db) {
  return db
    .select({
      id: invites.id,
      email: invites.email,
      createdAt: invites.createdAt,
      expiresAt: invites.expiresAt,
      usedAt: invites.usedAt,
      revokedAt: invites.revokedAt,
    })
    .from(invites)
    .orderBy(desc(invites.createdAt))
    .limit(200);
}

export async function listAccounts(db: Db) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      linkCount: count(links.id),
    })
    .from(user)
    .leftJoin(links, eq(links.ownerId, user.id))
    .groupBy(user.id)
    .orderBy(desc(user.createdAt));
}

export async function listAllLinks(db: Db) {
  // Count scans in a subquery so the join to owners cannot multiply rows.
  const scanCounts = db
    .select({ linkId: scans.linkId, total: count().as("total") })
    .from(scans)
    .groupBy(scans.linkId)
    .as("scan_counts");

  return db
    .select({
      id: links.id,
      slug: links.slug,
      destinationUrl: links.destinationUrl,
      status: links.status,
      disabledReason: links.disabledReason,
      urlCheck: links.urlCheck,
      createdAt: links.createdAt,
      ownerEmail: user.email,
      scanCount: sql<number>`coalesce(${scanCounts.total}, 0)`.mapWith(Number),
    })
    .from(links)
    .innerJoin(user, eq(user.id, links.ownerId))
    .leftJoin(scanCounts, eq(scanCounts.linkId, links.id))
    .orderBy(desc(links.createdAt));
}

export async function listBlockedHosts(db: Db) {
  return db.select().from(blockedHosts).orderBy(desc(blockedHosts.createdAt));
}

export async function adminCounts(db: Db) {
  const [[pending], [live], [accounts], [flagged]] = await Promise.all([
    db.select({ n: count() }).from(inviteRequests).where(eq(inviteRequests.status, "pending")),
    db
      .select({ n: count() })
      .from(invites)
      .where(sql`${invites.usedAt} is null and ${invites.revokedAt} is null and ${invites.expiresAt} > now()`),
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(links).where(eq(links.status, "disabled")),
  ]);
  return {
    pendingRequests: pending.n,
    liveInvites: live.n,
    accounts: accounts.n,
    disabledLinks: flagged.n,
  };
}
