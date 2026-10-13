import { createHash, randomInt } from "node:crypto";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/types";
import { inviteRequests, invites, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export const INVITE_TTL_DAYS = 7;
export const MAX_PENDING_REQUESTS = 50;

// No 0, 1, I or O, which people misread when typing a code from a message.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_GROUPS = 4;
const GROUP_LENGTH = 4;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 16 characters from a 32 character alphabet: 80 bits, shown as XXXX-XXXX-XXXX-XXXX. */
export function generateInviteCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < CODE_GROUPS; g++) {
    let group = "";
    for (let i = 0; i < GROUP_LENGTH; i++) {
      group += ALPHABET[randomInt(0, ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

/** Upper case and drop spaces and dashes, so a pasted or retyped code still matches. */
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * SHA-256 is enough here (no salt, no slow hash) because the input is 80
 * random bits, not a human-chosen password. Only this hash is stored.
 */
export function hashInviteCode(code: string): string {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}

export type InviteStatus = "active" | "used" | "expired" | "revoked";

export function inviteStatus(invite: {
  usedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}): InviteStatus {
  if (invite.usedAt) return "used";
  if (invite.revokedAt) return "revoked";
  if (invite.expiresAt.getTime() <= Date.now()) return "expired";
  return "active";
}

// ---------------------------------------------------------------- requests

export type AccessRequestInput = {
  name?: unknown;
  email?: unknown;
  note?: unknown;
  /** Honeypot. Real people never see this field, so a value means a bot. */
  website?: unknown;
};

export type AccessRequestResult =
  | { status: "received" }
  | { status: "closed" }
  | { status: "invalid"; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Takes a request for an invite. Every outcome that is not a validation
 * error or a full queue answers "received", including duplicates and emails
 * that already have an account or an invite, so the form never reveals who
 * is already known to Setu.
 */
export async function createAccessRequest(
  db: Db,
  input: AccessRequestInput,
): Promise<AccessRequestResult> {
  if (typeof input.website === "string" && input.website.trim() !== "") {
    return { status: "received" };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const rawEmail = typeof input.email === "string" ? input.email.trim() : "";
  const note = typeof input.note === "string" ? input.note.trim() : "";

  if (!name || name.length > 80) {
    return { status: "invalid", error: "Enter your name, up to 80 characters" };
  }
  if (!rawEmail || rawEmail.length > 254 || !EMAIL_PATTERN.test(rawEmail)) {
    return { status: "invalid", error: "Enter a valid email address" };
  }
  if (note.length > 500) {
    return { status: "invalid", error: "Keep the note under 500 characters" };
  }

  const email = normalizeEmail(rawEmail);

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existingUser) return { status: "received" };

  const [liveInvite] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(
        eq(invites.email, email),
        isNull(invites.usedAt),
        isNull(invites.revokedAt),
        gt(invites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (liveInvite) return { status: "received" };

  const [pendingForEmail] = await db
    .select({ id: inviteRequests.id })
    .from(inviteRequests)
    .where(and(eq(inviteRequests.email, email), eq(inviteRequests.status, "pending")))
    .limit(1);
  if (pendingForEmail) return { status: "received" };

  const [{ pending }] = await db
    .select({ pending: count() })
    .from(inviteRequests)
    .where(eq(inviteRequests.status, "pending"));
  if (pending >= MAX_PENDING_REQUESTS) return { status: "closed" };

  // The partial unique index also blocks a duplicate that slips past the
  // check above in a race, so a conflict is simply "already received".
  await db
    .insert(inviteRequests)
    .values({ id: newId(), name, email, note: note || null })
    .onConflictDoNothing();

  return { status: "received" };
}

// ----------------------------------------------------------------- invites

export type IssuedInvite = {
  inviteId: string;
  email: string;
  /** The only time the code exists in readable form. Show it, never store it. */
  code: string;
  expiresAt: Date;
};

async function revokeUnusedForEmail(db: Db, email: string) {
  await db
    .update(invites)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(invites.email, email), isNull(invites.usedAt), isNull(invites.revokedAt)),
    );
}

/** Revokes any earlier unused invite for the email, then issues a fresh one. */
export async function issueInviteForEmail(
  db: Db,
  rawEmail: string,
  requestId: string | null = null,
): Promise<IssuedInvite> {
  const email = normalizeEmail(rawEmail);
  const code = generateInviteCode();
  const inviteId = newId();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

  await revokeUnusedForEmail(db, email);
  await db.insert(invites).values({
    id: inviteId,
    requestId,
    email,
    codeHash: hashInviteCode(code),
    expiresAt,
  });

  return { inviteId, email, code, expiresAt };
}

export type ApproveResult = ({ ok: true } & IssuedInvite) | { ok: false; error: string };

export async function approveRequest(db: Db, requestId: string): Promise<ApproveResult> {
  const [request] = await db
    .select()
    .from(inviteRequests)
    .where(eq(inviteRequests.id, requestId))
    .limit(1);
  if (!request) return { ok: false, error: "Request not found" };

  const issued = await issueInviteForEmail(db, request.email, request.id);
  await db
    .update(inviteRequests)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(inviteRequests.id, request.id));

  return { ok: true, ...issued };
}

export async function rejectRequest(db: Db, requestId: string): Promise<boolean> {
  const [request] = await db
    .select()
    .from(inviteRequests)
    .where(eq(inviteRequests.id, requestId))
    .limit(1);
  if (!request) return false;

  await db
    .update(inviteRequests)
    .set({ status: "rejected", reviewedAt: new Date() })
    .where(eq(inviteRequests.id, request.id));
  await revokeUnusedForEmail(db, request.email);
  return true;
}

export async function revokeInvite(db: Db, inviteId: string): Promise<void> {
  await db
    .update(invites)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(invites.id, inviteId), isNull(invites.usedAt), isNull(invites.revokedAt)),
    );
}

/**
 * Spends an invite. One UPDATE both checks and consumes it, so two people
 * racing with the same code cannot both succeed: the second UPDATE finds
 * used_at already set and matches nothing. The email is part of the match,
 * so a code only ever works for the address it was issued to.
 */
export async function claimInvite(
  db: Db,
  input: { email: unknown; code: unknown },
): Promise<boolean> {
  if (typeof input.email !== "string" || typeof input.code !== "string") return false;
  const email = normalizeEmail(input.email);
  if (!email || !normalizeCode(input.code)) return false;

  const claimed = await db
    .update(invites)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(invites.email, email),
        eq(invites.codeHash, hashInviteCode(input.code)),
        isNull(invites.usedAt),
        isNull(invites.revokedAt),
        gt(invites.expiresAt, new Date()),
      ),
    )
    .returning({ id: invites.id });

  return claimed.length === 1;
}

/** Records which account spent the invite, for the admin's history view. */
export async function attachInviteUser(db: Db, email: string, userId: string) {
  await db
    .update(invites)
    .set({ usedBy: userId })
    .where(
      and(eq(invites.email, normalizeEmail(email)), isNull(invites.usedBy)),
    );
}
