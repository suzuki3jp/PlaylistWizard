import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(testDirectory, "../..");
const oxlintBin = path.join(workspaceRoot, "node_modules/.bin/oxlint");
const pluginPath = path.join(testDirectory, "playlistwizard-api-rules.js");

/**
 * Runs oxlint against a synthetic workspace so custom rule tests exercise the
 * same path-resolution and parser behavior used by the real lint command.
 */
const runOxlint = async ({ files, targets }) => {
  const root = await mkdtemp(path.join(tmpdir(), "playlistwizard-oxlint-"));

  try {
    await writeFixtureFiles(root, {
      ".oxlintrc.json": JSON.stringify({
        jsPlugins: [pluginPath],
        rules: {
          "no-console": "off",
          "playlistwizard-api/boundary-branded-ids": "error",
          "playlistwizard-api/layer-imports": "error",
        },
      }),
      ...files,
    });

    const result = await execOxlint([
      "-c",
      path.join(root, ".oxlintrc.json"),
      ...targets.map((target) => path.join(root, target)),
      "--format",
      "json",
    ]);

    return {
      exitCode: result.exitCode,
      diagnostics: JSON.parse(result.stdout).diagnostics,
    };
  } finally {
    await rm(root, { force: true, recursive: true });
  }
};

/**
 * Writes a map of relative fixture paths to file contents while preserving the
 * `apps/api/src` path shape required by the custom layer rules.
 */
const writeFixtureFiles = async (root, files) => {
  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const absolutePath = path.join(root, relativePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content);
    }),
  );
};

/**
 * Converts oxlint's non-zero exit for expected diagnostics into a structured
 * result so individual tests can assert the reported rule and message.
 */
const execOxlint = (args) =>
  new Promise((resolve, reject) => {
    execFile(
      oxlintBin,
      args,
      { cwd: workspaceRoot },
      (error, stdout, stderr) => {
        if (error && typeof error.code !== "number") {
          reject(error);
          return;
        }

        resolve({
          exitCode: typeof error?.code === "number" ? error.code : 0,
          stderr,
          stdout,
        });
      },
    );
  });

describe("playlistwizard-api oxlint rules", () => {
  it("reports layer violations through named re-exports", async () => {
    const result = await runOxlint({
      files: {
        "apps/api/src/infrastructure/playlist-store.ts":
          "export const playlistStore = {};\n",
        "apps/api/src/usecase/playlist-actions/index.ts":
          'export { playlistStore } from "@/infrastructure/playlist-store";\n',
      },
      targets: ["apps/api/src/usecase/playlist-actions/index.ts"],
    });

    expect(result.exitCode).toBe(1);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "playlistwizard-api(layer-imports)",
        message: expect.stringContaining(
          "usecase must not import infrastructure",
        ),
      }),
    ]);
  });

  it("reports layer violations through export-all barrels", async () => {
    const result = await runOxlint({
      files: {
        "apps/api/src/infrastructure/playlist-store.ts":
          "export const playlistStore = {};\n",
        "apps/api/src/usecase/playlist-actions/index.ts":
          'export * from "@/infrastructure/playlist-store";\n',
      },
      targets: ["apps/api/src/usecase/playlist-actions/index.ts"],
    });

    expect(result.exitCode).toBe(1);
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        code: "playlistwizard-api(layer-imports)",
        message: expect.stringContaining(
          "usecase must not import infrastructure",
        ),
      }),
    );
  });

  it("allows type-only usecase re-exports from presentation", async () => {
    const result = await runOxlint({
      files: {
        "apps/api/src/presentation/http/contracts.ts":
          'export type { CreatePlaylistCommand } from "@/usecase/playlist-actions/create";\n',
        "apps/api/src/usecase/playlist-actions/create.ts":
          "export type CreatePlaylistCommand = { name: string };\n",
      },
      targets: ["apps/api/src/presentation/http/contracts.ts"],
    });

    expect(result).toEqual({ diagnostics: [], exitCode: 0 });
  });

  it("reports branded ID conversion through namespace imports", async () => {
    const result = await runOxlint({
      files: {
        "apps/api/src/usecase/playlist-actions/create.ts": [
          'import * as ids from "@playlistwizard/core/ids";',
          'export const accountId = ids.toAccountId("account_1");',
        ].join("\n"),
      },
      targets: ["apps/api/src/usecase/playlist-actions/create.ts"],
    });

    expect(result.exitCode).toBe(1);
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        code: "playlistwizard-api(boundary-branded-ids)",
        message: expect.stringContaining("toAccountId may be used only"),
      }),
    );
  });

  it("allows namespace imports when banned branded ID helpers are not used", async () => {
    const result = await runOxlint({
      files: {
        "apps/api/src/usecase/playlist-actions/create.ts": [
          'import * as core from "@playlistwizard/core";',
          "export const provider = core.Provider.YouTube;",
        ].join("\n"),
      },
      targets: ["apps/api/src/usecase/playlist-actions/create.ts"],
    });

    expect(result).toEqual({ diagnostics: [], exitCode: 0 });
  });
});
