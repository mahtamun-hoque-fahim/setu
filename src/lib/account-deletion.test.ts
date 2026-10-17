import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import {
  inviteRequests, invites, linkEdits, links, scans, session, user,
} from "@/lib/db/schema";
import { deleteAccountAndData } from "@/lib/account-deletion";
import { issueInviteForEmail } from "@/lib/invites";

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
  for (const table of [scans, linkEdits, links, session, invites, inviteRequests, user]) {
    await db.delete(table);
  }
  await db.insert(user).values([
    { id: "u1", name: "Fahim", email: "admin@example.com" },
    { id: "u2", name: "Rafi", email: "rafi@example.com" },
    { id: "u3", name: "Mim", email: "mim@example.com" },
  ]);
  await db.insert(links).values([
    { id: "l2", slug: "rafi", destinationUrl: "https://example.com/r", ownerId: "u2" },
    { id: "l3", slug: "mim", destinationUrl: "https://example.com/m", ownerId: "u3" },
  ]);
  await db.insert(scans).values([{ id: "s2", linkId: "l2" }, { id: "s3", linkId: "l3" }]);
  await db.insert(linkEdits).values({
    id: "e2", linkId: "l2", editedBy: "u2", previousUrl: "https://a.example", newUrl: "https://b.example",
  });
  await db.insert(session).values({
    id: "se2", userId: "u2", token: "t2", expiresAt: new Date(Date.now() + 1e6), ipAddress: "1.2.3.4",
  });
  await db.insert(inviteRequests).values({ id: "r2", name: "Rafi", email: "rafi@example.com", status: "approved" });
  await issueInviteForEmail(db, "rafi@example.com", "r2");
});

describe("deleteAccountAndData", () => {
  it("removes the account and everything about it: links, scans, history, sessions, requests, invites", async () => {
    const result = await deleteAccountAndData(db, "u2", { adminEmail: "admin@example.com" });
    expect(result).toEqual({ ok: true });

    expect(await db.select().from(user).then((r) => r.map((u) => u.id).sort())).toEqual(["u1", "u3"]);
    expect(await db.select().from(links).then((r) => r.map((l) => l.id))).toEqual(["l3"]);
    expect(await db.select().from(scans).then((r) => r.map((s) => s.id))).toEqual(["s3"]);
    expect(await db.select().from(linkEdits)).toHaveLength(0);
    expect(await db.select().from(session)).toHaveLength(0);
    expect(await db.select().from(inviteRequests)).toHaveLength(0);
    expect(await db.select().from(invites)).toHaveLength(0);
  });

  it("leaves other people's data alone", async () => {
    await deleteAccountAndData(db, "u2", { adminEmail: "admin@example.com" });
    expect(await db.select().from(links)).toHaveLength(1);
  });

  it("refuses to delete the admin account", async () => {
    const result = await deleteAccountAndData(db, "u1", { adminEmail: "ADMIN@example.com" });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/admin/i) });
    expect(await db.select().from(user)).toHaveLength(3);
  });

  it("reports an account that does not exist", async () => {
    const result = await deleteAccountAndData(db, "nope", { adminEmail: "admin@example.com" });
    expect(result.ok).toBe(false);
  });
});
