import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Only pure logic (domain and application layers) is tested, so no DOM environment is needed.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
