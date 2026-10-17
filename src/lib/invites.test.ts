import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type TestDb } from "@/test/db";
import { inviteRequests, invites, user } from "@/lib/db/schema";
import {
  MAX_PENDING_REQUESTS,
  approveRequest,
  claimInvite,
  createAccessRequest,
  generateInviteCode,
  hashInviteCode,
  inviteStatus,
  issueInviteForEmail,
  normalizeEmail,
  rejectRequest,
  revokeInvite,
} from "@/lib/invites";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let db: TestDb;

beforeAll(async () => {
  ctx = await createTestDb();
  db = ctx.db;
});
afterAll(async () => {
  await ctx.client.close();
});
beforeEach(async () => {
  await db.delete(invites);
  await db.delete(inviteRequests);
  await db.delete(user);
});

const valid = { name: "Rafi", email: "rafi@example.com", note: "Classmate" };
const pendingCount = async () =>
  (await db.select().from(inviteRequests).where(eq(inviteRequests.status, "pending"))).length;

describe("codes and emails", () => {
  it("normalizes emails", () => {
    expect(normalizeEmail("  Rafi@Example.COM ")).toBe("rafi@example.com");
  });

  it("generates codes that are long, formatted and different every time", () => {
    const a = generateInviteCode();
    const b = generateInviteCode();
    expect(a).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    expect(a).not.toBe(b);
  });

  it("hashes a code the same way however the person types it", () => {
    const code = "ABCD-EFGH-JKLM-NPQR";
    expect(hashInviteCode(code)).toBe(hashInviteCode(" abcd efgh jklm npqr "));
    expect(hashInviteCode(code)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteCode(code)).not.toContain("ABCD");
  });
});

describe("createAccessRequest", () => {
  it("stores a valid request, lowercased, as pending", async () => {
    const result = await createAccessRequest(db, { ...valid, email: "Rafi@Example.com" });
    expect(result.status).toBe("received");
    const rows = await db.select().from(inviteRequests);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "rafi@example.com", status: "pending", name: "Rafi" });
  });

  it.each([
    ["empty name", { ...valid, name: "  " }],
    ["name too long", { ...valid, name: "x".repeat(81) }],
    ["bad email", { ...valid, email: "not-an-email" }],
    ["email too long", { ...valid, email: "a".repeat(250) + "@x.co" }],
    ["note too long", { ...valid, note: "x".repeat(501) }],
  ])("rejects %s", async (_name, input) => {
    const result = await createAccessRequest(db, input);
    expect(result.status).toBe("invalid");
    expect(await db.select().from(inviteRequests)).toHaveLength(0);
  });

  it("silently ignores bots that fill the hidden field, and stores nothing", async () => {
    const result = await createAccessRequest(db, { ...valid, website: "http://spam.example" });
    expect(result.status).toBe("received");
    expect(await db.select().from(inviteRequests)).toHaveLength(0);
  });

  it("answers the same for a duplicate, so nobody can learn who is already known", async () => {
    await createAccessRequest(db, valid);
    const again = await createAccessRequest(db, valid);
    expect(again.status).toBe("received");
    expect(await db.select().from(inviteRequests)).toHaveLength(1);
  });

  it("answers the same for an email that already has an account", async () => {
    await db.insert(user).values({ id: "u1", name: "Rafi", email: "rafi@example.com" });
    const result = await createAccessRequest(db, valid);
    expect(result.status).toBe("received");
    expect(await db.select().from(inviteRequests)).toHaveLength(0);
  });

  it("answers the same for an email that already holds a live invite", async () => {
    await issueInviteForEmail(db, "rafi@example.com");
    const result = await createAccessRequest(db, valid);
    expect(result.status).toBe("received");
    expect(await db.select().from(inviteRequests)).toHaveLength(0);
  });

  it("closes the queue once the pending cap is reached", async () => {
    await db.insert(inviteRequests).values(
      Array.from({ length: MAX_PENDING_REQUESTS }, (_, i) => ({
        id: `r${i}`, name: "N", email: `p${i}@example.com`,
      })),
    );
    const result = await createAccessRequest(db, valid);
    expect(result.status).toBe("closed");
    expect(await pendingCount()).toBe(MAX_PENDING_REQUESTS);
  });

  it("lets someone request again after a rejection", async () => {
    await createAccessRequest(db, valid);
    const [row] = await db.select().from(inviteRequests);
    await rejectRequest(db, row.id);
    const again = await createAccessRequest(db, valid);
    expect(again.status).toBe("received");
    expect(await pendingCount()).toBe(1);
  });
});

describe("approveRequest", () => {
  it("issues a 7 day invite bound to the email, storing only a hash", async () => {
    await createAccessRequest(db, valid);
    const [row] = await db.select().from(inviteRequests);
    const result = await approveRequest(db, row.id);
    if (!result.ok) throw new Error(result.error);

    expect(result.email).toBe("rafi@example.com");
    expect(result.code).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    const days = (result.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);

    const [invite] = await db.select().from(invites);
    expect(invite.codeHash).toBe(hashInviteCode(result.code));
    expect(JSON.stringify(invite)).not.toContain(result.code);
    const [updated] = await db.select().from(inviteRequests);
    expect(updated.status).toBe("approved");
    expect(updated.reviewedAt).not.toBeNull();
  });

  it("re-issuing revokes the earlier unused invite", async () => {
    await createAccessRequest(db, valid);
    const [row] = await db.select().from(inviteRequests);
    const first = await approveRequest(db, row.id);
    const second = await approveRequest(db, row.id);
    if (!first.ok || !second.ok) throw new Error("approve failed");

    expect(await claimInvite(db, { email: valid.email, code: first.code })).toBe(false);
    expect(await claimInvite(db, { email: valid.email, code: second.code })).toBe(true);
  });

  it("fails for a request that does not exist", async () => {
    const result = await approveRequest(db, "nope");
    expect(result.ok).toBe(false);
  });
});

describe("claimInvite", () => {
  const setup = async (email = "rafi@example.com") => {
    const issued = await issueInviteForEmail(db, email);
    return issued;
  };

  it("accepts the right email with the right code, once", async () => {
    const { code } = await setup();
    expect(await claimInvite(db, { email: "rafi@example.com", code })).toBe(true);
    expect(await claimInvite(db, { email: "rafi@example.com", code })).toBe(false);
  });

  it("ignores email case and code formatting", async () => {
    const { code } = await setup();
    expect(await claimInvite(db, { email: "RAFI@example.com", code: code.toLowerCase().replaceAll("-", " ") })).toBe(true);
  });

  it("rejects a different email, even with a real code", async () => {
    const { code } = await setup();
    expect(await claimInvite(db, { email: "someone-else@example.com", code })).toBe(false);
    expect(await claimInvite(db, { email: "rafi@example.com", code })).toBe(true);
  });

  it("rejects a wrong code", async () => {
    await setup();
    expect(await claimInvite(db, { email: "rafi@example.com", code: "AAAA-AAAA-AAAA-AAAA" })).toBe(false);
  });

  it("rejects an expired invite", async () => {
    const { code } = await setup();
    await db.update(invites).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await claimInvite(db, { email: "rafi@example.com", code })).toBe(false);
  });

  it("rejects a revoked invite", async () => {
    const { code, inviteId } = await setup();
    await revokeInvite(db, inviteId);
    expect(await claimInvite(db, { email: "rafi@example.com", code })).toBe(false);
  });

  it("lets only one of two simultaneous attempts win", async () => {
    const { code } = await setup();
    const results = await Promise.all([
      claimInvite(db, { email: "rafi@example.com", code }),
      claimInvite(db, { email: "rafi@example.com", code }),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("rejects empty and non-string input", async () => {
    await setup();
    expect(await claimInvite(db, { email: "rafi@example.com", code: "" })).toBe(false);
    expect(await claimInvite(db, { email: "", code: "AAAA-AAAA-AAAA-AAAA" })).toBe(false);
  });
});

describe("inviteStatus", () => {
  it("describes each state", () => {
    // Built inside the test, not at file load: the in-process database takes
    // seconds to boot and a timestamp made earlier would already be in the past.
    const base = { usedAt: null, revokedAt: null, expiresAt: new Date(Date.now() + 60_000) };
    expect(inviteStatus(base)).toBe("active");
    expect(inviteStatus({ ...base, usedAt: new Date() })).toBe("used");
    expect(inviteStatus({ ...base, revokedAt: new Date() })).toBe("revoked");
    expect(inviteStatus({ ...base, expiresAt: new Date(Date.now() - 1) })).toBe("expired");
  });
});

describe("rejectRequest", () => {
  it("marks it rejected and kills any invite already issued for that email", async () => {
    await createAccessRequest(db, valid);
    const [row] = await db.select().from(inviteRequests);
    const approved = await approveRequest(db, row.id);
    if (!approved.ok) throw new Error("approve failed");
    await rejectRequest(db, row.id);

    const [after] = await db.select().from(inviteRequests);
    expect(after.status).toBe("rejected");
    expect(await claimInvite(db, { email: valid.email, code: approved.code })).toBe(false);
  });
});
