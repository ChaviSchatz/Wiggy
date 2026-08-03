import { resolve } from "path";

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Integration tests hit local Supabase (Docker). They read the same env the
// app uses, so load `.env.local` (including the service-role key) into the test
// process. These run in a node environment and are excluded from `npm run test`.
const env = loadEnv("test", process.cwd(), "");

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.{test,spec}.ts"],
    env,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      // `admin.ts` imports `server-only`, whose default export throws outside a
      // React Server Component bundle. Stub it so the service-role client can be
      // exercised from node-based integration tests.
      "server-only": resolve(
        import.meta.dirname,
        "./tests/stubs/server-only.ts",
      ),
    },
  },
});
