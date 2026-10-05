import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Tests cover logic, adapters (against fakes) and route guards (in-memory history); nothing
// renders, so no DOM environment is needed, and fetch is always stubbed: no network.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "eslint-rules/**/*.test.ts"],
    passWithNoTests: true,
  },
});
