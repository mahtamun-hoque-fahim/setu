import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/lib/db/types";
import { blockedHosts, links } from "@/lib/db/schema";
import { hostMatches } from "@/lib/validate-destination";

const HOSTNAME_PATTERN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

/** Accepts "evil.example" or a whole pasted URL and returns the lowercase host, or null. */
export function normalizeHostInput(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  try {
    const hostname = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
    return HOSTNAME_PATTERN.test(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

export async function disableLink(db: Db, linkId: string, reason: string | null) {
  await db
    .update(links)
    .set({ status: "disabled", disabledReason: reason, disabledAt: new Date() })
    .where(eq(links.id, linkId));
}

export async function enableLink(db: Db, linkId: string) {
  await db
    .update(links)
    .set({ status: "active", disabledReason: null, disabledAt: null })
    .where(eq(links.id, linkId));
}

export type AddBlockedHostResult =
  | { ok: true; host: string; disabled: number }
  | { ok: false; error: string };

/**
 * Blocks a host for new and edited links, and switches off every active link
 * that already points at it (or at a subdomain of it) in the same step.
 */
export async function addBlockedHost(
  db: Db,
  input: string,
  reason: string | null,
): Promise<AddBlockedHostResult> {
  const host = normalizeHostInput(input);
  if (!host) return { ok: false, error: "Enter a website address like example.com" };

  await db.insert(blockedHosts).values({ host, reason }).onConflictDoNothing();

  const active = await db
    .select({ id: links.id, destinationUrl: links.destinationUrl })
    .from(links)
    .where(eq(links.status, "active"));

  const affected = active
    .filter((link) => {
      try {
        return hostMatches(new URL(link.destinationUrl).hostname, [host]);
      } catch {
        return false;
      }
    })
    .map((link) => link.id);

  if (affected.length > 0) {
    await db
      .update(links)
      .set({
        status: "disabled",
        disabledReason: `Host blocked: ${host}`,
        disabledAt: new Date(),
      })
      .where(and(inArray(links.id, affected), eq(links.status, "active")));
  }

  return { ok: true, host, disabled: affected.length };
}

export async function removeBlockedHost(db: Db, host: string) {
  await db.delete(blockedHosts).where(eq(blockedHosts.host, host));
}
