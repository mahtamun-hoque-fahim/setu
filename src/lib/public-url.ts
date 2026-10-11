/**
 * The public origin short links live on, from NEXT_PUBLIC_APP_URL. It is
 * the same value the QR code encodes, so every place that shows a short
 * link reads it from here and the displayed address always matches the code.
 */
export function publicBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/** Host only, for display: "setu.app" rather than "https://setu.app". */
export function publicHost(): string {
  try {
    return new URL(publicBaseUrl()).host;
  } catch {
    return "localhost:3000";
  }
}

export function shortUrl(slug: string): string {
  return `${publicBaseUrl()}/${slug}`;
}
