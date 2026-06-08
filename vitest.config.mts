import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "json"],
      reportOnFailure: true,
    },
    projects: ["packages/*/vitest.config.mts", "apps/www/vitest.config.mts"],
  },
});
