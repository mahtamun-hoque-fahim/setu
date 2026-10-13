import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type TestDb } from "@/test/db";
import { blockedHosts, links, user } from "@/lib/db/schema";
import {
  addBlockedHost,
  disableLink,
  enableLink,
  normalizeHostInput,
  removeBlockedHost,
} from "@/lib/link-moderation";

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
  await db.delete(blockedHosts);
  await db.delete(links);
  await db.delete(user);
  await db.insert(user).values({ id: "u1", name: "Rafi", email: "rafi@example.com" });
});

const addLink = (id: string, slug: string, destinationUrl: string) =>
  db.insert(links).values({ id, slug, destinationUrl, ownerId: "u1" });
const getLink = async (id: string) =>
  (await db.select().from(links).where(eq(links.id, id)))[0];

describe("normalizeHostInput", () => {
  it.each([
    ["evil.example", "evil.example"],
    ["  EVIL.Example ", "evil.example"],
    ["https://Evil.Example/some/path?q=1", "evil.example"],
    ["www.evil.example", "www.evil.example"],
  ])("%s", (input, expected) => {
    expect(normalizeHostInput(input)).toBe(expected);
  });

  it.each(["", "   ", "not a host", "http://", "a".repeat(300) + ".com"])("rejects %j", (input) => {
    expect(normalizeHostInput(input)).toBeNull();
  });
});

describe("disable and enable", () => {
  it("disables a link with a reason and brings it back", async () => {
    await addLink("l1", "mine", "https://example.com/a");
    await disableLink(db, "l1", "Reported as phishing");
    let link = await getLink("l1");
    expect(link.status).toBe("disabled");
    expect(link.disabledReason).toBe("Reported as phishing");
    expect(link.disabledAt).not.toBeNull();

    await enableLink(db, "l1");
    link = await getLink("l1");
    expect(link).toMatchObject({ status: "active", disabledReason: null, disabledAt: null });
  });
});

describe("blocking a host", () => {
  it("stores it and disables every active link already pointing there, subdomains included", async () => {
    await addLink("l1", "a", "https://evil.example/x");
    await addLink("l2", "b", "https://login.evil.example/y");
    await addLink("l3", "c", "https://notevil.example/z");

    const result = await addBlockedHost(db, "https://EVIL.example/anything", "phishing");
    expect(result).toEqual({ ok: true, host: "evil.example", disabled: 2 });

    expect((await getLink("l1")).status).toBe("disabled");
    expect((await getLink("l2")).status).toBe("disabled");
    expect((await getLink("l3")).status).toBe("active");
    expect((await getLink("l1")).disabledReason).toMatch(/blocked/i);
    expect(await db.select().from(blockedHosts)).toHaveLength(1);
  });

  it("is safe to add twice", async () => {
    await addBlockedHost(db, "evil.example", null);
    const again = await addBlockedHost(db, "evil.example", null);
    expect(again.ok).toBe(true);
    expect(await db.select().from(blockedHosts)).toHaveLength(1);
  });

  it("rejects something that is not a host", async () => {
    expect(await addBlockedHost(db, "not a host", null)).toEqual({ ok: false, error: expect.any(String) });
  });

  it("can be removed again", async () => {
    await addBlockedHost(db, "evil.example", null);
    await removeBlockedHost(db, "evil.example");
    expect(await db.select().from(blockedHosts)).toHaveLength(0);
  });
});
