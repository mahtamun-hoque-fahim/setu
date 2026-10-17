export type DestinationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const MAX_LENGTH = 2048;

/**
 * Generic link shorteners. Letting a Setu link point at one would let anyone
 * chain redirects to hide where a link really ends up.
 */
export const SHORTENER_HOSTS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "v.gd",
  "buff.ly", "rebrand.ly", "rb.gy", "cutt.ly", "shorturl.at", "tiny.cc",
  "bl.ink", "lnkd.in", "s.id", "t.ly", "short.io", "soo.gd", "adf.ly",
  "shorte.st", "qrco.de",
];

/** True for the host itself or any subdomain of it, never for a lookalike. */
export function hostMatches(host: string, entries: readonly string[]): boolean {
  const h = host.toLowerCase();
  return entries.some((entry) => h === entry || h.endsWith(`.${entry}`));
}

function isIpAddress(hostname: string): boolean {
  // new URL() already rewrites 2130706433 and 0x7f.1 into dotted form.
  return hostname.startsWith("[") || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isLocalHostName(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    [".localhost", ".local", ".internal", ".localdomain"].some((suffix) =>
      hostname.endsWith(suffix),
    )
  );
}

/**
 * Validates and normalizes a redirect destination. Shared by link creation
 * and link editing so the two paths can never drift apart.
 *
 * Only http and https are allowed: the redirect route sends whatever is
 * stored straight to the visitor, so a javascript:, data: or file: value
 * must never get in. Destinations on Setu's own host are rejected to rule
 * out redirect loops (a slug pointing back at itself).
 */
export function parseDestinationUrl(input: unknown): DestinationResult {
  if (typeof input !== "string" || input.trim() === "") {
    return { ok: false, error: "Enter a destination URL" };
  }

  const raw = input.trim();

  if (raw.length > MAX_LENGTH) {
    return { ok: false, error: "That URL is too long" };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return {
      ok: false,
      error: "Enter a full URL, including https://",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https links are allowed" };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      error: "Links with a username or password in them are not allowed",
    };
  }

  if (isIpAddress(parsed.hostname) || isLocalHostName(parsed.hostname)) {
    return {
      ok: false,
      error: "Use a public website address, not an IP address or a local host",
    };
  }

  if (hostMatches(parsed.hostname, SHORTENER_HOSTS)) {
    return {
      ok: false,
      error: "Link shorteners cannot be used as a destination",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (parsed.hostname === new URL(appUrl).hostname) {
        return {
          ok: false,
          error: "A link cannot point back to Setu itself",
        };
      }
    } catch {
      // A malformed NEXT_PUBLIC_APP_URL should not block link edits.
    }
  }

  return { ok: true, url: parsed.toString() };
}
