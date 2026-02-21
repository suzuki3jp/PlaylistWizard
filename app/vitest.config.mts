/// <reference types="vitest" />

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    coverage: {
      reporter: ["text", "json"],
      reportOnFailure: true,
    },
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30000, // 30 seconds
    alias: {
      "server-only": resolve(__dirname, "./mocks/server-only.ts"),
    },
  },
});
