import type { PgDatabase } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * Any Drizzle Postgres database with the Setu schema: the Neon HTTP client
 * in production, an in-process PGlite in tests. Business logic takes this
 * type so it can be tested against a real Postgres without mocks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;
