export type DestinationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const MAX_LENGTH = 2048;

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
