import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { links, scans, user } from "@/lib/db/schema";

const holder = vi.hoisted(() => ({
  db: null as unknown,
  afterTasks: [] as Promise<unknown>[],
}));

vi.mock("@/lib/db", () => ({ getDb: () => holder.db }));
// after() only works inside a real request, so run its callback right away
// and let the test await it, which is what the platform does after responding.
vi.mock("next/server", async (importOriginal) => {
  const real = await importOriginal<typeof import("next/server")>();
  return {
    ...real,
    after: (task: () => unknown) => {
      holder.afterTasks.push(Promise.resolve().then(task));
    },
  };
});

import { GET } from "@/app/[slug]/route";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let db: TestDb;
beforeAll(async () => {
  ctx = await createTestDb();
  db = ctx.db;
  holder.db = db;
});
afterAll(async () => {
  await ctx.client.close();
});
beforeEach(async () => {
  holder.afterTasks.length = 0;
  await db.delete(scans);
  await db.delete(links);
  await db.delete(user);
  await db.insert(user).values({ id: "u1", name: "Rafi", email: "rafi@example.com" });
});

const scan = (slug: string, headers: Record<string, string> = {}) =>
  GET(new Request(`https://setu.example/${slug}`, { headers }), {
    params: Promise.resolve({ slug }),
  });

describe("the redirect route", () => {
  it("sends an unknown slug to the branded 404 page, uncached, logging nothing", async () => {
    const res = await scan("nope");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://setu.example/link-not-found");
    expect(res.headers.get("cache-control")).toBe("no-store");
    await Promise.all(holder.afterTasks);
    expect(await db.select().from(scans)).toHaveLength(0);
  });

  it("redirects an active link straight to its destination, uncached", async () => {
    await db.insert(links).values({ id: "l1", slug: "mine", destinationUrl: "https://example.com/a", ownerId: "u1" });
    const res = await scan("mine");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/a");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("records the scan after the redirect, with a snapshot of where it was sent", async () => {
    await db.insert(links).values({ id: "l1", slug: "mine", destinationUrl: "https://example.com/a", ownerId: "u1" });
    await scan("mine", { "x-vercel-ip-country": "BD", "user-agent": "TestAgent/1", referer: "https://facebook.com/" });
    await Promise.all(holder.afterTasks);
    const rows = await db.select().from(scans);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      linkId: "l1", country: "BD", userAgent: "TestAgent/1",
      referrer: "https://facebook.com/", destinationUrl: "https://example.com/a",
    });
  });

  it("sends a disabled link to the notice page instead of its destination, and never reveals it", async () => {
    await db.insert(links).values({
      id: "l1", slug: "bad", destinationUrl: "https://evil.example/x", ownerId: "u1",
      status: "disabled", disabledReason: "phishing",
    });
    const res = await scan("bad");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://setu.example/link-disabled");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("location")).not.toContain("evil");
    await Promise.all(holder.afterTasks);
    expect(await db.select().from(scans)).toHaveLength(0);
  });
});
