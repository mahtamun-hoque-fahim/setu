import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true }, // the "@/..." imports from tsconfig.json
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Each DB-backed test file boots an in-process Postgres (PGlite) and
    // pushes the real Drizzle schema into it, so allow a slower first hook.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
