import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { blockedHosts, inviteRequests, invites, links, scans, user } from "@/lib/db/schema";
import { adminCounts, listAccounts, listAllLinks, listInvites } from "@/lib/admin-data";
import { createAccessRequest, issueInviteForEmail } from "@/lib/invites";

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
  await db.delete(scans);
  await db.delete(links);
  await db.delete(invites);
  await db.delete(inviteRequests);
  await db.delete(blockedHosts);
  await db.delete(user);
  await db.insert(user).values([
    { id: "u1", name: "Fahim", email: "admin@example.com" },
    { id: "u2", name: "Rafi", email: "rafi@example.com" },
  ]);
  await db.insert(links).values([
    { id: "l1", slug: "a", destinationUrl: "https://example.com/a", ownerId: "u1" },
    { id: "l2", slug: "b", destinationUrl: "https://example.com/b", ownerId: "u1", status: "disabled" },
    { id: "l3", slug: "c", destinationUrl: "https://example.com/c", ownerId: "u2" },
  ]);
  await db.insert(scans).values([
    { id: "s1", linkId: "l1" }, { id: "s2", linkId: "l1" }, { id: "s3", linkId: "l1" }, { id: "s4", linkId: "l3" },
  ]);
});

describe("admin data", () => {
  it("counts links per account without multiplying rows", async () => {
    const accounts = await listAccounts(db);
    expect(accounts).toHaveLength(2);
    expect(accounts.find((a) => a.email === "admin@example.com")?.linkCount).toBe(2);
    expect(accounts.find((a) => a.email === "rafi@example.com")?.linkCount).toBe(1);
  });

  it("lists every link with its owner and a correct scan count, zero included", async () => {
    const all = await listAllLinks(db);
    expect(all).toHaveLength(3);
    const byId = Object.fromEntries(all.map((l) => [l.id, l]));
    expect(byId.l1.scanCount).toBe(3);
    expect(byId.l2.scanCount).toBe(0);
    expect(byId.l3.scanCount).toBe(1);
    expect(byId.l3.ownerEmail).toBe("rafi@example.com");
    expect(byId.l2.status).toBe("disabled");
  });

  it("never exposes individual scan records", async () => {
    const all = await listAllLinks(db);
    for (const link of all) {
      expect(Object.keys(link)).not.toContain("userAgent");
      expect(Object.keys(link)).not.toContain("country");
      expect(Object.keys(link)).not.toContain("referrer");
    }
  });

  it("shows invites without their code hash", async () => {
    await issueInviteForEmail(db, "new@example.com");
    const list = await listInvites(db);
    expect(list).toHaveLength(1);
    expect(Object.keys(list[0])).not.toContain("codeHash");
  });

  it("summarizes what needs attention", async () => {
    await createAccessRequest(db, { name: "N", email: "n@example.com" });
    await issueInviteForEmail(db, "x@example.com");
    expect(await adminCounts(db)).toEqual({
      pendingRequests: 1,
      liveInvites: 1,
      accounts: 2,
      disabledLinks: 1,
    });
  });
});
