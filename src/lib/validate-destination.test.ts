import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseDestinationUrl } from "@/lib/validate-destination";

const original = process.env.NEXT_PUBLIC_APP_URL;
beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://setu.example";
});
afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = original;
});

const ok = (input: unknown) => parseDestinationUrl(input);

describe("accepted", () => {
  it.each([
    ["https", "https://facebook.com/yourpage"],
    ["http with query", "http://example.com/a?b=1"],
    ["surrounding whitespace", "  https://example.com/x  "],
    ["lookalike of a shortener, not the shortener", "https://bit.ly.example.com/x"],
    ["a different domain that merely ends the same", "https://abit.ly/x"],
    ["another host than Setu", "https://notsetu.example/x"],
  ])("%s", (_name, input) => {
    expect(ok(input).ok).toBe(true);
  });

  it("normalizes a bare origin", () => {
    expect(ok("https://example.com")).toEqual({ ok: true, url: "https://example.com/" });
  });
});

describe("rejected, basics", () => {
  it.each([
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,<script>1</script>"],
    ["file scheme", "file:///etc/passwd"],
    ["ftp scheme", "ftp://example.com/x"],
    ["no scheme", "facebook.com/yourpage"],
    ["empty", "   "],
    ["not a string", 42],
    ["undefined", undefined],
    ["too long", "https://example.com/" + "a".repeat(2100)],
    ["Setu itself", "https://setu.example/dashboard"],
    ["Setu itself, other case", "https://SETU.example/x"],
  ])("%s", (_name, input) => {
    expect(ok(input).ok).toBe(false);
  });
});

describe("rejected, abuse patterns", () => {
  it.each([
    ["IPv4 address", "http://192.168.1.10/login"],
    ["loopback", "http://127.0.0.1:8080/"],
    ["numeric IPv4 form", "http://2130706433/"],
    ["IPv6 address", "http://[::1]/"],
    ["localhost", "http://localhost:3000/"],
    ["a localhost subdomain", "http://app.localhost/"],
    ["a .local host", "http://printer.local/"],
    ["an .internal host", "http://billing.internal/"],
  ])("host that is not a public site: %s", (_name, input) => {
    const result = ok(input);
    expect(result.ok).toBe(false);
  });

  it("credentials in the URL, the paypal.com@evil trick", () => {
    const result = ok("https://paypal.com@evil.example/signin");
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/username|password|credentials/i) });
  });

  it.each([
    ["bit.ly", "https://bit.ly/abc"],
    ["www.tinyurl.com", "https://www.tinyurl.com/x"],
    ["t.co", "https://t.co/x"],
    ["a subdomain of a shortener", "https://go.rebrand.ly/x"],
  ])("link shorteners cannot be chained: %s", (_name, input) => {
    const result = ok(input);
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/shortener/i) });
  });
});
