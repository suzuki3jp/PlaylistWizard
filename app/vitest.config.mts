/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

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
  },
});
