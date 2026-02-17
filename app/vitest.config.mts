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
    env: {
      DATABASE_URL: "postgresql://localhost:5432/test",
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "test-secret",
      GOOGLE_CLIENT_ID: "test",
      GOOGLE_CLIENT_SECRET: "test",
      SPOTIFY_CLIENT_ID: "test",
      SPOTIFY_CLIENT_SECRET: "test",
    },
  },
});
