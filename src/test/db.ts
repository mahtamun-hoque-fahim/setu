import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "@/lib/db/schema";

/**
 * A throwaway real Postgres, in process, with the project's actual Drizzle
 * schema applied. Integration tests run against this instead of mocks, so
 * constraints, partial unique indexes and atomic UPDATEs behave as they do
 * in production. Nothing here ever touches a real database.
 */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // drizzle-kit's pushSchema takes any pg drizzle instance.
  const { apply } = await pushSchema(
    schema as unknown as Record<string, unknown>,
    db as unknown as Parameters<typeof pushSchema>[1],
  );
  await apply();

  return { db, client };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];
