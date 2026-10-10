/**
 * Display helpers for dates, countries and referrers. Everything here is
 * timezone independent on purpose: pages render on the server, where the
 * clock is UTC, so recent times are relative ("2 mins ago") and older ones
 * are shown as UTC dates.
 */

const relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const dateOnly = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const dateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function formatWhen(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs >= SEVEN_DAYS_MS || diffMs < 0) return dateOnly.format(date);

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return relative.format(-minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");

  return relative.format(-Math.floor(hours / 24), "day");
}

/** Full date and time in UTC, used for tooltips and the edit history. */
export function formatDateTimeUtc(date: Date): string {
  return `${dateTime.format(date)} UTC`;
}

export function formatDate(date: Date): string {
  return dateOnly.format(date);
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** "BD" becomes "Bangladesh". Unknown or malformed codes fall back safely. */
export function countryName(code: string | null): string {
  if (!code) return "Unknown";
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** "https://www.facebook.com/x" becomes "facebook.com". No referrer is "Direct". */
export function referrerHost(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
}
