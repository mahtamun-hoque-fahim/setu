import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Lazily creates the Drizzle client. Lazy on purpose: this file gets
 * imported at build time by route modules, and DATABASE_URL is only
 * guaranteed to exist at runtime, not during the Next.js build step.
 */
export function getDb() {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(url);
  cached = drizzle(sql, { schema });
  return cached;
}
