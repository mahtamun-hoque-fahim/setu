import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/types";
import { inviteRequests, invites, user } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { normalizeEmail } from "@/lib/invites";

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

/**
 * Erases a person from Setu. Deleting the user row cascades to their links,
 * every scan of those links, the edit history, their sessions and their
 * login records. Invite requests and invites are keyed by email rather than
 * by account, so they are removed here explicitly: erasing someone has to
 * include the name and note they typed into the request form.
 */
export async function deleteAccountAndData(
  db: Db,
  userId: string,
  options: { adminEmail: string | undefined },
): Promise<DeleteAccountResult> {
  const [account] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!account) return { ok: false, error: "Account not found" };

  if (isAdminEmail(account.email, options.adminEmail)) {
    return { ok: false, error: "The admin account cannot be deleted here" };
  }

  const email = normalizeEmail(account.email);
  await db.delete(invites).where(eq(invites.email, email));
  await db.delete(inviteRequests).where(eq(inviteRequests.email, email));
  await db.delete(user).where(eq(user.id, userId));
  return { ok: true };
}
