/**
 * Slugs no one is allowed to claim, because they collide with a real
 * route this app needs, or are common enough to cause confusion.
 * Check every new slug against this list at creation time.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "dashboard",
  "login",
  "logout",
  "settings",
  "signup",
  "sign-in",
  "sign-up",
  "setu",
  "static",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
