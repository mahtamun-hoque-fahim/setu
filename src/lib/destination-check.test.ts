import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { blockedHosts } from "@/lib/db/schema";
import { prepareDestination } from "@/lib/destination-check";

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
});

const KEY = "test-key-123";
const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

describe("the cheap rules still apply first", () => {
  it("rejects a bad URL without calling out to anything", async () => {
    const fetchImpl = vi.fn();
    const result = await prepareDestination(db, "javascript:alert(1)", { apiKey: KEY, fetchImpl });
    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("the admin blocklist", () => {
  it("blocks a listed host and any subdomain of it", async () => {
    await db.insert(blockedHosts).values({ host: "evil.example", reason: "phishing" });
    for (const url of ["https://evil.example/a", "https://login.evil.example/a"]) {
      const result = await prepareDestination(db, url, {});
      expect(result).toEqual({ ok: false, error: expect.stringMatching(/not allowed/i) });
    }
  });

  it("does not block a lookalike domain", async () => {
    await db.insert(blockedHosts).values({ host: "evil.example" });
    expect((await prepareDestination(db, "https://notevil.example/a", {})).ok).toBe(true);
  });
});

describe("Google Safe Browsing", () => {
  it("is skipped, and reported as unchecked, when no key is configured", async () => {
    const fetchImpl = vi.fn();
    const result = await prepareDestination(db, "https://example.com/a", { fetchImpl });
    expect(result).toEqual({ ok: true, url: "https://example.com/a", check: "unchecked" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("marks the link clean when Google finds nothing, and asks about the normalized URL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({}));
    const result = await prepareDestination(db, "https://example.com", { apiKey: KEY, fetchImpl });
    expect(result).toEqual({ ok: true, url: "https://example.com/", check: "clean" });

    const [calledUrl, init] = fetchImpl.mock.calls[0];
    expect(String(calledUrl)).toContain("safebrowsing.googleapis.com/v4/threatMatches:find");
    expect(String(calledUrl)).toContain(`key=${KEY}`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).threatInfo.threatEntries).toEqual([{ url: "https://example.com/" }]);
  });

  it("refuses a URL Google flags, without echoing the API key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ matches: [{ threatType: "SOCIAL_ENGINEERING" }] }));
    const result = await prepareDestination(db, "https://bad.example/x", { apiKey: KEY, fetchImpl });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/unsafe/i) });
    expect(JSON.stringify(result)).not.toContain(KEY);
  });

  it.each([
    ["an HTTP error", () => Promise.resolve(new Response("nope", { status: 500 }))],
    ["a network failure", () => Promise.reject(new Error("offline"))],
    ["garbage in the response", () => Promise.resolve(new Response("not json", { status: 200 }))],
  ])("fails open as unchecked on %s", async (_name, impl) => {
    const result = await prepareDestination(db, "https://example.com/a", {
      apiKey: KEY,
      fetchImpl: vi.fn().mockImplementation(impl),
    });
    expect(result).toEqual({ ok: true, url: "https://example.com/a", check: "unchecked" });
  });

  it("gives up after the timeout instead of hanging the form", async () => {
    const hang = vi.fn().mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const started = Date.now();
    const result = await prepareDestination(db, "https://example.com/a", {
      apiKey: KEY,
      fetchImpl: hang,
      timeoutMs: 50,
    });
    expect(result).toMatchObject({ ok: true, check: "unchecked" });
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
