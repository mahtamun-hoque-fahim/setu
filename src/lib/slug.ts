export type SlugResult = { ok: true; slug: string } | { ok: false; error: string };

// Letters, digits and hyphens only. Anything else (a slash, a space, dots)
// either could never match the /[slug] route or invites confusion.
const SLUG_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

export function parseSlug(input: unknown): SlugResult {
  const slug = typeof input === "string" ? input.trim() : "";
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: "Use letters, numbers and hyphens only, up to 64 characters",
    };
  }
  return { ok: true, slug };
}
