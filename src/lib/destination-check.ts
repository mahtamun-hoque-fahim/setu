import type { Db } from "@/lib/db/types";
import { blockedHosts } from "@/lib/db/schema";
import { hostMatches, parseDestinationUrl } from "@/lib/validate-destination";

export type PrepareResult =
  | { ok: true; url: string; check: "clean" | "unchecked" }
  | { ok: false; error: string };

export type PrepareOptions = {
  /** Google Safe Browsing API key. Without one the check is skipped. */
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

const SAFE_BROWSING_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

async function safeBrowsing(
  url: string,
  apiKey: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<"clean" | "flagged" | "unchecked"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${SAFE_BROWSING_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        client: { clientId: "setu", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
    });
    if (!res.ok) return "unchecked";
    const data = (await res.json()) as { matches?: unknown[] };
    return Array.isArray(data.matches) && data.matches.length > 0 ? "flagged" : "clean";
  } catch {
    // Deliberately swallowed and never logged: the error text can contain the
    // request URL, and the URL contains the API key.
    return "unchecked";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Everything a destination has to pass before it is saved: the format rules,
 * the admin's blocklist, then Google Safe Browsing. The last step fails open
 * (the link is saved and marked "unchecked") so a Google outage cannot stop
 * people from using Setu. It only catches sites already known to be bad, so
 * it backs up invite-only access and the admin kill switch, it does not
 * replace them.
 */
export async function prepareDestination(
  db: Db,
  input: unknown,
  options: PrepareOptions = {},
): Promise<PrepareResult> {
  const parsed = parseDestinationUrl(input);
  if (!parsed.ok) return parsed;

  const host = new URL(parsed.url).hostname;
  const blocked = await db.select({ host: blockedHosts.host }).from(blockedHosts);
  if (hostMatches(host, blocked.map((row) => row.host))) {
    return { ok: false, error: "That site is not allowed on Setu" };
  }

  if (!options.apiKey) return { ok: true, url: parsed.url, check: "unchecked" };

  const verdict = await safeBrowsing(
    parsed.url,
    options.apiKey,
    options.fetchImpl ?? fetch,
    options.timeoutMs ?? 3000,
  );
  if (verdict === "flagged") {
    return { ok: false, error: "Google Safe Browsing flags that site as unsafe" };
  }
  return { ok: true, url: parsed.url, check: verdict };
}

/** The options the routes pass in: the key comes from the environment, never from tests. */
export function destinationOptionsFromEnv(): PrepareOptions {
  return { apiKey: process.env.SAFE_BROWSING_API_KEY || undefined };
}
