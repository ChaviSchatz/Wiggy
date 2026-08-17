import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      // A client component that imports a Server Action (e.g. the layout's
      // feedback dialog) pulls the whole `"use server"` module graph into the
      // test bundle -- Next.js replaces it with a client reference at build
      // time, Vitest doesn't. `server-only` throws in that situation, so stub
      // it: importing a Server Action in a component test is legitimate,
      // calling it is what the tests avoid.
      "server-only": resolve(
        import.meta.dirname,
        "./tests/stubs/server-only.ts",
      ),
    },
  },
});
