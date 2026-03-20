import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["**/*.integration.test.ts"],
    environment: "node",
    testTimeout: 60000,
    fileParallelism: false,
    alias: {
      "server-only": resolve(__dirname, "./mocks/server-only.ts"),
    },
  },
});
