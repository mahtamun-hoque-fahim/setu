import { describe, expect, it } from "vitest";
import { parseSlug } from "@/lib/slug";

describe("parseSlug", () => {
  it.each(["mahtamun", "a", "bcard-flyer", "Thesis-QR-2026", "x".repeat(64)])("accepts %s", (slug) => {
    expect(parseSlug(slug)).toEqual({ ok: true, slug });
  });

  it("trims surrounding whitespace", () => {
    expect(parseSlug("  mine ")).toEqual({ ok: true, slug: "mine" });
  });

  it.each([
    ["empty", ""],
    ["spaces inside", "my link"],
    ["a slash, which would never match the route", "a/b"],
    ["dots", "../x"],
    ["non-ASCII", "লিংক"],
    ["too long", "x".repeat(65)],
    ["not a string", 42],
  ])("rejects %s", (_name, input) => {
    expect(parseSlug(input).ok).toBe(false);
  });
});
